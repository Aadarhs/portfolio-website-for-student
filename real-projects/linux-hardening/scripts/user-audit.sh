#!/usr/bin/env bash
#==============================================================================
# User Account Audit Script
# Identifies and remediates risky user account configurations
#==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/user-audit-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="${LOG_DIR}/user-audit-report-$(date +%Y%m%d-%H%M%S).txt"

REMOVE_SHELLS=false
LOCK_INACTIVE_DAYS=90
AUTO_FIX=false
DRY_RUN=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[-]${NC} $1" | tee -a "$LOG_FILE"; }
info()  { echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root."
        exit 1
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --remove-shells) REMOVE_SHELLS=true; shift ;;
            --lock-inactive) LOCK_INACTIVE_DAYS="$2"; shift 2 ;;
            --auto-fix)      AUTO_FIX=true; shift ;;
            --dry-run)       DRY_RUN=true; shift ;;
            *)               error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

find_empty_passwords() {
    header "Checking for Accounts with Empty Passwords"
    local empty_pwds
    empty_pwds=$(awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow 2>/dev/null || true)

    if [[ -n "$empty_pwds" ]]; then
        warn "Accounts with empty/unset passwords found:"
        while IFS= read -r user; do
            echo -e "  ${RED}•${NC} ${user}"
            if [[ "$AUTO_FIX" == true && "$DRY_RUN" != true ]]; then
                passwd -l "$user" 2>/dev/null && log "Locked account: ${user}" || true
            elif [[ "$AUTO_FIX" == true ]]; then
                info "Would lock account: ${user}"
            fi
        done <<< "$empty_pwds"
    else
        log "No accounts with empty passwords found."
    fi
}

find_uid_zero() {
    header "Checking for UID 0 (Root-equivalent) Accounts"
    local uid_zero
    uid_zero=$(awk -F: '$3 == 0 {print $1}' /etc/passwd)

    local count=0
    while IFS= read -r user; do
        ((count++))
        if [[ "$user" != "root" ]]; then
            warn "Non-root account with UID 0: ${BOLD}${user}${NC}"
            if [[ "$AUTO_FIX" == true && "$DRY_RUN" != true ]]; then
                usermod -c "DISABLED - was UID 0" "$user" 2>/dev/null
                usermod -l "disabled_${user}" "$user" 2>/dev/null
                log "Disabled non-root UID 0 account: ${user}"
            fi
        fi
    done <<< "$uid_zero"

    if [[ $count -eq 1 ]]; then
        log "Only root has UID 0 (correct)."
    fi
}

check_no_password_aging() {
    header "Checking for Accounts Without Password Aging"
    local issues=0
    while IFS=: read -r user _ uid _; do
        if [[ $uid -ge 1000 && $user != "nobody" ]]; then
            local shadow_entry
            shadow_entry=$(getent shadow "$user" 2>/dev/null || echo "")
            if [[ -n "$shadow_entry" ]]; then
                local max_days
                max_days=$(echo "$shadow_entry" | awk -F: '{print $5}')
                if [[ -z "$max_days" || "$max_days" -eq 0 || "$max_days" -eq -1 ]]; then
                    warn "No password aging for: ${BOLD}${user}${NC}"
                    ((issues++))
                fi
            fi
        fi
    done < /etc/passwd

    if [[ $issues -eq 0 ]]; then
        log "All interactive accounts have password aging configured."
    fi
}

find_nologin_shells() {
    header "Checking for Accounts with Login Shells"
    local login_shells=("/bin/bash" "/bin/sh" "/bin/zsh" "/bin/ksh" "/usr/bin/bash" "/usr/bin/sh")
    local users_with_shells=()

    while IFS=: read -r user _ uid _ _ home shell; do
        if [[ $uid -ge 1000 && $user != "nobody" ]]; then
            if [[ -n "$shell" && "$shell" != "/usr/sbin/nologin" && "$shell" != "/bin/false" && "$shell" != "/sbin/nologin" ]]; then
                users_with_shells+=("${user}:${shell}")
            fi
        fi
    done < /etc/passwd

    if [[ ${#users_with_shells[@]} -gt 0 ]]; then
        info "Interactive accounts with login shells:"
        for entry in "${users_with_shells[@]}"; do
            local user shell
            user="${entry%%:*}"
            shell="${entry##*:}"
            echo -e "  ${user} -> ${shell}"
        done
    fi
}

check_sudo_group() {
    header "Reviewing Sudo/Sudoers Group Membership"
    local sudo_users=()

    if getent group sudo &>/dev/null; then
        sudo_users=($(getent group sudo | cut -d: -f4 | tr ',' ' '))
    elif getent group wheel &>/dev/null; then
        sudo_users=($(getent group wheel | cut -d: -f4 | tr ',' ' '))
    fi

    if [[ ${#sudo_users[@]} -gt 0 ]]; then
        info "Users with sudo privileges:"
        for user in "${sudo_users[@]}"; do
            echo -e "  • ${user}"
        done
    else
        warn "No users found in sudo/wheel group!"
    fi

    # Check for direct sudoers entries
    if [[ -f /etc/sudoers ]]; then
        local direct
        direct=$(grep -E "^[^#%].*ALL" /etc/sudoers 2>/dev/null || true)
        if [[ -n "$direct" ]]; then
            info "Direct sudoers entries (non-group):"
            echo "$direct" | while IFS= read -r line; do
                echo -e "  ${line}"
            done
        fi
    fi
}

check_unauthorized_keys() {
    header "Checking for Unauthorized SSH Authorized Keys"
    local home_dirs
    home_dirs=$(find /home -maxdepth 2 -name "authorized_keys" -o -name "authorized_keys2" 2>/dev/null || true)

    if [[ -n "$home_dirs" ]]; then
        while IFS= read -r keyfile; do
            local user
            user=$(stat -c '%U' "$(dirname "$(dirname "$keyfile")")" 2>/dev/null || echo "unknown")
            local count
            count=$(wc -l < "$keyfile" 2>/dev/null || echo "0")
            info "SSH keys for ${user}: ${keyfile} (${count} keys)"

            # Check permissions
            local perms
            perms=$(stat -c '%a' "$keyfile" 2>/dev/null || echo "unknown")
            if [[ "$perms" != "600" && "$perms" != "644" ]]; then
                warn "Incorrect permissions (${perms}) on ${keyfile}"
                if [[ "$AUTO_FIX" == true && "$DRY_RUN" != true ]]; then
                    chmod 600 "$keyfile"
                    log "Fixed permissions on ${keyfile}"
                fi
            fi
        done <<< "$home_dirs"
    fi

    # Check root's keys
    if [[ -f /root/.ssh/authorized_keys ]]; then
        local count
        count=$(wc -l < /root/.ssh/authorized_keys)
        info "Root has ${count} authorized SSH key(s)"
    fi
}

check_inactive_accounts() {
    header "Checking for Inactive Accounts"
    local today
    today=$(date +%s)
    local threshold=$(( LOCK_INACTIVE_DAYS * 86400 ))
    local inactive=()

    while IFS=: read -r user _ uid _ _ _ shell; do
        if [[ $uid -ge 1000 && $user != "nobody" ]]; then
            local last_login
            last_login=$(lastlog -u "$user" 2>/dev/null | tail -1 | awk '{print $4,$5,$6,$7,$8,$9}' || echo "")

            if [[ -z "$last_login" || "$last_login" == "*Never logged in*" ]]; then
                inactive+=("${user}")
            fi
        fi
    done < /etc/passwd

    if [[ ${#inactive[@]} -gt 0 ]]; then
        warn "Potentially inactive accounts (${#inactive[@]}):"
        for user in "${inactive[@]}"; do
            echo -e "  ${RED}•${NC} ${user}"
        done
    else
        log "No obviously inactive accounts detected."
    fi
}

generate_report() {
    header "Generating Audit Report"

    {
        echo "=========================================="
        echo "  User Account Audit Report"
        echo "  Generated: $(date)"
        echo "=========================================="
        echo ""
        echo "Total system accounts: $(awk -F: '$3 < 1000' /etc/passwd | wc -l)"
        echo "Total user accounts:   $(awk -F: '$3 >= 1000 && $1 != "nobody"' /etc/passwd | wc -l)"
        echo "Accounts with shells:  $(grep -v '/sbin/nologin\|/bin/false\|/usr/sbin/nologin' /etc/passwd | grep -v '^#' | wc -l)"
        echo "UID 0 accounts:       $(awk -F: '$3 == 0' /etc/passwd | wc -l)"
        echo ""
        echo "------------------------------------------"
        echo "Full Account Listing:"
        echo "------------------------------------------"
        printf "%-20s %-8s %-30s %-20s\n" "USERNAME" "UID" "HOME" "SHELL"
        echo "---------------------------------------------------------------"
        awk -F: '$3 >= 1000 && $1 != "nobody" {printf "%-20s %-8s %-30s %-20s\n", $1, $3, $6, $7}' /etc/passwd
    } > "$REPORT_FILE"

    log "Report saved to: ${REPORT_FILE}"
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}User Account Audit Module${NC}"
    log "User audit started at $(date)"

    find_empty_passwords
    find_uid_zero
    check_no_password_aging
    find_nologin_shells
    check_sudo_group
    check_unauthorized_keys
    check_inactive_accounts
    generate_report

    log "User audit completed at $(date)"
    echo -e "\n${GREEN}User account audit complete. Report: ${REPORT_FILE}${NC}"
}

main "$@"

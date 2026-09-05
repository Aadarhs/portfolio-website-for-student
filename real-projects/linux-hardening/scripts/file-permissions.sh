#!/usr/bin/env bash
#==============================================================================
# File Permissions Hardening Script
# Secures critical system files and directories
#==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/file-permissions-$(date +%Y%m%d-%H%M%S).log"

VERIFY_ONLY=false
DRY_RUN=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[-]${NC} $1" | tee -a "$LOG_FILE"; }
info()  { echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }
fix()   { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }
fail()  { echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root."
        exit 1
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --verify-only) VERIFY_ONLY=true; shift ;;
            --dry-run)     DRY_RUN=true; shift ;;
            *)             error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

set_perms() {
    local path="$1" expected_owner="$2" expected_perms="$3" desc="$4"

    if [[ ! -e "$path" ]]; then
        info "Not found (skipped): ${path}"
        return 0
    fi

    local current_owner current_perms
    current_owner=$(stat -c '%U:%G' "$path" 2>/dev/null || echo "unknown")
    current_perms=$(stat -c '%a' "$path" 2>/dev/null || echo "unknown")

    if [[ "$current_owner" == "$expected_owner" && "$current_perms" == "$expected_perms" ]]; then
        fix "${desc}: ${path} (${current_owner}:${current_perms})"
        return 0
    fi

    warn "${desc}: ${path}"
    echo -e "    Current: ${current_owner}:${current_perms}"
    echo -e "    Expected: ${expected_owner}:${expected_perms}"

    if [[ "$VERIFY_ONLY" == true ]]; then
        return 1
    fi

    if [[ "$DRY_RUN" == true ]]; then
        info "  Would fix: chown ${expected_owner} ${path} && chmod ${expected_perms} ${path}"
        return 0
    fi

    chown "$expected_owner" "$path" 2>/dev/null && chmod "$expected_perms" "$path" 2>/dev/null
    fix "  Fixed permissions on ${path}"
    return 0
}

secure_etc_files() {
    header "Securing /etc Critical Files"

    set_perms "/etc/passwd"     "root:root" "644" "Password file"
    set_perms "/etc/shadow"     "root:shadow" "640" "Shadow file"
    set_perms "/etc/group"      "root:root" "644" "Group file"
    set_perms "/etc/gshadow"    "root:shadow" "640" "Group shadow"
    set_perms "/etc/sudoers"    "root:root" "440" "Sudoers"
    set_perms "/etc/ssh/sshd_config" "root:root" "600" "SSH config"

    # Sudoers.d directory
    if [[ -d /etc/sudoers.d ]]; then
        set_perms "/etc/sudoers.d" "root:root" "750" "Sudoers.d directory"
    fi

    # PAM configuration
    if [[ -d /etc/pam.d ]]; then
        find /etc/pam.d -type f -exec chmod 644 {} \; 2>/dev/null || true
        find /etc/pam.d -type f -exec chown root:root {} \; 2>/dev/null || true
        log "PAM configuration files secured"
    fi
}

secure_ssh_keys() {
    header "Securing SSH Key Files"

    local key_patterns=(
        "/etc/ssh/ssh_host_*_key"
    )

    for pattern in "${key_patterns[@]}"; do
        for keyfile in $pattern; do
            if [[ -f "$keyfile" ]]; then
                set_perms "$keyfile" "root:root" "600" "SSH host key"
            fi
        done
    done

    # User authorized_keys
    if [[ -d /root/.ssh ]]; then
        set_perms "/root/.ssh" "root:root" "700" "Root .ssh directory"
        set_perms "/root/.ssh/authorized_keys" "root:root" "600" "Root authorized_keys"
    fi
}

secure_boot_files() {
    header "Securing Boot Configuration"

    local boot_files=(
        "/boot/grub/grub.cfg"
        "/boot/grub2/grub.cfg"
        "/etc/grub.conf"
        "/etc/grub.cfg"
    )

    for f in "${boot_files[@]}"; do
        if [[ -f "$f" ]]; then
            set_perms "$f" "root:root" "600" "Boot configuration"
        fi
    done
}

secure_cron_files() {
    header "Securing Cron Files"

    local cron_files=(
        "/etc/crontab"
        "/etc/cron.d"
        "/etc/cron.daily"
        "/etc/cron.hourly"
        "/etc/cron.weekly"
        "/etc/cron.monthly"
        "/var/spool/cron"
    )

    for f in "${cron_files[@]}"; do
        if [[ -e "$f" ]]; then
            if [[ -d "$f" ]]; then
                set_perms "$f" "root:root" "700" "Cron directory"
            else
                set_perms "$f" "root:root" "600" "Cron file"
            fi
        fi
    done
}

fix_world_writable() {
    header "Fixing World-Writable Files"

    local count=0
    while IFS= read -r -d '' file; do
        ((count++))
        if [[ "$VERIFY_ONLY" == true ]]; then
            warn "World-writable: ${file}"
        elif [[ "$DRY_RUN" != true ]]; then
            chmod o-w "$file" 2>/dev/null || true
        fi
    done < <(find / -xdev -type f -perm -0002 -print0 2>/dev/null || true)

    if [[ $count -gt 0 ]]; then
        if [[ "$DRY_RUN" != true && "$VERIFY_ONLY" != true ]]; then
            fix "Fixed ${count} world-writable files"
        elif [[ "$VERIFY_ONLY" == true ]]; then
            warn "Found ${count} world-writable files"
        fi
    else
        log "No world-writable files found."
    fi
}

fix_unowned_files() {
    header "Fixing Files Without Valid Owner/Group"

    local count=0
    while IFS= read -r -d '' file; do
        ((count++))
        if [[ "$VERIFY_ONLY" == true ]]; then
            warn "Unowned: ${file}"
        elif [[ "$DRY_RUN" != true ]]; then
            chown root:root "$file" 2>/dev/null || true
        fi
    done < <(find / -xdev \( -nouser -o -nogroup \) -print0 2>/dev/null || true)

    if [[ $count -gt 0 ]]; then
        if [[ "$DRY_RUN" != true && "$VERIFY_ONLY" != true ]]; then
            fix "Fixed ${count} unowned files"
        elif [[ "$VERIFY_ONLY" == true ]]; then
            warn "Found ${count} files without valid owner/group"
        fi
    else
        log "No unowned files found."
    fi
}

check_suid_sgid() {
    header "Checking SUID/SGID Binaries"

    local suid_count=0
    while IFS= read -r -d '' file; do
        ((suid_count++))
    done < <(find / -xdev -type f \( -perm -4000 -o -perm -2000 \) -print0 2>/dev/null || true)

    info "Found ${suid_count} SUID/SGID binaries"

    # Common expected SUID binaries
    local expected_suid=(
        "/usr/bin/sudo" "/usr/bin/su" "/usr/bin/passwd" "/usr/bin/chsh"
        "/usr/bin/chfn" "/usr/bin/newgrp" "/usr/bin/gpasswd"
        "/usr/lib/openssh/ssh-keysign" "/usr/lib/dbus-1.0/dbus-daemon-launch-helper"
        "/usr/sbin/unix_chkpwd"
    )

    # Find unexpected SUID binaries
    while IFS= read -r -d '' file; do
        local is_expected=false
        for expected in "${expected_suid[@]}"; do
            if [[ "$file" == "$expected" ]]; then
                is_expected=true
                break
            fi
        done
        if [[ "$is_expected" != true ]]; then
            info "Non-standard SUID/SGID: ${file}"
        fi
    done < <(find / -xdev -type f \( -perm -4000 -o -perm -2000 \) -print0 2>/dev/null || true)
}

secure_tmp() {
    header "Securing /tmp and /var/tmp"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would secure /tmp and /var/tmp"
        return 0
    fi

    # Set proper permissions
    chmod 1777 /tmp 2>/dev/null || true
    chmod 1777 /var/tmp 2>/dev/null || true
    log "Set /tmp and /var/tmp permissions to 1777"
}

protect_sensitive_dirs() {
    header "Protecting Sensitive Directories"

    set_perms "/etc"       "root:root" "755" "etc directory"
    set_perms "/etc/shadow" "root:shadow" "640" "Shadow file"

    local sensitive_dirs=(
        "/var/log"
        "/var/spool"
        "/var/cache"
        "/usr/local"
    )

    for dir in "${sensitive_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            set_perms "$dir" "root:root" "755" "System directory"
        fi
    done
}

print_summary() {
    header "File Permissions Summary"
    if [[ "$VERIFY_ONLY" == true ]]; then
        echo -e "  Mode: ${BOLD}Verify Only${NC} (no changes made)"
    elif [[ "$DRY_RUN" == true ]]; then
        echo -e "  Mode: ${BOLD}Dry Run${NC} (changes shown but not applied)"
    else
        echo -e "  Mode: ${BOLD}Apply${NC}"
    fi
    echo -e "  Log: ${LOG_FILE}"
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}File Permissions Hardening Module${NC}"
    log "File permission audit started at $(date)"

    secure_etc_files
    secure_ssh_keys
    secure_boot_files
    secure_cron_files
    fix_world_writable
    fix_unowned_files
    check_suid_sgid
    secure_tmp
    protect_sensitive_dirs
    print_summary

    log "File permissions hardening completed at $(date)"
    echo -e "\n${GREEN}File permissions hardening complete.${NC}"
}

main "$@"

#!/usr/bin/env bash
#==============================================================================
# Restore Defaults Script
# Rolls back changes made by the hardening suite
#==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/rollback-$(date +%Y%m%d-%H%M%S).log"

RESTORE_MODULE=""
FORCE=false
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
            --module)  RESTORE_MODULE="$2"; shift 2 ;;
            --force)   FORCE=true; shift ;;
            --dry-run) DRY_RUN=true; shift ;;
            --help|-h)
                echo "Usage: sudo $0 [--module MODULE] [--force] [--dry-run]"
                echo ""
                echo "Modules: ssh, firewall, kernel, all"
                echo ""
                echo "Options:"
                echo "  --module MODULE  Restore specific module (ssh, firewall, kernel, all)"
                echo "  --force          Skip confirmation prompts"
                echo "  --dry-run        Show what would be restored without applying"
                echo "  --help           Show this help"
                exit 0
                ;;
            *)         error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

list_backups() {
    header "Available Backups"

    if [[ ! -d "$BACKUP_DIR" ]]; then
        warn "No backup directory found at ${BACKUP_DIR}"
        return 1
    fi

    local count
    count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)

    if [[ $count -eq 0 ]]; then
        warn "No backups found in ${BACKUP_DIR}"
        return 1
    fi

    info "Backups found:"
    ls -lt "$BACKUP_DIR" 2>/dev/null | head -20 | while IFS= read -r line; do
        echo -e "  ${line}"
    done

    echo ""
    info "Total backups: ${count}"
}

confirm_restore() {
    if [[ "$FORCE" == true ]]; then
        return 0
    fi

    echo -en "${YELLOW}[?]${NC} Are you sure you want to restore defaults? This will undo hardening changes. [y/N]: "
    read -r response
    [[ "$response" =~ ^[Yy] ]] && return 0
    return 1
}

restore_ssh() {
    header "Restoring SSH Configuration"

    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/sshd_config.bak.* 2>/dev/null | head -1)

    if [[ -z "$latest_backup" ]]; then
        warn "No SSH backup found. Restoring to defaults..."

        if [[ "$DRY_RUN" != true ]]; then
            # Restore minimal SSH config
            cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# Restored to defaults by rollback script
# All hardening overrides removed
EOF
            log "SSH hardening configuration cleared"
        else
            info "DRY RUN: Would clear SSH hardening configuration"
        fi
        return 0
    fi

    info "Restoring from: ${latest_backup}"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would restore SSH config from ${latest_backup}"
        return 0
    fi

    cp -a "$latest_backup" /etc/ssh/sshd_config
    chmod 600 /etc/ssh/sshd_config
    log "SSH configuration restored from ${latest_backup}"

    # Remove drop-in config
    rm -f /etc/ssh/sshd_config.d/99-hardening.conf 2>/dev/null || true
    log "Removed hardened SSH drop-in configuration"

    # Restart SSH
    if systemctl is-active --quiet sshd 2>/dev/null; then
        systemctl restart sshd 2>/dev/null || true
        log "SSH service restarted"
    fi
}

restore_firewall() {
    header "Restoring Firewall Configuration"

    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/firewall.bak.*.v4 2>/dev/null | head -1)

    if [[ -z "$latest_backup" ]]; then
        warn "No firewall backup found. Flushing all rules..."

        if [[ "$DRY_RUN" != true ]]; then
            iptables -F
            iptables -X
            iptables -P INPUT ACCEPT
            iptables -P FORWARD ACCEPT
            iptables -P OUTPUT ACCEPT
            log "Firewall rules flushed, default ACCEPT policy set"
        else
            info "DRY RUN: Would flush all firewall rules"
        fi
        return 0
    fi

    info "Restoring from: ${latest_backup}"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would restore iptables from ${latest_backup}"
        return 0
    fi

    iptables-restore < "$latest_backup"
    log "iptables rules restored from ${latest_backup}"

    # Restore IPv6 if backup exists
    local ipv6_backup="${latest_backup%.v4}.v6"
    if [[ -f "$ipv6_backup" ]]; then
        ip6tables-restore < "$ipv6_backup"
        log "ip6tables rules restored"
    fi
}

restore_kernel() {
    header "Restoring Kernel Parameters"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would restore kernel parameters"
        return 0
    fi

    # Remove the hardening sysctl config
    if [[ -f /etc/sysctl.d/99-hardening.conf ]]; then
        rm -f /etc/sysctl.d/99-hardening.conf
        log "Removed /etc/sysctl.d/99-hardening.conf"
    fi

    # Restore defaults
    sysctl -w net.ipv4.ip_forward=1 2>/dev/null || true
    sysctl -w net.ipv4.conf.all.accept_redirects=1 2>/dev/null || true
    sysctl -w net.ipv4.tcp_syncookies=0 2>/dev/null || true
    sysctl -w kernel.dmesg_restrict=0 2>/dev/null || true
    sysctl -w kernel.randomize_va_space=0 2>/dev/null || true

    log "Kernel parameters restored to defaults"
}

restore_password_policy() {
    header "Restoring Password Policy"

    local login_defs_backup
    login_defs_backup=$(ls -t "$BACKUP_DIR"/login.defs.bak.* 2>/dev/null | head -1)

    if [[ -n "$login_defs_backup" && "$DRY_RUN" != true ]]; then
        cp -a "$login_defs_backup" /etc/login.defs
        log "login.defs restored from ${login_defs_backup}"
    else
        # Set reasonable defaults
        if [[ "$DRY_RUN" != true ]]; then
            sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS   99999/' /etc/login.defs 2>/dev/null || true
            sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS   0/' /etc/login.defs 2>/dev/null || true
            sed -i 's/^PASS_MIN_LEN.*/PASS_MIN_LEN    5/' /etc/login.defs 2>/dev/null || true
            log "Password policy restored to system defaults"
        fi
    fi

    # Remove pwquality config
    if [[ "$DRY_RUN" != true ]]; then
        rm -f /etc/security/pwquality.conf 2>/dev/null || true
        rm -f /etc/security/faillock.conf 2>/dev/null || true
        log "Password quality configuration removed"
    fi
}

restore_banners() {
    header "Restoring Login Banners"

    local banner_backup_dir
    banner_backup_dir=$(ls -td "$BACKUP_DIR"/banners.bak.* 2>/dev/null | head -1)

    if [[ -n "$banner_backup_dir" && -d "$banner_backup_dir" ]]; then
        if [[ "$DRY_RUN" != true ]]; then
            for f in /etc/issue /etc/issue.net /etc/motd; do
                local fname
                fname=$(basename "$f")
                if [[ -f "${banner_backup_dir}/${fname}" ]]; then
                    cp -a "${banner_backup_dir}/${fname}" "$f"
                    log "Restored ${f}"
                fi
            done
        else
            info "DRY RUN: Would restore banners from ${banner_backup_dir}"
        fi
    else
        if [[ "$DRY_RUN" != true ]]; then
            # Restore minimal default banners
            echo "Ubuntu $(lsb_release -rs 2>/dev/null || echo 'Linux') \n \l\n" > /etc/issue
            echo "Ubuntu $(lsb_release -rs 2>/dev/null || echo 'Linux')" > /etc/issue.net
            echo "" > /etc/motd
            log "Banners restored to minimal defaults"
        fi
    fi
}

restore_all() {
    header "Restoring All Defaults"

    if ! confirm_restore; then
        info "Restore cancelled."
        exit 0
    fi

    restore_ssh
    restore_firewall
    restore_kernel
    restore_password_policy
    restore_banners

    # Remove sysctl hardening
    if [[ "$DRY_RUN" != true ]]; then
        rm -f /etc/sysctl.d/99-hardening.conf 2>/dev/null || true

        # Reload sysctl
        sysctl --system &>/dev/null || true
    fi

    header "Restore Complete"
    echo -e "${GREEN}All settings have been restored to defaults.${NC}"
    echo -e "Review changes and restart affected services."
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$LOG_DIR"
    chmod 700 "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Linux Hardening - Rollback Utility${NC}"
    log "Rollback started at $(date)"

    list_backups

    if [[ -n "$RESTORE_MODULE" ]]; then
        case "$RESTORE_MODULE" in
            ssh)             restore_ssh ;;
            firewall)        restore_firewall ;;
            kernel)          restore_kernel ;;
            password-policy) restore_password_policy ;;
            banner)          restore_banners ;;
            all)             restore_all ;;
            *)
                error "Unknown module: ${RESTORE_MODULE}"
                echo "Available modules: ssh, firewall, kernel, password-policy, banner, all"
                exit 1
                ;;
        esac
    else
        restore_all
    fi

    log "Rollback completed at $(date)"
    echo -e "\n${GREEN}Rollback complete. Log: ${LOG_FILE}${NC}"
}

main "$@"

#!/usr/bin/env bash
#==============================================================================
# Login Banner Configuration Script
# Sets up legal warning banners for pre and post-login
#==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/banner-$(date +%Y%m%d-%H%M%S).log"

CUSTOM_TEXT=""
DRY_RUN=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[-]${NC} $1" | tee -a "$LOG_FILE"; }
info()  { echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }

DEFAULT_BANNER="*******************************************************************
*                                                                 *
*   AUTHORIZED ACCESS ONLY                                        *
*                                                                 *
*   This system is the property of [Organization Name].           *
*   Unauthorized access is strictly prohibited and may result     *
*   in criminal prosecution. All activities on this system are     *
*   monitored and recorded.                                       *
*                                                                 *
*   By logging in, you consent to monitoring and recording of     *
*   your activity. Disconnect immediately if you are not          *
*   authorized.                                                   *
*                                                                 *
*******************************************************************"

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root."
        exit 1
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --text)  CUSTOM_TEXT="$2"; shift 2 ;;
            --file)  CUSTOM_TEXT=$(cat "$2"); shift 2 ;;
            --dry-run) DRY_RUN=true; shift ;;
            *)       error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

backup_banners() {
    local backup_path="${BACKUP_DIR}/banners.bak.$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_path"

    for f in /etc/issue /etc/issue.net /etc/motd; do
        if [[ -f "$f" ]]; then
            cp -a "$f" "$backup_path/"
        fi
    done

    log "Backed up existing banners to ${backup_path}"
}

create_issue() {
    header "Configuring Pre-Login Banner (/etc/issue)"

    local banner_text="${CUSTOM_TEXT:-$DEFAULT_BANNER}"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would write /etc/issue"
        echo "$banner_text" | head -5
        echo "  ..."
        return 0
    fi

    echo "$banner_text" > /etc/issue
    chmod 644 /etc/issue
    log "Pre-login banner configured at /etc/issue"
}

create_issue_net() {
    header "Configuring Network Pre-Login Banner (/etc/issue.net)"

    local banner_text="${CUSTOM_TEXT:-$DEFAULT_BANNER}"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would write /etc/issue.net"
        return 0
    fi

    echo "$banner_text" > /etc/issue.net
    chmod 644 /etc/issue.net
    log "Network pre-login banner configured at /etc/issue.net"
}

create_motd() {
    header "Configuring MOTD (/etc/motd)"

    local motd_text
    if [[ -n "$CUSTOM_TEXT" ]]; then
        motd_text="$CUSTOM_TEXT"
    else
        motd_text="${DEFAULT_BANNER}

System: $(hostname)
Date:   $(date)
Kernel: $(uname -r)"
    fi

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would write /etc/motd"
        return 0
    fi

    echo "$motd_text" > /etc/motd
    chmod 644 /etc/motd
    log "MOTD configured at /etc/motd"
}

configure_sshd_banner() {
    header "Ensuring SSH Banner Configuration"

    local sshd_config="/etc/ssh/sshd_config"

    if [[ ! -f "$sshd_config" ]]; then
        warn "SSH config not found"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would verify SSH banner setting"
        return 0
    fi

    # Check if Banner is already configured
    if grep -q "^Banner" "$sshd_config" 2>/dev/null; then
        local current
        current=$(grep "^Banner" "$sshd_config" | head -1 | awk '{print $2}')
        if [[ "$current" == "/etc/issue.net" ]]; then
            log "SSH banner already configured correctly"
            return 0
        fi
        sed -i "s|^Banner.*|Banner /etc/issue.net|" "$sshd_config"
    elif grep -q "^#Banner" "$sshd_config" 2>/dev/null; then
        sed -i "s|^#Banner.*|Banner /etc/issue.net|" "$sshd_config"
    else
        echo "Banner /etc/issue.net" >> "$sshd_config"
    fi

    log "SSH banner configured to /etc/issue.net"

    # Restart SSH if running
    if systemctl is-active --quiet sshd 2>/dev/null; then
        systemctl restart sshd 2>/dev/null || true
        log "SSH service restarted"
    fi
}

configure_graphical_banner() {
    header "Configuring Display Manager Banner (if applicable)"

    local gdm_conf="/etc/gdm3/greeter.dconf-defaults"
    local lightdm_conf="/etc/lightdm/lightdm.conf"

    if [[ -f "$gdm_conf" && "$DRY_RUN" != true ]]; then
        if grep -q "banner-message" "$gdm_conf" 2>/dev/null; then
            sed -i "s|banner-message-text=.*|banner-message-text='${CUSTOM_TEXT:-Authorized Access Only}'|" "$gdm_conf"
        fi
        log "GDM banner configured"
    fi
}

print_summary() {
    header "Banner Configuration Summary"
    echo -e "  /etc/issue:     ${BOLD}Pre-login console banner${NC}"
    echo -e "  /etc/issue.net: ${BOLD}Pre-login network banner${NC}"
    echo -e "  /etc/motd:      ${BOLD}Post-login message${NC}"
    echo -e "  Log File:       ${LOG_FILE}"

    if [[ -n "$CUSTOM_TEXT" ]]; then
        echo -e "\n${CYAN}Custom banner text:${NC}"
        echo "$CUSTOM_TEXT" | head -5
    fi
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Login Banner Module${NC}"
    log "Banner configuration started at $(date)"

    backup_banners
    create_issue
    create_issue_net
    create_motd
    configure_sshd_banner
    configure_graphical_banner
    print_summary

    log "Banner configuration completed at $(date)"
    echo -e "\n${GREEN}Login banners configured successfully.${NC}"
}

main "$@"

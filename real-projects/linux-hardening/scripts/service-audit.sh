#!/usr/bin/env bash
#==============================================================================
# Service Audit Script
# Identifies and disables unnecessary services
#==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/service-audit-$(date +%Y%m%d-%H%M%S).log"

INTERACTIVE=true
WHITELIST=""
AUTO_DISABLE=false
DRY_RUN=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[-]${NC} $1" | tee -a "$LOG_FILE"; }
info()  { echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }

# Services that are commonly safe but worth noting
KNOWN_SAFELY_RUNNING=(
    sshd ssh sysstat cron crond rsyslog systemd-journald
    systemd-logind dbus NetworkManager networkd systemd-resolved
    chronyd ntpd ntp multipathd udisks2
)

# Services that are commonly dangerous/unnecessary on servers
DANGEROUS_SERVICES=(
    telnet.socket rsh.socket rlogin.socket tftp.socket
    vsftpd xinetd avahi-daemon cups-browsed cups
    bluetooth ModemManager rpcbind nfs-server
    smb nmb apache2 nginx postfix dovecot
    squid vsftpd proftpd pure-ftpd
    x11vnc vnc-server
)

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root."
        exit 1
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --interactive)  INTERACTIVE=true; shift ;;
            --auto-disable) AUTO_DISABLE=true; INTERACTIVE=false; shift ;;
            --whitelist)    WHITELIST="$2"; shift 2 ;;
            --dry-run)      DRY_RUN=true; shift ;;
            *)              error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

is_whitelisted() {
    local service="$1"
    IFS=',' read -ra wl <<< "$WHITELIST"
    for w in "${wl[@]}"; do
        w=$(echo "$w" | tr -d ' ')
        [[ "$w" == "$service" ]] && return 0
    done
    return 1
}

check_init_system() {
    if command -v systemctl &>/dev/null && systemctl is-system-running &>/dev/null; then
        echo "systemd"
    elif [[ -f /etc/init.d/rc ]]; then
        echo "sysvinit"
    elif command -v rc-status &>/dev/null; then
        echo "openrc"
    else
        echo "unknown"
    fi
}

list_running_services() {
    header "Running Services"

    local init_system
    init_system=$(check_init_system)

    if [[ "$init_system" == "systemd" ]]; then
        info "System services (systemd):"
        systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | \
            awk '{print $1}' | sed 's/\.service$//' | while IFS= read -r svc; do
                echo -e "  ${svc}"
            done
    else
        info "Running services:"
        for svc in /etc/init.d/*; do
            if [[ -x "$svc" ]]; then
                local name
                name=$(basename "$svc")
                echo -e "  ${name}"
            fi
        done
    fi
}

check_listening_ports() {
    header "Listening Network Ports"

    if command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | tail -n +2 | while IFS= read -r line; do
            local addr port prog
            addr=$(echo "$line" | awk '{print $4}')
            port=$(echo "$addr" | rev | cut -d: -f1 | rev)
            prog=$(echo "$line" | grep -oP 'users:\(\("\K[^"]+' || echo "unknown")
            echo -e "  Port ${BOLD}${port}${NC} - ${prog}"
        done
    elif command -v netstat &>/dev/null; then
        netstat -tlnp 2>/dev/null | tail -n +3 | while IFS= read -r line; do
            echo "  ${line}"
        done
    fi
}

audit_dangerous_services() {
    header "Checking for Dangerous/Unnecessary Services"

    local found=0

    for service in "${DANGEROUS_SERVICES[@]}"; do
        local status="inactive"
        if command -v systemctl &>/dev/null; then
            if systemctl is-active --quiet "$service" 2>/dev/null; then
                status="active"
            fi
        elif command -v service &>/dev/null; then
            if service "$service" status &>/dev/null; then
                status="active"
            fi
        fi

        if [[ "$status" == "active" ]]; then
            ((found++))

            if is_whitelisted "$service"; then
                info "Running (whitelisted): ${service}"
                continue
            fi

            warn "Running (potentially dangerous): ${BOLD}${service}${NC}"

            if [[ "$AUTO_DISABLE" == true && "$DRY_RUN" != true ]]; then
                systemctl disable --now "$service" 2>/dev/null || true
                log "  Disabled: ${service}"
            elif [[ "$AUTO_DISABLE" == true ]]; then
                info "  Would disable: ${service}"
            elif [[ "$INTERACTIVE" == true ]]; then
                echo -en "  Disable ${service}? [y/N]: "
                read -r response
                if [[ "$response" =~ ^[Yy] ]]; then
                    if [[ "$DRY_RUN" != true ]]; then
                        systemctl disable --now "$service" 2>/dev/null || true
                        log "  Disabled: ${service}"
                    else
                        info "  Would disable: ${service}"
                    fi
                fi
            fi
        fi
    done

    if [[ $found -eq 0 ]]; then
        log "No dangerous services currently running."
    fi
}

check_openinetd() {
    header "Checking inetd/xinetd"

    if [[ -f /etc/inetd.conf ]]; then
        local active
        active=$(grep -v '^#' /etc/inetd.conf 2>/dev/null | grep -v '^$' | wc -l)
        if [[ $active -gt 0 ]]; then
            warn "inetd.conf has ${active} active entries"
            if [[ "$AUTO_DISABLE" == true && "$DRY_RUN" != true ]]; then
                mv /etc/inetd.conf /etc/inetd.conf.disabled 2>/dev/null || true
                log "Disabled inetd.conf"
            fi
        else
            log "inetd.conf has no active entries"
        fi
    fi

    if [[ -d /etc/xinetd.d ]]; then
        local count
        count=$(ls /etc/xinetd.d/ 2>/dev/null | wc -l)
        if [[ $count -gt 0 ]]; then
            warn "xinetd.d has ${count} service files"
        fi
    fi
}

check_unnecessary_daemons() {
    header "Checking for Unnecessary Daemons"

    local daemons=(
        "avahi-daemon" "cups" "cups-browsed" "bluetooth"
        "ModemManager" "rpcbind" "nfs" "smbd" "nmbd"
        "xinetd" "vsftpd" "proftpd" "squid"
    )

    for daemon in "${daemons[@]}"; do
        if command -v systemctl &>/dev/null; then
            if systemctl is-enabled --quiet "$daemon" 2>/dev/null; then
                warn "Enabled but may be unnecessary: ${BOLD}${daemon}${NC}"

                if [[ "$AUTO_DISABLE" == true && "$DRY_RUN" != true ]]; then
                    systemctl disable "$daemon" 2>/dev/null || true
                    log "  Disabled: ${daemon}"
                fi
            fi
        fi
    done
}

print_summary() {
    header "Service Audit Summary"
    echo -e "  Log File: ${LOG_FILE}"
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "  Mode: ${BOLD}Dry Run${NC}"
    elif [[ "$AUTO_DISABLE" == true ]]; then
        echo -e "  Mode: ${BOLD}Auto-Disable${NC}"
    else
        echo -e "  Mode: ${BOLD}Interactive${NC}"
    fi
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Service Audit Module${NC}"
    log "Service audit started at $(date)"

    list_running_services
    check_listening_ports
    audit_dangerous_services
    check_openinetd
    check_unnecessary_daemons
    print_summary

    log "Service audit completed at $(date)"
    echo -e "\n${GREEN}Service audit complete.${NC}"
}

main "$@"

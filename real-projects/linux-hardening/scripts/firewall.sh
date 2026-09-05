#!/usr/bin/env bash
#==============================================================================
# Firewall Hardening Script
# Configures iptables/nftables with a default-deny policy
#==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/firewall-$(date +%Y%m%d-%H%M%S).log"
CONFIG_FILE="${SCRIPT_DIR}/../config/iptables.rules"

ALLOW_PORTS="2222,80,443"
DEFAULT_DROP=true
USE_IPV6=true
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
            --allow-ports)  ALLOW_PORTS="$2"; shift 2 ;;
            --default-drop) DEFAULT_DROP=true; shift ;;
            --no-ipv6)      USE_IPV6=false; shift ;;
            --dry-run)      DRY_RUN=true; shift ;;
            *)              error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

detect_firewall() {
    if command -v nft &>/dev/null && nft list tables 2>/dev/null | grep -q .; then
        echo "nftables"
    elif command -v iptables &>/dev/null; then
        echo "iptables"
    else
        echo "none"
    fi
}

backup_firewall() {
    local fw_type
    fw_type=$(detect_firewall)
    local backup_path="${BACKUP_DIR}/firewall.bak.$(date +%Y%m%d-%H%M%S)"

    mkdir -p "$BACKUP_DIR"

    if [[ "$fw_type" == "iptables" ]]; then
        iptables-save > "${backup_path}.v4" 2>/dev/null || true
        ip6tables-save > "${backup_path}.v6" 2>/dev/null || true
        log "Backed up iptables rules to ${backup_path}"
    elif [[ "$fw_type" == "nftables" ]]; then
        nft list ruleset > "${backup_path}.nft" 2>/dev/null || true
        log "Backed up nftables rules to ${backup_path}"
    fi
}

configure_iptables() {
    header "Configuring iptables Firewall"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would apply iptables rules:"
        echo -e "  - Default policy: INPUT ${BOLD}DROP${NC}, FORWARD ${BOLD}DROP${NC}"
        echo -e "  - Allowed ports: ${BOLD}${ALLOW_PORTS}${NC}"
        echo -e "  - IPv6: ${BOLD}${USE_IPV6}${NC}"
        return 0
    fi

    backup_firewall

    # Flush existing rules
    iptables -F
    iptables -X
    iptables -t nat -F
    iptables -t nat -X
    iptables -t mangle -F
    iptables -t mangle -X

    # Default policies
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT ACCEPT

    # Loopback
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A OUTPUT -o lo -j ACCEPT

    # Drop invalid packets
    iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
    iptables -A FORWARD -m conntrack --ctstate INVALID -j DROP

    # Allow established/related connections
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

    # ICMP (rate limited)
    iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 4 -j ACCEPT
    iptables -A INPUT -p icmp --icmp-type echo-request -j DROP
    iptables -A INPUT -p icmp --icmp-type destination-unreachable -j ACCEPT
    iptables -A INPUT -p icmp --icmp-type time-exceeded -j ACCEPT

    # Allow specified ports
    IFS=',' read -ra PORTS <<< "$ALLOW_PORTS"
    for port in "${PORTS[@]}"; do
        port=$(echo "$port" | tr -d ' ')
        iptables -A INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT
        log "Allowed inbound TCP port ${port}"
    done

    # Rate limit SSH if port 2222 is in the list
    if [[ ",${ALLOW_PORTS}," == *",2222,"* ]]; then
        iptables -I INPUT -p tcp --dport 2222 -m conntrack --ctstate NEW \
            -m recent --set --name SSH --rsource
        iptables -I INPUT -p tcp --dport 2222 -m conntrack --ctstate NEW \
            -m recent --update --seconds 60 --hitcount 4 --name SSH --rsource -j DROP
        log "Applied SSH rate limiting on port 2222"
    fi

    # Block common attack patterns
    iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
    iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
    iptables -A INPUT -p tcp --tcp-flags ALL FIN,URG,PSH -j DROP
    iptables -A INPUT -p tcp --tcp-flags ALL SYN,RST,ACK,FIN,URG -j DROP
    iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
    iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP

    # Log dropped packets (rate limited)
    iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-dropped: " --log-level 4

    # Save rules
    if command -v netfilter-persistent &>/dev/null; then
        netfilter-persistent save
    elif command -v iptables-save &>/dev/null; then
        mkdir -p /etc/iptables
        iptables-save > /etc/iptables/rules.v4
    fi

    log "iptables rules applied and saved"
}

configure_ipv6() {
    if [[ "$USE_IPV6" != true ]]; then
        info "IPv6 firewall configuration skipped"
        return 0
    fi

    header "Configuring ip6tables"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would apply ip6tables rules"
        return 0
    fi

    ip6tables -F
    ip6tables -X

    ip6tables -P INPUT DROP
    ip6tables -P FORWARD DROP
    ip6tables -P OUTPUT ACCEPT

    ip6tables -A INPUT -i lo -j ACCEPT
    ip6tables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    ip6tables -A INPUT -p ipv6-icmp -j ACCEPT

    IFS=',' read -ra PORTS <<< "$ALLOW_PORTS"
    for port in "${PORTS[@]}"; do
        port=$(echo "$port" | tr -d ' ')
        ip6tables -A INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT
    done

    if command -v ip6tables-save &>/dev/null; then
        mkdir -p /etc/iptables
        ip6tables-save > /etc/iptables/rules.v6
    fi

    log "ip6tables rules applied"
}

enable_persistent() {
    header "Enabling Persistent Firewall"

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would enable firewall persistence"
        return 0
    fi

    # Enable netfilter-persistent if available
    if command -v netfilter-persistent &>/dev/null; then
        systemctl enable netfilter-persistent 2>/dev/null || true
        log "Enabled netfilter-persistent service"
    elif command -v ufw &>/dev/null; then
        warn "UFW detected. Consider: ufw enable"
    fi
}

print_summary() {
    header "Firewall Summary"
    local fw_type
    fw_type=$(detect_firewall)
    echo -e "  Firewall Type:  ${BOLD}${fw_type}${NC}"
    echo -e "  Default Policy: ${BOLD}INPUT DROP${NC}"
    echo -e "  Allowed Ports:  ${BOLD}${ALLOW_PORTS}${NC}"
    echo -e "  IPv6:           ${BOLD}${USE_IPV6}${NC}"
    echo -e "  Log File:       ${LOG_FILE}"

    if [[ "$DRY_RUN" != true ]]; then
        echo -e "\n${CYAN}Current rules:${NC}"
        iptables -L INPUT -n --line-numbers 2>/dev/null | head -30
    fi
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Firewall Hardening Module${NC}"
    log "Firewall configuration started at $(date)"

    local fw_type
    fw_type=$(detect_firewall)
    if [[ "$fw_type" == "none" ]]; then
        error "No firewall tool found (iptables/nftables)."
        error "Install: apt install iptables-persistent (Debian/Ubuntu) or yum install iptables-services (RHEL)"
        exit 1
    fi

    configure_iptables
    configure_ipv6
    enable_persistent
    print_summary

    log "Firewall configuration completed at $(date)"
    echo -e "\n${GREEN}Firewall configured successfully.${NC}"
}

main "$@"

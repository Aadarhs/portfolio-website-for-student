#!/usr/bin/env bash
#==============================================================================
# Full System Security Audit Script
# Read-only comprehensive security assessment
#==============================================================================
set -euo pipefail

LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/security-audit-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="${LOG_DIR}/security-audit-report-$(date +%Y%m%d-%H%M%S).txt"
SCORE=0
MAX_SCORE=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
fail()  { echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"; }
pass()  { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }
info()  { echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        warn "Running without root. Some checks may be limited."
    fi
}

check_pass() { ((MAX_SCORE++)); ((SCORE++)); pass "$1"; }
check_fail() { ((MAX_SCORE++)); fail "$1"; }
check_warn() { ((MAX_SCORE++)); warn "$1"; }

audit_ssh_config() {
    header "SSH Configuration Audit"

    local sshd_config="/etc/ssh/sshd_config"

    if [[ ! -f "$sshd_config" ]]; then
        check_fail "SSH config not found"
        return 0
    fi

    # Check PermitRootLogin
    if grep -qE "^PermitRootLogin\s+no" "$sshd_config" 2>/dev/null || \
       grep -qE "^PermitRootLogin\s+prohibit-password" "$sshd_config" 2>/dev/null; then
        check_pass "Root login is disabled in SSH"
    else
        check_fail "Root login may be enabled in SSH"
    fi

    # Check PasswordAuthentication
    if grep -qE "^PasswordAuthentication\s+no" "$sshd_config" 2>/dev/null; then
        check_pass "Password authentication disabled (key-only)"
    else
        check_fail "Password authentication may be enabled"
    fi

    # Check SSH port
    local ssh_port
    ssh_port=$(grep -E "^Port\s+" "$sshd_config" 2>/dev/null | awk '{print $2}' | head -1)
    if [[ -n "$ssh_port" && "$ssh_port" != "22" ]]; then
        check_pass "SSH running on non-default port: ${ssh_port}"
    elif [[ -z "$ssh_port" ]]; then
        check_pass "SSH using default port (may be behind reverse proxy)"
    else
        check_warn "SSH running on default port 22"
    fi

    # Check MaxAuthTries
    if grep -qE "^MaxAuthTries\s+[0-3]" "$sshd_config" 2>/dev/null; then
        check_pass "MaxAuthTries is set to 3 or less"
    else
        check_warn "MaxAuthTries not hardened (default is 6)"
    fi

    # Check X11Forwarding
    if grep -qE "^X11Forwarding\s+no" "$sshd_config" 2>/dev/null; then
        check_pass "X11 forwarding disabled"
    else
        check_warn "X11 forwarding may be enabled"
    fi

    # Check empty passwords
    if grep -qE "^PermitEmptyPasswords\s+no" "$sshd_config" 2>/dev/null; then
        check_pass "Empty passwords not permitted"
    else
        check_fail "Empty passwords setting not explicitly disabled"
    fi

    # Check protocol
    if grep -qE "^Protocol\s+2" "$sshd_config" 2>/dev/null; then
        check_pass "SSH Protocol 2 enforced"
    else
        check_info "SSH Protocol 2 (default on modern systems)"
    fi
}

audit_firewall() {
    header "Firewall Audit"

    if command -v iptables &>/dev/null; then
        local input_policy
        input_policy=$(iptables -L INPUT -n 2>/dev/null | head -1 | awk '{print $4}' | tr -d ')')

        if [[ "$input_policy" == "DROP" || "$input_policy" == "REJECT" ]]; then
            check_pass "iptables INPUT policy is ${input_policy}"
        else
            check_fail "iptables INPUT policy is not DROP/REJECT (currently: ${input_policy})"
        fi

        # Count rules
        local rule_count
        rule_count=$(iptables -L INPUT -n 2>/dev/null | tail -n +3 | wc -l)
        info "iptables INPUT chain has ${rule_count} rules"
    else
        check_warn "iptables not found"
    fi

    if command -v nft &>/dev/null; then
        local nft_tables
        nft_tables=$(nft list tables 2>/dev/null | wc -l)
        if [[ $nft_tables -gt 0 ]]; then
            check_pass "nftables has ${nft_tables} table(s) configured"
        else
            check_warn "nftables installed but no tables configured"
        fi
    fi
}

audit_kernel_params() {
    header "Kernel Parameter Audit"

    local params=(
        "net.ipv4.ip_forward:0:IP forwarding disabled"
        "net.ipv4.conf.all.accept_redirects:0:ICMP redirects rejected"
        "net.ipv4.tcp_syncookies:1:SYN cookies enabled"
        "kernel.randomize_va_space:2:ASLR fully enabled"
        "kernel.dmesg_restrict:1:dmesg restricted"
        "kernel.kptr_restrict:2:Kernel pointers restricted"
        "fs.protected_hardlinks:1:Hardlink protection enabled"
        "fs.protected_symlinks:1:Symlink protection enabled"
    )

    for param_def in "${params[@]}"; do
        IFS=':' read -r param expected desc <<< "$param_def"
        local actual
        actual=$(sysctl -n "$param" 2>/dev/null || echo "N/A")

        if [[ "$actual" == "$expected" ]]; then
            check_pass "${desc} (${param}=${actual})"
        elif [[ "$actual" == "N/A" ]]; then
            check_warn "${desc} - parameter not available"
        else
            check_fail "${desc} - ${param}=${actual} (expected ${expected})"
        fi
    done
}

audit_user_accounts() {
    header "User Account Audit"

    # Check for empty passwords
    local empty_pwds
    empty_pwds=$(awk -F: '($2 == "" || $2 == "!") {print $1}' /etc/shadow 2>/dev/null | wc -l || echo "0")
    if [[ "$empty_pwds" -eq 0 ]]; then
        check_pass "No accounts with empty passwords"
    else
        check_fail "${empty_pwds} accounts with empty passwords"
    fi

    # Check UID 0 accounts
    local uid_zero
    uid_zero=$(awk -F: '$3 == 0 {print $1}' /etc/passwd | wc -l)
    if [[ "$uid_zero" -eq 1 ]]; then
        check_pass "Only root has UID 0"
    else
        check_fail "${uid_zero} accounts have UID 0 (should be 1)"
    fi

    # Check for accounts with no password aging
    local no_aging=0
    while IFS=: read -r user _ uid _; do
        if [[ $uid -ge 1000 ]]; then
            local max_days
            max_days=$(getent shadow "$user" 2>/dev/null | cut -d: -f5 || echo "")
            if [[ -z "$max_days" || "$max_days" -eq 0 ]]; then
                ((no_aging++))
            fi
        fi
    done < /etc/passwd

    if [[ $no_aging -eq 0 ]]; then
        check_pass "All user accounts have password aging set"
    else
        check_warn "${no_aging} accounts without password aging"
    fi
}

audit_file_permissions() {
    header "File Permissions Audit"

    # Check /etc/passwd
    local passwd_perms
    passwd_perms=$(stat -c '%a' /etc/passwd 2>/dev/null || echo "unknown")
    if [[ "$passwd_perms" == "644" ]]; then
        check_pass "/etc/passwd has correct permissions (644)"
    else
        check_fail "/etc/passwd has incorrect permissions (${passwd_perms})"
    fi

    # Check /etc/shadow
    local shadow_perms
    shadow_perms=$(stat -c '%a' /etc/shadow 2>/dev/null || echo "unknown")
    if [[ "$shadow_perms" -le 640 ]]; then
        check_pass "/etc/shadow has restrictive permissions (${shadow_perms})"
    else
        check_fail "/etc/shadow has too-open permissions (${shadow_perms})"
    fi

    # Check world-writable files
    local ww_count
    ww_count=$(find / -xdev -type f -perm -0002 2>/dev/null | wc -l || echo "0")
    if [[ "$ww_count" -eq 0 ]]; then
        check_pass "No world-writable files found"
    else
        check_warn "${ww_count} world-writable files found"
    fi

    # Check /tmp permissions
    local tmp_perms
    tmp_perms=$(stat -c '%a' /tmp 2>/dev/null || echo "unknown")
    if [[ "$tmp_perms" == "1777" ]]; then
        check_pass "/tmp has correct sticky bit permissions"
    else
        check_warn "/tmp permissions: ${tmp_perms}"
    fi
}

audit_services() {
    header "Service Audit"

    local dangerous=(
        "telnet.socket" "rsh.socket" "rlogin.socket" "tftp.socket"
        "vsftpd" "xinetd" "avahi-daemon" "cups" "bluetooth"
    )

    local found_dangerous=0
    for service in "${dangerous[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            check_fail "Dangerous service running: ${service}"
            ((found_dangerous++))
        fi
    done

    if [[ $found_dangerous -eq 0 ]]; then
        check_pass "No dangerous services currently running"
    fi
}

audit_updates() {
    header "System Update Status"

    if command -v apt &>/dev/null; then
        local updates
        updates=$(apt list --upgradable 2>/dev/null | grep -c upgradable || echo "0")
        if [[ "$updates" -eq 0 ]]; then
            check_pass "System is up to date"
        else
            check_warn "${updates} packages have pending updates"
        fi
    elif command -v yum &>/dev/null; then
        local updates
        updates=$(yum check-update 2>/dev/null | grep -c "^" || echo "0")
        if [[ "$updates" -eq 0 ]]; then
            check_pass "System is up to date"
        else
            check_warn "System has pending updates"
        fi
    fi
}

audit_logging() {
    header "Logging Audit"

    if systemctl is-active --quiet auditd 2>/dev/null; then
        check_pass "auditd is running"
    else
        check_warn "auditd is not running"
    fi

    if systemctl is-active --quiet rsyslog 2>/dev/null || \
       systemctl is-active --quiet systemd-journald 2>/dev/null; then
        check_pass "System logging is active"
    else
        check_warn "System logging may not be active"
    fi
}

generate_report() {
    header "Generating Security Audit Report"

    local score_pct=0
    if [[ $MAX_SCORE -gt 0 ]]; then
        score_pct=$(( (SCORE * 100) / MAX_SCORE ))
    fi

    {
        echo "=========================================="
        echo "  Security Audit Report"
        echo "  Generated: $(date)"
        echo "  Hostname:  $(hostname)"
        echo "  Kernel:    $(uname -r)"
        echo "=========================================="
        echo ""
        echo "Score: ${SCORE}/${MAX_SCORE} (${score_pct}%)"
        echo ""
        echo "System Information:"
        echo "  OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
        echo "  Kernel: $(uname -r)"
        echo "  Uptime: $(uptime -p 2>/dev/null || uptime)"
        echo ""
        echo "See full audit log for details:"
        echo "  ${LOG_FILE}"
    } > "$REPORT_FILE"

    log "Report saved to: ${REPORT_FILE}"
}

print_score() {
    header "Security Audit Score"
    local score_pct=0
    if [[ $MAX_SCORE -gt 0 ]]; then
        score_pct=$(( (SCORE * 100) / MAX_SCORE ))
    fi

    echo -e "  ${BOLD}Score: ${SCORE}/${MAX_SCORE} (${score_pct}%)${NC}"
    echo ""

    if [[ $score_pct -ge 80 ]]; then
        echo -e "  ${GREEN}${BOLD}GOOD${NC} - System has strong security posture"
    elif [[ $score_pct -ge 60 ]]; then
        echo -e "  ${YELLOW}${BOLD}FAIR${NC} - Some security improvements recommended"
    else
        echo -e "  ${RED}${BOLD}POOR${NC} - Significant security improvements needed"
    fi

    echo -e "\n  Report: ${REPORT_FILE}"
}

main() {
    check_root

    mkdir -p "$LOG_DIR"
    chmod 700 "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Full System Security Audit${NC}"
    echo -e "Scanning system security posture...\n"
    log "Security audit started at $(date)"

    audit_ssh_config
    audit_firewall
    audit_kernel_params
    audit_user_accounts
    audit_file_permissions
    audit_services
    audit_updates
    audit_logging
    generate_report
    print_score

    log "Security audit completed at $(date)"
}

main "$@"

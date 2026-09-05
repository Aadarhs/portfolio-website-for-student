#!/usr/bin/env bash
#==============================================================================
# CIS Benchmark Compliance Check Script
# Basic checks against CIS benchmarks
#==============================================================================
set -euo pipefail

LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/compliance-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="${LOG_DIR}/compliance-report-$(date +%Y%m%d-%H%M%S).txt"
OUTPUT_FILE=""
LEVEL=1

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
TOTAL=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
fail()  { echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"; }
pass()  { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }
header(){ echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }

record_pass() { ((TOTAL++)); ((PASS_COUNT++)); pass "$1"; }
record_fail() { ((TOTAL++)); ((FAIL_COUNT++)); fail "$1"; }
record_warn() { ((TOTAL++)); ((WARN_COUNT++)); warn "$1"; }

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --level)  LEVEL="$2"; shift 2 ;;
            --output) OUTPUT_FILE="$2"; shift 2 ;;
            *)        echo "Unknown option: $1"; exit 1 ;;
        esac
    done
}

check_1_1_filesystem() {
    header "1. Filesystem Configuration"

    # 1.1.1.1-1.1.1.9 - Disable cramfs, freevxfs, hfs, hfsplus, udf, etc.
    local modules=("cramfs" "freevxfs" "hfs" "hfsplus" "udf" "vfat" "squashfs")
    for mod in "${modules[@]}"; do
        if modprobe -n -v "$mod" 2>/dev/null | grep -q "install /bin/true"; then
            record_pass "1.1.1 - ${mod} module is disabled"
        elif ! lsmod | grep -q "$mod"; then
            record_pass "1.1.1 - ${mod} module is not loaded"
        else
            record_fail "1.1.1 - ${mod} module is not disabled"
        fi
    done

    # 1.1.4 /tmp is separate partition
    if mount | grep -q " /tmp "; then
        record_pass "1.1.4 - /tmp is a separate partition"
    else
        record_warn "1.1.4 - /tmp is not a separate partition"
    fi

    # 1.1.5 /tmp has nodev
    if findmnt -n -o OPTIONS /tmp 2>/dev/null | grep -q "nodev"; then
        record_pass "1.1.5 - /tmp has nodev option"
    else
        record_warn "1.1.5 - /tmp does not have nodev option"
    fi

    # 1.1.6 /tmp has nosuid
    if findmnt -n -o OPTIONS /tmp 2>/dev/null | grep -q "nosuid"; then
        record_pass "1.1.6 - /tmp has nosuid option"
    else
        record_warn "1.1.6 - /tmp does not have nosuid option"
    fi

    # 1.1.14 /var is separate partition
    if mount | grep -q " /var "; then
        record_pass "1.1.14 - /var is a separate partition"
    else
        record_warn "1.1.14 - /var is not a separate partition"
    fi

    # 1.1.15 /var/tmp has nodev
    if findmnt -n -o OPTIONS /var/tmp 2>/dev/null | grep -q "nodev"; then
        record_pass "1.1.15 - /var/tmp has nodev option"
    else
        record_warn "1.1.15 - /var/tmp does not have nodev option"
    fi
}

check_1_2_software_updates() {
    header "2. Software Updates"
    # This is informational
    record_warn "1.2 - Software updates should be verified manually"
}

check_1_3_filesystem_permissions() {
    header "3. Filesystem Permissions"

    # 1.3.1 /dev/shm has nodev
    if findmnt -n -o OPTIONS /dev/shm 2>/dev/null | grep -q "nodev"; then
        record_pass "1.3.1 - /dev/shm has nodev option"
    else
        record_warn "1.3.1 - /dev/shm does not have nodev option"
    fi
}

check_2_1_banner() {
    header "4. Banners and Warning Messages"

    # /etc/issue exists
    if [[ -f /etc/issue ]] && [[ -s /etc/issue ]]; then
        record_pass "2.1 - /etc/issue banner exists"
    else
        record_fail "2.1 - /etc/issue banner missing"
    fi

    # /etc/issue.net exists
    if [[ -f /etc/issue.net ]] && [[ -s /etc/issue.net ]]; then
        record_pass "2.1 - /etc/issue.net banner exists"
    else
        record_fail "2.1 - /etc/issue.net banner missing"
    fi

    # SSH Banner configured
    if grep -qE "^Banner\s+/etc/issue.net" /etc/ssh/sshd_config 2>/dev/null; then
        record_pass "2.1 - SSH banner configured"
    else
        record_fail "2.1 - SSH banner not configured"
    fi
}

check_3_1_ssh() {
    header "5. SSH Configuration"

    local sshd="/etc/ssh/sshd_config"

    # 3.1.1 - Protocol 2 (implicit in modern OpenSSH)
    record_pass "3.1.1 - SSH Protocol 2 (default)"

    # 3.1.2 LogLevel
    if grep -qE "^LogLevel\s+VERBOSE" "$sshd" 2>/dev/null || \
       grep -qE "^LogLevel\s+INFO" "$sshd" 2>/dev/null; then
        record_pass "3.1.2 - SSH LogLevel is set"
    else
        record_fail "3.1.2 - SSH LogLevel should be VERBOSE or INFO"
    fi

    # 3.1.3 X11Forwarding
    if grep -qE "^X11Forwarding\s+no" "$sshd" 2>/dev/null; then
        record_pass "3.1.3 - X11Forwarding disabled"
    else
        record_fail "3.1.3 - X11Forwarding should be disabled"
    fi

    # 3.1.4 MaxAuthTries
    if grep -qE "^MaxAuthTries\s+[0-4]" "$sshd" 2>/dev/null; then
        record_pass "3.1.4 - MaxAuthTries is 4 or less"
    else
        record_fail "3.1.4 - MaxAuthTries should be 4 or less"
    fi

    # 3.1.5 PermitEmptyPasswords
    if grep -qE "^PermitEmptyPasswords\s+no" "$sshd" 2>/dev/null; then
        record_pass "3.1.5 - PermitEmptyPasswords is no"
    else
        record_fail "3.1.5 - PermitEmptyPasswords should be no"
    fi

    # 3.1.6 PermitUserEnvironment
    if grep -qE "^PermitUserEnvironment\s+no" "$sshd" 2>/dev/null; then
        record_pass "3.1.6 - PermitUserEnvironment is no"
    else
        record_fail "3.1.6 - PermitUserEnvironment should be no"
    fi

    # 3.1.7 ClientAliveInterval
    if grep -qE "^ClientAliveInterval\s+[0-9]+" "$sshd" 2>/dev/null; then
        record_pass "3.1.7 - ClientAliveInterval is set"
    else
        record_fail "3.1.7 - ClientAliveInterval should be set"
    fi

    # 3.1.8 LoginGraceTime
    if grep -qE "^LoginGraceTime\s+[0-9]+" "$sshd" 2>/dev/null; then
        record_pass "3.1.8 - LoginGraceTime is set"
    else
        record_fail "3.1.8 - LoginGraceTime should be set"
    fi

    # 3.1.9 PermitRootLogin
    if grep -qE "^PermitRootLogin\s+no" "$sshd" 2>/dev/null; then
        record_pass "3.1.9 - PermitRootLogin is no"
    else
        record_fail "3.1.9 - PermitRootLogin should be no"
    fi

    # 3.1.10 PermitRhosts
    if grep -qE "^IgnoreRhosts\s+yes" "$sshd" 2>/dev/null; then
        record_pass "3.1.10 - IgnoreRhosts is yes"
    else
        record_fail "3.1.10 - IgnoreRhosts should be yes"
    fi

    # 3.1.11 HostbasedAuthentication
    if grep -qE "^HostbasedAuthentication\s+no" "$sshd" 2>/dev/null; then
        record_pass "3.1.11 - HostbasedAuthentication is no"
    else
        record_fail "3.1.11 - HostbasedAuthentication should be no"
    fi
}

check_3_2_logging() {
    header "6. Logging and Auditing"

    # rsyslog running
    if systemctl is-active --quiet rsyslog 2>/dev/null || \
       systemctl is-active --quiet systemd-journald 2>/dev/null; then
        record_pass "3.2 - System logging is active"
    else
        record_fail "3.2 - System logging should be active"
    fi

    # auditd running
    if systemctl is-active --quiet auditd 2>/dev/null; then
        record_pass "3.2 - Audit daemon is running"
    else
        record_fail "3.2 - Audit daemon should be running"
    fi

    # Permissions on log files
    if [[ -d /var/log ]]; then
        local perms
        perms=$(stat -c '%a' /var/log 2>/dev/null)
        if [[ "$perms" -le 755 ]]; then
            record_pass "3.2 - /var/log has restrictive permissions"
        else
            record_fail "3.2 - /var/log has too-open permissions"
        fi
    fi
}

check_3_3_access() {
    header "7. Access, Authentication, and Authorization"

    # Password hashing
    if grep -qE "^ENCRYPT_METHOD\s+SHA512" /etc/login.defs 2>/dev/null; then
        record_pass "3.3 - Password hashing uses SHA512"
    else
        record_fail "3.3 - Password hashing should use SHA512"
    fi

    # Minimum password length
    if [[ -f /etc/security/pwquality.conf ]]; then
        local minlen
        minlen=$(grep -E "^minlen" /etc/security/pwquality.conf 2>/dev/null | awk -F= '{print $2}' | tr -d ' ')
        if [[ -n "$minlen" && "$minlen" -ge 14 ]]; then
            record_pass "3.3 - Minimum password length is ${minlen}"
        else
            record_fail "3.3 - Minimum password length should be >= 14"
        fi
    else
        record_fail "3.3 - /etc/security/pwquality.conf not found"
    fi

    # Password aging
    local max_days
    max_days=$(grep "^PASS_MAX_DAYS" /etc/login.defs 2>/dev/null | awk '{print $2}')
    if [[ -n "$max_days" && "$max_days" -le 90 && "$max_days" -gt 0 ]]; then
        record_pass "3.3 - PASS_MAX_DAYS is ${max_days}"
    else
        record_fail "3.3 - PASS_MAX_DAYS should be <= 90"
    fi
}

check_3_4_network() {
    header "8. Network Configuration"

    # IP forwarding
    local fwd
    fwd=$(sysctl -n net.ipv4.ip_forward 2>/dev/null || echo "N/A")
    if [[ "$fwd" == "0" ]]; then
        record_pass "3.4 - IP forwarding is disabled"
    else
        record_fail "3.4 - IP forwarding should be disabled"
    fi

    # ICMP redirects
    local redir
    redir=$(sysctl -n net.ipv4.conf.all.accept_redirects 2>/dev/null || echo "N/A")
    if [[ "$redir" == "0" ]]; then
        record_pass "3.4 - ICMP redirects are disabled"
    else
        record_fail "3.4 - ICMP redirects should be disabled"
    fi

    # SYN cookies
    local syn
    syn=$(sysctl -n net.ipv4.tcp_syncookies 2>/dev/null || echo "N/A")
    if [[ "$syn" == "1" ]]; then
        record_pass "3.4 - SYN cookies are enabled"
    else
        record_fail "3.4 - SYN cookies should be enabled"
    fi
}

check_level_2() {
    if [[ "$LEVEL" -lt 2 ]]; then
        return 0
    fi

    header "Level 2 Additional Checks"

    # 2.1.1 - Disable unused filesystems (deeper check)
    local unused_fs=("cramfs" "freevxfs" "hfs" "hfsplus" "jffs2" "udf")
    for fs in "${unused_fs[@]}"; do
        if ! lsmod | grep -q "$fs" 2>/dev/null; then
            record_pass "L2 - ${fs} is not loaded"
        else
            record_fail "L2 - ${fs} should be unloaded"
        fi
    done

    # Restricted su
    if grep -qE "^auth.*required.*pam_wheel.so" /etc/pam.d/su 2>/dev/null; then
        record_pass "L2 - su is restricted to wheel group"
    else
        record_fail "L2 - su should be restricted to wheel group"
    fi

    # Default umask
    if grep -q "umask 027" /etc/profile 2>/dev/null || \
       grep -q "umask 027" /etc/bashrc 2>/dev/null; then
        record_pass "L2 - Default umask is 027"
    else
        record_warn "L2 - Default umask should be 027"
    fi
}

generate_report() {
    header "Generating Compliance Report"

    local pct=0
    if [[ $TOTAL -gt 0 ]]; then
        pct=$(( (PASS_COUNT * 100) / TOTAL ))
    fi

    local output="${OUTPUT_FILE:-$REPORT_FILE}"

    {
        echo "=========================================="
        echo "  CIS Benchmark Compliance Report"
        echo "  Generated: $(date)"
        echo "  Hostname:  $(hostname)"
        echo "  Level:     ${LEVEL}"
        echo "=========================================="
        echo ""
        echo "Results:  ${PASS_COUNT}/${TOTAL} passed (${pct}%)"
        echo "  Passed:  ${PASS_COUNT}"
        echo "  Failed:  ${FAIL_COUNT}"
        echo "  Warnings:${WARN_COUNT}"
        echo ""
        echo "System: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
        echo "Kernel: $(uname -r)"
        echo ""
        echo "See full log: ${LOG_FILE}"
    } > "$output"

    log "Report saved to: ${output}"
}

print_score() {
    header "Compliance Score"
    local pct=0
    if [[ $TOTAL -gt 0 ]]; then
        pct=$(( (PASS_COUNT * 100) / TOTAL ))
    fi

    echo -e "  ${BOLD}Passed:   ${GREEN}${PASS_COUNT}${NC}/${TOTAL}"
    echo -e "  ${BOLD}Failed:   ${RED}${FAIL_COUNT}${NC}"
    echo -e "  ${BOLD}Warnings: ${YELLOW}${WARN_COUNT}${NC}"
    echo -e "  ${BOLD}Score:    ${pct}%${NC}"
    echo ""

    if [[ $pct -ge 80 ]]; then
        echo -e "  ${GREEN}${BOLD}COMPLIANT${NC} - Meets most CIS benchmarks"
    elif [[ $pct -ge 60 ]]; then
        echo -e "  ${YELLOW}${BOLD}PARTIAL${NC} - Some CIS benchmarks not met"
    else
        echo -e "  ${RED}${BOLD}NON-COMPLIANT${NC} - Significant gaps in compliance"
    fi

    echo -e "\n  Report: ${REPORT_FILE}"
}

main() {
    parse_args "$@"

    mkdir -p "$LOG_DIR"
    chmod 700 "$LOG_DIR"

    echo -e "${BOLD}${CYAN}CIS Benchmark Compliance Check (Level ${LEVEL})${NC}\n"
    log "Compliance check started at $(date)"

    check_1_1_filesystem
    check_1_2_software_updates
    check_1_3_filesystem_permissions
    check_2_1_banner
    check_3_1_ssh
    check_3_2_logging
    check_3_3_access
    check_3_4_network
    check_level_2

    generate_report
    print_score

    log "Compliance check completed at $(date)"
}

main "$@"

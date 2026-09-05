#!/usr/bin/env bash
#==============================================================================
# Kernel Hardening Script
# Applies security-focused sysctl parameters
#==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/kernel-hardening-$(date +%Y%m%d-%H%M%S).log"
CONFIG_FILE="${SCRIPT_DIR}/../config/sysctl.conf"

PROFILE="strict"
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
            --profile) PROFILE="$2"; shift 2 ;;
            --dry-run) DRY_RUN=true; shift ;;
            *)         error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

backup_sysctl() {
    local backup_path="${BACKUP_DIR}/sysctl.bak.$(date +%Y%m%d-%H%M%S)"
    sysctl -a 2>/dev/null > "${backup_path}"
    log "Backed up current sysctl settings to ${backup_path}"
}

apply_network_hardening() {
    header "Applying Network Security Parameters"

    declare -A net_params=(
        ["net.ipv4.ip_forward"]="0"
        ["net.ipv4.conf.all.accept_redirects"]="0"
        ["net.ipv4.conf.default.accept_redirects"]="0"
        ["net.ipv6.conf.all.accept_redirects"]="0"
        ["net.ipv6.conf.default.accept_redirects"]="0"
        ["net.ipv4.conf.all.send_redirects"]="0"
        ["net.ipv4.conf.default.send_redirects"]="0"
        ["net.ipv4.conf.all.accept_source_route"]="0"
        ["net.ipv4.conf.default.accept_source_route"]="0"
        ["net.ipv4.tcp_syncookies"]="1"
        ["net.ipv4.tcp_max_syn_backlog"]="2048"
        ["net.ipv4.tcp_synack_retries"]="2"
        ["net.ipv4.conf.all.log_martians"]="1"
        ["net.ipv4.conf.default.log_martians"]="1"
        ["net.ipv4.icmp_echo_ignore_broadcasts"]="1"
        ["net.ipv4.icmp_ignore_bogus_error_responses"]="1"
        ["net.ipv4.conf.all.rp_filter"]="1"
        ["net.ipv4.conf.default.rp_filter"]="1"
        ["net.ipv4.tcp_fin_timeout"]="15"
        ["net.ipv4.tcp_tw_reuse"]="1"
    )

    for param in "${!net_params[@]}"; do
        local value="${net_params[$param]}"
        if [[ "$DRY_RUN" == true ]]; then
            info "Would set: ${param} = ${value}"
        else
            if sysctl -w "${param}=${value}" &>/dev/null; then
                log "Set ${param} = ${value}"
            else
                warn "Failed to set ${param}"
            fi
        fi
    done
}

apply_memory_protection() {
    header "Applying Memory Protection Parameters"

    declare -A mem_params=(
        ["kernel.dmesg_restrict"]="1"
        ["kernel.kptr_restrict"]="2"
        ["kernel.randomize_va_space"]="2"
        ["kernel.yama.ptrace_scope"]="1"
        ["kernel.perf_event_paranoid"]="3"
        ["kernel.sysrq"]="0"
        ["kernel.unprivileged_bpf_disabled"]="1"
        ["vm.unprivileged_userfaultfd"]="0"
    )

    for param in "${!mem_params[@]}"; do
        local value="${mem_params[$param]}"
        if [[ "$DRY_RUN" == true ]]; then
            info "Would set: ${param} = ${value}"
        else
            if sysctl -w "${param}=${value}" &>/dev/null; then
                log "Set ${param} = ${value}"
            else
                warn "Failed to set ${param} (may not be supported on this kernel)"
            fi
        fi
    done
}

apply_filesystem_protection() {
    header "Applying File System Protection Parameters"

    declare -A fs_params=(
        ["fs.suid_dumpable"]="0"
        ["fs.protected_hardlinks"]="1"
        ["fs.protected_symlinks"]="1"
        ["fs.protected_fifos"]="2"
        ["fs.protected_regular"]="2"
    )

    for param in "${!fs_params[@]}"; do
        local value="${fs_params[$param]}"
        if [[ "$DRY_RUN" == true ]]; then
            info "Would set: ${param} = ${value}"
        else
            if sysctl -w "${param}=${value}" &>/dev/null; then
                log "Set ${param} = ${value}"
            else
                warn "Failed to set ${param}"
            fi
        fi
    done
}

apply_bpf_hardening() {
    header "Applying BPF Hardening"

    declare -A bpf_params=(
        ["kernel.unprivileged_bpf_disabled"]="1"
        ["net.core.bpf_jit_harden"]="2"
    )

    for param in "${!bpf_params[@]}"; do
        local value="${bpf_params[$param]}"
        if [[ "$DRY_RUN" == true ]]; then
            info "Would set: ${param} = ${value}"
        else
            if sysctl -w "${param}=${value}" &>/dev/null; then
                log "Set ${param} = ${value}"
            else
                warn "Failed to set ${param}"
            fi
        fi
    done
}

make_persistent() {
    header "Making Settings Persistent"

    if [[ "$DRY_RUN" == true ]]; then
        info "Would create /etc/sysctl.d/99-hardening.conf"
        return 0
    fi

    local sysctl_dir="/etc/sysctl.d"
    mkdir -p "$sysctl_dir"

    cat > "${sysctl_dir}/99-hardening.conf" << 'EOF'
# Security Hardening - Generated by Linux Hardening Suite
# This file is loaded at boot by sysctl

# Network Security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1

# Memory Protection
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.randomize_va_space = 2
kernel.yama.ptrace_scope = 1
kernel.perf_event_paranoid = 3
kernel.sysrq = 0
kernel.unprivileged_bpf_disabled = 1
vm.unprivileged_userfaultfd = 0

# File System
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
fs.protected_fifos = 2
fs.protected_regular = 2

# BPF Hardening
net.core.bpf_jit_harden = 2
EOF

    chmod 644 "${sysctl_dir}/99-hardening.conf"
    sysctl -p "${sysctl_dir}/99-hardening.conf" &>/dev/null || true
    log "Persistent sysctl settings created at ${sysctl_dir}/99-hardening.conf"
}

verify_settings() {
    header "Verifying Applied Settings"

    local failed=0
    local checks=(
        "net.ipv4.ip_forward=0"
        "net.ipv4.conf.all.accept_redirects=0"
        "net.ipv4.tcp_syncookies=1"
        "kernel.dmesg_restrict=1"
        "kernel.randomize_va_space=2"
        "fs.protected_hardlinks=1"
    )

    for check in "${checks[@]}"; do
        local param="${check%%=*}"
        local expected="${check#*=}"
        local actual
        actual=$(sysctl -n "$param" 2>/dev/null || echo "N/A")

        if [[ "$actual" == "$expected" ]]; then
            log "${param} = ${actual} (correct)"
        else
            warn "${param} = ${actual} (expected ${expected})"
            ((failed++))
        fi
    done

    return $failed
}

print_summary() {
    header "Kernel Hardening Summary"
    echo -e "  Profile: ${BOLD}${PROFILE}${NC}"
    echo -e "  Mode:    ${BOLD}$(if $DRY_RUN; then echo 'Dry Run'; else echo 'Apply'; fi)${NC}"
    echo -e "  Log:     ${LOG_FILE}"
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Kernel Hardening Module${NC}"
    log "Kernel hardening started at $(date)"

    backup_sysctl
    apply_network_hardening
    apply_memory_protection
    apply_filesystem_protection
    apply_bpf_hardening
    make_persistent
    verify_settings || true
    print_summary

    log "Kernel hardening completed at $(date)"
    echo -e "\n${GREEN}Kernel hardening complete.${NC}"
}

main "$@"

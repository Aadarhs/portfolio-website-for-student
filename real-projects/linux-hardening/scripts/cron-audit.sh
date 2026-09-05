#!/usr/bin/env bash
#==============================================================================
# Cron Job Security Audit Script
# Reviews and validates all cron configurations
#==============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/linux-hardening"
LOG_DIR="/var/log/linux-hardening"
LOG_FILE="${LOG_DIR}/cron-audit-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="${LOG_DIR}/cron-audit-report-$(date +%Y%m%d-%H%M%S).txt"

CHECK_PERMS=true
VERIFY_USERS=true
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
            --check-permissions) CHECK_PERMS=true; shift ;;
            --no-check-permissions) CHECK_PERMS=false; shift ;;
            --verify-users)  VERIFY_USERS=true; shift ;;
            --dry-run)       DRY_RUN=true; shift ;;
            *)               error "Unknown option: $1"; exit 1 ;;
        esac
    done
}

audit_system_cron() {
    header "System Cron Files"

    local cron_dirs=(
        "/etc/crontab"
        "/etc/cron.d"
        "/etc/cron.daily"
        "/etc/cron.hourly"
        "/etc/cron.weekly"
        "/etc/cron.monthly"
    )

    for cron_path in "${cron_dirs[@]}"; do
        if [[ -d "$cron_path" ]]; then
            echo -e "\n${BOLD}Directory: ${cron_path}${NC}"
            for f in "$cron_path"/*; do
                if [[ -f "$f" ]]; then
                    local name
                    name=$(basename "$f")
                    local perms
                    perms=$(stat -c '%a %U:%G' "$f" 2>/dev/null || echo "unknown")

                    # Check permissions
                    if [[ "$CHECK_PERMS" == true ]]; then
                        local file_perms
                        file_perms=$(stat -c '%a' "$f" 2>/dev/null || echo "000")
                        if [[ "$file_perms" -gt 644 ]]; then
                            warn "Excessive permissions (${file_perms}) on ${f}"
                            if [[ "$DRY_RUN" != true ]]; then
                                chmod 644 "$f" 2>/dev/null || true
                                log "  Fixed permissions on ${f}"
                            fi
                        fi
                    fi

                    # Show content summary
                    echo -e "  ${CYAN}${name}${NC} (${perms})"
                    grep -v '^#' "$f" 2>/dev/null | grep -v '^$' | head -3 | while IFS= read -r line; do
                        echo -e "    ${line}"
                    done
                fi
            done
        elif [[ -f "$cron_path" ]]; then
            echo -e "\n${BOLD}File: ${cron_path}${NC}"
            local perms
            perms=$(stat -c '%a %U:%G' "$cron_path" 2>/dev/null || echo "unknown")
            echo -e "  Permissions: ${perms}"
            grep -v '^#' "$cron_path" 2>/dev/null | grep -v '^$' | head -5 | while IFS= read -r line; do
                echo -e "  ${line}"
            done
        fi
    done
}

audit_user_crontabs() {
    header "User Crontabs"

    local cron_dir="/var/spool/cron/crontabs"
    [[ ! -d "$cron_dir" ]] && cron_dir="/var/spool/cron"

    if [[ ! -d "$cron_dir" ]]; then
        info "No crontab directory found"
        return 0
    fi

    for crontab in "$cron_dir"/*; do
        [[ ! -f "$crontab" ]] && continue

        local user
        user=$(basename "$crontab")

        echo -e "\n${BOLD}User: ${user}${NC}"

        # Verify user exists
        if [[ "$VERIFY_USERS" == true ]]; then
            if ! id "$user" &>/dev/null; then
                warn "Crontab belongs to non-existent user: ${user}"
                if [[ "$DRY_RUN" != true ]]; then
                    info "  Consider removing: ${crontab}"
                fi
            fi
        fi

        # Check permissions
        if [[ "$CHECK_PERMS" == true ]]; then
            local perms
            perms=$(stat -c '%a' "$crontab" 2>/dev/null || echo "unknown")
            if [[ "$perms" != "600" && "$perms" != "644" ]]; then
                warn "Incorrect permissions (${perms}) on ${crontab}"
                if [[ "$DRY_RUN" != true ]]; then
                    chmod 600 "$crontab" 2>/dev/null || true
                    log "  Fixed permissions on ${crontab}"
                fi
            fi
        fi

        # Show crontab content
        grep -v '^#' "$crontab" 2>/dev/null | grep -v '^$' | while IFS= read -r line; do
            echo -e "  ${line}"
        done
    done
}

check_cron_root() {
    header "Checking Root's Crontab"

    if crontab -l -u root &>/dev/null; then
        local entries
        entries=$(crontab -l -u root 2>/dev/null | grep -v '^#' | grep -v '^$' | wc -l)

        if [[ $entries -gt 0 ]]; then
            info "Root has ${entries} cron job(s):"
            crontab -l -u root 2>/dev/null | grep -v '^#' | grep -v '^$' | while IFS= read -r line; do
                echo -e "  ${line}"
            done

            # Check for suspicious commands
            crontab -l -u root 2>/dev/null | grep -v '^#' | grep -v '^$' | while IFS= read -r line; do
                if echo "$line" | grep -qE 'curl|wget|python|perl|ruby|nc|ncat|bash.*-i|/dev/tcp'; then
                    warn "Potentially suspicious cron command: ${line}"
                fi
            done
        else
            log "Root has no active cron jobs"
        fi
    fi
}

check_cron_suspicious_patterns() {
    header "Checking for Suspicious Cron Patterns"

    local suspicious_patterns=(
        "curl.*|.*sh"
        "wget.*|.*sh"
        "python.*-c"
        "perl.*-e"
        "/dev/tcp"
        "bash.*-i"
        "nc.*-"
        "ncat.*-"
        "base64.*-d"
        "eval.*\("
        "chmod.*777"
    )

    local found=0

    for pattern in "${suspicious_patterns[@]}"; do
        local matches
        matches=$(grep -rl "$pattern" /etc/cron* /var/spool/cron* 2>/dev/null || true)

        if [[ -n "$matches" ]]; then
            ((found++))
            warn "Suspicious pattern '${pattern}' found in:"
            echo "$matches" | while IFS= read -r match; do
                echo -e "  ${RED}•${NC} ${match}"
            done
        fi
    done

    if [[ $found -eq 0 ]]; then
        log "No suspicious cron patterns detected."
    fi
}

check_cron_at() {
    header "Checking 'at' Jobs"

    if command -v atq &>/dev/null; then
        local at_jobs
        at_jobs=$(atq 2>/dev/null || true)

        if [[ -n "$at_jobs" ]]; then
            warn "Pending 'at' jobs found:"
            echo "$at_jobs" | while IFS= read -r line; do
                echo -e "  ${line}"
            done
        else
            log "No pending 'at' jobs"
        fi
    fi
}

generate_report() {
    header "Generating Cron Audit Report"

    {
        echo "=========================================="
        echo "  Cron Job Security Audit Report"
        echo "  Generated: $(date)"
        echo "=========================================="
        echo ""
        echo "--- System Crontab ---"
        cat /etc/crontab 2>/dev/null || echo "(not found)"
        echo ""
        echo "--- /etc/cron.d/ ---"
        ls -la /etc/cron.d/ 2>/dev/null || echo "(not found)"
        echo ""
        echo "--- User Crontabs ---"
        for f in /var/spool/cron/crontabs/* /var/spool/cron/*; do
            [[ -f "$f" ]] && echo "  $(basename "$f"): $(grep -v '^#' "$f" | grep -v '^$' | wc -l) entries"
        done
        echo ""
        echo "--- Cron Permissions ---"
        ls -la /etc/crontab /var/spool/cron/ 2>/dev/null || true
    } > "$REPORT_FILE"

    log "Report saved to: ${REPORT_FILE}"
}

print_summary() {
    header "Cron Audit Summary"
    echo -e "  Log File:  ${LOG_FILE}"
    echo -e "  Report:    ${REPORT_FILE}"
    echo -e "  Check Perms: ${BOLD}${CHECK_PERMS}${NC}"
    echo -e "  Verify Users: ${BOLD}${VERIFY_USERS}${NC}"
}

main() {
    check_root
    parse_args "$@"

    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    chmod 700 "$BACKUP_DIR" "$LOG_DIR"

    echo -e "${BOLD}${CYAN}Cron Audit Module${NC}"
    log "Cron audit started at $(date)"

    audit_system_cron
    audit_user_crontabs
    check_cron_root
    check_cron_suspicious_patterns
    check_cron_at
    generate_report
    print_summary

    log "Cron audit completed at $(date)"
    echo -e "\n${GREEN}Cron audit complete.${NC}"
}

main "$@"

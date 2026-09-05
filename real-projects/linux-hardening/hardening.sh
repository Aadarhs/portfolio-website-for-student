#!/usr/bin/env bash
#==============================================================================
# Linux System Hardening Orchestrator
# Main entry point for the hardening suite
#==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/linux-hardening"
BACKUP_DIR="/var/backups/linux-hardening"
LOG_FILE="${LOG_DIR}/hardening-$(date +%Y%m%d-%H%M%S).log"
MODULES_DIR="${SCRIPT_DIR}/scripts"
CONFIG_DIR="${SCRIPT_DIR}/config"
DRY_RUN=false
RUN_ALL=false
SKIP_MODULES=()
SELECT_MODULES=()
INTERACTIVE=true

declare -A MODULE_MAP=(
    [ssh]="ssh-hardening.sh"
    [firewall]="firewall.sh"
    [user-audit]="user-audit.sh"
    [file-permissions]="file-permissions.sh"
    [service-audit]="service-audit.sh"
    [kernel]="kernel-hardening.sh"
    [audit-logging]="audit-logging.sh"
    [password-policy]="password-policy.sh"
    [banner]="banner.sh"
    [cron-audit]="cron-audit.sh"
)

declare -A MODULE_DESCRIPTIONS=(
    [ssh]="SSH Server Hardening"
    [firewall]="Firewall Configuration"
    [user-audit]="User Account Audit"
    [file-permissions]="File Permission Hardening"
    [service-audit]="Service Audit and Cleanup"
    [kernel]="Kernel Security Parameters"
    [audit-logging]="Audit Daemon Configuration"
    [password-policy]="Password Policy Enforcement"
    [banner]="Login Banner Setup"
    [cron-audit]="Cron Job Security Review"
)

MODULE_ORDER=(ssh firewall user-audit file-permissions service-audit kernel audit-logging password-policy banner cron-audit)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[-]${NC} $1" | tee -a "$LOG_FILE"; }
info() { echo -e "${BLUE}[i]${NC} $1" | tee -a "$LOG_FILE"; }
header() { echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }

show_banner() {
    echo -e "${BOLD}${MAGENTA}"
    cat << 'EOF'
    _                  _           _ _    __  __              _
   | |    ___   ___ __| |___  __| | |  |  \/  |___  ___ _ __| |_
   | |   / _ \ / __/ _| / _ \/ _` | |  | |\/| / _ \/ _ \ '__| __|
   | |__| (_) | (_| ||  __/ (_| | |  | |  | |  __/  __/ |  | |_
   |_____\___/ \____\__|\___|\__,_|_|  |_|  |_|\___|\___|_|   \__|

   Linux System Hardening Suite v1.0
   Production-Quality Security Automation
EOF
    echo -e "${NC}"
}

show_help() {
    show_banner
    cat << EOF
Usage: sudo ./hardening.sh [OPTIONS]

Options:
  --all                 Run all modules non-interactively
  --modules MOD1,MOD2   Run only specified modules (comma-separated)
  --skip MOD1,MOD2      Skip specified modules (comma-separated)
  --dry-run             Show what would be changed without applying
  --list                List all available modules
  --help                Show this help message

Available modules:
  ssh                   SSH server configuration hardening
  firewall              iptables/nftables firewall setup
  user-audit            User account audit and cleanup
  file-permissions      Critical file permission hardening
  service-audit         Disable unnecessary services
  kernel                Kernel security parameters (sysctl)
  audit-logging         Auditd configuration
  password-policy       Password complexity and aging policies
  banner                Login banner configuration
  cron-audit            Cron job security review

Examples:
  sudo ./hardening.sh --all
  sudo ./hardening.sh --modules ssh,firewall,kernel
  sudo ./hardening.sh --skip cron-audit,banner
  sudo ./hardening.sh --dry-run
EOF
}

list_modules() {
    header "Available Modules"
    for mod in "${MODULE_ORDER[@]}"; do
        printf "  ${CYAN}%-20s${NC} %s\n" "$mod" "${MODULE_DESCRIPTIONS[$mod]}"
    done
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

setup_directories() {
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    chmod 700 "$LOG_DIR" "$BACKUP_DIR"
}

is_module_selected() {
    local mod="$1"
    if [[ ${#SELECT_MODULES[@]} -gt 0 ]]; then
        for sm in "${SELECT_MODULES[@]}"; do
            [[ "$sm" == "$mod" ]] && return 0
        done
        return 1
    fi
    if [[ ${#SKIP_MODULES[@]} -gt 0 ]]; then
        for sm in "${SKIP_MODULES[@]}"; do
            [[ "$sm" == "$mod" ]] && return 1
        done
    fi
    return 0
}

confirm_module() {
    local mod="$1"
    if [[ "$RUN_ALL" == true ]] || [[ "$INTERACTIVE" == false ]]; then
        return 0
    fi
    local desc="${MODULE_DESCRIPTIONS[$mod]}"
    echo -en "${YELLOW}[?]${NC} Run ${BOLD}${desc}${NC} (${mod})? [Y/n]: "
    read -r response
    [[ -z "$response" || "$response" =~ ^[Yy] ]] && return 0
    return 1
}

run_module() {
    local mod="$1"
    local script="${MODULE_MAP[$mod]}"
    local script_path="${MODULES_DIR}/${script}"

    if [[ ! -f "$script_path" ]]; then
        error "Script not found: ${script_path}"
        return 1
    fi

    if ! confirm_module "$mod"; then
        info "Skipping module: ${mod}"
        return 0
    fi

    header "Running: ${MODULE_DESCRIPTIONS[$mod]}"
    local start_time
    start_time=$(date +%s)

    local args=()
    [[ "$DRY_RUN" == true ]] && args+=("--dry-run")

    if bash "$script_path" "${args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        local end_time
        end_time=$(date +%s)
        local duration=$(( end_time - start_time ))
        success "Module '${mod}' completed in ${duration}s"
        return 0
    else
        error "Module '${mod}' failed with exit code $?"
        return 1
    fi
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --all)
                RUN_ALL=true
                INTERACTIVE=false
                shift
                ;;
            --modules)
                IFS=',' read -ra SELECT_MODULES <<< "$2"
                INTERACTIVE=false
                shift 2
                ;;
            --skip)
                IFS=',' read -ra SKIP_MODULES <<< "$2"
                INTERACTIVE=false
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --list)
                list_modules
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

print_summary() {
    local total="$1" passed="$2" failed="$3" skipped="$4"
    header "Hardening Summary"
    echo -e "  Total Modules:    ${BOLD}${total}${NC}"
    echo -e "  ${GREEN}Passed:${NC}         ${passed}"
    echo -e "  ${RED}Failed:${NC}         ${failed}"
    echo -e "  ${YELLOW}Skipped:${NC}        ${skipped}"
    echo -e "  Log File:         ${LOG_FILE}"
    echo -e "  Backup Directory: ${BACKUP_DIR}"
    if [[ $failed -gt 0 ]]; then
        echo -e "\n${RED}${BOLD}Some modules failed. Review the log for details.${NC}"
    else
        echo -e "\n${GREEN}${BOLD}All selected modules completed successfully.${NC}"
    fi
}

main() {
    parse_args "$@"

    check_root
    setup_directories
    show_banner

    log "Hardening session started at $(date)"
    log "Log file: ${LOG_FILE}"
    log "Backup directory: ${BACKUP_DIR}"
    echo ""

    local total=0 passed=0 failed=0 skipped=0

    for mod in "${MODULE_ORDER[@]}"; do
        ((total++))
        if ! is_module_selected "$mod"; then
            ((skipped++))
            info "Module '${mod}' not selected, skipping"
            continue
        fi

        if run_module "$mod"; then
            ((passed++))
        else
            ((failed++))
        fi
    done

    print_summary "$total" "$passed" "$failed" "$skipped"

    log "Hardening session completed at $(date)"
    echo -e "\n${CYAN}System hardening complete. Review logs and test thoroughly.${NC}"
}

main "$@"

#!/bin/bash
# ============================================================================
# Evidence Collection Script - Linux
# ============================================================================
# Purpose: Collect volatile and non-volatile evidence from a Linux system
#          during incident response.
# Usage:   sudo bash collect-evidence.sh [output_directory]
# Output:  Creates a timestamped directory with all collected evidence
# 
# IMPORTANT: Run this script as root. Collect volatile evidence FIRST.
#            The script minimizes system impact by using read-only commands
#            where possible.
# ============================================================================

set -euo pipefail

# --- Configuration ---
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S_UTC")
HOSTNAME=$(hostname -f 2>/dev/null || hostname)
OUTPUT_DIR="${1:-./evidence_${HOSTNAME}_${TIMESTAMP}}"
HASH_TOOL="sha256sum"

# Verify running as root
if [[ $EUID -ne 0 ]]; then
    echo "[ERROR] This script must be run as root (sudo)." >&2
    exit 1
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Create metadata file
cat > "${OUTPUT_DIR}/metadata.txt" << EOF
Evidence Collection Metadata
=============================
Hostname:        ${HOSTNAME}
Collection Time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Local Time:      $(date +"%Y-%m-%d %H:%M:%S %Z")
Collected By:    $(whoami)
Collection Tool: collect-evidence.sh
Script Version:  1.0
Kernel:          $(uname -r)
OS:              $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')
Uptime:          $(uptime -p 2>/dev/null || uptime)
EOF

echo "[*] Evidence collection started at ${TIMESTAMP}"
echo "[*] Output directory: ${OUTPUT_DIR}"
echo ""

# ============================================================================
# PHASE 1: VOLATILE DATA (Collect first - most perishable)
# ============================================================================
echo "[+] Phase 1: Collecting volatile data..."

# --- System Date/Time ---
echo "  [*] System time..."
date -u > "${OUTPUT_DIR}/system_time.txt" 2>&1
timedatectl >> "${OUTPUT_DIR}/system_time.txt" 2>&1 || true

# --- Running Processes ---
echo "  [*] Running processes..."
ps auxwwf > "${OUTPUT_DIR}/processes_full.txt" 2>&1
ps -eo pid,ppid,uid,gid,user,comm,start time,args > "${OUTPUT_DIR}/processes_detailed.txt" 2>&1
ps -eo pid,ppid,user,%cpu,%mem,vsz,rss,tty,stat,start,time,comm > "${OUTPUT_DIR}/processes_resources.txt" 2>&1

# --- Network Connections ---
echo "  [*] Network connections..."
ss -tlnp > "${OUTPUT_DIR}/listening_ports.txt" 2>&1
ss -tunap > "${OUTPUT_DIR}/all_connections.txt" 2>&1
ss -s > "${OUTPUT_DIR}/socket_stats.txt" 2>&1
netstat -antup > "${OUTPUT_DIR}/netstat_connections.txt" 2>&1 || true
cat /proc/net/tcp > "${OUTPUT_DIR}/proc_net_tcp.txt" 2>&1 || true
cat /proc/net/tcp6 > "${OUTPUT_DIR}/proc_net_tcp6.txt" 2>&1 || true
cat /proc/net/udp > "${OUTPUT_DIR}/proc_net_udp.txt" 2>&1 || true

# --- Network Interfaces ---
echo "  [*] Network interfaces..."
ip addr show > "${OUTPUT_DIR}/ip_addresses.txt" 2>&1
ip route show > "${OUTPUT_DIR}/ip_routes.txt" 2>&1
ip neigh show > "${OUTPUT_DIR}/arp_cache.txt" 2>&1
ifconfig -a > "${OUTPUT_DIR}/ifconfig.txt" 2>&1 || true

# --- Users and Sessions ---
echo "  [*] Users and sessions..."
w > "${OUTPUT_DIR}/logged_in_users.txt" 2>&1
who > "${OUTPUT_DIR}/who.txt" 2>&1
last -50 > "${OUTPUT_DIR}/last_logins.txt" 2>&1
lastb -50 > "${OUTPUT_DIR}/failed_logins.txt" 2>&1 || true
cat /etc/passwd > "${OUTPUT_DIR}/passwd.txt" 2>&1
cat /etc/shadow > "${OUTPUT_DIR}/shadow.txt" 2>&1 || true
cat /etc/group > "${OUTPUT_DIR}/group.txt" 2>&1
getent passwd > "${OUTPUT_DIR}/getent_passwd.txt" 2>&1 || true

# --- Loaded Kernel Modules ---
echo "  [*] Kernel modules..."
lsmod > "${OUTPUT_DIR}/lsmod.txt" 2>&1
cat /proc/modules > "${OUTPUT_DIR}/proc_modules.txt" 2>&1

# --- Open Files ---
echo "  [*] Open files..."
lsof -n -P > "${OUTPUT_DIR}/open_files.txt" 2>&1 || true

# --- Cron Jobs ---
echo "  [*] Cron jobs..."
for user in $(cut -f1 -d: /etc/passwd); do
    echo "=== Cron jobs for ${user} ===" >> "${OUTPUT_DIR}/cron_jobs.txt"
    crontab -l -u "${user}" >> "${OUTPUT_DIR}/cron_jobs.txt" 2>&1 || true
done
ls -la /etc/cron* >> "${OUTPUT_DIR}/cron_jobs.txt" 2>&1
cat /etc/crontab >> "${OUTPUT_DIR}/cron_jobs.txt" 2>&1 || true

# --- DNS Configuration ---
echo "  [*] DNS configuration..."
cat /etc/resolv.conf > "${OUTPUT_DIR}/dns_config.txt" 2>&1
cat /etc/hosts > "${OUTPUT_DIR}/hosts_file.txt" 2>&1

# --- Environment Variables ---
echo "  [*] Environment variables..."
env > "${OUTPUT_DIR}/environment.txt" 2>&1

# --- Running Services ---
echo "  [*] Running services..."
systemctl list-units --type=service --state=running > "${OUTPUT_DIR}/running_services.txt" 2>&1 || true
systemctl list-units --type=service --all > "${OUTPUT_DIR}/all_services.txt" 2>&1 || true

# --- Kernel Parameters ---
echo "  [*] Kernel parameters..."
sysctl -a > "${OUTPUT_DIR}/sysctl.txt" 2>&1 || true

# --- Mount Points ---
echo "  [*] Mount points..."
mount > "${OUTPUT_DIR}/mounts.txt" 2>&1
df -h > "${OUTPUT_DIR}/disk_usage.txt" 2>&1
lsblk > "${OUTPUT_DIR}/block_devices.txt" 2>&1 || true

# --- Memory ---
echo "  [*] Memory information..."
free -h > "${OUTPUT_DIR}/memory.txt" 2>&1
cat /proc/meminfo > "${OUTPUT_DIR>/proc_meminfo.txt" 2>&1 || true

# ============================================================================
# PHASE 2: PERSISTENT DATA (Non-volatile evidence)
# ============================================================================
echo ""
echo "[+] Phase 2: Collecting persistent data..."

# --- System Logs ---
echo "  [*] System logs..."
mkdir -p "${OUTPUT_DIR}/logs"
if [[ -d /var/log ]]; then
    cp -r /var/log/auth.log* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/syslog* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/messages* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/secure* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/kern.log* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/dmesg* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/faillog* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/lastlog* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/btmp* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    cp -r /var/log/wtmp* "${OUTPUT_DIR}/logs/" 2>/dev/null || true
    dmesg > "${OUTPUT_DIR}/logs/dmesg_output.txt" 2>&1 || true
fi

# --- Journal Logs (systemd) ---
echo "  [*] Journal logs..."
journalctl --since "7 days ago" --no-pager > "${OUTPUT_DIR}/logs/journal_7days.txt" 2>&1 || true

# --- Bash History ---
echo "  [*] Bash history..."
mkdir -p "${OUTPUT_DIR}/history"
for home_dir in /home/* /root; do
    if [[ -d "${home_dir}" ]]; then
        user=$(basename "${home_dir}")
        cp "${home_dir}/.bash_history" "${OUTPUT_DIR}/history/${user}_bash_history.txt" 2>/dev/null || true
    fi
done

# --- SSH Keys and Configuration ---
echo "  [*] SSH configuration..."
mkdir -p "${OUTPUT_DIR}/ssh"
cp /etc/ssh/sshd_config "${OUTPUT_DIR}/ssh/" 2>/dev/null || true
for home_dir in /home/* /root; do
    if [[ -d "${home_dir}/.ssh" ]]; then
        user=$(basename "${home_dir}")
        mkdir -p "${OUTPUT_DIR}/ssh/${user}"
        cp -r "${home_dir}/.ssh/"* "${OUTPUT_DIR}/ssh/${user}/" 2>/dev/null || true
    fi
done

# --- Scheduled Tasks ---
echo "  [*] Scheduled tasks..."
mkdir -p "${OUTPUT_DIR}/scheduled"
ls -la /etc/cron.d/ > "${OUTPUT_DIR}/scheduled/cron.d.txt" 2>&1 || true
ls -la /etc/cron.daily/ > "${OUTPUT_DIR}/scheduled/cron.daily.txt" 2>&1 || true
ls -la /etc/cron.hourly/ > "${OUTPUT_DIR}/scheduled/cron.hourly.txt" 2>&1 || true
ls -la /etc/cron.weekly/ > "${OUTPUT_DIR}/scheduled/cron.weekly.txt" 2>&1 || true
ls -la /etc/cron.monthly/ > "${OUTPUT_DIR}/scheduled/cron.monthly.txt" 2>&1 || true
systemctl list-timers --all > "${OUTPUT_DIR}/scheduled/systemd_timers.txt" 2>&1 || true

# --- Installed Software ---
echo "  [*] Installed software..."
dpkg --get-selections > "${OUTPUT_DIR}/dpkg_packages.txt" 2>&1 || true
rpm -qa --qf '%{NAME}-%{VERSION}-%{RELEASE}.%{ARCH}\n' > "${OUTPUT_DIR}/rpm_packages.txt" 2>&1 || true
pip list 2>/dev/null > "${OUTPUT_DIR}/pip_packages.txt" || true
pip3 list 2>/dev/null > "${OUTPUT_DIR}/pip3_packages.txt" || true

# --- File System Information ---
echo "  [*] File system information..."
find / -maxdepth 3 -type f -mtime -7 -ls > "${OUTPUT_DIR}/recently_modified_files.txt" 2>&1 || true
find /tmp /var/tmp /dev/shm -type f -ls > "${OUTPUT_DIR}/temp_files.txt" 2>&1 || true

# --- SUID/SGID Files ---
echo "  [*] SUID/SGID files..."
find / -type f \( -perm -4000 -o -perm -2000 \) -ls > "${OUTPUT_DIR}/suid_sgid_files.txt" 2>&1 || true

# --- Kernel Messages ---
echo "  [*] Kernel messages..."
dmesg | tail -1000 > "${OUTPUT_DIR}/dmesg_tail.txt" 2>&1 || true

# ============================================================================
# PHASE 3: HASH ALL EVIDENCE FILES
# ============================================================================
echo ""
echo "[+] Phase 3: Generating hashes for all evidence files..."

cd "${OUTPUT_DIR}"
find . -type f -not -name "metadata.txt" -not -name "evidence_hashes.txt" | sort | while read -r file; do
    ${HASH_TOOL} "${file}" >> "${OUTPUT_DIR}/evidence_hashes.txt" 2>&1
done
cd - > /dev/null

# Hash the entire output directory
${HASH_TOOL} "${OUTPUT_DIR}" > "${OUTPUT_DIR}/directory_hash.txt" 2>&1 || true

# ============================================================================
# Complete
# ============================================================================
echo ""
echo "[+] Evidence collection complete!"
echo "[*] Output directory: ${OUTPUT_DIR}"
echo "[*] Evidence files: $(find "${OUTPUT_DIR}" -type f | wc -l)"
echo "[*] Total size: $(du -sh "${OUTPUT_DIR}" | cut -f1)"
echo "[*] SHA256 hash of evidence directory: $(cat "${OUTPUT_DIR}/directory_hash.txt" | head -1)"
echo ""
echo "[!] IMPORTANT: Verify the hash, document chain of custody, and"
echo "    store evidence in a secure location."
echo ""

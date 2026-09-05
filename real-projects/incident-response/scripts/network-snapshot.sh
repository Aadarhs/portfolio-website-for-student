#!/bin/bash
# ============================================================================
# Network Snapshot Script
# ============================================================================
# Purpose: Capture a point-in-time snapshot of network state for forensics.
#          Captures routing tables, ARP caches, DNS, connections, and
#          optional packet capture.
# Usage:   sudo bash network-snapshot.sh [output_directory] [--pcap seconds]
# Output:  Creates a timestamped directory with network forensics data
#
# IMPORTANT: Run as root. Use --pcap to capture packet data if needed.
# ============================================================================

set -euo pipefail

# --- Configuration ---
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S_UTC")
HOSTNAME=$(hostname -f 2>/dev/null || hostname)
OUTPUT_DIR="${1:-./network_snapshot_${HOSTNAME}_${TIMESTAMP}}"
PCAP_DURATION=0
PCAP_INTERFACE="any"
PCAP_FILTER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --pcap)
            PCAP_DURATION="$2"
            shift 2
            ;;
        --interface)
            PCAP_INTERFACE="$2"
            shift 2
            ;;
        --filter)
            PCAP_FILTER="$2"
            shift 2
            ;;
        *)
            if [[ -z "${OUTPUT_DIR_SET:-}" ]]; then
                OUTPUT_DIR="$1"
                OUTPUT_DIR_SET=1
            fi
            shift
            ;;
    esac
done

# Verify running as root
if [[ $EUID -ne 0 ]]; then
    echo "[ERROR] This script must be run as root (sudo)." >&2
    exit 1
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# ============================================================================
# Metadata
# ============================================================================
cat > "${OUTPUT_DIR}/metadata.txt" << EOF
Network Snapshot Metadata
==========================
Hostname:        ${HOSTNAME}
Collection Time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Local Time:      $(date +"%Y-%m-%d %H:%M:%S %Z")
Collected By:    $(whoami)
Tool:            network-snapshot.sh
Kernel:          $(uname -r)
EOF

echo "[*] Network snapshot started at ${TIMESTAMP}"
echo "[*] Output directory: ${OUTPUT_DIR}"
echo ""

# ============================================================================
# 1. Network Interfaces
# ============================================================================
echo "[+] Capturing network interfaces..."
ip -s link show > "${OUTPUT_DIR}/interfaces.txt" 2>&1
ip addr show >> "${OUTPUT_DIR}/interfaces.txt" 2>&1
ethtool ${PCAP_INTERFACE//any/eth0} 2>/dev/null >> "${OUTPUT_DIR}/interfaces.txt" || true

# ============================================================================
# 2. Routing Tables
# ============================================================================
echo "[+] Capturing routing tables..."
ip route show table all > "${OUTPUT_DIR}/routes.txt" 2>&1
ip -6 route show table all >> "${OUTPUT_DIR}/routes_v6.txt" 2>&1
route -n 2>/dev/null >> "${OUTPUT_DIR}/routes_traditional.txt" || true
netstat -rn 2>/dev/null >> "${OUTPUT_DIR}/routes_netstat.txt" || true

# ============================================================================
# 3. ARP Cache
# ============================================================================
echo "[+] Capturing ARP cache..."
ip neigh show > "${OUTPUT_DIR}/arp_cache.txt" 2>&1
arp -a 2>/dev/null >> "${OUTPUT_DIR}/arp_cache_traditional.txt" || true

# ============================================================================
# 4. DNS Configuration and Cache
# ============================================================================
echo "[+] Capturing DNS information..."
cat /etc/resolv.conf > "${OUTPUT_DIR}/dns_resolver.txt" 2>&1
cat /etc/hosts > "${OUTPUT_DIR}/hosts_file.txt" 2>&1

# Try to dump DNS cache if systemd-resolved
if command -v resolvectl &> /dev/null; then
    resolvectl statistics > "${OUTPUT_DIR}/dns_stats.txt" 2>&1 || true
    resolvectl query --cache 2>/dev/null | head -200 > "${OUTPUT_DIR}/dns_cache.txt" || true
fi

# ============================================================================
# 5. Active Connections
# ============================================================================
echo "[+] Capturing active connections..."
ss -tunapl > "${OUTPUT_DIR}/connections_detailed.txt" 2>&1
ss -tunap state established > "${OUTPUT_DIR}/established_connections.txt" 2>&1
ss -tlnp > "${OUTPUT_DIR}/listening_sockets.txt" 2>&1

# ============================================================================
# 6. Firewall Rules
# ============================================================================
echo "[+] Capturing firewall rules..."
iptables-save 2>/dev/null > "${OUTPUT_DIR}/iptables_rules.txt" || echo "iptables not available or no permission" > "${OUTPUT_DIR}/iptables_rules.txt"
ip6tables-save 2>/dev/null > "${OUTPUT_DIR}/ip6tables_rules.txt" || echo "ip6tables not available" > "${OUTPUT_DIR}/ip6tables_rules.txt"

# nftables
if command -v nft &> /dev/null; then
    nft list ruleset > "${OUTPUT_DIR}/nftables_rules.txt" 2>&1 || true
fi

# ============================================================================
# 7. Network Statistics
# ============================================================================
echo "[+] Capturing network statistics..."
netstat -s > "${OUTPUT_DIR}/netstat_stats.txt" 2>&1 || true
cat /proc/net/snmp > "${OUTPUT_DIR}/proc_snmp.txt" 2>&1 || true
cat /proc/net/netstat > "${OUTPUT_DIR}/proc_netstat.txt" 2>&1 || true
ip -s link show > "${OUTPUT_DIR}/link_stats.txt" 2>&1

# ============================================================================
# 8. Wireless Information (if applicable)
# ============================================================================
if command -v iwconfig &> /dev/null; then
    echo "[+] Capturing wireless information..."
    iwconfig > "${OUTPUT_DIR}/wireless_config.txt" 2>&1 || true
    iw dev scan 2>/dev/null > "${OUTPUT_DIR}/wifi_scan.txt" || true
fi

# ============================================================================
# 9. DHCP Leases
# ============================================================================
echo "[+] Capturing DHCP information..."
cat /var/lib/dhcp/dhclient.leases 2>/dev/null > "${OUTPUT_DIR}/dhcp_leases.txt" || true
cat /var/lib/NetworkManager/dhclient-*.lease 2>/dev/null >> "${OUTPUT_DIR}/dhcp_leases.txt" || true
cat /var/lib/dhcp/dhclient-*.leases 2>/dev/null >> "${OUTPUT_DIR}/dhcp_leases.txt" || true

# ============================================================================
# 10. Network Shares
# ============================================================================
echo "[+] Capturing mounted network shares..."
mount | grep -E "(nfs|cifs|smbfs|fuse)" > "${OUTPUT_DIR}/network_mounts.txt" 2>&1 || echo "No network mounts found" > "${OUTPUT_DIR}/network_mounts.txt"
df -h | grep -E "(nfs|cifs|smbfs)" >> "${OUTPUT_DIR}/network_mounts.txt" 2>&1 || true

# ============================================================================
# 11. Open Ports and Services
# ============================================================================
echo "[+] Capturing open ports and services..."
ss -tlnp > "${OUTPUT_DIR}/open_ports.txt" 2>&1
cat /etc/services > "${OUTPUT_DIR}/service_names.txt" 2>&1

# ============================================================================
# 12. VPN Configuration
# ============================================================================
echo "[+] Capturing VPN configuration..."
ifconfig -a 2>/dev/null | grep -A5 -E "(tun|tap|wg|ppp)" > "${OUTPUT_DIR}/vpn_interfaces.txt" || true
ip link show type wireguard 2>/dev/null >> "${OUTPUT_DIR}/vpn_interfaces.txt" || true

# ============================================================================
# 13. Packet Capture (optional)
# ============================================================================
if [[ $PCAP_DURATION -gt 0 ]]; then
    echo ""
    echo "[+] Starting packet capture for ${PCAP_DURATION} seconds..."

    if command -v tcpdump &> /dev/null; then
        PCAP_FILE="${OUTPUT_DIR}/capture_${TIMESTAMP}.pcap"
        PCAP_ARGS="-i ${PCAP_INTERFACE} -w ${PCAP_FILE} -s 96"

        if [[ -n "$PCAP_FILTER" ]]; then
            PCAP_ARGS="${PCAP_ARGS} ${PCAP_FILTER}"
        fi

        timeout "${PCAP_DURATION}" tcpdump ${PCAP_ARGS} &
        PCAP_PID=$!

        # Show progress
        for ((i=1; i<=PCAP_DURATION; i++)); do
            echo -ne "\r  Capturing... ${i}/${PCAP_DURATION} seconds"
            sleep 1
        done
        echo ""

        wait ${PCAP_PID} 2>/dev/null || true

        # Get capture stats
        tcpdump -r "${PCAP_FILE}" -q 2>/dev/null | tail -1 > "${OUTPUT_DIR}/capture_stats.txt" || true
        echo "[*] Packet capture saved to: ${PCAP_FILE}"
    else
        echo "[WARNING] tcpdump not found. Skipping packet capture."
        echo "Install with: apt install tcpdump"
    fi
fi

# ============================================================================
# 14. Generate Summary
# ============================================================================
echo ""
echo "[+] Generating summary..."

cat > "${OUTPUT_DIR}/summary.txt" << EOF
Network Snapshot Summary
=========================
Hostname:        ${HOSTNAME}
Timestamp:       ${TIMESTAMP}
Interfaces:      $(wc -l < "${OUTPUT_DIR}/interfaces.txt" 2>/dev/null || echo "0") lines
Routes:          $(wc -l < "${OUTPUT_DIR}/routes.txt" 2>/dev/null || echo "0") lines
ARP Entries:     $(wc -l < "${OUTPUT_DIR}/arp_cache.txt" 2>/dev/null || echo "0") lines
Connections:     $(wc -l < "${OUTPUT_DIR}/connections_detailed.txt" 2>/dev/null || echo "0") lines
Listening:       $(ss -tlnp 2>/dev/null | tail -n +2 | wc -l || echo "0") sockets
Established:     $(ss -tunap state established 2>/dev/null | tail -n +2 | wc -l || echo "0") connections
Firewall Rules:  $(wc -l < "${OUTPUT_DIR}/iptables_rules.txt" 2>/dev/null || echo "0") lines
EOF

if [[ $PCAP_DURATION -gt 0 ]]; then
    echo "Pcap Duration:  ${PCAP_DURATION}s" >> "${OUTPUT_DIR}/summary.txt"
    echo "Pcap File:      capture_${TIMESTAMP}.pcap" >> "${OUTPUT_DIR}/summary.txt"
fi

# ============================================================================
# 15. Hash all collected files
# ============================================================================
echo "[+] Generating hashes for all collected files..."
find "${OUTPUT_DIR}" -type f -not -name "metadata.txt" -not -name "evidence_hashes.txt" | sort | while read -r file; do
    sha256sum "${file}" >> "${OUTPUT_DIR}/evidence_hashes.txt" 2>&1
done

# ============================================================================
# Complete
# ============================================================================
echo ""
echo "[+] Network snapshot complete!" -ForegroundColor Green
echo "[*] Output directory: ${OUTPUT_DIR}"
echo "[*] Files collected: $(find "${OUTPUT_DIR}" -type f | wc -l)"
echo "[*] Total size: $(du -sh "${OUTPUT_DIR}" | cut -f1)"
echo ""
echo "[!] Verify hashes and document chain of custody."

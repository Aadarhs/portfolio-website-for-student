# Network Intrusion Detection System (IDS)

A lightweight, Python-based intrusion detection system built on [Scapy](https://scapy.net/) that sniffs live network traffic and detects suspicious patterns in real time.

## Features

| Feature | Description |
|---|---|
| **Signature-based detection** | Rule-driven matching loaded from `rules.json` |
| **Threshold / anomaly detection** | Sliding-window rate tracking for flood and scan attacks |
| **Colored console alerts** | Severity-coded output via Colorama |
| **Persistent logging** | Rotating log file with configurable size and backups |
| **CLI configurable** | Interface, rules file, time window, log level, and color toggles |
| **Extensible rule set** | Add new JSON rules without touching Python code |

## Detected Threats

| Rule ID | Name | Severity |
|---|---|---|
| `SYN-001` | SYN Flood Attack | High |
| `SCAN-001` | Port Scan Detection | Medium |
| `ICMP-001` | ICMP Flood | Medium |
| `DNS-001` | Suspicious DNS Volume (tunnel indicator) | Medium |
| `DNS-002` | Unusually Long DNS Query (exfiltration indicator) | High |
| `SUSPORT-001` | Suspicious Port Access (telnet, SMB, RDP, etc.) | Low |

## Project Structure

```
network-ids/
├── ids.py              # Main IDS engine – packet capture, rule dispatch, alerts
├── config.py           # Centralised configuration dataclass
├── utils.py            # Helper functions (IP validation, packet formatting)
├── rules.json          # Detection rules in JSON format
├── requirements.txt    # Python dependencies
├── __init__.py         # Package initialisation
├── README.md           # This file
└── logs/               # Auto-created at runtime
    └── ids_alerts.log
```

## Requirements

* Python 3.9+
* **Root / Administrator** privileges (needed for raw packet capture)
* Linux, macOS, or Windows with Npcap installed

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd network-ids

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate   # Linux / macOS
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt
```

## Usage

```bash
# Run with defaults (uses first available interface)
sudo python ids.py

# Specify network interface
sudo python ids.py -i eth0

# Use a custom rules file and 15-second detection window
sudo python ids.py -i wlan0 -r custom_rules.json -w 15

# Disable colored output (useful for piping)
sudo python ids.py --no-color

# Enable debug logging
sudo python ids.py --log-level DEBUG
```

### Command-Line Options

| Flag | Description | Default |
|---|---|---|
| `-i, --interface` | Network interface to capture on | `eth0` |
| `-r, --rules` | Path to JSON rules file | `./rules.json` |
| `-w, --window` | Sliding window size in seconds | `10` |
| `--no-color` | Disable ANSI color in output | colors on |
| `--log-level` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |

## How It Works

1. **Capture** – Scapy sniffs packets in promiscuous mode on the chosen interface.
2. **Evaluate** – Each IP packet is run through every loaded rule:
   * **Rate rules** use a thread-safe `RateTracker` that maintains per-key timestamps inside a sliding window.
   * **Port-scan rules** use a `PortScanTracker` that counts distinct destination ports per source.
   * **Static rules** inspect individual packet fields (DNS query length, destination port membership).
3. **Alert** – When a condition is met, a coloured alert is printed to the console and written to the rotating log file.
4. **Shutdown** – On `Ctrl+C`, a session summary is printed showing total packets analysed and alerts generated.

## Adding Custom Rules

Open `rules.json` and append a new rule object:

```json
{
  "id": "CUSTOM-001",
  "name": "My Custom Rule",
  "description": "Detects ...",
  "severity": "medium",
  "protocol": "TCP",
  "condition": {
    "dst_port_in": [8080],
    "source_rate_threshold": 100,
    "window_seconds": 5
  },
  "action": "alert_and_log"
}
```

Then implement the matching handler in `ids.py` and register it in `_dispatch()`.

## Configuration

All tuneable parameters live in `config.py` as a `dataclass`. Key settings:

* **Thresholds** – `SYN_FLOOD_THRESHOLD`, `PORT_SCAN_THRESHOLD`, `ICMP_FLOOD_THRESHOLD`, etc.
* **Suspicious ports** – `SUSPICIOUS_PORTS` list.
* **Logging** – `LOG_DIR`, `LOG_FILE`, `MAX_LOG_SIZE_MB`, `LOG_BACKUP_COUNT`.

## Limitations

* Single-machine, single-interface capture (not distributed).
* No packet reassembly or deep protocol parsing beyond the layers Scapy provides natively.
* Threshold values are static; a production system would benefit from adaptive / ML-based tuning.
* Windows requires [Npcap](https://npcap.com/) installed for Scapy packet capture.

## License

MIT

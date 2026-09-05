#!/usr/bin/env python3
"""
Network Intrusion Detection System (IDS)
=========================================

A packet-sniffing IDS built on top of Scapy.  It supports:

* Signature-based detection driven by an external ``rules.json`` file.
* Threshold / anomaly detection for flood-style attacks.
* Colored console alerts via Colorama.
* Persistent logging to a rotating log file.

Usage
-----
    sudo python ids.py                         # defaults
    sudo python ids.py -i wlan0                # specify interface
    sudo python ids.py -i eth0 -r custom.json  # custom rules
    sudo python ids.py --no-color              # disable colors
"""

from __future__ import annotations

import argparse
import json
import logging
import logging.handlers
import signal
import sys
import threading
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

try:
    from scapy.all import (
        IP,
        ICMP,
        TCP,
        UDP,
        DNS,
        DNSQR,
        sniff,
        conf,
    )
except ImportError:
    sys.exit(
        "[FATAL] Scapy is not installed.  "
        "Install it with:  pip install scapy"
    )

try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
    HAS_COLORAMA = True
except ImportError:
    HAS_COLORAMA = False

from config import config, IDSConfig
from utils import (
    format_packet_summary,
    format_timestamp,
    get_dns_query_name,
    is_valid_ip,
)


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

LOG_PATH = config.LOG_DIR + "/" + config.LOG_FILE

logger = logging.getLogger("ids")
logger.setLevel(getattr(logging, config.LOG_LEVEL, logging.INFO))

file_handler = logging.handlers.RotatingFileHandler(
    LOG_PATH,
    maxBytes=config.MAX_LOG_SIZE_MB * 1024 * 1024,
    backupCount=config.LOG_BACKUP_COUNT,
    encoding="utf-8",
)
file_handler.setFormatter(
    logging.Formatter("%(asctime)s | %(levelname)-8s | %(message)s")
)
logger.addHandler(file_handler)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter("%(message)s"))
logger.addHandler(console_handler)


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------

def _c(text: str, color: str) -> str:
    """Wrap *text* in an ANSI color if Colorama is available."""
    if not HAS_COLORAMA or not config.COLOR_OUTPUT:
        return text
    return f"{color}{text}{Style.RESET_ALL}"


_SEVERITY_COLORS = {
    "critical": Fore.RED + Style.BRIGHT,
    "high": Fore.RED,
    "medium": Fore.YELLOW,
    "low": Fore.CYAN,
    "info": Fore.GREEN,
}


# ---------------------------------------------------------------------------
# Alert object
# ---------------------------------------------------------------------------

class Alert:
    """Represents a single IDS alert."""

    __slots__ = ("rule_id", "name", "severity", "source_ip",
                 "destination_ip", "details", "timestamp", "packet_summary")

    def __init__(
        self,
        rule_id: str,
        name: str,
        severity: str,
        source_ip: str,
        destination_ip: str,
        details: str,
        packet_summary: str = "",
    ) -> None:
        self.rule_id = rule_id
        self.name = name
        self.severity = severity
        self.source_ip = source_ip
        self.destination_ip = destination_ip
        self.details = details
        self.timestamp = format_timestamp()
        self.packet_summary = packet_summary

    def __str__(self) -> str:
        return (
            f"[{self.timestamp}] [{self.severity.upper():^8}] "
            f"{self.rule_id} - {self.name} | "
            f"src={self.source_ip} dst={self.destination_ip} | "
            f"{self.details}"
        )


# ---------------------------------------------------------------------------
# Rate tracker (thread-safe sliding window)
# ---------------------------------------------------------------------------

class RateTracker:
    """Tracks per-key event counts inside a sliding time window."""

    def __init__(self, window_seconds: int = 10) -> None:
        self._window = window_seconds
        self._events: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def record(self, key: str) -> int:
        """Record an event for *key* and return the current count inside the window."""
        now = time.time()
        cutoff = now - self._window
        with self._lock:
            timestamps = self._events[key]
            # Prune old entries
            self._events[key] = [t for t in timestamps if t > cutoff]
            self._events[key].append(now)
            return len(self._events[key])

    def count(self, key: str) -> int:
        """Return current count for *key* without recording."""
        now = time.time()
        cutoff = now - self._window
        with self._lock:
            return sum(1 for t in self._events[key] if t > cutoff)

    def prune(self) -> None:
        """Remove all expired entries."""
        now = time.time()
        cutoff = now - self._window
        with self._lock:
            for key in list(self._events):
                self._events[key] = [t for t in self._events[key] if t > cutoff]
                if not self._events[key]:
                    del self._events[key]


# ---------------------------------------------------------------------------
# Port-scan tracker
# ---------------------------------------------------------------------------

class PortScanTracker:
    """Track distinct destination ports contacted by each source."""

    def __init__(self, window_seconds: int = 10) -> None:
        self._window = window_seconds
        self._data: Dict[str, Dict[int, float]] = defaultdict(dict)
        self._lock = threading.Lock()

    def record(self, src_ip: str, dst_port: int) -> int:
        now = time.time()
        cutoff = now - self._window
        with self._lock:
            ports = self._data[src_ip]
            # Prune old entries
            self._data[src_ip] = {p: t for p, t in ports.items() if t > cutoff}
            self._data[src_ip][dst_port] = now
            return len(self._data[src_ip])


# ---------------------------------------------------------------------------
# Core IDS engine
# ---------------------------------------------------------------------------

class IDSEngine:
    """Main intrusion detection engine."""

    def __init__(self, cfg: IDSConfig, rules_path: Optional[str] = None) -> None:
        self.cfg = cfg
        self.rules = self._load_rules(rules_path or cfg.RULES_FILE)
        self.rate_tracker = RateTracker(window_seconds=cfg.TIME_WINDOW)
        self.port_tracker = PortScanTracker(window_seconds=cfg.TIME_WINDOW)
        self._alert_count = 0
        self._packet_count = 0
        self._stop = threading.Event()
        self._lock = threading.Lock()

        logger.info(_c("=" * 70, Fore.CYAN))
        logger.info(_c("  Network IDS  v1.0", Fore.CYAN + Style.BRIGHT))
        logger.info(_c("=" * 70, Fore.CYAN))
        logger.info(f"  Interface   : {cfg.INTERFACE}")
        logger.info(f"  Rules loaded: {len(self.rules)}")
        logger.info(f"  Log file    : {LOG_PATH}")
        logger.info(_c("=" * 70, Fore.CYAN))

    # -- rule loading -------------------------------------------------------

    @staticmethod
    def _load_rules(path: str) -> List[Dict[str, Any]]:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            rules = data.get("rules", [])
            logger.info(f"Loaded {len(rules)} rules from {path}")
            return rules
        except FileNotFoundError:
            logger.warning(f"Rules file not found at {path}. Running with built-in defaults only.")
            return []
        except json.JSONDecodeError as exc:
            logger.error(f"Failed to parse rules file: {exc}")
            return []

    # -- alert dispatch -----------------------------------------------------

    def _emit_alert(self, alert: Alert) -> None:
        with self._lock:
            self._alert_count += 1

        sev = alert.severity.lower()
        color = _SEVERITY_COLORS.get(sev, Fore.WHITE)

        banner = _c(f"  *** ALERT #{self._alert_count} [{sev.upper()}] ***", color)
        logger.info(banner)
        logger.info(_c(f"  Rule     : {alert.rule_id} - {alert.name}", color))
        logger.info(_c(f"  Source   : {alert.source_ip}", color))
        logger.info(_c(f"  Dest     : {alert.destination_ip}", color))
        logger.info(_c(f"  Details  : {alert.details}", color))
        if alert.packet_summary:
            logger.info(_c(f"  Packet   : {alert.packet_summary}", color))
        logger.info(_c("-" * 70, color))

        # Persistent file log
        logger.debug(str(alert))

    # -- rule evaluation helpers -------------------------------------------

    def _check_syn_flood(self, pkt: Any, rule: Dict[str, Any]) -> None:
        if not pkt.haslayer(TCP):
            return
        tcp = pkt[TCP]
        flags = str(tcp.flags)
        if flags != "S":
            return
        cond = rule.get("condition", {})
        threshold = cond.get("source_rate_threshold", self.cfg.SYN_FLOOD_THRESHOLD)
        window = cond.get("window_seconds", self.cfg.TIME_WINDOW)
        self.rate_tracker._window = window
        src_ip = pkt[IP].src
        count = self.rate_tracker.record(f"syn:{src_ip}")
        if count >= threshold:
            alert = Alert(
                rule_id=rule["id"],
                name=rule["name"],
                severity=rule.get("severity", "high"),
                source_ip=src_ip,
                destination_ip=pkt[IP].dst,
                details=f"SYN packet rate {count}/{window}s from {src_ip} (threshold {threshold})",
                packet_summary=format_packet_summary(pkt),
            )
            self._emit_alert(alert)

    def _check_port_scan(self, pkt: Any, rule: Dict[str, Any]) -> None:
        if not pkt.haslayer(TCP):
            return
        cond = rule.get("condition", {})
        threshold = cond.get("distinct_dst_ports", self.cfg.PORT_SCAN_THRESHOLD)
        src_ip = pkt[IP].src
        dst_port = pkt[TCP].dport
        distinct = self.port_tracker.record(src_ip, dst_port)
        if distinct >= threshold:
            alert = Alert(
                rule_id=rule["id"],
                name=rule["name"],
                severity=rule.get("severity", "medium"),
                source_ip=src_ip,
                destination_ip=pkt[IP].dst,
                details=f"{src_ip} probed {distinct} distinct ports within the monitoring window",
                packet_summary=format_packet_summary(pkt),
            )
            self._emit_alert(alert)

    def _check_icmp_flood(self, pkt: Any, rule: Dict[str, Any]) -> None:
        if not pkt.haslayer(ICMP):
            return
        icmp = pkt[ICMP]
        cond = rule.get("condition", {})
        required_type = cond.get("icmp_type", 8)
        if icmp.type != required_type:
            return
        threshold = cond.get("source_rate_threshold", self.cfg.ICMP_FLOOD_THRESHOLD)
        window = cond.get("window_seconds", self.cfg.TIME_WINDOW)
        self.rate_tracker._window = window
        src_ip = pkt[IP].src
        count = self.rate_tracker.record(f"icmp:{src_ip}")
        if count >= threshold:
            alert = Alert(
                rule_id=rule["id"],
                name=rule["name"],
                severity=rule.get("severity", "medium"),
                source_ip=src_ip,
                destination_ip=pkt[IP].dst,
                details=f"ICMP echo rate {count}/{window}s from {src_ip} (threshold {threshold})",
                packet_summary=format_packet_summary(pkt),
            )
            self._emit_alert(alert)

    def _check_dns_volume(self, pkt: Any, rule: Dict[str, Any]) -> None:
        if not (pkt.haslayer(UDP) and pkt.haslayer(DNS)):
            return
        cond = rule.get("condition", {})
        threshold = cond.get("source_rate_threshold", self.cfg.DNS_TUNING_QUERY_THRESHOLD)
        window = cond.get("window_seconds", self.cfg.TIME_WINDOW)
        self.rate_tracker._window = window
        src_ip = pkt[IP].src
        count = self.rate_tracker.record(f"dns:{src_ip}")
        if count >= threshold:
            alert = Alert(
                rule_id=rule["id"],
                name=rule["name"],
                severity=rule.get("severity", "medium"),
                source_ip=src_ip,
                destination_ip=pkt[IP].dst,
                details=f"DNS query volume {count}/{window}s from {src_ip} (threshold {threshold})",
                packet_summary=format_packet_summary(pkt),
            )
            self._emit_alert(alert)

    def _check_dns_long_query(self, pkt: Any, rule: Dict[str, Any]) -> None:
        if not (pkt.haslayer(UDP) and pkt.haslayer(DNS) and pkt.haslayer(DNSQR)):
            return
        cond = rule.get("condition", {})
        min_len = cond.get("dns_query_min_length", 50)
        dns = pkt[DNS]
        if dns.qr != 0:  # only queries
            return
        qname = pkt[DNSQR].qname.decode("utf-8", errors="ignore").rstrip(".")
        if len(qname) >= min_len:
            alert = Alert(
                rule_id=rule["id"],
                name=rule["name"],
                severity=rule.get("severity", "high"),
                source_ip=pkt[IP].src,
                destination_ip=pkt[IP].dst,
                details=f"DNS query name length {len(qname)} chars (>= {min_len}): {qname[:80]}",
                packet_summary=format_packet_summary(pkt),
            )
            self._emit_alert(alert)

    def _check_suspicious_port(self, pkt: Any, rule: Dict[str, Any]) -> None:
        if not pkt.haslayer(TCP):
            return
        cond = rule.get("condition", {})
        port_list = cond.get("dst_port_in", [])
        dst_port = pkt[TCP].dport
        if dst_port in port_list:
            alert = Alert(
                rule_id=rule["id"],
                name=rule["name"],
                severity=rule.get("severity", "low"),
                source_ip=pkt[IP].src,
                destination_ip=pkt[IP].dst,
                details=f"Traffic to suspicious port {dst_port}",
                packet_summary=format_packet_summary(pkt),
            )
            self._emit_alert(alert)

    # Dispatch map: rule id prefix -> handler
    _HANDLERS: Dict[str, Any] = {
        "SYN": "_check_syn_flood",
        "SCAN": "_check_port_scan",
        "ICMP": "_check_icmp_flood",
        "DNS": None,  # resolved dynamically
        "SUSPORT": "_check_suspicious_port",
    }

    def _dispatch(self, rule: Dict[str, Any], pkt: Any) -> None:  # type: ignore[type-arg]
        rid = rule.get("id", "")
        prefix = rid.split("-")[0] if "-" in rid else rid

        if prefix == "SYN":
            self._check_syn_flood(pkt, rule)
        elif prefix == "SCAN":
            self._check_port_scan(pkt, rule)
        elif prefix == "ICMP":
            self._check_icmp_flood(pkt, rule)
        elif prefix == "DNS":
            # Choose between volume vs long-query based on condition keys
            cond = rule.get("condition", {})
            if "dns_query_min_length" in cond:
                self._check_dns_long_query(pkt, rule)
            else:
                self._check_dns_volume(pkt, rule)
        elif prefix == "SUSPORT":
            self._check_suspicious_port(pkt, rule)

    # -- packet callback ----------------------------------------------------

    def _process_packet(self, pkt: Any) -> None:  # type: ignore[type-arg]
        self._packet_count += 1
        # Only IP-layer packets are interesting
        if not pkt.haslayer(IP):
            return

        for rule in self.rules:
            try:
                self._dispatch(rule, pkt)
            except Exception as exc:
                logger.error(f"Error evaluating rule {rule.get('id', '?')}: {exc}")

    # -- lifecycle ----------------------------------------------------------

    def start(self) -> None:
        """Start sniffing (blocking)."""
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        logger.info(f"Starting packet capture on {self.cfg.INTERFACE} ...")
        logger.info("Press Ctrl+C to stop.\n")

        try:
            sniff(
                iface=self.cfg.INTERFACE,
                prn=self._process_packet,
                store=False,
                promisc=self.cfg.PROMISCUOUS,
                stop_filter=lambda _: self._stop.is_set(),
            )
        except PermissionError:
            logger.error("Permission denied.  Try running with sudo / as Administrator.")
            sys.exit(1)
        except Exception as exc:
            logger.error(f"Sniffing error: {exc}")
            sys.exit(1)
        finally:
            self._print_summary()

    def _signal_handler(self, signum: int, _frame: Any) -> None:
        logger.info("\nShutdown signal received – stopping ...")
        self._stop.set()

    def _print_summary(self) -> None:
        logger.info("")
        logger.info(_c("=" * 70, Fore.CYAN))
        logger.info(_c("  Session Summary", Fore.CYAN + Style.BRIGHT))
        logger.info(_c("=" * 70, Fore.CYAN))
        logger.info(f"  Packets analysed : {self._packet_count}")
        logger.info(f"  Alerts generated : {self._alert_count}")
        logger.info(f"  Log file         : {LOG_PATH}")
        logger.info(_c("=" * 70, Fore.CYAN))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Network Intrusion Detection System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Requires root / admin privileges to capture packets.",
    )
    parser.add_argument(
        "-i", "--interface",
        default=config.INTERFACE,
        help=f"Network interface to sniff on (default: {config.INTERFACE})",
    )
    parser.add_argument(
        "-r", "--rules",
        default=config.RULES_FILE,
        help="Path to the JSON rules file",
    )
    parser.add_argument(
        "-w", "--window",
        type=int,
        default=config.TIME_WINDOW,
        help=f"Time window in seconds for rate detection (default: {config.TIME_WINDOW})",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colored output",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default=config.LOG_LEVEL,
        help=f"Logging level (default: {config.LOG_LEVEL})",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Apply CLI overrides
    config.INTERFACE = args.interface
    config.TIME_WINDOW = args.window
    config.RULES_FILE = args.rules
    if args.no_color:
        config.COLOR_OUTPUT = False
    config.LOG_LEVEL = args.log_level

    engine = IDSEngine(config)
    engine.start()


if __name__ == "__main__":
    main()

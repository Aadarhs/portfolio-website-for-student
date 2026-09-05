"""Utility / helper functions for the Network IDS."""

from __future__ import annotations

import ipaddress
import struct
import socket
from datetime import datetime
from typing import Optional


def is_valid_ip(addr: str) -> bool:
    """Return True if *addr* is a valid IPv4 or IPv6 address."""
    try:
        ipaddress.ip_address(addr)
        return True
    except ValueError:
        return False


def is_private_ip(addr: str) -> bool:
    """Return True if *addr* belongs to a private / reserved range."""
    try:
        return ipaddress.ip_address(addr).is_private
    except ValueError:
        return False


def ip_to_int(addr: str) -> int:
    """Convert a dotted-quad IP string to a 32-bit integer."""
    return struct.unpack("!I", socket.inet_aton(addr))[0]


def int_to_ip(n: int) -> str:
    """Convert a 32-bit integer back to a dotted-quad IP string."""
    return socket.inet_ntoa(struct.pack("!I", n))


def format_packet_summary(pkt) -> str:  # type: ignore[no-untyped-def]
    """Return a human-readable one-liner describing *pkt*."""
    parts: list[str] = []
    if pkt.haslayer("IP"):
        ip = pkt["IP"]
        parts.append(f"{ip.src} -> {ip.dst}")
    if pkt.haslayer("TCP"):
        tcp = pkt["TCP"]
        flags = str(tcp.flags)
        parts.append(f"TCP {tcp.sport}:{tcp.dport} [{flags}]")
    elif pkt.haslayer("UDP"):
        udp = pkt["UDP"]
        parts.append(f"UDP {udp.sport}:{udp.dport}")
    elif pkt.haslayer("ICMP"):
        icmp = pkt["ICMP"]
        parts.append(f"ICMP type={icmp.type} code={icmp.code}")
    return " | ".join(parts) if parts else pkt.summary()


def format_timestamp(ts: Optional[float] = None) -> str:
    """Return a formatted timestamp string."""
    return datetime.fromtimestamp(ts or datetime.now().timestamp()).strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def bytes_to_hex(data: bytes, max_len: int = 64) -> str:
    """Show the first *max_len* bytes of *data* as a hex dump."""
    preview = data[:max_len]
    hex_str = " ".join(f"{b:02x}" for b in preview)
    if len(data) > max_len:
        hex_str += " ..."
    return hex_str


def get_dns_query_name(payload: bytes) -> Optional[str]:
    """Attempt to extract a DNS query name from raw DNS payload bytes."""
    if len(payload) < 12:
        return None
    try:
        # Skip the 12-byte DNS header; the question section follows.
        offset = 12
        labels: list[str] = []
        while offset < len(payload):
            length = payload[offset]
            if length == 0:
                break
            offset += 1
            if offset + length > len(payload):
                return None
            labels.append(payload[offset : offset + length].decode("ascii", errors="ignore"))
            offset += length
        return ".".join(labels) if labels else None
    except Exception:
        return None

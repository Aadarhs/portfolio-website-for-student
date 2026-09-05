"""Configuration settings for the Network IDS."""

import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class IDSConfig:
    """Central configuration for the intrusion detection system."""

    # Network
    INTERFACE: str = "eth0"
    PROMISCUOUS: bool = True
    PACKET_BUFFER_SIZE: int = 65535

    # Detection thresholds (per window)
    SYN_FLOOD_THRESHOLD: int = 20
    PORT_SCAN_THRESHOLD: int = 15
    ICMP_FLOOD_THRESHOLD: int = 30
    DNS_TUNING_QUERY_THRESHOLD: int = 50

    # Time window in seconds for rate-based detection
    TIME_WINDOW: int = 10

    # Suspicious ports (commonly abused)
    SUSPICIOUS_PORTS: List[int] = field(default_factory=lambda: [
        21,    # FTP
        22,    # SSH (flag if unexpected)
        23,    # Telnet
        25,    # SMTP
        110,   # POP3
        135,   # MSRPC
        139,   # NetBIOS
        445,   # SMB
        1433,  # MSSQL
        3306,  # MySQL
        3389,  # RDP
        5900,  # VNC
        6667,  # IRC (common malware C2)
    ])

    # Logging
    LOG_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    LOG_FILE: str = "ids_alerts.log"
    LOG_LEVEL: str = "INFO"
    MAX_LOG_SIZE_MB: int = 10
    LOG_BACKUP_COUNT: int = 5

    # Rules file
    RULES_FILE: str = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "rules.json"
    )

    # Display
    MAX_ALERT_DISPLAY: int = 200
    COLOR_OUTPUT: bool = True

    def __post_init__(self) -> None:
        os.makedirs(self.LOG_DIR, exist_ok=True)


config = IDSConfig()

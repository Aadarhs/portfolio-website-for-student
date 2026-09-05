#!/usr/bin/env python3
"""
IOC (Indicator of Compromise) Checking Script
=============================================
Purpose: Check indicators of compromise against multiple threat intelligence feeds
         and local blocklists.
Usage:   python check-iocs.py <ioc_file> [--output report.json] [--format text|json|csv]
Input:   A text file with one IOC per line, prefixed with type:
         ip:1.2.3.4
         domain:evil.example.com
         hash:abc123def456...
         url:https://evil.example.com/payload
         email:attacker@evil.com

Dependencies: requests (pip install requests)
Optional:     config.ini for API keys (see below)
"""

import argparse
import csv
import hashlib
import io
import json
import os
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' library required. Install with: pip install requests")
    sys.exit(1)


# ============================================================================
# Configuration
# ============================================================================

VIRUSTOTAL_API_KEY = os.environ.get("VT_API_KEY", "")
ABUSEIPDB_API_KEY = os.environ.get("ABUSEIPDB_API_KEY", "")
OTX_API_KEY = os.environ.get("OTX_API_KEY", "")

# Known malicious IP ranges and indicators (example blocklist)
# In production, load from a file or threat intelligence platform
KNOWN_MALICIOUS_IPS = set()
KNOWN_MALICIOUS_DOMAINS = set()
KNOWN_MALICIOUS_HASHES = set()

# Rate limiting
REQUEST_DELAY = 1.5  # seconds between API calls


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class IOCResult:
    """Result of checking a single IOC against threat intelligence."""
    ioc_type: str
    ioc_value: str
    source: str
    is_malicious: bool
    confidence: str = "unknown"
    details: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class IOCReport:
    """Complete report of all IOC checks."""
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    total_iocs: int = 0
    malicious_count: int = 0
    clean_count: int = 0
    error_count: int = 0
    results: list = field(default_factory=list)


# ============================================================================
# IOC Parsers
# ============================================================================

def parse_ioc_file(filepath: str) -> list:
    """Parse IOC file and return list of (type, value) tuples."""
    iocs = []
    ip_pattern = re.compile(
        r'^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$'
    )
    domain_pattern = re.compile(
        r'^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$'
    )
    hash_pattern = re.compile(r'^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$')
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

    with open(filepath, 'r') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            # Parse explicit type prefix
            if ':' in line:
                parts = line.split(':', 1)
                prefix = parts[0].lower()
                value = parts[1].strip()

                if prefix in ('ip', 'ipv4', 'ipv6'):
                    iocs.append(('ip', value))
                elif prefix in ('domain', 'fqdn', 'hostname'):
                    iocs.append(('domain', value))
                elif prefix in ('hash', 'md5', 'sha1', 'sha256'):
                    iocs.append(('hash', value))
                elif prefix == 'url':
                    iocs.append(('url', value))
                elif prefix in ('email', 'mailto'):
                    iocs.append(('email', value))
                else:
                    print(f"  [WARNING] Line {line_num}: Unknown type prefix '{prefix}', auto-detecting...")
                    ioc_type = _detect_type(value)
                    if ioc_type:
                        iocs.append((ioc_type, value))
                    else:
                        print(f"  [WARNING] Line {line_num}: Could not determine type for '{value}'")
            else:
                ioc_type = _detect_type(line)
                if ioc_type:
                    iocs.append((ioc_type, line))
                else:
                    print(f"  [WARNING] Line {line_num}: Could not determine type for '{line}'")

    return iocs


def _detect_type(value: str) -> Optional[str]:
    """Auto-detect IOC type from value."""
    ip_pattern = re.compile(
        r'^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$'
    )
    hash_pattern = re.compile(r'^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$')
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

    if ip_pattern.match(value):
        return 'ip'
    if hash_pattern.match(value):
        return 'hash'
    if email_pattern.match(value):
        return 'email'
    if value.startswith('http://') or value.startswith('https://'):
        return 'url'
    if '.' in value and ' ' not in value:
        return 'domain'
    return None


# ============================================================================
# Threat Intelligence Checks
# ============================================================================

def check_virustotal(ioc_type: str, ioc_value: str) -> Optional[IOCResult]:
    """Check IOC against VirusTotal API."""
    if not VIRUSTOTAL_API_KEY:
        return None

    headers = {"x-apikey": VIRUSTOTAL_API_KEY}

    if ioc_type == 'ip':
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ioc_value}"
    elif ioc_type == 'domain':
        url = f"https://www.virustotal.com/api/v3/domains/{ioc_value}"
    elif ioc_type == 'hash':
        url = f"https://www.virustotal.com/api/v3/files/{ioc_value}"
    elif ioc_type == 'url':
        url_id = hashlib.sha256(ioc_value.encode()).hexdigest()
        url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
    else:
        return None

    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            stats = data.get('data', {}).get('attributes', {}).get('last_analysis_stats', {})
            malicious = stats.get('malicious', 0) + stats.get('suspicious', 0)
            total = sum(stats.values()) if stats else 0
            is_malicious = malicious > 0
            confidence = "high" if malicious > 5 else "medium" if malicious > 0 else "clean"
            details = f"{malicious}/{total} engines flagged as malicious"

            return IOCResult(
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                source="VirusTotal",
                is_malicious=is_malicious,
                confidence=confidence,
                details=details
            )
        elif response.status_code == 404:
            return IOCResult(
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                source="VirusTotal",
                is_malicious=False,
                confidence="none",
                details="Not found in VirusTotal"
            )
    except requests.RequestException as e:
        print(f"  [ERROR] VirusTotal API error for {ioc_value}: {e}")
    return None


def check_abuseipdb(ioc_value: str) -> Optional[IOCResult]:
    """Check IP against AbuseIPDB."""
    if not ABUSEIPDB_API_KEY or not re.match(r'^\d+\.\d+\.\d+\.\d+$', ioc_value):
        return None

    headers = {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"}
    params = {"ipAddress": ioc_value, "maxAgeInDays": "90"}

    try:
        response = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers=headers, params=params, timeout=30
        )
        if response.status_code == 200:
            data = response.json().get('data', {})
            abuse_score = data.get('abuseConfidenceScore', 0)
            reports = data.get('totalReports', 0)
            is_malicious = abuse_score > 25
            confidence = "high" if abuse_score > 75 else "medium" if abuse_score > 25 else "low"
            details = f"Abuse score: {abuse_score}%, Reports: {reports}, Country: {data.get('countryCode', 'N/A')}"

            return IOCResult(
                ioc_type='ip',
                ioc_value=ioc_value,
                source="AbuseIPDB",
                is_malicious=is_malicious,
                confidence=confidence,
                details=details
            )
    except requests.RequestException as e:
        print(f"  [ERROR] AbuseIPDB API error for {ioc_value}: {e}")
    return None


def check_otx(ioc_type: str, ioc_value: str) -> Optional[IOCResult]:
    """Check IOC against AlienVault OTX."""
    if not OTX_API_KEY:
        return None

    headers = {"X-OTX-API-KEY": OTX_API_KEY}

    if ioc_type == 'ip':
        endpoint = f"indicators/IPv4/{ioc_value}/general"
    elif ioc_type == 'domain':
        endpoint = f"indicators/domain/{ioc_value}/general"
    elif ioc_type == 'hash':
        endpoint = f"indicators/file/{ioc_value}/general"
    else:
        return None

    try:
        response = requests.get(
            f"https://otx.alienvault.com/api/v1/{endpoint}",
            headers=headers, timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            pulse_count = data.get('pulse_info', {}).get('count', 0)
            is_malicious = pulse_count > 0
            confidence = "high" if pulse_count > 10 else "medium" if pulse_count > 3 else "low"
            details = f"Found in {pulse_count} threat intelligence pulses"

            return IOCResult(
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                source="AlienVault OTX",
                is_malicious=is_malicious,
                confidence=confidence,
                details=details
            )
    except requests.RequestException as e:
        print(f"  [ERROR] OTX API error for {ioc_value}: {e}")
    return None


def check_local_blocklist(ioc_type: str, ioc_value: str) -> Optional[IOCResult]:
    """Check IOC against local blocklists."""
    is_malicious = False
    source_details = []

    if ioc_type == 'ip' and ioc_value in KNOWN_MALICIOUS_IPS:
        is_malicious = True
        source_details.append("Local malicious IP list")
    elif ioc_type == 'domain' and ioc_value in KNOWN_MALICIOUS_DOMAINS:
        is_malicious = True
        source_details.append("Local malicious domain list")
    elif ioc_type == 'hash' and ioc_value in KNOWN_MALICIOUS_HASHES:
        is_malicious = True
        source_details.append("Local malicious hash list")

    if is_malicious:
        return IOCResult(
            ioc_type=ioc_type,
            ioc_value=ioc_value,
            source="Local Blocklist",
            is_malicious=True,
            confidence="high",
            details=f"Match found in: {', '.join(source_details)}"
        )
    return None


def check_threatcrowd(ioc_type: str, ioc_value: str) -> Optional[IOCResult]:
    """Check IOC against ThreatCrowd (free, no API key needed)."""
    if ioc_type == 'ip':
        url = f"https://www.threatcrowd.org/searchApi/v2/ip/report/?ip={ioc_value}"
    elif ioc_type == 'domain':
        url = f"https://www.threatcrowd.org/searchApi/v2/domain/report/?domain={ioc_value}"
    elif ioc_type == 'hash':
        url = f"https://www.threatcrowd.org/searchApi/v2/file/report/?resource={ioc_value}"
    else:
        return None

    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if data.get('response_code') == '1':
                malicious_count = len(data.get('scans', {}).get('malicious', []))
                is_malicious = malicious_count > 0
                details = f"Flagged by {malicious_count} AV engines on ThreatCrowd"

                return IOCResult(
                    ioc_type=ioc_type,
                    ioc_value=ioc_value,
                    source="ThreatCrowd",
                    is_malicious=is_malicious,
                    confidence="medium" if is_malicious else "low",
                    details=details
                )
    except requests.RequestException as e:
        print(f"  [ERROR] ThreatCrowd API error for {ioc_value}: {e}")
    return None


# ============================================================================
# Main Logic
# ============================================================================

def check_ioc(ioc_type: str, ioc_value: str) -> list:
    """Check a single IOC against all available sources."""
    results = []

    # Local blocklist check (always available)
    local_result = check_local_blocklist(ioc_type, ioc_value)
    if local_result:
        results.append(local_result)

    # ThreatCrowd (free, always available)
    tc_result = check_threatcrowd(ioc_type, ioc_value)
    if tc_result:
        results.append(tc_result)

    # VirusTotal (requires API key)
    vt_result = check_virustotal(ioc_type, ioc_value)
    if vt_result:
        results.append(vt_result)
        time.sleep(REQUEST_DELAY)

    # AbuseIPDB (IP only, requires API key)
    if ioc_type == 'ip':
        abuse_result = check_abuseipdb(ioc_value)
        if abuse_result:
            results.append(abuse_result)
            time.sleep(REQUEST_DELAY)

    # AlienVault OTX (requires API key)
    otx_result = check_otx(ioc_type, ioc_value)
    if otx_result:
        results.append(otx_result)
        time.sleep(REQUEST_DELAY)

    return results


def determine_overall_verdict(results: list) -> tuple:
    """Determine overall malicious verdict from multiple source results."""
    if not results:
        return False, "no_data", "No source data available"

    malicious_count = sum(1 for r in results if r.is_malicious)
    total_sources = len(results)

    if malicious_count >= 3:
        return True, "high", f"Flagged by {malicious_count}/{total_sources} sources"
    elif malicious_count >= 2:
        return True, "medium", f"Flagged by {malicious_count}/{total_sources} sources"
    elif malicious_count >= 1:
        # Check if it's a high-confidence source
        high_conf_sources = [r for r in results if r.is_malicious and r.confidence == "high"]
        if high_conf_sources:
            return True, "medium", f"Flagged by {len(high_conf_sources)} high-confidence source(s)"
        return False, "low", f"Flagged by {malicious_count}/{total_sources} source(s)"
    else:
        return False, "clean", f"Not flagged by any of {total_sources} sources"


def format_text_report(report: IOCReport) -> str:
    """Format report as human-readable text."""
    lines = []
    lines.append("=" * 70)
    lines.append("IOC CHECK REPORT")
    lines.append("=" * 70)
    lines.append(f"Generated: {report.generated_at}")
    lines.append(f"Total IOCs: {report.total_iocs}")
    lines.append(f"Malicious: {report.malicious_count}")
    lines.append(f"Clean: {report.clean_count}")
    lines.append(f"Errors: {report.error_count}")
    lines.append("=" * 70)
    lines.append("")

    # Group by IOC
    ioc_groups = {}
    for result in report.results:
        key = result.ioc_value
        if key not in ioc_groups:
            ioc_groups[key] = {
                'type': result.ioc_type,
                'value': result.ioc_value,
                'results': []
            }
        ioc_groups[key]['results'].append(result)

    for ioc_value, group in ioc_groups.items():
        is_malicious, confidence, summary = determine_overall_verdict(group['results'])
        status = "MALICIOUS" if is_malicious else "CLEAN"
        status_color = "\033[91m" if is_malicious else "\033[92m"
        reset_color = "\033[0m"

        lines.append(f"  [{status_color}{status}{reset_color}] {group['type'].upper()}: {ioc_value}")
        lines.append(f"  Verdict: {confidence.upper()} confidence - {summary}")
        lines.append(f"  Sources checked:")
        for r in group['results']:
            marker = "[!]" if r.is_malicious else "[ ]"
            lines.append(f"    {marker} {r.source}: {r.details}")
        lines.append("")

    return "\n".join(lines)


def format_csv_report(report: IOCReport) -> str:
    """Format report as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["IOC Type", "IOC Value", "Source", "Malicious", "Confidence", "Details", "Timestamp"])

    for result in report.results:
        writer.writerow([
            result.ioc_type,
            result.ioc_value,
            result.source,
            result.is_malicious,
            result.confidence,
            result.details,
            result.timestamp
        ])

    return output.getvalue()


def main():
    parser = argparse.ArgumentParser(
        description="Check IOCs against threat intelligence feeds",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python check-iocs.py iocs.txt
  python check-iocs.py iocs.txt --output report.json --format json
  python check-iocs.py iocs.txt --format csv > report.csv

IOC file format (one per line):
  ip:1.2.3.4
  domain:evil.example.com
  hash:abc123def456...
  url:https://evil.example.com/payload
  email:attacker@evil.com

Environment variables for API keys:
  VT_API_KEY       - VirusTotal API key
  ABUSEIPDB_API_KEY - AbuseIPDB API key
  OTX_API_KEY       - AlienVault OTX API key
        """
    )
    parser.add_argument("ioc_file", help="Path to IOC file")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--format", "-f", choices=["text", "json", "csv"], default="text",
                        help="Output format (default: text)")

    args = parser.parse_args()

    # Check if IOC file exists
    if not os.path.exists(args.ioc_file):
        print(f"[ERROR] IOC file not found: {args.ioc_file}")
        sys.exit(1)

    # Parse IOCs
    print(f"[*] Reading IOCs from: {args.ioc_file}")
    iocs = parse_ioc_file(args.ioc_file)
    print(f"[*] Found {len(iocs)} IOCs to check")
    print()

    # Check for available API keys
    print("[*] API key status:")
    print(f"    VirusTotal: {'Configured' if VIRUSTOTAL_API_KEY else 'Not configured'}")
    print(f"    AbuseIPDB:  {'Configured' if ABUSEIPDB_API_KEY else 'Not configured'}")
    print(f"    AlienVault OTX: {'Configured' if OTX_API_KEY else 'Not configured'}")
    print(f"    ThreatCrowd: Available (no key required)")
    print(f"    Local Blocklist: Available (loaded from memory)")
    print()

    # Initialize report
    report = IOCReport(total_iocs=len(iocs))

    # Check each IOC
    for i, (ioc_type, ioc_value) in enumerate(iocs, 1):
        print(f"[{i}/{len(iocs)}] Checking {ioc_type}: {ioc_value}...")

        try:
            results = check_ioc(ioc_type, ioc_value)
            report.results.extend(results)

            # Determine verdict
            is_malicious, confidence, summary = determine_overall_verdict(results)
            if is_malicious:
                report.malicious_count += 1
                print(f"  -> MALICIOUS ({confidence}): {summary}")
            else:
                report.clean_count += 1
                print(f"  -> CLEAN: {summary}")

        except Exception as e:
            report.error_count += 1
            print(f"  -> ERROR: {e}")

        print()

    # Generate report
    if args.format == "text":
        formatted_report = format_text_report(report)
    elif args.format == "json":
        report_dict = asdict(report)
        formatted_report = json.dumps(report_dict, indent=2, default=str)
    elif args.format == "csv":
        formatted_report = format_csv_report(report)

    # Output report
    if args.output:
        with open(args.output, 'w') as f:
            f.write(formatted_report)
        print(f"\n[*] Report saved to: {args.output}")
    else:
        print("\n" + formatted_report)

    # Summary
    print(f"\n[*] Summary: {report.malicious_count} malicious, {report.clean_count} clean, {report.error_count} errors out of {report.total_iocs} IOCs")

    # Exit with non-zero if malicious IOCs found
    sys.exit(1 if report.malicious_count > 0 else 0)


if __name__ == "__main__":
    main()

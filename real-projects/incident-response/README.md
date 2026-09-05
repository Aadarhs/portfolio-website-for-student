# Incident Response Playbook

A comprehensive, production-ready Incident Response (IR) playbook for security teams. This framework follows NIST SP 800-61r2 guidelines and provides actionable procedures, templates, scripts, and scenario-specific playbooks.

## Directory Structure

```
incident-response/
├── README.md                    # This file
├── playbook.md                  # Main IR playbook (NIST-aligned phases)
├── templates/
│   ├── incident-report.md       # Incident documentation template
│   ├── evidence-log.md          # Chain of custody log
│   ├── communication-template.md # Stakeholder notification templates
│   └── post-mortem.md           # Post-incident review template
├── scenarios/
│   ├── ransomware.md            # Ransomware response
│   ├── phishing.md              # Phishing attack response
│   ├── data-breach.md           # Data breach response
│   ├── ddos.md                  # DDoS attack response
│   ├── insider-threat.md        # Insider threat response
│   └── malware.md               # Malware infection response
├── scripts/
│   ├── collect-evidence.sh      # Linux evidence collection
│   ├── collect-evidence.ps1     # Windows evidence collection
│   ├── check-iocs.py            # IOC checking against threat feeds
│   └── network-snapshot.sh      # Network state capture for forensics
└── checklists/
    ├── initial-response.md      # First 24 hours checklist
    └── communication.md         # Notification checklist
```

## Quick Start

1. **Read `playbook.md`** for the overall IR process and phase-by-phase guidance.
2. **Use `checklists/initial-response.md`** when an incident is first detected.
3. **Pick the relevant scenario** from `scenarios/` for incident-specific steps.
4. **Use templates** to document everything during the response.
5. **Run scripts** for evidence collection and IOC checking.

## Severity Levels

| Level | Name         | Response Time | Description |
|-------|-------------|---------------|-------------|
| SEV-1 | Critical    | Immediate     | Active data exfiltration, ransomware encryption in progress, full system compromise |
| SEV-2 | High        | < 1 hour      | Confirmed malware, phishing with credential harvest, partial system compromise |
| SEV-3 | Medium      | < 4 hours     | Suspicious activity, policy violation, malware detected but contained |
| SEV-4 | Low         | < 24 hours    | Port scanning, minor policy violations, single endpoint compromise |

## RACI Matrix

| Activity                          | IR Lead | IT Ops | Legal | Comms | Exec |
|-----------------------------------|---------|--------|-------|-------|------|
| Incident Detection                | A       | R      | I     | I     | I    |
| Triage and Classification         | R       | C      | I     | I     | I    |
| Containment                       | R       | C      | I     | I     | I    |
| Eradication & Recovery            | A       | R      | I     | I     | I    |
| Legal/Regulatory Notification     | C       | I      | R     | I     | A    |
| External Communications           | C       | I      | R     | R     | A    |
| Post-Incident Review              | R       | C      | C     | C     | I    |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

## Contact List

Maintain a current contact list separate from this repository. Store it in your secure communication platform. Include:

- IR team members (primary and backup)
- Legal counsel
- Executive leadership
- External IR retainer (if applicable)
- Law enforcement contacts
- Cyber insurance carrier
- PR/Communications team

## Customization

This playbook is a framework. Before deploying:

1. Fill in organization-specific contact information
2. Adjust severity levels to match your risk tolerance
3. Add your specific asset inventory and network diagrams
4. Configure the IOC checking script with your threat intelligence feeds
5. Test the playbook with tabletop exercises at least quarterly

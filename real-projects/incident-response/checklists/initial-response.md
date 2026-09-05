# Initial Response Checklist (First 24 Hours)

Use this checklist the moment a security incident is detected. Print it and keep it accessible.

---

## Hour 0-1: Detection & Triage

### Immediate Actions
- [ ] Acknowledge the alert/notification
- [ ] Record the exact time of detection: `________`
- [ ] Assign incident ID: `________`
- [ ] Determine initial severity level: SEV-`__`

### Initial Assessment
- [ ] Validate the alert is not a false positive
- [ ] Identify what was detected (malware, phishing, unauthorized access, etc.)
- [ ] Determine if this is a new incident or part of an existing one
- [ ] Identify the affected system(s): `________`
- [ ] Identify the affected user(s): `________`
- [ ] Document initial indicators (IPs, file hashes, domains): `________`

### Team Activation
- [ ] Notify IR Lead: `________` (Time: `________`)
- [ ] Activate IR team (if SEV-1 or SEV-2)
- [ ] Establish communication channel (Slack channel, conference bridge, etc.)
- [ ] Set up war room (physical or virtual): `________`
- [ ] Begin incident report (`templates/incident-report.md`)

---

## Hour 1-2: Containment

### Evidence Collection (Do First!)
- [ ] Capture memory dump from affected system(s) before any changes
- [ ] Screenshot any suspicious activity
- [ ] Run evidence collection script:
  - Linux: `sudo bash scripts/collect-evidence.sh`
  - Windows: `.\scripts\collect-evidence.ps1`
- [ ] Preserve relevant logs (SIEM, endpoint, network)
- [ ] Document evidence in `templates/evidence-log.md`

### System Isolation
- [ ] Disconnect affected system(s) from network
  - Pull Ethernet cable or disable Wi-Fi
  - Do NOT power off the system
- [ ] Document the time of isolation: `________`
- [ ] If network-wide impact, consider VLAN isolation or firewall rules

### Indicator Blocking
- [ ] Block malicious IP addresses at firewall: `________`
- [ ] Block malicious domains at DNS: `________`
- [ ] Block malicious file hashes at EDR: `________`
- [ ] Block sender address/domain at email gateway: `________`
- [ ] Document all blocks applied: `________`

### Account Actions
- [ ] Identify potentially compromised accounts: `________`
- [ ] Disable compromised accounts: `________`
- [ ] Force password reset for compromised accounts: `________`
- [ ] Revoke active sessions and tokens: `________`
- [ ] Document account actions taken: `________`

---

## Hour 2-4: Analysis & Escalation

### Scope Determination
- [ ] Search for related indicators across the environment
- [ ] Check SIEM for similar alerts in the past 24-72 hours
- [ ] Identify all affected systems (not just initially detected ones)
- [ ] Determine if data was accessed or exfiltrated
- [ ] Determine if the incident is still active

### IOC Analysis
- [ ] Run IOC checking script: `python scripts/check-iocs.py <ioc_file>`
- [ ] Research indicators using OSINT tools
- [ ] Map to MITRE ATT&CK framework
- [ ] Document IOCs in incident report

### Escalation
- [ ] Determine if escalation is needed based on severity matrix
- [ ] Notify executive leadership (if SEV-1 or regulatory implications)
- [ ] Notify legal counsel (if data breach suspected)
- [ ] Notify law enforcement (if criminal activity suspected)
- [ ] Contact external IR retainer (if needed)
- [ ] Notify cyber insurance carrier (if needed)

### Documentation
- [ ] Complete initial incident report sections
- [ ] Begin timeline of events
- [ ] Record all actions taken with timestamps
- [ ] Record all communications

---

## Hour 4-12: Deep Investigation

### Forensic Analysis
- [ ] Analyze memory dump
- [ ] Analyze affected system image (if taken)
- [ ] Analyze network traffic captures
- [ ] Review full event logs
- [ ] Identify attack vector and technique
- [ ] Determine persistence mechanisms

### Additional Containment
- [ ] Implement additional network segmentation if needed
- [ ] Deploy enhanced monitoring on unaffected systems
- [ ] Block additional IOCs discovered during analysis
- [ ] Coordinate with business on containment impact

### Communication
- [ ] Send status update to stakeholders
- [ ] Document any customer impact
- [ ] Assess regulatory notification requirements
- [ ] Prepare initial external communication (if needed)

---

## Hour 12-24: Stabilization

### Containment Verification
- [ ] Verify containment measures are holding
- [ ] Check for signs of reinfection or continued attacker activity
- [ ] Review all blocked indicators
- [ ] Confirm affected systems remain isolated

### Eradication Planning
- [ ] Identify all malware/backdoors to remove
- [ ] Identify all persistence mechanisms to clean
- [ ] Determine if system rebuild is necessary
- [ ] Plan credential rotation
- [ ] Plan vulnerability patching

### Recovery Planning
- [ ] Identify clean backup sources
- [ ] Verify backup integrity
- [ ] Plan staged recovery approach
- [ ] Coordinate recovery timeline with business

### Status Report
- [ ] Prepare 24-hour status report
- [ ] Send update to all stakeholders
- [ ] Document current known impact
- [ ] Document planned next steps

---

## End of Day 1 Checklist

- [ ] All affected systems identified and isolated
- [ ] All compromised accounts identified and secured
- [ ] Incident report is complete through current phase
- [ ] Evidence is properly collected and logged
- [ ] All stakeholders have been notified
- [ ] Next 24-hour plan is documented
- [ ] On-call handoff documented (if shift change)
- [ ] Post-mortem review scheduled

---

## Quick Reference: Contact List

| Role | Name | Phone | Email |
|------|------|-------|-------|
| IR Lead | | | |
| IT Operations | | | |
| Legal Counsel | | | |
| Executive Sponsor | | | |
| External IR Firm | | | |
| Law Enforcement | | | |
| Cyber Insurance | | | |
| PR/Communications | | | |

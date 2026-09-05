# Incident Response Playbook

## Overview

This playbook follows the NIST Computer Security Incident Handling Guide (SP 800-61r2) framework. It covers five phases of incident response from preparation through post-incident activity. All incident response activities should be documented using the templates in `templates/`.

**Before using this playbook:** Ensure your team has completed Phase 1 (Preparation) activities and that all required tools, contacts, and access are in place.

---

## Phase 1: Preparation

Preparation is the most critical phase. An unprepared team will fail when an incident occurs.

### 1.1 Team Readiness

- [ ] Establish and maintain a dedicated Computer Security Incident Response Team (CSIRT)
- [ ] Define roles and responsibilities for each team member
- [ ] Maintain a current contact roster (see `checklists/communication.md`)
- [ ] Ensure 24/7 on-call rotation coverage
- [ ] Conduct tabletop exercises quarterly
- [ ] Conduct technical IR drills semi-annually

### 1.2 Tooling and Access

- [ ] SIEM deployed with relevant log sources and alerts tuned
- [ ] EDR solution deployed and monitoring all endpoints
- [ ] Forensic toolkit available (see `scripts/` for evidence collection)
- [ ] Network packet capture capability available
- [ ] Forensic workstation(s) prepared with required software
- [ ] Secure evidence storage (physical and/or digital)
- [ ] Isolated VLAN or network segment for containment
- [ ] Backup systems tested and verified
- [ ] Communication channels for IR team (secure, out-of-band)

### 1.3 Documentation

- [ ] Asset inventory up to date
- [ ] Network topology diagrams current
- [ ] Data classification inventory maintained
- [ ] Regulatory notification requirements documented
- [ ] Cyber insurance policy reviewed and contacts current
- [ ] Legal counsel contact information current
- [ ] All templates in `templates/` reviewed and customized

### 1.4 Training

- [ ] All IR team members trained on this playbook
- [ ] Phishing awareness program active
- [ ] System administrators trained on initial containment procedures
- [ ] Help desk trained on identifying and escalating security events

---

## Phase 2: Detection & Analysis

The goal is to detect the incident, determine its scope, and understand what happened.

### 2.1 Initial Detection

**Sources of detection:**
- SIEM alerts and correlation rules
- EDR alerts
- IDS/IPS alerts
- User reports (help desk tickets)
- Threat intelligence feeds
- External notifications (law enforcement, vendors, researchers)
- Anomaly detection systems
- Log analysis

**Immediate actions upon detection:**

1. **Do not panic.** Take a breath. Document what you see.
2. **Capture the initial alert/notification details:**
   - Timestamp of detection
   - Source of detection (tool, user, external)
   - Initial indicators (IP addresses, file hashes, domain names)
   - Affected systems (known)
3. **Assign an incident ticket/number.** Use a consistent format: `INC-YYYY-NNNN`
4. **Determine initial severity** using the severity matrix in the README.

### 2.2 Triage

1. **Validate the alert is not a false positive:**
   - Check for known legitimate activity
   - Verify the source system is functioning correctly
   - Cross-reference with other data sources

2. **Determine if this is a new incident or part of an existing one:**
   - Search for related indicators
   - Check if affected systems are already under investigation

3. **If confirmed as a real incident:**
   - Activate the IR team
   - Open the appropriate scenario playbook from `scenarios/`
   - Begin the `templates/incident-report.md`

### 2.3 Analysis

1. **Determine the scope:**
   - What systems are affected?
   - What data may be at risk?
   - Is the incident active or historical?
   - How did the attacker gain initial access?

2. **Collect initial evidence:**
   - Run `scripts/collect-evidence.ps1` (Windows) or `scripts/collect-evidence.sh` (Linux) on affected systems
   - Capture volatile data first (memory, network connections, running processes)
   - Preserve logs (SIEM, endpoint, network)
   - Screenshot any suspicious activity

3. **Document everything in the incident report:**
   - Use `templates/incident-report.md`
   - Log all evidence in `templates/evidence-log.md`
   - Record all actions taken with timestamps

4. **Check IOCs against threat intelligence:**
   - Run `scripts/check-iocs.py` to check indicators against known threat feeds
   - Research indicators using OSINT tools
   - Check MITRE ATT&CK for technique mapping

5. **Determine the attack vector and technique:**
   - Map to MITRE ATT&CK framework
   - Identify the initial access vector
   - Identify any persistence mechanisms
   - Identify lateral movement patterns
   - Identify data access or exfiltration

### 2.4 Escalation Criteria

Escalate to SEV-1 (Critical) if:
- Active encryption by ransomware
- Confirmed data exfiltration of sensitive data
- Compromise of domain controller or critical infrastructure
- Multiple systems compromised simultaneously
- Active attacker on the network

Escalate to executive leadership if:
- Any SEV-1 incident
- Incident involves PII/PHI of more than 500 individuals
- Incident may require regulatory notification
- Incident involves a third-party or supply chain compromise

---

## Phase 3: Containment

The goal is to prevent further damage while preserving evidence.

### 3.1 Short-Term Containment

**Immediate actions (within the first hour of confirmed incident):**

1. **Isolate affected systems:**
   - Disconnect from network (pull Ethernet cable or disable Wi-Fi)
   - Do NOT power off (preserve volatile evidence)
   - Document the exact time of isolation
   - If network isolation is needed at scale, use firewall rules or VLAN isolation

2. **Block malicious indicators:**
   - Block IP addresses at firewall/proxy
   - Block domains at DNS
   - Block file hashes at EDR
   - Disable compromised user accounts
   - Revoke active sessions and tokens

3. **Protect evidence:**
   - Take memory dumps before any system changes
   - Capture running processes and network connections
   - Image affected systems if feasible
   - Preserve all relevant logs

4. **Create forensic images:**
   - Use write-blockers for disk imaging
   - Create hash of original media
   - Document chain of custody (use `templates/evidence-log.md`)

### 3.2 Long-Term Containment

1. **Establish clean network segments** for recovery
2. **Deploy additional monitoring** on unaffected systems
3. **Implement additional access controls** if needed
4. **Consider strategic system shutdowns** if containment requires it (coordinate with business)
5. **Deploy detection rules** for indicators found during investigation

### 3.3 Business Coordination

- Communicate containment impact to business stakeholders
- Document any business disruptions
- Establish workarounds for critical business processes
- Coordinate with third parties if their systems are affected

---

## Phase 4: Eradication & Recovery

The goal is to remove the threat and restore systems to normal operation.

### 4.1 Eradication

1. **Remove the threat:**
   - Remove malware from all affected systems
   - Delete attacker-created accounts
   - Remove persistence mechanisms (scheduled tasks, registry keys, services)
   - Patch the vulnerability that was exploited
   - Reset all potentially compromised credentials

2. **Validate eradication:**
   - Scan all affected systems with updated signatures
   - Verify no backdoors remain
   - Check for additional compromised systems not previously identified
   - Review all changes made by the attacker

3. **If ransomware was involved:**
   - Do NOT pay the ransom unless authorized by executive leadership and legal counsel
   - Restore from clean backups
   - Ensure backups are not compromised
   - Rebuild systems if clean backups are unavailable

### 4.2 Recovery

1. **Restore systems from known-good state:**
   - Restore from verified clean backups
   - Rebuild systems from golden images if needed
   - Apply all security patches before bringing systems online
   - Change all credentials before restoring services

2. **Phased recovery approach:**
   - Start with the most critical business systems
   - Bring systems online one at a time
   - Verify each system is clean before restoring full functionality
   - Monitor recovered systems intensively for 48-72 hours

3. **Validation steps:**
   - Verify system integrity (file hashes, configuration)
   - Confirm normal business operations
   - Monitor for signs of reinfection
   - Review all access logs for the recovery period

---

## Phase 5: Post-Incident Activity

The goal is to learn from the incident and improve defenses.

### 5.1 Post-Incident Review

Within 5 business days of incident closure:

1. **Conduct a blameless post-mortem:**
   - Use `templates/post-mortem.md`
   - Invite all involved parties
   - Focus on process improvement, not blame

2. **Key questions to answer:**
   - What happened? (Timeline reconstruction)
   - What went well during the response?
   - What could be improved?
   - Were there detection gaps?
   - Were there communication issues?
   - Were tools and processes adequate?

### 5.2 Metrics Collection

Document the following metrics:
- **Time to detect (TTD):** How long from compromise to detection?
- **Time to contain (TTC):** How long from detection to containment?
- **Time to eradicate (TTE):** How long from containment to eradication?
- **Time to recover (TTR):** How long from eradication to full recovery?
- **Business impact:** Financial cost, operational impact, reputational impact

### 5.3 Improvement Actions

1. **Update this playbook** based on lessons learned
2. **Create new detection rules** for any gaps identified
3. **Implement additional controls** as needed
4. **Update training materials** based on the incident
5. **Share relevant threat intelligence** with the community (as appropriate)
6. **Track all improvement actions to completion**

### 5.4 Regulatory and Legal

1. **File required notifications:**
   - Regulatory bodies (per applicable laws)
   - Affected individuals (if PII/PHI was compromised)
   - Cyber insurance carrier
   - Law enforcement (if criminal activity is suspected)

2. **Preserve evidence** as required by legal and regulatory obligations
3. **Document all decisions** made during the response, especially those involving legal counsel

### 5.5 Incident Closure

- Confirm all eradication and recovery steps are complete
- All evidence is properly preserved and logged
- All required notifications have been sent
- Post-mortem review has been conducted
- Improvement actions have been assigned with owners and due dates
- Incident report is finalized and archived

---

## Appendix: Reference Materials

### MITRE ATT&CK Quick Reference

| Tactic | Common Techniques |
|--------|-------------------|
| Initial Access | Phishing, Exploit Public App, Supply Chain |
| Execution | Command Scripting, PowerShell, Scheduled Task |
| Persistence | Registry Run Keys, Scheduled Tasks, Accounts |
| Privilege Escalation | Exploitation for Priv Esc, Token Manipulation |
| Defense Evasion | Obfuscated Files, Process Injection, Timestomp |
| Credential Access | LSASS Memory, Brute Force, Credential Stuffing |
| Discovery | Network Service Scanning, System Info Discovery |
| Lateral Movement | Remote Services, SMB/Windows Admin Shares |
| Collection | Data from Local System, Screen Capture |
| Exfiltration | Exfil Over C2, Exfil Over Web Service |

### Useful Commands Quick Reference

```bash
# Check running processes (Linux)
ps auxf

# Check listening ports (Linux)
ss -tlnp

# Check network connections (Linux)
netstat -antup

# Check running processes (PowerShell)
Get-Process | Select-Object Name, Id, Path

# Check listening ports (PowerShell)
Get-NetTCPConnection -State Listen

# Check scheduled tasks (PowerShell)
Get-ScheduledTask | Where-Object {$_.State -ne 'Disabled'}

# Check services (PowerShell)
Get-Service | Where-Object {$_.Status -eq 'Running'}

# Check recent logins (Linux)
last -20

# Check recent login attempts (Linux)
grep "Failed password" /var/log/auth.log | tail -20
```

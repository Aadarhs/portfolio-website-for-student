# Insider Threat Response Playbook

**Severity Level:** SEV-1 to SEV-3 depending on intent and impact

---

## Important Considerations

> Insider threat incidents require careful handling to balance security with employee rights and legal requirements. **Always involve HR and Legal before taking action against an employee.**

> **Do not confront the suspected insider** until evidence has been gathered and HR/Legal have approved the response plan.

---

## Immediate Actions (First 30 Minutes)

1. **Assess the situation:**
   - What behavior triggered the suspicion?
   - Is the insider currently active on the network?
   - Is the insider's access level known?
   - Is there imminent risk of data loss or system damage?

2. **Begin covert monitoring:**
   - Do NOT alert the suspected insider
   - Do NOT discuss with anyone outside the IR team
   - Enable enhanced logging on affected systems
   - Monitor the insider's network activity

3. **Notify HR and Legal:**
   - Provide factual summary of observations
   - Do not make accusations
   - Request guidance on employee monitoring laws
   - Determine employment status and any union/contract considerations

---

## Detection Indicators

### Technical Indicators
- Unusual data access patterns (accessing data not related to job function)
- Large data downloads or transfers
- Access to systems outside normal working hours
- Use of unauthorized storage devices (USB drives, external hard drives)
- Use of unauthorized cloud storage services
- Attempts to bypass security controls
- Installation of unauthorized software
- Access to sensitive data after resignation/termination notice
- Abnormal email forwarding rules
- Multiple failed access attempts followed by success

### Behavioral Indicators
- Disgruntlement or expressed dissatisfaction
- Financial difficulties
- Excessive work hours (indicating copying data)
- Expressions of intent to leave
- Unusual interest in matters outside job scope
- Resistance to policy changes
- Working unusual hours without explanation

---

## Triage

1. **Determine the threat type:**

   **Malicious Insider (intentional):**
   - Deliberate data theft
   - Sabotage
   - Fraud
   - Espionage

   **Negligent Insider (unintentional):**
   - Accidental data exposure
   - Policy violations
   - Unintentional security breaches

   **Compromised Insider (credentials stolen):**
   - Attacker using insider's credentials
   - Social engineering victim
   - Unintentional accomplice

2. **Assess urgency:**
   - Is the insider actively exfiltrating data?
   - Is the insider about to leave the organization?
   - Is there evidence of sabotage?
   - Is the insider's access level critical?

---

## Containment

### Covert Containment (Before Insider is Aware)

1. **Monitor without detection:**
   - Enable enhanced logging
   - Capture network traffic
   - Monitor file access
   - Track email activity
   - Log all authentication events

2. **Restrict access covertly** (if approved by Legal/HR):
   - Modify permissions to prevent data exfiltration
   - Redirect sensitive data access through monitoring
   - Enable additional authentication requirements
   - Block external transfer channels

### overt Containment (After Insider is Aware)

3. **Coordinate with HR for employee action:**
   - Employee interview/interrogation
   - Badge and equipment collection
   - System access revocation
   - Exit interview process

4. **System access revocation:**
   - Disable all accounts (AD, email, VPN, cloud)
   - Revoke all certificates and tokens
   - Disable VPN access
   - Block badge access
   - Change shared credentials the employee knew

5. **Evidence preservation:**
   - Image the insider's workstation before any changes
   - Preserve all relevant logs
   - Capture email and communications
   - Document all evidence collected

---

## Analysis

1. **Forensic analysis:**
   - Image and analyze the insider's workstation
   - Review all file access logs
   - Analyze email communications
   - Review USB device usage history
   - Check cloud storage upload history
   - Review browser history and downloads

2. **Determine scope:**
   - What data was accessed?
   - What data was exfiltrated?
   - How long has this been going on?
   - Are there other insiders involved?
   - Were systems damaged or modified?

3. **Assess damage:**
   - Data loss extent
   - System compromise extent
   - Financial impact
   - Competitive/intelligence impact
   - Legal exposure

---

## Eradication

1. **Remove all unauthorized access:**
   - Remove all accounts created by the insider
   - Remove all backdoors and persistence mechanisms
   - Remove unauthorized software
   - Revoke all credentials

2. **Restore any modified systems:**
   - Restore from clean backups if sabotage occurred
   - Verify system integrity
   - Apply security patches

3. **Secure affected data:**
   - Rotate any credentials the insider had access to
   - Change encryption keys if applicable
   - Review and update access controls

---

## Recovery

1. **Restore normal operations:**
   - Re-enable legitimate access
   - Verify all systems operational
   - Monitor for retaliatory action

2. **Enhance monitoring:**
   - Deploy additional DLP controls
   - Enhance monitoring for data exfiltration
   - Review access controls for similar roles

---

## Legal Considerations

- **Criminal referral:** Determine if law enforcement should be notified
- **Civil remedies:** Consider restraining orders, lawsuits for damages
- **Regulatory implications:** If sensitive data was exposed, notification may be required
- **Insurance notification:** Notify cyber insurance carrier
- **Evidence preservation:** Maintain chain of custody for potential legal proceedings
- **Employee rights:** Comply with labor laws, union agreements, employment contracts

---

## Post-Incident

1. **Conduct thorough post-mortem** using `templates/post-mortem.md`
2. **Review access controls:**
   - Implement least privilege across the organization
   - Implement separation of duties for critical functions
   - Review privileged account management
3. **Enhance monitoring:**
   - Deploy/improve UEBA (User and Entity Behavior Analytics)
   - Enhance DLP controls
   - Improve logging of privileged access
4. **Update policies:**
   - Acceptable use policy
   - Data handling procedures
   - Offboarding procedures
5. **Conduct training:**
   - Manager awareness of insider threat indicators
   - Employee security awareness
   - Proper data handling procedures

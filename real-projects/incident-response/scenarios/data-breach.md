# Data Breach Response Playbook

**Severity Level:** SEV-1 or SEV-2 depending on volume and sensitivity of data

---

## Immediate Actions (First 30 Minutes)

1. **Confirm the breach:**
   - Validate that data was actually accessed/exfiltrated (not just attempted)
   - Determine what data was involved
   - Determine how many records/individuals affected

2. **Contain the breach:**
   - Stop ongoing data exfiltration
   - Isolate affected systems
   - Block exfiltration channels (C2 IPs, cloud storage, email)
   - Revoke access for compromised accounts

3. **Notify legal counsel immediately:**
   - Data breach triggers legal obligations
   - Do not discuss details outside the IR team without legal approval
   - Preserve attorney-client privilege

---

## Detection Indicators

- DLP alerts for sensitive data leaving the network
- Large outbound data transfers
- Unauthorized access to databases containing sensitive data
- Exfiltration tools detected (rclone, mega, pastebin, etc.)
- Compromised credentials used to access data repositories
- Cloud storage anomalies (unusual uploads)
- Database dump files found on systems
- Dark web monitoring detects company data for sale

---

## Data Classification Assessment

Determine what type of data was compromised:

### Highly Regulated (Legal notification required)
- **PII (Personally Identifiable Information):** SSN, driver's license, passport numbers
- **PHI (Protected Health Information):** Medical records, health insurance info
- **PCI (Payment Card Information):** Credit/debit card numbers, CVVs
- **Authentication Data:** Passwords, biometrics, security questions

### Sensitive Business Data
- Trade secrets, intellectual property
- Financial records
- Customer databases
- Employee records
- Contracts and agreements

### Internal Data
- Internal communications
- Business plans
- Non-public financial data
- System configurations

---

## Containment

### Stop the Bleeding

1. **Block all exfiltration channels:**
   - Block C2 IP addresses
   - Block known exfiltration services
   - Block Tor exit nodes
   - Implement egress filtering

2. **Secure the data source:**
   - Revoke database access
   - Change database credentials
   - Restrict database access to specific IPs
   - Enable enhanced logging

3. **Preserve evidence:**
   - Memory dumps from systems with data access
   - Network captures
   - Database access logs
   - Authentication logs
   - DLP logs

### Contain Downstream Impact

4. **Notify affected parties (if applicable):**
   - If third-party data is involved, notify them per contract
   - Coordinate notification timing with legal counsel
   - Do not notify before legal review

---

## Analysis

1. **Determine the full scope:**
   - What data was accessed?
   - What data was actually exfiltrated?
   - How many records/individuals affected?
   - What is the geographic distribution of affected individuals?

2. **Determine the attack path:**
   - How did the attacker gain access?
   - What vulnerabilities were exploited?
   - How long did the attacker have access?
   - Was the breach targeted or opportunistic?

3. **Assess data exposure:**
   - Was the data encrypted at rest?
   - Was the data encrypted in transit?
   - Can the data be easily interpreted?
   - Has the data appeared on dark web markets?

4. **Forensic analysis:**
   - Full analysis of compromised systems
   - Database query logs
   - File access logs
   - Network flow analysis

---

## Eradication

1. **Remove attacker access:**
   - Reset all compromised credentials
   - Remove backdoors and persistence mechanisms
   - Patch exploited vulnerabilities
   - Revoke unauthorized API keys and tokens

2. **Secure the data:**
   - Rotate encryption keys if database keys may be compromised
   - Implement additional access controls
   - Enable enhanced monitoring on data stores

---

## Recovery

1. **Verify data integrity:**
   - Check for unauthorized modifications
   - Validate database integrity
   - Restore from backups if data was destroyed

2. **Implement additional controls:**
   - Enhanced DLP rules
   - Additional access controls
   - Improved logging and monitoring
   - Network segmentation if needed

---

## Regulatory Notification

### Notification Requirements by Regulation

| Regulation | Notification Deadline | To Whom | Details Required |
|-----------|----------------------|---------|-----------------|
| GDPR | 72 hours | Supervisory Authority | Nature of breach, data affected, measures taken |
| HIPAA | 60 days | HHS, Media (if >500) | Description, types of info, steps taken |
| SEC | 4 business days | SEC (material incidents) | Description, impact, response |
| PCI DSS | Immediately | Card brands, acquirer | Compromised account numbers |
| State Laws | Varies (30-90 days) | Affected individuals, AG | State-specific requirements |

### Notification Checklist

- [ ] Legal counsel reviewed and approved notification content
- [ ] Notification sent to regulatory authorities
- [ ] Individual notifications prepared and sent (if required)
- [ ] Media statement prepared (if >500 individuals affected in some states)
- [ ] Credit monitoring/identity protection offered (if PII exposed)
- [ ] Dedicated response line/email established
- [ ] Documentation of all notifications preserved

---

## Post-Incident

1. **Complete post-mortem** using `templates/post-mortem.md`
2. **Review data handling practices:**
   - Was data classification adequate?
   - Were access controls appropriate?
   - Was encryption properly implemented?
   - Was DLP monitoring effective?
3. **Implement additional controls** based on findings
4. **Update this playbook** based on lessons learned
5. **Conduct training** on data handling and breach prevention
6. **Review third-party/vendor security** if breach originated from supply chain

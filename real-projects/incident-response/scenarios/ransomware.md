# Ransomware Response Playbook

**Severity Level:** SEV-1 (Critical) - Always treat ransomware as critical until scope is determined.

---

## Immediate Actions (First 15 Minutes)

> **DO NOT PAY THE RANSOM** without explicit authorization from executive leadership and legal counsel.

1. **Isolate the affected system(s) immediately:**
   - Disconnect network cable (do NOT power off)
   - Disable Wi-Fi
   - If multiple systems are affected, isolate the network segment
   - Document the time of isolation

2. **Identify the ransomware variant:**
   - Check for ransom note (filename, content)
   - Look for encrypted file extensions
   - Take screenshots of any ransom message
   - Check ID Ransomware (id-ransomware.malwarehunterteam.com) for identification

3. **Activate the IR team:**
   - Declare a SEV-1 incident
   - Open war room (physical or virtual)
   - Begin incident report

---

## Detection Indicators

- Files renamed with unknown extensions (e.g., .locked, .encrypted, .crypto)
- Ransom note files appearing (README.txt, DECRYPT_INSTRUCTIONS.html, etc.)
- Desktop wallpaper changed
- Mass file modification events in logs
- EDR alert on encryption behavior
- Multiple systems showing identical symptoms simultaneously
- Volume Shadow Copy deletion events

---

## Containment

### Immediate Containment

1. **Network isolation** of all affected systems
2. **Block known IOCs:**
   - C2 IP addresses (from ransom note or analysis)
   - Payment wallet addresses (for tracking)
   - Related domains
3. **Disable compromised accounts:**
   - Check which accounts were used to spread
   - Reset passwords for all potentially compromised accounts
   - Revoke all active sessions
4. **Preserve evidence:**
   - Memory dump from affected systems (if possible before shutdown)
   - Copy ransom note and encrypted files
   - Preserve Windows Event Logs
   - Preserve network logs

### Containment for Enterprise Spread

If ransomware is actively spreading:

1. **Isolate entire network segments** using firewall rules
2. **Disable SMBv1** across the environment
3. **Block lateral movement protocols** (RDP, SMB, WMI) at network boundaries
4. **Consider disconnecting internet** for the duration of containment
5. **Shut down affected domain controllers** if they are compromised

---

## Analysis

1. **Determine the initial access vector:**
   - Phishing email with malicious attachment
   - Exploited RDP/Vulnerability
   - Stolen credentials
   - Supply chain compromise

2. **Map the attack timeline:**
   - When was initial access gained?
   - How long was the attacker in the network?
   - What reconnaissance was performed?
   - What data was accessed or exfiltrated before encryption?
   - When did encryption begin?

3. **Determine if data was exfiltrated** (double extortion):
   - Check for large outbound data transfers
   - Review DLP logs
   - Check for known exfiltration tools
   - This affects whether you need to notify individuals

4. **Check for persistence mechanisms:**
   - Scheduled tasks
   - Registry modifications
   - New services
   - Modified startup scripts

---

## Eradication

1. **Do NOT attempt to decrypt files** unless a known decryption tool exists for the specific variant
2. **Identify all affected systems** (not just the ones showing symptoms)
3. **Rebuild affected systems** from clean media:
   - Do not attempt to "clean" ransomware-infected systems
   - Rebuild from known-good images
   - Apply all security patches
4. **Remove persistence mechanisms** on all systems
5. **Reset all credentials:**
   - Domain admin accounts
   - Service accounts
   - Local admin accounts
   - User accounts that were active during the compromise
6. **Patch the vulnerability** that was exploited for initial access

---

## Recovery

1. **Restore from clean backups:**
   - Verify backups are not compromised (check date ranges)
   - Restore to isolated environment first
   - Scan restored data for malware
   - Bring systems online in phases

2. **Recovery priority order:**
   - Domain controllers (if compromised)
   - Critical business systems
   - Email systems
   - User workstations
   - Non-critical systems

3. **Monitor for reinfection:**
   - Deploy enhanced detection rules
   - Monitor for known IOCs
   - Watch for encryption behavior
   - Review all restored system logs

4. **Verify recovery completeness:**
   - All systems operational
   - All data restored
   - No remaining indicators of compromise
   - Normal business operations resumed

---

## Decision Point: Ransom Payment

If data exfiltration occurred and the attacker threatens to publish it:

1. **Legal counsel must be involved** in any payment decision
2. **Contact law enforcement** (FBI IC3, local field office)
3. **Contact cyber insurance carrier**
4. **Consider:**
   - Payment does not guarantee data return or deletion
   - Payment may fund criminal/nation-state operations
   - Payment may violate sanctions regulations (OFAC)
   - Reputational risk of payment vs. data exposure

---

## Post-Incident

- Complete post-mortem review using `templates/post-mortem.md`
- Document lessons learned
- Update detection rules for the specific ransomware variant
- Review and test backup procedures
- Consider implementing application whitelisting
- Review RDP and remote access policies
- Consider network segmentation improvements
- Update this playbook based on lessons learned

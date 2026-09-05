# Phishing Attack Response Playbook

**Severity Level:** SEV-2 to SEV-4 depending on impact (credentials harvested, malware delivered, etc.)

---

## Immediate Actions (First 15 Minutes)

1. **Identify the phishing email:**
   - Collect the full email with headers
   - Note the sender address (spoofed or compromised account)
   - Note any malicious links or attachments
   - Check how many users received the email

2. **Determine if anyone interacted with the phishing:**
   - Check if links were clicked
   - Check if attachments were opened
   - Check if credentials were entered on a phishing page
   - Check if any malware was downloaded

3. **Block the phishing infrastructure:**
   - Block sender address/domain at email gateway
   - Block phishing URL at proxy/firewall
   - Block phishing domain at DNS
   - Add file hashes to EDR blocklist

---

## Detection Indicators

- Suspicious email reported by users
- Spike in email gateway blocks
- User credentials used from unusual locations after phishing email
- Malware detected on endpoint that originated from email
- New scheduled tasks or registry entries on recently-phished systems
- C2 communication from endpoints
- User reports of suspicious login pages

---

## Triage

1. **Assess the scope:**
   - How many users received the email?
   - How many users clicked the link/attachment?
   - How many entered credentials?
   - Was malware actually delivered?

2. **Determine impact level:**

   **Low impact** (credential entered, no malware):
   - Reset affected user passwords
   - Enable MFA if not already active
   - Monitor affected accounts

   **Medium impact** (malware delivered, isolated):
   - Isolate affected endpoint(s)
   - Run full malware scan
   - Collect forensic evidence
   - Check for lateral movement

   **High impact** (malware spreading, multiple accounts):
   - Isolate all affected endpoints
   - Activate full IR team
   - Check for data access or exfiltration
   - May need to escalate to full IR process

---

## Containment

### For Credential Harvesting

1. **Reset all compromised passwords immediately:**
   - Users who entered credentials on phishing page
   - Check if the phishing page captured MFA tokens
   - Force MFA re-enrollment if MFA tokens may have been compromised
2. **Review account activity:**
   - Check for unauthorized logins using compromised credentials
   - Review email forwarding rules (attackers often set these)
   - Check for inbox rules that move emails to folders
   - Review OAuth app grants
3. **Block the phishing page:**
   - Report to hosting provider for takedown
   - Block URL at proxy/DNS
   - Report to Google Safe Browsing, PhishTank

### For Malware Delivery

1. **Isolate affected endpoints:**
   - Disconnect from network
   - Preserve evidence (do not power off)
2. **Block malware indicators:**
   - File hashes at EDR
   - C2 IP addresses at firewall
   - C2 domains at DNS
3. **Search for similar malware across the environment:**
   - Deploy detection rules for identified malware
   - Hunt for indicators on other endpoints
   - Check email gateway for other deliveries of the same malware

---

## Analysis

1. **Analyze the phishing email:**
   - Extract full email headers
   - Identify the sending infrastructure
   - Analyze attachments (sandbox detonation)
   - Analyze URLs (URLScan, VirusTotal)
   - Determine the phishing kit used (if web-based)

2. **Map the attack chain:**
   - Initial phishing email -> URL/attachment clicked -> credential entered/malware dropped -> persistence -> lateral movement

3. **Check for follow-on attacks:**
   - Were compromised credentials used to send more phishing?
   - Was the compromised account used for BEC?
   - Was data accessed from compromised accounts?
   - Were any other accounts accessed with the same credentials?

4. **Determine if this is targeted (spear phishing):**
   - Was the email personalized?
   - Was it sent to a specific group?
   - Is there a connection to a known threat actor?

---

## Eradication

1. **Remove malware** from all affected systems
2. **Reset all compromised credentials**
3. **Remove persistence mechanisms:**
   - Scheduled tasks
   - Registry modifications
   - Startup items
4. **Remove email forwarding rules** added by attacker
5. **Remove unauthorized OAuth applications**
6. **Patch the vulnerability** if the phishing exploited a software flaw (e.g., Office macro, browser vulnerability)

---

## Recovery

1. **Restore affected systems** if malware was destructive
2. **Restore normal email operations** (unblock senders/domains that were blocked for investigation)
3. **Monitor affected accounts** for 30-90 days
4. **Re-enable accounts** that were disabled during containment

---

## Post-Incident

1. **Report the phishing to:**
   - Anti-Phishing Working Group (reportphishing@apwg.org)
   - CISA (phishing-report@us-cert.gov)
   - Email provider/ISP of the sender
   - Hosting provider of phishing page
   - Brand owner (if impersonating a brand)

2. **Improve defenses:**
   - Update email filtering rules
   - Add IOCs to blocklists
   - Consider implementing DMARC/DKIM/SPF
   - Enhance email attachment sandboxing
   - Deploy link protection/URL rewriting

3. **User awareness:**
   - Share IOCs with all users
   - Conduct targeted training for affected users
   - Update phishing awareness materials
   - Consider running a phishing simulation

4. **Document lessons learned**

# Incident Report Template

**Classification:** CONFIDENTIAL - INCIDENT DOCUMENTATION

---

## Incident Information

| Field | Value |
|-------|-------|
| **Incident ID** | INC-YYYY-NNNN |
| **Date/Time Detected** | YYYY-MM-DD HH:MM (UTC/Local) |
| **Date/Time Reported** | YYYY-MM-DD HH:MM (UTC/Local) |
| **Reported By** | [Name / Title / Source] |
| **IR Lead** | [Name / Title] |
| **Severity Level** | SEV-1 / SEV-2 / SEV-3 / SEV-4 |
| **Status** | Detected / Investigating / Contained / Eradicated / Recovered / Closed |

---

## Incident Summary

**One-paragraph description of the incident.**

[Provide a concise summary of what happened, what was affected, and the current status.]

**Incident Type:**
- [ ] Ransomware
- [ ] Phishing
- [ ] Data Breach
- [ ] DDoS
- [ ] Insider Threat
- [ ] Malware
- [ ] Unauthorized Access
- [ ] Other: _______________

---

## Affected Systems

| System Name | IP Address | Role | Impact | Data at Risk |
|-------------|-----------|------|--------|--------------|
| | | | | |
| | | | | |
| | | | | |

---

## Attack Vector & MITRE ATT&CK Mapping

**Initial Access Vector:**
- [ ] Phishing email
- [ ] Exploited public-facing application
- [ ] Stolen credentials
- [ ] Supply chain compromise
- [ ] Insider threat
- [ ] Removable media
- [ ] Unknown / Under investigation

**MITRE ATT&CK Techniques:**
| Tactic | Technique | ID | Details |
|--------|-----------|-----|---------|
| | | | |
| | | | |

---

## Timeline of Events

| Timestamp (UTC) | Event | Source | Action Taken |
|----------------|-------|--------|-------------|
| | Initial compromise detected | | |
| | | | |
| | | | |
| | | | |
| | Incident declared | | |
| | | | |
| | | | |
| | Containment achieved | | |
| | | | |
| | Eradication completed | | |
| | | | |
| | Recovery completed | | |
| | Incident closed | | |

---

## Indicators of Compromise (IOCs)

| Type | Value | Context | Confidence |
|------|-------|---------|------------|
| IP Address | | | High / Medium / Low |
| Domain | | | High / Medium / Low |
| File Hash (MD5) | | | High / Medium / Low |
| File Hash (SHA256) | | | High / Medium / Low |
| File Name | | | High / Medium / Low |
| URL | | | High / Medium / Low |
| Email Address | | | High / Medium / Low |
| Registry Key | | | High / Medium / Low |

---

## Evidence Collected

| # | Evidence ID | Description | Collected By | Date/Time | Hash (SHA256) | Storage Location |
|---|------------|-------------|-------------|-----------|---------------|-----------------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

**See full chain of custody log:** `evidence-log.md`

---

## Containment Actions Taken

| Action | Performed By | Date/Time | Result |
|--------|-------------|-----------|--------|
| | | | |
| | | | |

---

## Eradication Actions Taken

| Action | Performed By | Date/Time | Result |
|--------|-------------|-----------|--------|
| | | | |
| | | | |

---

## Recovery Actions Taken

| Action | Performed By | Date/Time | Result |
|--------|-------------|-----------|--------|
| | | | |
| | | | |

---

## Business Impact

**Operational Impact:**
[Describe impact to business operations, including duration and affected services.]

**Data Impact:**
[Describe any data accessed, stolen, modified, or destroyed.]

**Financial Impact:**
[Estimate financial cost including downtime, response costs, and potential regulatory fines.]

**Reputational Impact:**
[Assess any reputational damage or customer impact.]

---

## Notifications

| Recipient | Reason | Date/Time | Method | By Whom |
|-----------|--------|-----------|--------|---------|
| | | | | |
| | | | | |

**Regulatory Notifications Required:**
- [ ] None
- [ ] GDPR (72-hour notification)
- [ ] HIPAA (60-day notification)
- [ ] SEC (4 business days for material incidents)
- [ ] State breach notification laws
- [ ] Other: _______________

---

## Lessons Learned

**What went well:**
1.
2.
3.

**What needs improvement:**
1.
2.
3.

**Action Items:**

| # | Action Item | Owner | Due Date | Status |
|---|------------|-------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| IR Lead | | | |
| IT Director | | | |
| Legal Counsel | | | |
| CISO | | | |

---

*This document is confidential and subject to attorney-client privilege. Do not distribute outside the incident response team without authorization from Legal Counsel.*

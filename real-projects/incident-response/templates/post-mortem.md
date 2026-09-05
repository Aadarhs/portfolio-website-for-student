# Post-Incident Review (Post-Mortem) Template

**Classification:** CONFIDENTIAL - INCIDENT DOCUMENTATION

---

## Incident Information

| Field | Value |
|-------|-------|
| **Incident ID** | INC-YYYY-NNNN |
| **Incident Title** | [Short descriptive title] |
| **Date Detected** | YYYY-MM-DD |
| **Date Closed** | YYYY-MM-DD |
| **Severity** | SEV-1 / SEV-2 / SEV-3 / SEV-4 |
| **IR Lead** | [Name] |
| **Post-Mortem Date** | YYYY-MM-DD |
| **Participants** | [List all attendees and their roles] |

---

## Executive Summary

[2-3 paragraph summary of the incident, response, and key outcomes. This should be understandable by someone who was not involved in the response.]

---

## Incident Timeline (Detailed)

| Timestamp (UTC) | Event | Phase | Notes |
|----------------|-------|-------|-------|
| | | Preparation | |
| | | Detection | |
| | | Analysis | |
| | | Containment | |
| | | Eradication | |
| | | Recovery | |
| | | Closure | |

---

## What Went Well

### Detection
- [What worked well in detecting the incident?]
- [Were detection tools effective?]
- [Did users report the issue appropriately?]

### Response
- [Was the IR team mobilized quickly?]
- [Were containment actions effective?]
- [Were communication procedures followed?]

### Recovery
- [Were backups available and clean?]
- [Was recovery executed smoothly?]
- [Were business operations restored promptly?]

### Team Performance
- [Individuals or teams that performed exceptionally]
- [Coordination between teams]
- [Decision-making quality]

---

## What Needs Improvement

### Detection Gaps
- [What was missed or detected too late?]
- [Were there log gaps?]
- [Were detection rules insufficient?]
- [Was visibility lacking in any area?]

### Response Gaps
- [Were procedures unclear or incomplete?]
- [Were there access or tooling issues?]
- [Was communication delayed or unclear?]
- [Were there coordination problems?]

### Recovery Gaps
- [Were backups inadequate?]
- [Was recovery time too long?]
- [Were there dependencies not accounted for?]

### Process Gaps
- [Was the playbook adequate?]
- [Were roles and responsibilities clear?]
- [Were escalation procedures followed?]
- [Were documentation practices sufficient?]

---

## Root Cause Analysis

**Primary Root Cause:**
[Detailed description of the root cause of the incident.]

**Contributing Factors:**
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

**Root Cause Category:**
- [ ] Technical vulnerability
- [ ] Process failure
- [ ] Human error
- [ ] Third-party/supply chain
- [ ] Insufficient training
- [ ] Inadequate controls
- [ ] Other: _______________

---

## Impact Assessment (Final)

| Category | Impact |
|----------|--------|
| **Financial Cost** | $ [estimated total] |
| **Operational Downtime** | [duration] |
| **Data Loss** | [description] |
| **Data Exposure** | [description] |
| **Regulatory Impact** | [notifications filed, fines] |
| **Reputational Impact** | [assessment] |
| **Customer Impact** | [number affected, services disrupted] |
| **Employee Impact** | [overtime, reassignment, stress] |

---

## Action Items

### Priority 1 - Critical (Complete within 30 days)

| # | Action | Owner | Due Date | Status | Notes |
|---|--------|-------|----------|--------|-------|
| 1 | | | | | |
| 2 | | | | | |

### Priority 2 - High (Complete within 60 days)

| # | Action | Owner | Due Date | Status | Notes |
|---|--------|-------|----------|--------|-------|
| 1 | | | | | |
| 2 | | | | | |

### Priority 3 - Medium (Complete within 90 days)

| # | Action | Owner | Due Date | Status | Notes |
|---|--------|-------|----------|--------|-------|
| 1 | | | | | |
| 2 | | | | | |

### Priority 4 - Low (Complete within 180 days)

| # | Action | Owner | Due Date | Status | Notes |
|---|--------|-------|----------|--------|-------|
| 1 | | | | | |
| 2 | | | | | |

---

## Playbook Updates Required

| Playbook/Procedure | Section | Change Required | Owner | Status |
|-------------------|---------|----------------|-------|--------|
| | | | | |
| | | | | |

---

## Detection Rule Updates

| Rule/SIEM Query | Gap Addressed | Priority | Status |
|----------------|--------------|----------|--------|
| | | | |
| | | | |

---

## Training Needs Identified

| Training Topic | Target Audience | Priority | Owner | Status |
|---------------|----------------|----------|-------|--------|
| | | | | |
| | | | | |

---

## Key Metrics

| Metric | Value | Benchmark/Goal | Assessment |
|--------|-------|----------------|------------|
| Time to Detect (TTD) | | < [target] | Met / Not Met |
| Time to Contain (TTC) | | < [target] | Met / Not Met |
| Time to Eradicate (TTE) | | < [target] | Met / Not Met |
| Time to Recover (TTR) | | < [target] | Met / Not Met |
| Total Incident Duration | | | |
| Total Cost | | | |

---

## Review Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| IR Lead | | | |
| IT Director | | | |
| CISO | | | |
| Legal Counsel | | | |

---

## Distribution List

| Name | Role | Distribution Reason |
|------|------|-------------------|
| | | |

---

## Follow-Up Schedule

| Date | Action | Attendees |
|------|--------|-----------|
| +30 days | Action item status check | |
| +60 days | Action item status check | |
| +90 days | Final review | |

---

*This document is confidential and subject to attorney-client privilege. Do not distribute outside the incident response team without authorization from Legal Counsel.*

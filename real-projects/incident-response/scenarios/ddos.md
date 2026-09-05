# DDoS Attack Response Playbook

**Severity Level:** SEV-1 (if critical services are down) or SEV-2 (if mitigated but ongoing)

---

## Immediate Actions (First 15 Minutes)

1. **Confirm it is a DDoS attack** (not a network outage or misconfiguration):
   - Check multiple monitoring sources
   - Verify with ISP/cloud provider
   - Check if attack is targeting specific services/ports

2. **Activate DDoS mitigation:**
   - Enable cloud-based DDoS protection (Cloudflare, Akamai, AWS Shield, etc.)
   - Contact ISP for upstream filtering
   - Enable rate limiting on exposed services
   - Activate CDN for static content

3. **Notify stakeholders:**
   - Alert IT operations team
   - Notify executive leadership if customer-facing services are affected
   - Notify customer support teams

---

## Detection Indicators

- Massive increase in traffic volume
- Unusual traffic patterns (volumetric, protocol, application layer)
- Service degradation or unavailability
- Network device CPU/memory spikes
- ISP reports of abnormal traffic
- SYN flood, UDP flood, HTTP flood patterns
- Amplification attack patterns (DNS, NTP, SSDP)

---

## Attack Classification

| Type | Characteristics | Mitigation |
|------|----------------|------------|
| **Volumetric (L3/4)** | High bandwidth, UDP/ICMP floods, amplification | ISP filtering, CDN, cloud scrubbing |
| **Protocol (L3/4)** | SYN flood, fragmented packets, protocol abuse | Rate limiting, SYN cookies, firewall rules |
| **Application (L7)** | HTTP flood, Slowloris, API abuse | WAF rules, rate limiting, CAPTCHA, JS challenges |
| **DNS Amplification** | Spoofed DNS queries, large responses | BCP38 ingress filtering, DNS server hardening |
| **NTP Amplification** | Monlist requests to NTP servers | Disable monlist, rate limiting |

---

## Containment

### Immediate Mitigation

1. **Enable cloud-based DDoS protection:**
   - Route traffic through scrubbing center
   - Enable always-on protection if available
   - Configure appropriate thresholds

2. **ISP-level filtering:**
   - Contact ISP NOC immediately
   - Request upstream traffic filtering
   - Provide attack signatures and source ranges
   - Request blackhole routing for most aggressive sources (last resort)

3. **On-premises mitigation:**
   - Enable rate limiting on all exposed services
   - Configure firewall rules to drop attack traffic
   - Enable SYN cookies
   - Block identified source IP ranges (if not spoofed)
   - Disable unnecessary services/ports

### For Application-Layer Attacks

4. **WAF rule configuration:**
   - Enable bot detection
   - Implement CAPTCHA for suspicious traffic
   - Rate limit by IP and session
   - Block known attack patterns
   - Implement JS challenges

5. **Origin server protection:**
   - Restrict origin server access to CDN/proxy IPs only
   - Enable geo-blocking if attack is geo-targeted
   - Reduce timeout values to free up connections
   - Scale up backend resources if possible

---

## Analysis

1. **Capture attack traffic samples:**
   - Run `scripts/network-snapshot.sh` to capture traffic
   - Document source IP ranges
   - Document attack vectors and patterns
   - Preserve packet captures

2. **Identify attack characteristics:**
   - Source geographic distribution
   - Protocol distribution
   - Packet sizes and rates
   - Targeted services and ports
   - Duration and intensity patterns

3. **Determine if DDoS is a smokescreen:**
   - Monitor for other attack activity during DDoS
   - Check for unauthorized access attempts
   - Verify no data exfiltration is occurring
   - Check for phishing or social engineering campaigns running in parallel

---

## Recovery

1. **Gradually restore normal operations:**
   - Remove emergency rate limits one at a time
   - Monitor for attack resumption
   - Scale back mitigation services if attack has subsided
   - Verify all services are fully operational

2. **Post-attack validation:**
   - Check all services for functionality
   - Verify no data loss or corruption
   - Review logs for any secondary attacks
   - Confirm normal traffic patterns have resumed

---

## Ongoing Protection

1. **Implement always-on DDoS protection** if not already in place
2. **Establish relationship with ISP NOC** before an attack occurs
3. **Implement proper network architecture:**
   - CDN for content delivery
   - Load balancing across multiple data centers
   - BGP anycast for traffic distribution
4. **Regular DDoS drills** to test response procedures
5. **Maintain up-to-date playbooks** with current provider contacts

---

## Post-Incident

1. **Document the attack:**
   - Complete timeline
   - Traffic analysis
   - Mitigation effectiveness
   - Business impact
2. **Review mitigation strategy:**
   - Was existing protection adequate?
   - Were response times acceptable?
   - What improvements are needed?
3. **Update DDoS protection rules** based on attack patterns
4. **File with law enforcement** if attack is persistent/criminal
5. **Consider proactive threat intelligence** for attack source attribution

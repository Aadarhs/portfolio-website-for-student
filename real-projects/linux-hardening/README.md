# Linux System Hardening Suite

A comprehensive, production-quality set of bash scripts for hardening Linux systems against common attack vectors. Each module is independently runnable and includes backup creation, rollback support, and detailed logging.

## Project Structure

```
linux-hardening/
├── README.md                    # This file
├── hardening.sh                 # Main orchestrator script
├── scripts/
│   ├── ssh-hardening.sh         # SSH configuration hardening
│   ├── firewall.sh              # iptables/nftables firewall setup
│   ├── user-audit.sh            # User account audit and cleanup
│   ├── file-permissions.sh      # Critical file permission hardening
│   ├── service-audit.sh         # Disable unnecessary services
│   ├── kernel-hardening.sh      # sysctl security parameters
│   ├── audit-logging.sh         # Auditd configuration
│   ├── password-policy.sh       # Password complexity and aging
│   ├── banner.sh                # Login banner configuration
│   └── cron-audit.sh            # Cron job security review
├── config/
│   ├── sshd_config_custom       # Hardened SSH configuration
│   ├── sysctl.conf              # Security-focused sysctl settings
│   ├── iptables.rules           # Base firewall rules
│   └── audit.rules              # Auditd monitoring rules
├── audit/
│   ├── security-audit.sh        # Full system security audit
│   └── compliance-check.sh      # CIS benchmark basic checks
└── rollback/
    └── restore-defaults.sh      # Restore original settings
```

## Prerequisites

- Linux system (tested on Ubuntu 20.04+, CentOS/RHEL 7+, Debian 10+, Amazon Linux 2)
- Bash 4.0+
- Root privileges (sudo)
- Standard Linux utilities: `ip`, `ss`, `awk`, `sed`, `grep`, `systemctl`

## Quick Start

```bash
# Clone or download the project
cd linux-hardening

# Make all scripts executable
chmod +x hardening.sh scripts/*.sh audit/*.sh rollback/*.sh

# Run the full hardening suite (interactive)
sudo ./hardening.sh

# Run a specific module independently
sudo ./scripts/ssh-hardening.sh
sudo ./scripts/firewall.sh
```

## Usage

### Main Orchestrator

```bash
# Full interactive hardening (prompts for each module)
sudo ./hardening.sh

# Run all modules non-interactively
sudo ./hardening.sh --all

# Run specific modules only
sudo ./hardening.sh --modules ssh,firewall,kernel

# Skip specific modules
sudo ./hardening.sh --skip user-audit,service-audit

# Dry run (show what would be changed without applying)
sudo ./hardening.sh --dry-run

# View help
./hardening.sh --help
```

### Individual Modules

Each script in `scripts/` can be run standalone:

```bash
# SSH Hardening
sudo ./scripts/ssh-hardening.sh [--port PORT] [--permit-root no] [--password-auth no]

# Firewall Setup
sudo ./scripts/firewall.sh [--allow-ports 22,80,443] [--default-drop]

# User Audit
sudo ./scripts/user-audit.sh [--remove-shells] [--lock-inactive DAYS]

# File Permissions
sudo ./scripts/file-permissions.sh [--verify-only]

# Service Audit
sudo ./scripts/service-audit.sh [--interactive] [--whitelist sshd,nginx]

# Kernel Hardening
sudo ./scripts/kernel-hardening.sh [--profile strict|moderate]

# Audit Logging
sudo ./scripts/audit-logging.sh [--rules-file PATH]

# Password Policy
sudo ./scripts/password-policy.sh [--min-length 14] [--max-age 90]

# Login Banner
sudo ./scripts/banner.sh [--text "Custom banner text"]

# Cron Audit
sudo ./scripts/cron-audit.sh [--check-permissions] [--verify-users]
```

### Security Audit

```bash
# Full security audit (read-only, makes no changes)
sudo ./audit/security-audit.sh

# CIS benchmark compliance check
sudo ./audit/compliance-check.sh [--level 1|2] [--output report.txt]
```

### Rollback

```bash
# Restore all settings from backups
sudo ./rollback/restore-defaults.sh

# Restore a specific module
sudo ./rollback/restore-defaults.sh --module ssh
```

## Features

### Safety Mechanisms

- **Root check**: Every script verifies root privileges before making changes
- **Backup creation**: Original configs are backed up before modification (stored in `/var/backups/linux-hardening/`)
- **Rollback support**: All changes can be reverted using the rollback script
- **Dry-run mode**: Preview changes without applying them
- **Logging**: All operations logged to `/var/log/linux-hardening/`
- **Error handling**: Scripts stop on critical errors and report issues

### Logging

All output is logged with timestamps:

```bash
# View hardening logs
tail -f /var/log/linux-hardening/hardening-YYYYMMDD.log

# View audit reports
cat /var/log/linux-hardening/audit-YYYYMMDD.log
```

## Module Details

### SSH Hardening (`ssh-hardening.sh`)
- Disables root login
- Enforces key-based authentication
- Changes default SSH port
- Disables password authentication
- Limits SSH brute-force attempts
- Restricts SSH to specific users/groups
- Disables X11 forwarding and agent forwarding
- Sets strong key exchange and cipher algorithms

### Firewall (`firewall.sh`)
- Configures iptables/nftables with default deny policy
- Allows only specified inbound ports
- Blocks invalid packets and common attack patterns
- Implements rate limiting for SSH
- Configures NAT rules if needed
- IPv6 support

### User Audit (`user-audit.sh`)
- Identifies accounts with empty passwords
- Finds UID 0 (root-equivalent) accounts
- Detects accounts with no password aging
- Removes or locks unused accounts
- Reviews sudo group membership
- Checks for unauthorized `.ssh/authorized_keys`

### File Permissions (`file-permissions.sh`)
- Secures `/etc/passwd`, `/etc/shadow`, `/etc/group`
- Fixes world-writable files
- Secures SUID/SGID binaries
- Locks down `/boot`, `/etc/grub.conf`
- Removes permissive ACLs
- Verifies critical directory ownership

### Service Audit (`service-audit.sh`)
- Lists all running services
- Identifies unnecessary/危险 services (telnet, rsh, etc.)
- Disables services interactively or automatically
- Checks for open ports
- Reviews inetd/xinetd configuration

### Kernel Hardening (`kernel-hardening.sh`)
- Disables IP forwarding (unless router)
- Enables SYN cookies
- Disables ICMP redirects
- Restricts dmesg access
- Enables ASLR
- Hardens BPF and userfaultfd
- Disables kernel module loading (optional)

### Audit Logging (`audit-logging.sh`)
- Installs and configures auditd
- Monitors authentication events
- Tracks file access on critical files
- Logs privilege escalation attempts
- Monitors network configuration changes
- Configures log rotation and retention

### Password Policy (`password-policy.sh`)
- Enforces minimum password length
- Requires complexity (uppercase, lowercase, digits, special)
- Sets password aging (max days, warning period)
- Configures account lockout after failed attempts
- PAM integration for runtime enforcement

### Login Banner (`banner.sh`)
- Legal warning banner before login
- MOTD configuration
- Pre-login banner (Issue.net)
- Post-login banner
- Custom banner text support

### Cron Audit (`cron-audit.sh`)
- Reviews all user crontabs
- Checks cron file permissions
- Validates cron job ownership
- Identifies potentially malicious cron entries
- Reviews /etc/cron.d/ and /etc/cron.{hourly,daily,weekly,monthly}/

## Backup and Restore

All backups are stored in `/var/backups/linux-hardening/` with timestamps. The rollback script can restore:

```bash
# List available backups
ls /var/backups/linux-hardening/

# Restore everything
sudo ./rollback/restore-defaults.sh

# Restore specific module
sudo ./rollback/restore-defaults.sh --module ssh
sudo ./rollback/restore-defaults.sh --module firewall
```

## Configuration

Edit the files in `config/` to customize settings before running:

| File | Purpose |
|------|---------|
| `sshd_config_custom` | SSH server configuration template |
| `sysctl.conf` | Kernel security parameters |
| `iptables.rules` | Firewall rules template |
| `audit.rules` | Auditd monitoring rules |

## Security Profiles

The kernel hardening module supports profiles:

- **moderate**: Balanced security, minimal service disruption
- **strict**: Maximum security, may break some applications

## Important Notes

1. **Always test in a staging environment first** before applying to production
2. **Keep a console/serial session open** when modifying SSH/firewall settings
3. **Review the dry-run output** before applying changes
4. **Backups are automatic** but verify they exist before hardening
5. Some hardening may break legitimate services - review the service audit whitelist

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Locked out of SSH | Use console access, restore from `/var/backups/linux-hardening/` |
| Service won't start | Check file permissions and SELinux/AppArmor status |
| Audit log full | Increase log rotation frequency in audit config |
| Firewall blocking traffic | Check iptables rules, use `iptables -L -n` to inspect |

## License

MIT License - Use at your own risk. Always test before applying to production systems.

## Author

Created as a portfolio demonstration of Linux security hardening expertise.

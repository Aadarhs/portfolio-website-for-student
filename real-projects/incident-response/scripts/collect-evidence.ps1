# ============================================================================
# Evidence Collection Script - Windows
# ============================================================================
# Purpose: Collect volatile and non-volatile evidence from a Windows system
#          during incident response.
# Usage:   Run in PowerShell as Administrator:
#          .\collect-evidence.ps1 [-OutputDir <path>]
# Output:  Creates a timestamped directory with all collected evidence
#
# IMPORTANT: Run this script as Administrator. Collect volatile evidence FIRST.
#            The script minimizes system impact by using read-only commands.
# ============================================================================

#Requires -RunAsAdministrator

param(
    [Parameter(HelpMessage = "Output directory for evidence")]
    [string]$OutputDir = ""
)

# --- Configuration ---
$ErrorActionPreference = "SilentlyContinue"
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd_HHmmss_UTC")
$ComputerName = $env:COMPUTERNAME

if (-not $OutputDir) {
    $OutputDir = ".\evidence_${ComputerName}_${Timestamp}"
}

# Create output directory
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# Create metadata file
$metadata = @"
Evidence Collection Metadata
=============================
Hostname:        $ComputerName
Collection Time: $((Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss UTC"))
Local Time:      $((Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz"))
Collected By:    $env:USERNAME
Collection Tool: collect-evidence.ps1
Script Version:  1.0
OS:              $((Get-CimInstance Win32_OperatingSystem).Caption)
Architecture:    $env:PROCESSOR_ARCHITECTURE
"@
$metadata | Out-File -FilePath "$OutputDir\metadata.txt" -Encoding UTF8

Write-Host "[*] Evidence collection started at $Timestamp" -ForegroundColor Cyan
Write-Host "[*] Output directory: $OutputDir" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PHASE 1: VOLATILE DATA
# ============================================================================
Write-Host "[+] Phase 1: Collecting volatile data..." -ForegroundColor Yellow

# --- System Date/Time ---
Write-Host "  [*] System time..."
Get-Date -Format "o" | Out-File "$OutputDir\system_time.txt"
Get-TimeZone | Out-File "$OutputDir\timezone.txt" -Append
w32tm /query /status 2>&1 | Out-File "$OutputDir\ntp_status.txt"

# --- Running Processes ---
Write-Host "  [*] Running processes..."
Get-Process | Format-List * | Out-File "$OutputDir\processes_detailed.txt"
Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine, CreationDate | Format-List | Out-File "$OutputDir\processes_commandline.txt"

# --- Network Connections ---
Write-Host "  [*] Network connections..."
Get-NetTCPConnection | Format-Table -AutoSize | Out-File "$OutputDir\tcp_connections.txt"
Get-NetUDPEndpoint | Format-Table -AutoSize | Out-File "$OutputDir\udp_endpoints.txt"
Get-NetTCPConnection -State Listen | Format-Table -AutoSize | Out-File "$OutputDir\listening_ports.txt"
netstat -anob 2>&1 | Out-File "$OutputDir\netstat_anob.txt"
Get-NetIPAddress | Format-Table -AutoSize | Out-File "$OutputDir\ip_addresses.txt"
Get-NetRoute | Format-Table -AutoSize | Out-File "$OutputDir\ip_routes.txt"
Get-NetNeighbor | Format-Table -AutoSize | Out-File "$OutputDir\arp_cache.txt"
Get-DnsClientCache | Format-Table -AutoSize | Out-File "$OutputDir\dns_cache.txt"

# --- Users and Sessions ---
Write-Host "  [*] Users and sessions..."
Get-WmiObject Win32_LoggedOnUser | Select-Object -Unique | Format-List | Out-File "$OutputDir\logged_on_users.txt"
Get-WmiObject Win32_ComputerSystem | Select-Object UserName | Format-List | Out-File "$OutputDir\current_user.txt"
query user 2>&1 | Out-File "$OutputDir\query_user.txt"
Get-LocalUser | Format-Table -AutoSize | Out-File "$OutputDir\local_users.txt"
Get-LocalGroup | Format-Table -AutoSize | Out-File "$OutputDir\local_groups.txt"
net localgroup Administrators 2>&1 | Out-File "$OutputDir\local_admins.txt"
net localgroup "Remote Desktop Users" 2>&1 | Out-File "$OutputDir\rdp_users.txt"

# --- Services ---
Write-Host "  [*] Services..."
Get-Service | Format-Table -AutoSize | Out-File "$OutputDir\all_services.txt"
Get-WmiObject Win32_Service | Select-Object Name, DisplayName, State, StartMode, PathName, StartName | Format-List | Out-File "$OutputDir\services_detailed.txt"

# --- Scheduled Tasks ---
Write-Host "  [*] Scheduled tasks..."
Get-ScheduledTask | Format-Table -AutoSize | Out-File "$OutputDir\scheduled_tasks.txt"
Get-ScheduledTask | Where-Object {$_.State -ne 'Disabled'} | Get-ScheduledTaskInfo | Format-Table -AutoSize | Out-File "$OutputDir\active_task_info.txt"

# --- Registry Run Keys ---
Write-Host "  [*] Registry persistence..."
$runKeys = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServices",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServicesOnce",
    "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon",
    "HKLM:\SYSTEM\CurrentControlSet\Services"
)
foreach ($key in $runKeys) {
    if (Test-Path $key) {
        Write-Output "=== $key ===" | Out-File "$OutputDir\registry_persistence.txt" -Append
        Get-ItemProperty -Path $key -ErrorAction SilentlyContinue | Out-File "$OutputDir\registry_persistence.txt" -Append
    }
}

# --- Startup Items ---
Write-Host "  [*] Startup items..."
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location, User | Format-List | Out-File "$OutputDir\startup_items.txt"

# --- Open Files ---
Write-Host "  [*] Open files..."
handle.exe -accepteula 2>&1 | Out-File "$OutputDir\open_handles.txt" || Write-Output "handle.exe not available - download from Sysinternals" | Out-File "$OutputDir\open_handles.txt"
openfiles /query 2>&1 | Out-File "$OutputDir\openfiles_query.txt" || Write-Output "openfiles query failed - may need to enable via: openfiles /local on" | Out-File "$OutputDir\openfiles_query.txt"

# --- Loaded DLLs ---
Write-Host "  [*] Loaded modules..."
tasklist /M 2>&1 | Out-File "$OutputDir\tasklist_modules.txt"

# --- Environment Variables ---
Write-Host "  [*] Environment variables..."
Get-ChildItem Env: | Format-Table -AutoSize | Out-File "$OutputDir\environment_variables.txt"
[System.Environment]::GetEnvironmentVariables("Machine") | Out-File "$OutputDir\machine_env.txt"
[System.Environment]::GetEnvironmentVariables("User") | Out-File "$OutputDir\user_env.txt"

# ============================================================================
# PHASE 2: PERSISTENT DATA
# ============================================================================
Write-Host ""
Write-Host "[+] Phase 2: Collecting persistent data..." -ForegroundColor Yellow

# --- Windows Event Logs ---
Write-Host "  [*] Windows Event Logs (this may take a moment)..."
New-Item -ItemType Directory -Path "$OutputDir\event_logs" -Force | Out-Null

$eventLogs = @("Security", "System", "Application", "PowerShell-Operational", "Microsoft-Windows-Sysmon/Operational", "Microsoft-Windows-TaskScheduler/Operational", "Microsoft-Windows-TerminalServices-LocalSessionManager/Operational", "Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational")
foreach ($log in $eventLogs) {
    $fileName = $log -replace "[\\\/:]", "_"
    wevtutil epl "$log" "$OutputDir\event_logs\$fileName.evtx" 2>&1 | Out-Null
}

# Export last 10000 events from Security log as text for quick review
wevtutil qe Security /c:10000 /f:text /rd:true 2>&1 | Out-File "$OutputDir\event_logs\Security Recent.txt"

# --- PowerShell History ---
Write-Host "  [*] PowerShell history..."
$psHistoryPath = (Get-PSReadLineOption).HistorySavePath
if (Test-Path $psHistoryPath) {
    Copy-Item $psHistoryPath "$OutputDir\powershell_history.txt" -Force
}

# Get history for all users
$profiles = Get-ChildItem "C:\Users\*\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt"
foreach ($profile in $profiles) {
    $userName = ($profile.DirectoryName -split "\\")[2]
    Copy-Item $profile.FullName "$OutputDir\powershell_history_${userName}.txt" -Force -ErrorAction SilentlyContinue
}

# --- Prefetch ---
Write-Host "  [*] Prefetch files..."
Copy-Item "C:\Windows\Prefetch\*" "$OutputDir\prefetch\" -Recurse -Force -ErrorAction SilentlyContinue

# --- Amcache ---
Write-Host "  [*] Amcache..."
Copy-Item "C:\Windows\appcompat\Programs\Amcache.hve" "$OutputDir\" -Force -ErrorAction SilentlyContinue

# --- Browser Data ---
Write-Host "  [*] Browser data..."
New-Item -ItemType Directory -Path "$OutputDir\browsers" -Force | Out-Null
$browserPaths = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\History",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Login Data",
    "$env:APPDATA\Mozilla\Firefox\Profiles\*\places.sqlite",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\History"
)
foreach ($path in $browserPaths) {
    $items = Get-ChildItem $path -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        $dest = "$OutputDir\browsers\$($item.Name)"
        Copy-Item $item.FullName $dest -Force -ErrorAction SilentlyContinue
    }
}

# --- Installed Software ---
Write-Host "  [*] Installed software..."
Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Format-Table -AutoSize | Out-File "$OutputDir\installed_software.txt"
Get-ItemProperty HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Format-Table -AutoSize | Out-File "$OutputDir\installed_software_32bit.txt"

# --- System Information ---
Write-Host "  [*] System information..."
systeminfo 2>&1 | Out-File "$OutputDir\system_info.txt"
Get-WmiObject Win32_BIOS | Format-List | Out-File "$OutputDir\bios_info.txt"
Get-WmiObject Win32_ComputerSystem | Format-List | Out-File "$OutputDir\computer_system.txt"

# --- Disk Information ---
Write-Host "  [*] Disk information..."
Get-Volume | Format-Table -AutoSize | Out-File "$OutputDir\disk_volumes.txt"
Get-Partition | Format-Table -AutoSize | Out-File "$OutputDir\disk_partitions.txt"

# --- Recently Modified Files ---
Write-Host "  [*] Recently modified files (last 7 days)..."
$sevenDaysAgo = (Get-Date).AddDays(-7)
Get-ChildItem -Path C:\ -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -gt $sevenDaysAgo } |
    Select-Object FullName, LastWriteTime, Length |
    Sort-Object LastWriteTime -Descending |
    Format-Table -AutoSize |
    Out-File "$OutputDir\recently_modified_files.txt"

# ============================================================================
# PHASE 3: HASH ALL EVIDENCE FILES
# ============================================================================
Write-Host ""
Write-Host "[+] Phase 3: Generating hashes for all evidence files..." -ForegroundColor Yellow

Get-ChildItem -Path $OutputDir -Recurse -File |
    Where-Object { $_.Name -ne "metadata.txt" -and $_.Name -ne "evidence_hashes.txt" } |
    ForEach-Object {
        $hash = Get-FileHash $_.FullName -Algorithm SHA256
        "$($hash.Hash)  $($_.FullName)"
    } | Out-File "$OutputDir\evidence_hashes.txt"

Write-Host ""
Write-Host "[+] Evidence collection complete!" -ForegroundColor Green
Write-Host "[*] Output directory: $OutputDir"
$fileCount = (Get-ChildItem -Path $OutputDir -Recurse -File).Count
$totalSize = (Get-ChildItem -Path $OutputDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Host "[*] Evidence files: $fileCount"
Write-Host "[*] Total size: $([math]::Round($totalSize / 1MB, 2)) MB"
Write-Host ""
Write-Host "[!] IMPORTANT: Verify hashes, document chain of custody, and" -ForegroundColor Red
Write-Host "    store evidence in a secure location." -ForegroundColor Red

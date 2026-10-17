# One-time (and re-runnable) setup of the ERP on the shop PC. Run from an ADMINISTRATOR PowerShell:
#   powershell -ExecutionPolicy Bypass -File deploy\shop\install-shop.ps1
# Re-run it after pulling new code: it rebuilds and restarts. It never touches the database.
$ErrorActionPreference = 'Stop'

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this from an Administrator PowerShell (right-click PowerShell > Run as administrator).'
}

$root    = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$backend = Join-Path $root 'backend'
$envFile = Join-Path $backend '.env'
$taskName = 'ERP Server'

# 1. Node.js 18+
$nodeVer = & node -v 2>$null
if (-not $nodeVer -or [int](($nodeVer -replace '^v','').Split('.')[0]) -lt 18) {
    throw 'Node.js 18 or newer is required. Install it with: winget install OpenJS.NodeJS.LTS  (then open a new PowerShell).'
}
Write-Host "Node $nodeVer OK"

# 2. Stop a running copy so files can be rebuilt
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
}
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*dist\server.js*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# 3. Install and build
Set-Location $root
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
npm run build -w backend
if ($LASTEXITCODE -ne 0) { throw 'backend build failed' }
Push-Location (Join-Path $root 'frontend')
npx vite build
if ($LASTEXITCODE -ne 0) { throw 'frontend build failed' }
Pop-Location

# 4. backend\.env (created once, secrets generated, never overwritten)
function New-Secret([int]$bytes) {
    $b = New-Object byte[] $bytes
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return (($b | ForEach-Object { $_.ToString('x2') }) -join '')
}
if (-not (Test-Path $envFile)) {
    $text = Get-Content (Join-Path $PSScriptRoot 'shop.env.example') -Raw
    foreach ($key in 'JWT_SECRET','JWT_REFRESH_SECRET','COOKIE_SECRET') {
        $text = $text -replace "(?m)^$key=__GENERATED__", "$key=$(New-Secret 32)"
    }
    $text = $text -replace '(?m)^SHOP_TENANT_ID=__GENERATED__', "SHOP_TENANT_ID=$(New-Secret 12)"
    Set-Content -Path $envFile -Value $text -Encoding ASCII
    Write-Host "Created $envFile"
    Write-Host 'Notepad will open: set TEXTILESOFT_DB_PASSWORD, TEXTILESOFT_DB_WRITE_PASSWORD, TEXTILESOFT_ADMIN_PASSWORD (and TEXTILESOFT_DB_NAME if needed), save, close.'
    Start-Process notepad.exe $envFile -Wait
}
$port = ((Get-Content $envFile | Where-Object { $_ -match '^PORT=' }) -replace 'PORT=','').Trim()
if (-not $port) { $port = '5000' }

# 5. Firewall: let other counters open http://<this-pc>:PORT (private/domain networks only)
if (-not (Get-NetFirewallRule -DisplayName "ERP (port $port)" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "ERP (port $port)" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Private,Domain | Out-Null
}

# 6. Start at every boot (and restart if it stops), then start now
$action  = New-ScheduledTaskAction -Execute (Join-Path $PSScriptRoot 'start-erp.bat')
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

# 7. Check it came up
$ok = $false
for ($i = 0; $i -lt 20 -and -not $ok; $i++) {
    Start-Sleep -Seconds 2
    try { $ok = (Invoke-WebRequest -UseBasicParsing "http://localhost:$port/api/health/live").StatusCode -eq 200 } catch { }
}
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } | Select-Object -First 1).IPAddress
if ($ok) {
    Write-Host ''
    Write-Host "ERP is running.  This PC: http://localhost:$port   Other counters: http://${ip}:$port"
} else {
    Write-Host "ERP did not answer yet. Check $PSScriptRoot\logs\erp.log (usually a wrong SQL password in backend\.env)."
}

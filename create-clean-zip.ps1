<#
.SYNOPSIS
    Creates a clean ZIP archive of the ERP project excluding build artifacts, dependencies, and temporary files.

.DESCRIPTION
    This script uses robocopy to create a clean snapshot of the project by filtering out:
    - node_modules, .git, dist, .next, .turbo, build, coverage, test-results, playwright-report
    - *.BAK, *.zip, *.log, *.tmp
    Then compresses it using Compress-Archive with optimal compression and removes the temporary staging folder.

.PARAMETER SourcePath
    Path to the ERP project folder. Defaults to this script's directory (or .\ERP if run from parent).

.PARAMETER DestinationPath
    Target ZIP file path. Defaults to ..\ERP_Project.zip.

.PARAMETER AddTimestamp
    If specified, appends current date and time to the zip file name (e.g. ERP_Project_20260928_1407.zip).

.EXAMPLE
    .\create-clean-zip.ps1

.EXAMPLE
    .\create-clean-zip.ps1 -AddTimestamp
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$SourcePath = "",

    [Parameter(Position = 1)]
    [string]$DestinationPath = "",

    [switch]$AddTimestamp
)

$ErrorActionPreference = "Stop"

# Determine Source Path
if ([string]::IsNullOrWhiteSpace($SourcePath)) {
    if (Test-Path -Path (Join-Path $PSScriptRoot "package.json")) {
        $SourcePath = $PSScriptRoot
    } elseif (Test-Path -Path (Join-Path $PSScriptRoot "ERP\package.json")) {
        $SourcePath = Join-Path $PSScriptRoot "ERP"
    } else {
        $SourcePath = $PSScriptRoot
    }
}

$SourcePath = (Resolve-Path $SourcePath).Path
$ParentDir = Split-Path -Path $SourcePath -Parent

# Determine Destination Path
if ([string]::IsNullOrWhiteSpace($DestinationPath)) {
    if ($AddTimestamp) {
        $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
        $DestinationPath = Join-Path $ParentDir "ERP_Project_$timestamp.zip"
    } else {
        $DestinationPath = Join-Path $ParentDir "ERP_Project.zip"
    }
}

$TempStagePath = Join-Path $ParentDir "ERP_Clean_Stage_$([System.IO.Path]::GetRandomFileName().Substring(0,6))"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " ERP Clean ZIP Archive Creator" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Source:      $SourcePath"
Write-Host "Destination: $DestinationPath"
Write-Host "Staging dir: $TempStagePath"
Write-Host ""

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # 1. Clean previous target zip if overwriting standard name
    if (-not $AddTimestamp -and (Test-Path -Path $DestinationPath)) {
        Write-Host "[-] Removing existing archive at $DestinationPath..." -ForegroundColor Yellow
        Remove-Item -Path $DestinationPath -Force -ErrorAction SilentlyContinue
    }

    # 2. Stage files excluding heavy/temporary folders and files using robocopy
    Write-Host "[1/3] Copying clean project files (excluding dependencies & build caches)..." -ForegroundColor Green
    
    $excludeDirs = @(
        "node_modules",
        ".git",
        "dist",
        ".next",
        ".turbo",
        "build",
        "coverage",
        ".cache",
        "test-results",
        "playwright-report"
    )

    $excludeFiles = @(
        "*.BAK",
        "*.zip",
        "*.log",
        "*.tmp",
        "*.suo"
    )

    $robocopyArgs = @(
        "`"$SourcePath`"",
        "`"$TempStagePath`"",
        "/E",
        "/XD"
    ) + $excludeDirs + @("/XF") + $excludeFiles + @("/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP")

    $robocopyCmd = "robocopy $SourcePath `"$TempStagePath`" /E /XD $($excludeDirs -join ' ') /XF $($excludeFiles -join ' ') /NFL /NDL /NJH /NJS /NC /NS /NP"
    
    # Execute robocopy
    $process = Start-Process -FilePath "robocopy.exe" -ArgumentList $robocopyArgs -NoNewWindow -Wait -PassThru
    # Robocopy exit codes 0-7 indicate success (files copied or no changes)
    if ($process.ExitCode -ge 8) {
        throw "Robocopy failed with exit code $($process.ExitCode)"
    }

    # Calculate staged size
    $stagedBytes = (Get-ChildItem -Path $TempStagePath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $stagedMB = [math]::Round($stagedBytes / 1MB, 2)
    Write-Host "      Clean source prepared: $stagedMB MB" -ForegroundColor DarkGray

    # 3. Compress to ZIP
    Write-Host "[2/3] Compressing to ZIP (Optimal compression)..." -ForegroundColor Green
    Compress-Archive -Path "$TempStagePath\*" -DestinationPath $DestinationPath -CompressionLevel Optimal

    # 4. Result details
    $zipFile = Get-Item $DestinationPath
    $zipMB = [math]::Round($zipFile.Length / 1MB, 2)
    $stopwatch.Stop()

    Write-Host "[3/3] Done in $($stopwatch.Elapsed.TotalSeconds.ToString('F1')) seconds!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " Archive Created Successfully" -ForegroundColor Green
    Write-Host " File: $DestinationPath" -ForegroundColor White
    Write-Host " Size: $zipMB MB" -ForegroundColor White
    Write-Host "=================================================" -ForegroundColor Cyan
}
catch {
    Write-Error "Failed to create clean zip: $_"
}
finally {
    # 5. Clean up temporary staging directory
    if (Test-Path -Path $TempStagePath) {
        Write-Host "[-] Cleaning temporary staging directory..." -ForegroundColor DarkGray
        Remove-Item -Path $TempStagePath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

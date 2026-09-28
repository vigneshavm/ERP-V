# Create project zip excluding specified directories and files
param(
    [string]$ProjectPath = ".",
    [string]$OutputName = "ERP_Project_$(Get-Date -Format 'yyyy-MM-dd_HHmmss')"
)

# Directories to exclude (pruned during traversal, not descended into)
$excludeDirs = @('node_modules', '.git', 'dist', '.next', '.turbo', 'playwright-report', 'test-results', 'coverage', '.vscode')

# File patterns to exclude
$excludeFilePatterns = @('*.bak', '*.zip', '*.log', '*.lock')

Write-Host "Creating project archive..." -ForegroundColor Cyan
Write-Host "Project path: $ProjectPath" -ForegroundColor Gray
Write-Host "Output: $OutputName.zip" -ForegroundColor Gray

$rootFull = (Resolve-Path $ProjectPath).Path

# Recursively collect files while pruning excluded directories up front (fast on large repos)
$allFiles = [System.Collections.Generic.List[string]]::new()
$excludedCount = 0

function Add-Files {
    param([string]$Dir)

    $entries = Get-ChildItem -LiteralPath $Dir -Force -ErrorAction SilentlyContinue
    foreach ($entry in $entries) {
        if ($entry.PSIsContainer) {
            if ($excludeDirs -contains $entry.Name) {
                $script:excludedCount++
                continue
            }
            Add-Files -Dir $entry.FullName
        }
        else {
            $isExcluded = $false
            foreach ($pattern in $excludeFilePatterns) {
                if ($entry.Name -like $pattern) {
                    $isExcluded = $true
                    break
                }
            }
            if ($isExcluded) {
                $script:excludedCount++
            }
            else {
                $allFiles.Add($entry.FullName)
            }
        }
    }
}

Add-Files -Dir $rootFull

Write-Host "Files to include: $($allFiles.Count)" -ForegroundColor Green
Write-Host "Files/folders excluded: $excludedCount" -ForegroundColor Yellow

# Create zip file
try {
    $zipPath = Join-Path $ProjectPath "$OutputName.zip"
    
    if ($allFiles.Count -gt 0) {
        # Use .NET compression for better control
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        
        $zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
        
        foreach ($file in $allFiles) {
            # Get relative path for zip entry
            $relativePath = [System.IO.Path]::GetRelativePath($rootFull, $file)
            
            $entry = $zip.CreateEntry($relativePath)
            $stream = $entry.Open()
            $fileStream = [System.IO.File]::OpenRead($file)
            $fileStream.CopyTo($stream)
            $stream.Dispose()
            $fileStream.Dispose()
        }
        
        $zip.Dispose()
        
        $zipSize = (Get-Item $zipPath).Length / 1MB
        Write-Host "Archive created successfully!" -ForegroundColor Green
        Write-Host "File: $zipPath" -ForegroundColor Green
        Write-Host "Size: $([Math]::Round($zipSize, 2)) MB" -ForegroundColor Green
    }
    else {
        Write-Host "No files to include in archive" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error creating archive: $_" -ForegroundColor Red
}

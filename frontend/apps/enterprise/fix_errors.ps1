$files = Get-ChildItem -Path 'src' -Recurse -Include '*.tsx','*.ts'

foreach ($file in $files) {
    $lines = Get-Content $file.FullName
    $fixed = $false
    $newLines = @()

    foreach ($line in $lines) {
        $newLine = $line -replace 'logger\.error\(error\)', 'logger.error(error as string | Error)'
        $newLine = $newLine -replace 'console\.error\(error\)', 'console.error(error as string | Error)'
        if ($newLine -ne $line) { $fixed = $true }
        $newLines += $newLine
    }

    if ($fixed) {
        $newLines | Set-Content $file.FullName
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done."

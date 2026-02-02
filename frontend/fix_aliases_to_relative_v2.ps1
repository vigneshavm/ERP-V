$srcVal = "d:\BizzAI-main\BizzAI-main\frontend\src"
$files = Get-ChildItem -Path $srcVal -Recurse -Include "*.jsx", "*.js", "*.tsx", "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Regex to find imports with @/
    $matches = [regex]::Matches($content, '["'']@/(.*?)["'']')
    foreach ($match in $matches) {
        $importPath = $match.Groups[1].Value
        
        $targetAbsPath = Join-Path $srcVal $importPath
        
        # Use Uri to calculate relative path (compatible with older PS)
        $fileUri = New-Object Uri $file.FullName
        $targetUri = New-Object Uri $targetAbsPath
        $relUri = $fileUri.MakeRelativeUri($targetUri)
        $relPath = $relUri.ToString()
        
        # Unescape (if needed, though rare for source files)
        $relPath = [Uri]::UnescapeDataString($relPath)
        
        # Add ./ if valid relative path doesn't start with . (same directory)
        if (-not $relPath.StartsWith('.')) {
            $relPath = "./$relPath"
        }
        
        # Replace
        $oldString = "@/$importPath"
        $newString = $relPath
        
        $content = $content.Replace($oldString, $newString)
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

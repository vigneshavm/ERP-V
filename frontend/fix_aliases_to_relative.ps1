$srcVal = "d:\BizzAI-main\BizzAI-main\frontend\src"
$files = Get-ChildItem -Path $srcVal -Recurse -Include "*.jsx", "*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Regex to find imports with @/
    # We use a callback logic by matching, then computing replacement
    
    $matches = [regex]::Matches($content, '["'']@/(.*?)["'']')
    foreach ($match in $matches) {
        $importPath = $match.Groups[1].Value
        # Remove potential arguments or quotes if regex captured too much (it shouldn't with correct regex)
        
        # Target absolute path (assuming @ maps to src)
        $targetAbsPath = Join-Path $srcVal $importPath
        
        # Calculate relative path
        $relPath = [System.IO.Path]::GetRelativePath($file.DirectoryName, $targetAbsPath)
        
        # Normalize to forward slashes
        $relPath = $relPath -replace '\\', '/'
        
        # Add ./ if it's in the same directory and doesn't start with .
        if (-not $relPath.StartsWith('.')) {
            $relPath = "./$relPath"
        }
        
        # Replace in content. Use literal string replacement to avoid regex issues with dots
        $oldString = "@/$importPath"
        $newString = $relPath
        
        $content = $content.Replace($oldString, $newString)
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

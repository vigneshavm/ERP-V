$files = Get-ChildItem -Path "d:\BizzAI-main\BizzAI-main\frontend\src" -Recurse -Include "*.tsx", "*.ts", "*.jsx", "*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace ../../redux with @/redux, etc.
    # Pattern captures: 1: (../)+ 2: module 3: rest of path
    $content = $content -replace 'from\s+["''](\.\./)+(redux|components|hooks|types|pages|services|contexts|utils|config)(.*?)["'']', 'from "@/$2$3"'
    $content = $content -replace 'import\s+["''](\.\./)+(redux|components|hooks|types|pages|services|contexts|utils|config)(.*?)["'']', 'import "@/$2$3"'
    
    # Specific fix for dynamic imports like import('../components...')
    $content = $content -replace 'import\(\s*["''](\.\./)+(redux|components|hooks|types|pages|services|contexts|utils|config)(.*?)["'']\s*\)', 'import("@/$2$3")'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

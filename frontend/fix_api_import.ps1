$files = Get-ChildItem -Path "d:\BizzAI-main\BizzAI-main\frontend\src" -Recurse -Include "*.tsx", "*.ts", "*.jsx", "*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace "@/services/api" with "@/services/api.js"
    $content = $content -replace 'from\s+["'']@/services/api["'']', 'from "@/services/api.js"'
    $content = $content -replace 'import\s+["'']@/services/api["'']', 'import "@/services/api.js"'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

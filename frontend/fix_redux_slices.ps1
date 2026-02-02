$files = Get-ChildItem -Path "d:\BizzAI-main\BizzAI-main\frontend\src\redux\slices" -Filter "*.js"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace "@/services/..." with "../../services/..."
    $content = $content -replace 'from\s+["'']@/services/(.*?)(\.js)?["'']', 'from "../../services/$1"'
    $content = $content -replace 'import\s+["'']@/services/(.*?)(\.js)?["'']', 'import "../../services/$1"'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

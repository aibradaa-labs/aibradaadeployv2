param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path
# Replace the 3rd radar dataset color from gray to yellow
$content = $content -replace 'rgba\(\s*168\s*,\s*178\s*,\s*204\s*,\s*0\.32\s*\)','rgba(255,215,0,0.35)'
$content = $content -replace 'rgba\(\s*168\s*,\s*178\s*,\s*204\s*,\s*0\.9\s*\)','rgba(255,215,0,0.9)'

Set-Content -Encoding UTF8 $Path $content
Write-Output "Patched radar palette. Backup: $backup"

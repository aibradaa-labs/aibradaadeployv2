param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# Replace literal backtick r/backtick n with actual newline
$content = $content -replace '\`r\`n', [Environment]::NewLine

# Fix alert input value binding: target -> alertRM
$pattern = 'value="\$\{\s*existingAlert\?\.\s*target\s*\|\|\s*''''\s*\}"'
$replacement = "value=\"`${existingAlert?.alertRM || ''}\""
$content = [regex]::Replace($content, $pattern, $replacement)

Set-Content -Encoding UTF8 $Path $content
Write-Output "Mini cleanup applied. Backup: $backup"

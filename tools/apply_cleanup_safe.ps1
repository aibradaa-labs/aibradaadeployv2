param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

# Read entire file
$content = Get-Content -Raw $Path

# 1) Normalize any literal `r`n sequences to actual newlines
$content = $content.Replace("`r`n", [Environment]::NewLine)

# 2) Switch value binding from existingAlert?.target -> existingAlert?.alertRM
$content = [regex]::Replace($content, '\bexistingAlert\?\.\s*target\b', 'existingAlert?.alertRM')

# 3) Normalize bullet join if double-encoded
$content = $content.Replace(' â€¢ ', ' • ')

# Write back
Set-Content -Encoding UTF8 $Path $content
Write-Output "Cleanup complete. Backup: $backup"

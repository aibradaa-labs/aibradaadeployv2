param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

# Read existing content (already interpreted as .NET string)
$content = Get-Content -Raw -Encoding UTF8 $Path

# Convert from CP1252 mis-decoding back to UTF-8
$bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($content)
$fixed = [System.Text.Encoding]::UTF8.GetString($bytes)

# Normalize line endings to CRLF to match Windows project style
$normalized = $fixed -replace "\r?\n", "`r`n"

Set-Content -Encoding UTF8 $Path $normalized
Write-Output "Re-encoded index.html. Backup: $backup"

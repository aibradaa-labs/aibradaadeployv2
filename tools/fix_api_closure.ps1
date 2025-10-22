param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path
# Remove the stray object closer after the legacy comment end
# Pattern: "*/" followed by an extra "};" on next line(s)
$new = [regex]::Replace($content, "(\*/)\s*\r?\n\s*\};", '$1')
Set-Content -Encoding UTF8 $Path $new
Write-Output "Fixed API_MODULE trailing closure. Backup: $backup"

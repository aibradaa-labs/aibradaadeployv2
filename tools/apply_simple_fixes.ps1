param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# 1) Replace remaining existingAlert?.target with existingAlert?.alertRM
$content = $content.Replace('existingAlert?.target','existingAlert?.alertRM')

# 2) Replace literal `r`n sequence with actual newline
$bt = [char]0x60
$literal = "$bt" + 'r' + "$bt" + 'n'
$content = $content.Replace($literal, [Environment]::NewLine)

Set-Content -Encoding UTF8 $Path $content
Write-Output "Simple fixes applied. Backup: $backup"

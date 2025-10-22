param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path
# Insert API_MODULE closer after the legacy comment end if missing
$content = [regex]::Replace($content, "(\*/\s*\r?\n)(\s*// --- UI MODULE)", '$1  };`r`n$2')
Set-Content -Encoding UTF8 $Path $content
Write-Output "Inserted API_MODULE closer after legacy comment end if needed. Backup: $backup"

param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# 1) Replace literal backtick sequences `r`n with real newlines
$content = $content -replace '`r`n', "`r`n"

# 2) After the legacy comment end (*/), ensure exactly one API_MODULE closer before UI MODULE banner
$pattern = '(\*/)(\s*\r?\n)(?:\s*};\s*)+(?=\s*// --- UI MODULE)'
$replacement = '$1$2  };' + "`r`n"
$content = [regex]::Replace($content, $pattern, $replacement)

Set-Content -Encoding UTF8 $Path $content
Write-Output "Cleaned API_MODULE insertion artifacts. Backup: $backup"

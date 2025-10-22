param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# Normalize any literal backtick r/backtick n sequences to real newlines
$content = $content -replace '\`r\`n', [Environment]::NewLine

# Ensure API_MODULE -> UI MODULE boundary is clean
$content = [regex]::Replace($content, '\};\s*\r?\n\s*// --- UI MODULE', '};' + [Environment]::NewLine + [Environment]::NewLine + '  // --- UI MODULE')

# Fix alert input value binding from .target to .alertRM
$content = [regex]::Replace($content, 'value="\$\{\s*existingAlert\?\.\s*target\s*\|\|\s*''\s*\}"', 'value="${existingAlert?.alertRM || ''}"')

# Clean any injected backtick newlines around data-brand insertion
$content = [regex]::Replace($content, 'data-brand="\$\{l\.brand\}"\s*\r?\n\s+placeholder', 'data-brand="${l.brand}"' + [Environment]::NewLine + '                     placeholder')

# Optional: normalize bullet variant if double-encoded (safe cosmetic)
$content = $content -replace 'â€¢', '•'

Set-Content -Encoding UTF8 $Path $content
Write-Output "Final cleanup applied. Backup: $backup"

param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# Reorder any `};` placed immediately before the legacy comment end so that `*/` comes first
$content = [regex]::Replace($content, '};\s*\r?\n\s*\*/', '*/' + [Environment]::NewLine + '  };')

# Collapse any duplicate closers after the comment end, just before UI MODULE banner
$content = [regex]::Replace($content, '\*/\s*\r?\n\s*};\s*\r?\n\s*};\s*\r?\n\s*// --- UI MODULE', '*/' + [Environment]::NewLine + '  };' + [Environment]::NewLine + '  // --- UI MODULE')

Set-Content -Encoding UTF8 $Path $content
Write-Output "Reordered API_MODULE closer. Backup: $backup"

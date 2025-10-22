param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# Close fetchMarketIntel before callAIAgent docblock
$content = [regex]::Replace($content, '      },\s*\r?\n\s*/\*\*', "      }\r\n    },\r\n\r\n    /**")

# Normalize API_MODULE closing whitespace
$content = [regex]::Replace($content, '\*/\s*\r?\n\s*};\s*\r?\n\s*//', "*/\r\n  };\r\n\r\n  //")

# Bullet separator normalization
$content = $content.Replace(" â€¢ ", " • ")

# Fix alert input default binding
$content = $content.Replace('value="${existingAlert?.target || ''}"', 'value="${existingAlert?.alertRM || ''}"')

Set-Content -Encoding UTF8 $Path $content
Write-Output "Batch fixes applied. Backup: $backup"

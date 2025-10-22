param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# Replace the closing brace/comma/newline sequence with a clean closure
$content = [regex]::Replace(
  $content,
  "      }\s*,\s*\r?\n\s*\r?\n\s*/\*\*",
  "      },\r\n\r\n    /**"
)

# Normalize API_MODULE closings to ensure only one closing brace before UI module banner
$content = [regex]::Replace(
  $content,
  "\*/\s*\r?\n\s*};\s*\r?\n\s*};",
  "*/\r\n  };"
)

# Clean bullet separator encoding
$content = $content.Replace(" â€¢ ", " • ")

# Update alert input value binding
$content = $content.Replace("value=\"${existingAlert?.target || ''}\"", "value=\"${existingAlert?.alertRM || ''}\"")

Set-Content -Encoding UTF8 $Path $content
Write-Output "Batch fixes v2 applied. Backup: $backup"

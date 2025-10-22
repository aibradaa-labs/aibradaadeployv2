# Safely remove duplicate top-level 'org_config:' (and following 'modules:' if present)
$ErrorActionPreference = 'Stop'
$path = 'Master Operation Config.yaml'
if (-not (Test-Path -LiteralPath $path)) { Write-Error "File not found: $path"; exit 1 }
# Backup
$backup = "$path.bak_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -LiteralPath $path -Destination $backup -Force

# Read all lines
$lines = [System.IO.File]::ReadAllLines($path)
# Find all 'org_config:' occurrences
$orgIdxs = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i].Trim() -eq 'org_config:') { $orgIdxs += $i }
}
if ($orgIdxs.Count -le 1) {
  Write-Host 'No duplicate org_config found'; exit 0
}
# Remove the second occurrence and optional next 'modules:' line
$dup = [int]$orgIdxs[1]
$removeCount = 1
if ($dup + 1 -lt $lines.Length -and ($lines[$dup + 1].Trim() -eq 'modules:' -or $lines[$dup + 1] -match '^\s*modules:\s*$')) {
  $removeCount = 2
}
$new = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($i -ge $dup -and $i -lt ($dup + $removeCount)) { continue }
  $null = $new.Add($lines[$i])
}
[System.IO.File]::WriteAllLines($path, $new)
Write-Host "Removed duplicate org_config at line $($dup + 1) (removed $removeCount line(s)); backup: $backup"

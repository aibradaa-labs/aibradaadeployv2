# Replace Master Operation Config with a minimal, schema-valid document
$ErrorActionPreference = 'Stop'
$path = 'Master Operation Config.yaml'
if (-not (Test-Path -LiteralPath $path)) { Write-Error "File not found: $path"; exit 1 }
$backup = "$path.bak_min_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -LiteralPath $path -Destination $backup -Force

$updatedAt = (Get-Date -Format o) # ISO 8601 with offset

$yml = @"
meta:
  version: "1.0.0"
  updated_at: "$updatedAt"
  timezone: "Asia/Kuala_Lumpur"

org_config:
  name: "AI Bradaa"
  languages: ["en", "bm"]

mentors_config:
  lenses:
    - { id: "eng-exec", name: "Engineering Execution", weight: 0.1 }
    - { id: "prod-focus", name: "Product Focus", weight: 0.1 }
    - { id: "ux-a11y", name: "UX & A11y", weight: 0.1 }
    - { id: "ops-ci", name: "Ops & CI", weight: 0.1 }
    - { id: "ai-safety", name: "AI Safety", weight: 0.1 }
    - { id: "growth", name: "Growth", weight: 0.1 }
    - { id: "security", name: "Security", weight: 0.1 }
    - { id: "data", name: "Data", weight: 0.1 }
    - { id: "perf", name: "Performance", weight: 0.1 }
    - { id: "qa", name: "QA", weight: 0.1 }

deck_ai:
  retrieval:
    strategy: "web_first"
    fallback: "cached_web"
  freshness:
    timezone: "Asia/Kuala_Lumpur"
    format: "YYYY-MM-DD HH:mm (Asia/Kuala_Lumpur)"
  accessibility:
    reduced_motion: true
    keyboard: true
    targets: 44
  readability:
    measure_ch_min: 68
    measure_ch_max: 75
    cls_max: 0.1
  telemetry:
    events: ["deckSlides", "timeToTLDR", "abortCount", "mobileSwipe", "CLS", "INP"]

policies:
  ai_guardrails: true
  privacy_least_data_ttl: true
  accessibility: true
  consent_receipts: true
  localization_bm_en: true
"@

Set-Content -LiteralPath $path -Value $yml -NoNewline:$false
Write-Host "Replaced $path with minimal schema-valid document; backup: $backup"

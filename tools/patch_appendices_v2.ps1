param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# 1) Switch existingAlert to alertsMap keyed by brand+model and inject fallback href builders
$pattern1 = 'const existingAlert\s*=\s*alerts\.find\(a\s*=>\s*a\.model\s*===\s*l\.model\);'
$replacement1 = @'
const alertId = `${l.brand} ${l.model}`.trim();
const existingAlert = alertsMap[alertId];
const q = (window.Marketplaces && window.Marketplaces.modelString) ? window.Marketplaces.modelString(l) : `${l.brand} ${l.model}`;
const shopeeHref = (window.Marketplaces && l.shopee_url && window.Marketplaces.isValidUrl(l.shopee_url)) ? l.shopee_url : (window.Marketplaces ? window.Marketplaces.shopeeSearch(q) : '#');
const priceHref  = (window.Marketplaces && l.price_source_url && window.Marketplaces.isValidUrl(l.price_source_url)) ? l.price_source_url : (window.Marketplaces ? window.Marketplaces.lazadaSearch(q) : '#');
const tiktokHref = (window.Marketplaces && l.tiktok_url && window.Marketplaces.isValidUrl(l.tiktok_url)) ? l.tiktok_url : (window.Marketplaces ? window.Marketplaces.tiktokSearch(q) : '#');
'@
$content = [regex]::Replace($content, $pattern1, $replacement1)

# 2) Replace buy block to always render links using computed hrefs
$pattern2 = "(?s)const buy\s*=\s*\[.*?\]\.filter\(Boolean\)\.join\(' • '\);"
$replacement2 = @'
const buy = [
  `<a class="underline hover:text-[var(--c-accent-cyan)]" target="_blank" href="${priceHref}">🔗 Price Source</a>`,
  `<a class="underline hover:text-[var(--c-accent-cyan)]" target="_blank" href="${shopeeHref}">🛒 Shopee</a>`,
  `<a class="underline hover:text-[var(--c-accent-cyan)]" target="_blank" href="${tiktokHref}">📱 TikTok</a>`
].join(' • ');
'@
$content = [regex]::Replace($content, $pattern2, $replacement2, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# 3) Add data-brand to alert input and change value from target to alertRM
$pattern3 = '(?s)(<input[^>]*class="[^"]*alert-input[^"]*"[^>]*data-model="\$\{l\.model\}"[^>]*)(>)'
$replacement3 = '$1 data-brand="${l.brand}"$2'
$content = [regex]::Replace($content, $pattern3, $replacement3, [System.Text.RegularExpressions.RegexOptions]::Singleline)

$pattern3b = 'value="\$\{\s*existingAlert\?\.\s*target\s*\|\|\s*''\s*\}"
$replacement3b = 'value="${existingAlert?.alertRM || ''}"'
$content = [regex]::Replace($content, $pattern3b, $replacement3b)

# 4) Ensure alert Save button has type="button" and data-brand
$pattern4 = '(?s)(<button)([^>]*class="alert-save[^"]*"[^>]*)(>)'
$replacement4 = '<button type="button"$2$3'
$content = [regex]::Replace($content, $pattern4, $replacement4, [System.Text.RegularExpressions.RegexOptions]::Singleline)

$pattern4b = '(?s)(<button[^>]*class="alert-save[^"]*"[^>]*data-model="\$\{l\.model\}"[^>]*)(>)'
$replacement4b = '$1 data-brand="${l.brand}"$2'
$content = [regex]::Replace($content, $pattern4b, $replacement4b, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# 5) Declare alertTimers after container check
$pattern5 = 'if \(!container\) return;'
$replacement5 = "if (!container) return;`r`n`r`n  const alertTimers = {};"
$content = $content -replace $pattern5, $replacement5

# 6) Replace the click handler body with debounced map writer
$pattern6 = "(?s)btn\.addEventListener\('click', \(e\) => \{.*?\}\);"
$replacement6 = @'
btn.addEventListener('click', (e) => {
  const model = e.target.dataset.model;
  const brand = e.target.dataset.brand;
  const id = `${brand} ${model}`.trim();
  const input = container.querySelector(`.alert-input[data-model="${model}"][data-brand="${brand}"]`);
  const target = parseFloat(input.value);
  if (!target || target <= 0) { alert('Enter a valid target price'); return; }
  e.target.textContent = 'Saving...';
  clearTimeout(alertTimers[id]);
  alertTimers[id] = setTimeout(() => {
    let map = {};
    const raw = StorageUtil.safeGet('alerts', '{}');
    try { map = JSON.parse(raw) || {}; } catch { map = {}; }
    map[id] = { alertRM: target, savedAt: new Date().toISOString() };
    StorageUtil.safeSet('alerts', JSON.stringify(map));
    e.target.textContent = '✓ Saved';
    setTimeout(() => { e.target.textContent = 'Save'; }, 1200);
  }, 300);
});
'@
$content = [regex]::Replace($content, $pattern6, $replacement6, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Set-Content -Encoding UTF8 $Path $content
Write-Output "Patched Appendices v2 (fallback links + alert map + debounce). Backup: $backup"

param([string]$Path)

$backup = "$Path.bak_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item $Path $backup

$content = Get-Content -Raw $Path

# 1) existingAlert: switch to alertsMap keyed by brand+model and insert fallback href builders
$pattern1 = 'const existingAlert\s*=\s*alerts\.find\(a\s*=>\s*a\.model\s*===\s*l\.model\);\s*'
$replacement1 = @'
const alertId = (l.brand + ' ' + l.model).trim();
const existingAlert = alertsMap[alertId];
const q = (window.Marketplaces && window.Marketplaces.modelString) ? window.Marketplaces.modelString(l) : (l.brand + ' ' + l.model);
const shopeeHref = (window.Marketplaces && l.shopee_url && window.Marketplaces.isValidUrl(l.shopee_url)) ? l.shopee_url : (window.Marketplaces ? window.Marketplaces.shopeeSearch(q) : '#');
const priceHref  = (window.Marketplaces && l.price_source_url && window.Marketplaces.isValidUrl(l.price_source_url)) ? l.price_source_url : (window.Marketplaces ? window.Marketplaces.lazadaSearch(q) : '#');
const tiktokHref = (window.Marketplaces && l.tiktok_url && window.Marketplaces.isValidUrl(l.tiktok_url)) ? l.tiktok_url : (window.Marketplaces ? window.Marketplaces.tiktokSearch(q) : '#');

'@
$content = [regex]::Replace($content, $pattern1, $replacement1)

# 2) Replace buy block with versions using computed hrefs
$pattern2 = "(?s)const buy\s*=\s*\[.*?\]\.filter\(Boolean\)\.join\(' • '\);"
$replacement2 = @'
const buy = [
  `<a class="underline hover:text-[var(--c-accent-cyan)]" target="_blank" href="${priceHref}">🔗 Price Source</a>`,
  `<a class="underline hover:text-[var(--c-accent-cyan)]" target="_blank" href="${shopeeHref}">🛒 Shopee</a>`,
  `<a class="underline hover:text-[var(--c-accent-cyan)]" target="_blank" href="${tiktokHref}">📱 TikTok</a>`
].join(' • ');
'@
$content = [regex]::Replace($content, $pattern2, $replacement2, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# 3) Add data-brand to alert input and adjust value to read alertRM
$content = [regex]::Replace($content, '(<input[^\n]*class="[^"]*alert-input[^"]*"[^\n]*data-model="\$\{l\.model\}")', '$1 data-brand="${l.brand}"')
$content = $content -replace 'value="\$\{existingAlert\?\.target \|\| ''\}"', 'value="${existingAlert?.alertRM || ''}"'

# 4) Make alert Save button type=button and carry data-brand
$content = [regex]::Replace($content, '(<button\s+)(class="alert-save")', '$1type="button" $2')
$content = $content -replace 'data-model="\$\{l\.model\}">Save', 'data-model="${l.model}" data-brand="${l.brand}">Save'

# 5) Insert alertTimers declaration in handler
$content = [regex]::Replace($content, 'if \(!container\) return;\s*', "if (!container) return;`r`n`r`n  const alertTimers = {};`r`n")

# 6) Replace the price alert click handler with debounced map writer
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
Write-Output "Patched Appendices (fallback links + alert map + debounce). Backup: $backup"

const TOKENS_URL = '/ai_pod/tokens/laptops.tokens.json';
const DEFAULT_TTL_HOURS = 72;
const REGION_PRIORITY = ['MY','SG','ID','TH','PH','VN','US','UK','EU'];

import normalizeLaptop from '../../ai_pod/data/normalizeLaptop.js';

const etagCache = new Map();
const controllers = new Map();
const noop = (_e) => void 0;
let tokens = null;
let top35Cache = null;
let top35Meta = { generated_at: null, source: 'unknown' };

function nowISO() { return new Date().toISOString(); }
function pickRegionWeight(code) { const i = REGION_PRIORITY.indexOf(String(code || '').toUpperCase()); return i === -1 ? 999 : i; }
function isHttpUrl(u) { try { const x = new URL(u, 'http://x'); return /^https?:/i.test(x.protocol) || /^https?:/i.test(String(u)); } catch { return false; } }

async function readTokens() {
  if (tokens) return tokens;
  let r; try { r = await fetch(TOKENS_URL, { cache: 'no-store' }); } catch (e) { noop(e); r = { ok: false }; }
  tokens = r.ok ? await r.json() : { fallback_path: '/data/fallbackLaptops.json', top35_cache: '/ai_pod/data/laptops/top35.cache.json', front_end_limit: 35, ttl_hours: DEFAULT_TTL_HOURS };
  return tokens;
}

async function fetchJson(url, { signal } = {}) {
  const key = url;
  const headers = {};
  const tag = etagCache.get(key);
  if (tag) headers['If-None-Match'] = tag;
  const res = await fetch(url, { cache: 'no-store', headers, signal });
  if (res.status === 304 && tag) {
    // Re-use caller-level cache; the caller should short-circuit if needed
    return { ok: true, notModified: true, json: async () => null, etag: tag };
  }
  const et = res.headers?.get?.('ETag'); if (et) etagCache.set(key, et);
  const data = res.ok ? await res.json() : null;
  return { ok: res.ok, json: async () => data, etag: et };
}

function ctrlFor(key) { const prev = controllers.get(key); if (prev) try { prev.abort(); } catch (e) { noop(e); } const c = new AbortController(); controllers.set(key, c); return c; }
function debounce(fn, ms = 180) { let t; return (...args) => { clearTimeout(t); return new Promise(r => { t = setTimeout(() => r(fn(...args)), Math.max(150, ms)); }); }; }

function normalizeFromFallback(entry) {
  if (!entry) return null;
  const raw = entry.raw || entry;
  const base = normalizeLaptop(raw) || normalizeLaptop(entry);
  if (!base) return null;

  const platformOverride = (() => {
    if (raw?.platform || entry?.platform) return String(raw.platform || entry.platform).toUpperCase();
    const gpu = String(raw?.gpu || entry?.gpu || '').toLowerCase();
    return gpu.includes('rtx') ? 'CUDA' : base.platform || 'NPU';
  })();

  const bestUrl = entry.buy?.url && isHttpUrl(entry.buy.url) ? entry.buy.url : base.best_deal_url;
  const region = String(entry.region || raw.region || 'MY').toUpperCase();
  const updatedAt = entry.updated_at || raw.updated_at || nowISO();
  const uid = entry.uid || `${base.brand}|${base.model}|${region.toLowerCase()}`;

  return {
    ...base,
    platform: platformOverride,
    best_deal_url: bestUrl,
    updated_at: updatedAt,
    region,
    uid
  };
}

async function loadTop35Internal() {
  const t = await readTokens();
  const url = t.top35_cache || '/ai_pod/data/laptops/top35.cache.json';
  const c = ctrlFor('top35');
  let res;
  try { res = await fetchJson(url, { signal: c.signal }); } catch (e) { noop(e); res = null; }
  let items = [];
  if (res?.ok && !res.notModified) {
    const data = await res.json();
    const arr = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    items = arr.map(normalizeFromFallback).filter(Boolean);
    top35Meta.generated_at = data?.generated_at || nowISO();
    top35Meta.source = 'top35.cache';
  }
  if (!items.length) {
    // Fallback to raw fallbackLaptops.json
    const fallbackUrl = t.fallback_path || '/data/fallbackLaptops.json';
    let res2; try { res2 = await fetchJson(fallbackUrl, { signal: c.signal }); } catch (e) { noop(e); }
    const data2 = res2?.ok ? await res2.json() : null;
    const arr2 = Array.isArray(data2) ? data2 : (Array.isArray(data2?.items) ? data2.items : []);
    items = arr2.map(normalizeFromFallback).filter(Boolean);
    top35Meta.generated_at = data2?.generated_at || nowISO();
    top35Meta.source = 'fallback.json';
  }
  // Region priority, dedupe by uid, newest wins
  const map = new Map();
  for (const it of items) {
    const k = (it.uid || `${it.brand}|${it.model}`).toLowerCase();
    const prev = map.get(k);
    if (!prev) { map.set(k, it); continue; }
    const prevW = pickRegionWeight(prev.region), curW = pickRegionWeight(it.region);
    if (curW < prevW) map.set(k, it); else if (curW === prevW) {
      if (new Date(it.updated_at) > new Date(prev.updated_at)) map.set(k, it);
    }
  }
  const limit = Number(tokens?.front_end_limit || 35) || 35;
  top35Cache = Array.from(map.values()).slice(0, limit);
  return top35Cache;
}

export async function getTop35() {
  if (top35Cache && Array.isArray(top35Cache)) return top35Cache;
  const items = await loadTop35Internal();
  try { (typeof globalThis !== 'undefined' && globalThis.aiPodTelemetry)?.emit?.('laptops.top35.served', { counts: { items: items.length }, ts: nowISO() }); } catch (e) { noop(e); }
  return items;
}

export async function refreshIfStale() {
  const t = await readTokens();
  const ttl = Number(t.ttl_hours || DEFAULT_TTL_HOURS) || DEFAULT_TTL_HOURS;
  const gen = new Date(top35Meta.generated_at || 0).getTime();
  const stale = !gen || (Date.now() - gen) > ttl * 3600 * 1000;
  if (stale) {
    try { (typeof globalThis !== 'undefined' && globalThis.aiPodTelemetry)?.emit?.('laptops.top35.stale', { ts: nowISO() }); } catch (e) { noop(e); }
    top35Cache = null;
    await getTop35();
  }
  return { stale };
}

export const searchExpanded = debounce(async function(predicate){
  const t = await readTokens();
  const c = ctrlFor('expanded');
  const url = '/ai_pod/data/laptops/fallback.laptops.json';
  let res; try { res = await fetchJson(url, { signal: c.signal }); } catch (e) { noop(e); }
  let data = [];
  if (res?.ok) {
    const arr = await res.json();
    const items = Array.isArray(arr) ? arr : (Array.isArray(arr?.items) ? arr.items : []);
    data = items.map(normalizeFromFallback).filter(Boolean);
  }
  if (!data.length) {
    // Fallback to tokens fallback_path
    const res2 = await fetchJson(t.fallback_path || '/data/fallbackLaptops.json', { signal: c.signal });
    const arr2 = res2?.ok ? await res2.json() : [];
    const items2 = Array.isArray(arr2) ? arr2 : (Array.isArray(arr2?.items) ? arr2.items : []);
    data = items2.map(normalizeFromFallback).filter(Boolean);
  }
  const cap = 500; // per batch
  const filtered = typeof predicate === 'function' ? data.filter(predicate).slice(0, cap) : data.slice(0, cap);
  try { (typeof globalThis !== 'undefined' && globalThis.aiPodTelemetry)?.emit?.('laptops.search.expanded', { counts: { items: filtered.length }, ts: nowISO() }); } catch (e) { noop(e); }
  return filtered;
}, 200);

export async function queryLaptops({ text } = {}) {
  const base = await getTop35();
  const rx = text ? new RegExp(String(text).replace(/[-/\\^$*+?.()|[\]{}]/g, '.'), 'i') : null;
  const expanded = await searchExpanded(rx ? (x) => rx.test(`${x.brand} ${x.model} ${x.cpu} ${x.gpu}`) : () => true);
  const byId = new Map();
  const put = (x) => { if (!x) return; const k = String(x.uid || `${x.brand}|${x.model}`).toLowerCase(); const prev = byId.get(k); if (!prev || new Date(x.updated_at) > new Date(prev.updated_at)) byId.set(k, x); };
  base.forEach(put); expanded.forEach(put);
  const arr = Array.from(byId.values());
  try { (typeof globalThis !== 'undefined' && globalThis.aiPodTelemetry)?.emit?.('laptops.query.completed', { counts: { items: arr.length }, ts: nowISO() }); } catch (e) { noop(e); }
  return arr;
}

export async function getExplorerTop10(criteria) {
  const key = String(criteria || 'gaming').toLowerCase();
  const url = `/ai_pod/data/laptops/explorer.top10.${key}.json`;
  let res; try { res = await fetchJson(url); } catch (e) { noop(e); }
  if (res?.ok) {
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    return items.map(normalizeFromFallback).filter(Boolean).slice(0, 10);
  }
  const set = await getTop35();
  // Simple heuristic fallback: filter by segments if available
  const scores = { gaming: 'Gaming', creator: 'Creator', portable: 'Portable', business: 'Business', student: 'Student', ai_feature: 'AI Feature' };
  const seg = scores[key] || null;
  const filtered = seg ? set.filter(x => Array.isArray(x.segments) && x.segments.includes(seg)) : set;
  return filtered.slice(0, 10);
}

// Initialize LAPTOP_FALLBACK for backward-compat imports
let INIT_PROMISE = null;
async function bootstrap() {
  if (INIT_PROMISE) return INIT_PROMISE;
  INIT_PROMISE = (async () => {
    await getTop35();
    return true;
  })();
  return INIT_PROMISE;
}

await bootstrap();

export const LAPTOP_FALLBACK = {
  meta: { ttlDays: Math.ceil((tokens?.ttl_hours || DEFAULT_TTL_HOURS) / 24), lastUpdated: top35Meta.generated_at || nowISO() },
  get all() { return Array.isArray(top35Cache) ? top35Cache : []; }
};

export const FALLBACK_LAPTOPS = (Array.isArray(top35Cache) ? top35Cache : []);

export default {
  LAPTOP_FALLBACK,
  FALLBACK_LAPTOPS,
  getTop35,
  refreshIfStale,
  searchExpanded,
  queryLaptops,
  getExplorerTop10
};

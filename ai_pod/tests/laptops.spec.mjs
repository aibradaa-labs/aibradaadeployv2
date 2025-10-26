import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const projectRoot = path.resolve(__dirname, '..', '..');
const resolveProjectPath = (...segments) => path.resolve(projectRoot, ...segments);

const START = Date.now();
let fetchCalls = 0;

const mockFetch = async (input, init = {}) => {
  fetchCalls += 1;
  const urlStr = typeof input === 'string' ? input : input?.toString?.() || '';
  const makeResponse = (body, ok = true, status = 200, extraHeaders = {}) => ({
    ok,
    status,
    headers: {
      get(key) {
        return extraHeaders[key.toLowerCase()] ?? extraHeaders[key] ?? null;
      }
    },
    async json() {
      return body;
    }
  });

  // Normalize relative paths used by fallbackLaptops module
  const normalized = urlStr.replace(/^\//, '');
  let filePath;
  if (normalized.startsWith('ai_pod/')) {
    filePath = resolveProjectPath(normalized);
  } else if (normalized.startsWith('data/')) {
    filePath = resolveProjectPath(normalized);
  } else if (normalized.includes('/ai_pod/')) {
    const idx = normalized.indexOf('ai_pod/');
    filePath = resolveProjectPath(normalized.slice(idx));
  } else if (normalized.includes('/data/')) {
    const idx = normalized.indexOf('data/');
    filePath = resolveProjectPath(normalized.slice(idx));
  }

  try {
    if (filePath) {
      const raw = await readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      const etag = `"mock-${path.basename(filePath)}-${raw.length}"`;
      if (init?.headers?.['If-None-Match'] === etag) {
        return makeResponse(null, true, 304, { ETag: etag });
      }
      return makeResponse(data, true, 200, { ETag: etag });
    }
  } catch (err) {
    return makeResponse({ error: err.message }, false, 500);
  }

  return makeResponse({ error: `Unhandled fetch ${urlStr}` }, false, 404);
};

const originalFetch = globalThis.fetch;
const originalTelemetry = globalThis.aiPodTelemetry;

const telemetryEvents = [];
const telemetry = {
  emit(event, payload) {
    telemetryEvents.push({ event, payload });
  }
};

try {
  globalThis.fetch = mockFetch;
  globalThis.aiPodTelemetry = telemetry;

  const mod = await import('../../src/data/fallbackLaptops.js');
  const { getTop35, queryLaptops, getExplorerTop10, refreshIfStale } = mod;

  const top35 = await getTop35();
  assert.ok(Array.isArray(top35), 'getTop35 should return an array');
  assert.ok(top35.length >= 15 && top35.length <= 35, `Top35 length out of bounds (${top35.length})`);
  for (const item of top35) {
    assert.ok(item.brand && item.model, 'item must have brand and model');
    assert.ok(Number.isFinite(item.price) && item.price > 0, 'price should be positive number');
    const anyLink = item.price_source_url || item.shopee_url || item.lazada_url || item.tiktok_url || item.best_deal_url;
    assert.ok(anyLink, 'item must have at least one outbound link');
  }

  const { stale } = await refreshIfStale();
  assert.equal(typeof stale, 'boolean', 'refreshIfStale should return stale boolean');

  const oledResults = await queryLaptops({ text: 'OLED' });
  assert.ok(Array.isArray(oledResults), 'queryLaptops should return an array');
  const seen = new Set();
  for (const item of oledResults) {
    const key = `${item.brand}|${item.model}`.toLowerCase();
    assert.ok(!seen.has(key), `queryLaptops should dedupe duplicates (${key})`);
    seen.add(key);
  }

  const gamingTop = await getExplorerTop10('gaming');
  assert.ok(Array.isArray(gamingTop) && gamingTop.length > 0 && gamingTop.length <= 10, 'getExplorerTop10 should return podium set');

  assert.ok(telemetryEvents.some(evt => evt.event === 'laptops.top35.served'), 'telemetry should emit top35 served');

  console.log(JSON.stringify({
    ok: true,
    durationMs: Date.now() - START,
    fetchCalls,
    telemetryEvents
  }, null, 2));

} finally {
  globalThis.fetch = originalFetch;
  globalThis.aiPodTelemetry = originalTelemetry;
}


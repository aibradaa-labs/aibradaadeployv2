# homepage-wiring (20251025-025203)
counts: {"files_scanned":231,"homepage_files":12,"adapter_users":12,"adapter_missing":0,"data_consumers":16,"prototype_refs":0}

## HOMEPAGE FILES
- ai_pod/mobile/bridge/index.js
- app/homepage-wiring.ts
- app/index.v15.2.html
- dist/ai_pod/mobile/bridge/index.js
- dist/app/index.v15.2.html
- dist/index.html
- public/index.html
- scripts/analyze/homepage-wiring.mjs
- scripts/homepage_repair.mjs
- scripts/refactor/fix-homepage-adapter.mjs
- src/lib/ai/index.js
- tests/e2e/playwright/homepage.smoke.spec.ts

## ADAPTER USERS
- ai_pod/mobile/bridge/index.js
- app/homepage-wiring.ts
- app/index.v15.2.html
- dist/ai_pod/mobile/bridge/index.js
- dist/app/index.v15.2.html
- dist/index.html
- public/index.html
- scripts/analyze/homepage-wiring.mjs
- scripts/homepage_repair.mjs
- scripts/refactor/fix-homepage-adapter.mjs
- src/lib/ai/index.js
- tests/e2e/playwright/homepage.smoke.spec.ts

## ADAPTER MISSING (needs `import * as hw from "app/homepage-wiring"`)
_none_

## DATA CONSUMERS (laptops/fallback/schema/normalizeLaptop)
- ai_pod/data/normalizeLaptop.js
    @30: export function normalizeLaptop(entry, options = {}) {
    @100: export default normalizeLaptop;
    @104:   globalThis.AI_POD.normalizeLaptop = normalizeLaptop;
    @106:   globalThis.AI_POD_DATA.normalizeLaptop = normalizeLaptop;
- ai_pod/lib/normalizeLaptop.js
    @34: export function normalizeLaptop(raw = {}) {
    @59:     upstream_schema_ref: raw.upstream_schema_ref ?? "data/laptops.schema.json",
    @70:   return arr.map(normalizeLaptop);
    @73: export default normalizeLaptop;
- ai_pod/lib/normalizeLaptop.mjs
    @34: export function normalizeLaptop(raw = {}) {
    @59:     upstream_schema_ref: raw.upstream_schema_ref ?? "data/laptops.schema.json",
    @70:   return arr.map(normalizeLaptop);
    @73: export default normalizeLaptop;
- app/homepage-wiring.ts
    @3: export { normalizeLaptop, normalizeMany } from "../ai_pod/lib/normalizeLaptop.js";
    @4: export * from "../ai_pod/lib/normalizeLaptop.js";
- app/index.v15.2.html
    @1483:     normalizeLaptop(item) {
    @1484:         const shared = window.AI_POD?.normalizeLaptop;
    @1710:             fetchJson('/data/laptops.json', 'laptops.json'),
    @1711:             fetchJson('/data/fallbackLaptops.json', 'fallbackLaptops.json'),
    @1712:             fetchJson('/data/laptops.schema.json', 'laptops.schema.json')
    @1719:             .map(item => API_MODULE.normalizeLaptop(item) ?? null)
- dist/index.html
    @1491:     normalizeLaptop(item) {
    @1781:             fetchJson('/data/laptops.json', 'laptops.json'),
    @1782:             fetchJson('/data/fallbackLaptops.json', 'fallbackLaptops.json'),
    @1783:             fetchJson('/data/laptops.schema.json', 'laptops.schema.json')
    @1789:         const normalizeList = (list) => (Array.isArray(list) ? list : []).map(API_MODULE.normalizeLaptop).filter(Boolean);
- pwa/service-worker.js
    @6:   '/data/laptops.json',
- scripts/analyze/homepage-wiring.mjs
    @13: const LAPTOP_HINTS = [/data\/laptops\.json\b/, /data\/fallbackLaptops\.json\b/, /laptops\.schema\.json\b/, /normalizeLaptop\b/];
    @99: ## DATA CONSUMERS (laptops/fallback/schema/normalizeLaptop)
- scripts/local/analyze-step-0.mjs
    @23:         if(/data\/laptops\.json|data\/fallbackLaptops\.json|data\/laptops\.schema\.json|normalizeLaptop/.test(txt)){
    @25:           lines.forEach((ln,i)=>{ if(ln.includes("laptops.json")||ln.includes("fallbackLaptops.json")||ln.includes("laptops.schema.json")||ln.includes("normalizeLaptop")) hits.push({file:rel(p),line:i+1,snippet:ln.trim().slice(0,160)}); });
    @25:           lines.forEach((ln,i)=>{ if(ln.includes("laptops.json")||ln.includes("fallbackLaptops.json")||ln.includes("laptops.schema.json")||ln.includes("normalizeLaptop")) hits.push({file:rel(p),line:i+1,snippet:ln.trim().slice(0,160)}); });
    @82:   const sp = await findFile([path.join(ROOT,"data","laptops.schema.json")]);
    @83:   const np = await findFile([path.join(ROOT,"ai_pod","lib","normalizeLaptop.js"), path.join(ROOT,"ai_pod","data","normalizeLaptop.js"), path.join(ROOT,"ai_pod","normalizeLaptop.js")]);
- scripts/local/analyze-step-1.mjs
    @58:       if (!/fetchMarketIntel|normalizeLaptop|laptops\.json/.test(txt)) homeGaps.push(rel(file));
- scripts/local/enrich-datasets.mjs
    @17:   e.upstream_schema_ref ||= "data/laptops.schema.json";
- scripts/local/extend-schema.mjs
    @7: const SCHEMA = path.join(ROOT, "data", "laptops.schema.json");
    @14:   if (!fs.existsSync(SCHEMA)) throw new Error("data/laptops.schema.json not found");
    @17:   await fsp.writeFile(path.join(BAKDIR, "laptops.schema.json.bak"), raw, "utf8");
- scripts/merge/merge-laptops.mjs
    @7: try { _mod = await import('../../ai_pod/lib/normalizeLaptop.mjs'); }
    @8: catch(e){ _mod = await import('../../ai_pod/lib/normalizeLaptop.js'); }
- scripts/refactor/apply-plan.mjs
    @28:   const src = `// homepage adapter — central import surface\nexport { normalizeLaptop, normalizeMany } from "../ai_pod/lib/normalizeLaptop.js";\nexport * from "../ai_pod/lib/normalizeLaptop.js";\n`;
- src/data/fallbackLaptops.js
    @5: import normalizeLaptop from '../../ai_pod/data/normalizeLaptop.js';
    @21:   tokens = r.ok ? await r.json() : { fallback_path: '/data/fallbackLaptops.json', top35_cache: '/ai_pod/data/laptops/top35.cache.json', front_end_limit: 35, ttl_hours: DEFAULT_TTL_HOURS };
    @46:   const base = normalizeLaptop(raw) || normalizeLaptop(entry);
    @86:     const fallbackUrl = t.fallback_path || '/data/fallbackLaptops.json';
    @143:     const res2 = await fetchJson(t.fallback_path || '/data/fallbackLaptops.json', { signal: c.signal });
- src/scripts/api.js
    @3: import { normalizeLaptop } from '../../ai_pod/data/normalizeLaptop.js';
    @18:     .map(entry => normalizeLaptop(entry, { defaultImage: DEFAULT_IMG }))
    @41:     fetchJson('/data/laptops.json', 'laptops.json'),
    @42:     fetchJson('/data/fallbackLaptops.json', 'fallbackLaptops.json'),
    @43:     fetchJson('/data/laptops.schema.json', 'laptops.schema.json')

## PROD↔PROTOTYPE REFERENCES (must be blocked from prod)
_none_

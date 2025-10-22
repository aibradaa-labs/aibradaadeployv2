#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LEGACY_PATTERNS = [/\/lib\/ui\//, /\\lib\\ui\\/, /\/lib\/ai\//, /\\lib\\ai\\/];
const IGNORES = [/\.md$/i, /index\.html\./i]; // ignore docs and backup HTML snapshots
let bad = 0;

function walk(dir){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})){
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else {
      if (IGNORES.some(rx => rx.test(e.name))) continue;
      const s = fs.readFileSync(p,'utf8');
      for (const rx of LEGACY_PATTERNS){
        if (rx.test(s)) { console.error('[link_check] legacy path in', p); bad++; break; }
      }
    }
  }
}

walk(ROOT);

// Quick manifest and SW checks in root or app index
function firstExisting(paths){ for(const p of paths){ if (fs.existsSync(p)) return p; } return null; }
try {
  const candidate = firstExisting(['index.html','app/index.html']);
  if (candidate) {
    const html = fs.readFileSync(candidate,'utf8');
    if (!/href\s*=\s*"\/pwa\/manifest\.json"/.test(html)) { console.error('[link_check] manifest link not pointing to /pwa/manifest.json in', candidate); bad++; }
    if (!/serviceWorker\.register\('\/pwa\/service-worker\.js'\)/.test(html)) { console.warn('[link_check] SW registration does not prefer /pwa/service-worker.js in', candidate); }
  }
} catch {}

if (bad){ console.error(`[link_check] FAIL (${bad} issues)`); process.exit(1); }
console.log('[link_check] OK');

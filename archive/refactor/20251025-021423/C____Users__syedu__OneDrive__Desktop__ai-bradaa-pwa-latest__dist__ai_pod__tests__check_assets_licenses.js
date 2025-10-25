#!/usr/bin/env node
/*
 Brand asset license check
 - Scans repo for branded/static assets (images, media, fonts)
 - Looks for nearby LICENSE/ATTRIBUTION/CREDITS files or central mapping in /ai_pod/docs/asset_licenses.json
 - Emits a JSON summary with counts and missing attributions.
 - Exit code: 0 (default, non-blocking), unless BRAND_CHECK_STRICT=1 to fail on missing.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const START = Date.now();
const EXT_WHITELIST = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif', '.mp4', '.webm', '.woff', '.woff2', '.ttf', '.otf']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.cache']);
const SOFT_SKIP_DIRS = new Set(['archive']);

function isBinaryExt(ext) { return EXT_WHITELIST.has(ext.toLowerCase()); }
function listDir(dir) {
  let out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const name = path.basename(cur);
    if (SKIP_DIRS.has(name)) continue;
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (SOFT_SKIP_DIRS.has(e.name)) continue;
        stack.push(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function loadMapping() {
  const mapPath = path.join(ROOT, 'ai_pod', 'docs', 'asset_licenses.json');
  try { return JSON.parse(fs.readFileSync(mapPath, 'utf8')); } catch { return { entries: [] }; }
}

function findNearbyLicense(filePath) {
  const dir = path.dirname(filePath);
  const candidates = [
    'LICENSE', 'LICENSE.txt', 'LICENSE.md',
    'ATTRIBUTION', 'ATTRIBUTION.txt', 'ATTRIBUTION.md',
    'CREDITS', 'CREDITS.txt', 'CREDITS.md',
    'README', 'README.md'
  ];
  for (const name of candidates) {
    const full = path.join(dir, name);
    try { if (fs.existsSync(full)) return full; } catch {}
  }
  return null;
}

function main() {
  const files = listDir(ROOT).filter(f => isBinaryExt(path.extname(f)));
  const mapping = loadMapping();
  const mapEntries = Array.isArray(mapping?.entries) ? mapping.entries : [];
  const mapByPath = new Map(mapEntries.map(e => [path.normalize(e.path || ''), e]));

  const results = [];
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const ext = path.extname(rel).toLowerCase();
    // Only check assets under app/ and public-like trees
    if (!rel.startsWith('app') && !rel.startsWith('public') && !rel.startsWith('assets')) continue;
    const nearby = findNearbyLicense(f);
    const mapped = mapByPath.get(rel.replace(/\\/g, '/')) || null;
    const ok = !!nearby || !!mapped;
    results.push({ path: rel, ext, license: nearby || (mapped ? mapped.license : null), source: mapped?.source || null, ok });
  }

  const missing = results.filter(r => !r.ok);
  const summary = {
    ok: missing.length === 0,
    counts: { scanned: results.length, missing: missing.length },
    durationMs: Date.now() - START,
    missing
  };

  const strict = process.env.BRAND_CHECK_STRICT === '1';
  const payload = JSON.stringify(summary, null, 2);
  try {
    console.log(payload);
  } catch {}

  process.exit(strict && missing.length ? 1 : 0);
}

main();

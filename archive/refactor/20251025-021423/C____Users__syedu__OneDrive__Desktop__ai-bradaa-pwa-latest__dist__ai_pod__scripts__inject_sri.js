#!/usr/bin/env node
/*
 Inject SRI attributes into HTML files based on a manifest.
 Usage:
   node ai_pod/scripts/inject_sri.js [--manifest ai_pod/docs/sri-manifest.example.json] [--out-suffix .sri] app/index.v15.2.html [other.html ...]
 Notes:
   - Non-destructive: writes alongside originals when --out-suffix provided (recommended for dev).
   - Exact URL match only. Does not fetch or compute hashes. Keeps existing integrity if present.
*/
const fs = require('fs');
const path = require('path');

function parseArgs(argv){
  const args = { files: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--manifest') { args.manifest = argv[++i]; }
    else if (a === '--out-suffix') { args.outSuffix = argv[++i]; }
    else { args.files.push(a); }
  }
  if (!args.manifest) args.manifest = path.join(process.cwd(), 'ai_pod', 'docs', 'sri-manifest.json');
  if (!fs.existsSync(args.manifest)) args.manifest = path.join(process.cwd(), 'ai_pod', 'docs', 'sri-manifest.example.json');
  if (args.files.length === 0) args.files = [path.join(process.cwd(), 'app', 'index.v15.2.html')];
  return args;
}

function loadManifest(p){
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return { entries: [] }; }
}

function inject(html, entries){
  let out = html;
  for (const e of entries) {
    const url = String(e.url || '').trim();
    const integrity = String(e.integrity || '').trim();
    const crossorigin = String(e.crossorigin || 'anonymous').trim();
    if (!url || !integrity) continue;
    // <script src="URL" ...>
    const scriptRe = new RegExp(
      String.raw`(<script[^>]*\ssrc=["\']${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["\'][^>]*)(>)`,
      'gi'
    );
    out = out.replace(scriptRe, (m, p1, p2) => {
      if (/\sintegrity\s*=/.test(p1)) return m; // already has integrity
      return `${p1} integrity="${integrity}" crossorigin="${crossorigin}"${p2}`;
    });
    // <link ... href="URL" ...>
    const linkRe = new RegExp(
      String.raw`(<link[^>]*\shref=["\']${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["\'][^>]*)(>)`,
      'gi'
    );
    out = out.replace(linkRe, (m, p1, p2) => {
      if (/\sintegrity\s*=/.test(p1)) return m;
      return `${p1} integrity="${integrity}" crossorigin="${crossorigin}"${p2}`;
    });
  }
  return out;
}

function main(){
  const args = parseArgs(process.argv);
  const manifest = loadManifest(args.manifest);
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
  if (!entries.length) {
    console.warn('[SRI] No entries in manifest; nothing to inject.');
  }
  for (const file of args.files) {
    try {
      const src = fs.readFileSync(file, 'utf8');
      const out = inject(src, entries);
      const dest = args.outSuffix ? file + args.outSuffix : file;
      if (args.outSuffix && fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.writeFileSync(dest, out, 'utf8');
      console.log(`[SRI] Injected: ${path.relative(process.cwd(), dest)}`);
    } catch (e) {
      console.error(`[SRI] Failed for ${file}:`, e.message);
      process.exitCode = 1;
    }
  }
}

if (require.main === module) main();

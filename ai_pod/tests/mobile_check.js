#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
function exists(p){ return fs.existsSync(p); }
function req(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }
const root = process.cwd();
const files = [
  'ai_pod/mobile/bridge/index.js',
  'ai_pod/mobile/bridge/deepLinkRouter.js',
  'ai_pod/mobile/bridge/offlineQueue.js',
  'ai_pod/mobile/security/secureStorage.js',
  'ai_pod/mobile/deeplinks/ios/apple-app-site-association',
  'ai_pod/mobile/deeplinks/android/assetlinks.json',
  'ai_pod/clients/geminiClient.js',
  'ai_pod/data/persona_weights.json',
  'ai_pod/docs/mobile.md'
];
let ok = true; for (const f of files) { if (!exists(path.join(root, f))) { console.error('[mobile:check] Missing', f); ok = false; } }
try {
  const persona = req(path.join(root, 'ai_pod/data/persona_weights.json'));
  const sum = Object.values(persona).reduce((a,b)=>a+b,0);
  if (Math.abs(sum - 1.0) > 1e-6) { console.warn('[mobile:check] persona weights sum != 1.0 (ok for tokenization)'); }
} catch(e) { console.warn('[mobile:check] persona weights parse error', e.message); }
process.exitCode = ok ? 0 : 1;

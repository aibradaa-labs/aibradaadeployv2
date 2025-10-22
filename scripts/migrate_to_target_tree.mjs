#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const dry = process.argv.includes('--dry');
const apply = process.argv.includes('--apply');
const rollback = process.argv.includes('--rollback');

// Three representative moves for Stage-2 (no deletes)
const plan = [
  { from: 'manifest.json', to: 'pwa/manifest.json' },
  { from: 'service-worker.js', to: 'pwa/service-worker.js' },
  { from: 'lib/ai/geminiClient.js', to: 'ai/providers/geminiClient.js' }
];

const log = (...a)=>console.log('[migrate]',...a);

async function ensureDir(p){ await fs.mkdir(path.dirname(p), { recursive: true }); }

if (dry || (!apply && !rollback)){
  log('dry-run plan:'); plan.forEach(m => log('  would move', m.from, '→', m.to));
  process.exit(0);
}

if (apply){
  for (const m of plan){ await ensureDir(m.to); await fs.copyFile(m.from, m.to); log('moved', m.from, '→', m.to); }
  log('apply done'); process.exit(0);
}

if (rollback){
  for (const m of plan){ try { await fs.rm(m.to, { force:true }); log('removed', m.to); } catch {}
  }
  log('rollback done'); process.exit(0);
}

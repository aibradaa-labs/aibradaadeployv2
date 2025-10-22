#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const files = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n');
const rx = /(api[_-]?key|secret|token)\s*[:=]\s*([A-Za-z0-9_\-]{12,})/i;
let bad = 0;
for (const f of files){
  if (f.endsWith('.env.example')) continue;
  try {
    const s = fs.readFileSync(f, 'utf8');
    if (rx.test(s)) { console.error('[secrets_scan] secret-like pattern in', f); bad++; }
  } catch {}
}
process.exit(bad ? 1 : 0);

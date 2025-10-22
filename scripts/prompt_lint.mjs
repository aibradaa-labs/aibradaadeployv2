#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || 'tests/fixtures/deck_sample.md';
if (!fs.existsSync(file)) { console.error('[prompt_lint] file not found:', file); process.exit(1); }
const md = fs.readFileSync(file, 'utf8');
const need = ['### TL;DR','### Recommendation','### Why','### Next Steps','### Alternatives','### Risks'];
const miss = need.filter(h=>!md.includes(h));
if (miss.length){ console.error('[prompt_lint] missing headings:', miss.join(', ')); process.exit(1); }
// Alternatives ≤2 check
const altBlock = md.split(/\n### Alternatives\n/m)[1] || '';
const altCount = (altBlock.match(/^- /mg)||[]).length;
if (altCount > 2){ console.error('[prompt_lint] Alternatives has >2 items:', altCount); process.exit(1); }
console.log('[prompt_lint] OK');
process.exit(0);

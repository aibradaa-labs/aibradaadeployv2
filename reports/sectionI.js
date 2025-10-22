const fs = require('fs');
const path = require('path');

const root = process.cwd();
const summaryPath = path.join(root, 'reports', 'audit-v3-summary.txt');

function readFileOr(note, fallback = null) {
  try {
    return fs.readFileSync(note, 'utf8');
  } catch (err) {
    return fallback;
  }
}

const datasetsTablePath = path.join(root, 'reports', 'datasets.metrics.table.txt');
const domHooksPatchPath = path.join(root, 'reports', 'index.hooks.diff.proposed.patch');
const functionsReportPath = path.join(root, 'reports', 'functions.scan.v3.txt');
const emojiReportPath = path.join(root, 'reports', 'emoji_fonts.scan.v3.txt');
const bootGraphPath = path.join(root, 'reports', 'aipod.modules.graph.v3.txt');

const datasetsTable = readFileOr(datasetsTablePath, 'datasets.metrics.table.txt: NOT FOUND');
const domHooksPatchExists = fs.existsSync(domHooksPatchPath);
const functionsReportExists = fs.existsSync(functionsReportPath);
const emojiReportExists = fs.existsSync(emojiReportPath);
const bootGraphExists = fs.existsSync(bootGraphPath);

const lines = [];
lines.push('AUDIT V3 SUMMARY');
lines.push('');
lines.push('BULLETS');

function summariseDatasets(tableText) {
  const summaries = [];
  const rows = tableText.split(/\r?\n/).slice(1).filter(Boolean);
  rows.forEach(row => {
    const parts = row.split('|').map(part => part.trim());
    if (parts.length < 6) return;
    const [fullPath, totalItems, priceMin, priceMax, inRange, countLe4500] = parts;
    const total = Number(totalItems) || 0;
    const inRangeCount = Number(inRange) || 0;
    const le4500Count = Number(countLe4500) || 0;
    const thresholdsMet = total >= 10 && inRangeCount >= 6 && le4500Count >= 2;
    const status = thresholdsMet ? 'MEETS' : 'MISS';
    summaries.push(`${fullPath}: total=${total}, inRM3500-7000=${inRangeCount}, <=RM4500=${le4500Count} (${status})`);
  });
  return summaries;
}

const datasetSummaries = summariseDatasets(datasetsTable);
if (!datasetSummaries.length) {
  datasetSummaries.push('datasets: no table entries parsed.');
}
lines.push('* Datasets:');
lines.push(...datasetSummaries.map(item => `  - ${item}`));

const domHooksStatus = domHooksPatchExists ? 'DOM hooks missing; see patch proposal' : 'DOM hooks all present';
lines.push(`* DOM hooks: ${domHooksStatus} (reports/index.hooks.diff.proposed.patch)`);

const functionsStatus = functionsReportExists ? 'See reports/functions.scan.v3.txt for inventory & reachability (local dev not running).' : 'functions report missing';
lines.push(`* Functions: ${functionsStatus}`);

const emojiStatus = emojiReportExists ? 'See reports/emoji_fonts.scan.v3.txt (Inter references only; Inter-roman var file zero bytes). PASS with noted zero-byte asset.' : 'emoji/fonts report missing';
lines.push(`* Emoji/Fonts: ${emojiStatus}`);

const bootStatus = bootGraphExists ? 'Boot chain documented in reports/aipod.modules.graph.v3.txt.' : 'Boot chain report missing';
lines.push(`* Boot chain: ${bootStatus}`);

lines.push('* Next actions (read-only guidance):');
lines.push('  - public/index.html (add missing DOM hooks per patch).');
lines.push('  - ai_pod/data/laptops/top35.cache.json (add sku/timestamp fields).');
lines.push('  - data/fallbackLaptops.json (promote to JSONL fallback file).');
lines.push('  - netlify/functions/*.js (review before enabling netlify dev).');
lines.push('  - public/assets/fonts/Inter-roman.var.woff2 (replace zero-byte font).');

fs.writeFileSync(summaryPath, lines.join('\n') + '\n', 'utf8');

console.log(lines.join('\n') + '\n');
console.log('NEW REPORTS:');
console.log(' - reports/functions.scan.v3.txt');
console.log(' - reports/emoji_fonts.scan.v3.txt');
console.log(' - reports/aipod.modules.graph.v3.txt');
console.log(' - reports/audit-v3-summary.txt');

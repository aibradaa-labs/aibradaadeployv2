const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'public', 'index.html');
const hooks = [
  'data-explore-top10',
  'data-intel',
  'data-appendices',
  'data-soul',
  'data-explore'
];

const text = fs.readFileSync(indexPath, 'utf8');
const lines = text.split(/\r?\n/);

const results = hooks.map(hook => {
  const needle = hook;
  const foundLine = lines.findIndex(line => line.includes(needle));
  return {
    hook,
    present: foundLine !== -1,
    line: foundLine !== -1 ? foundLine + 1 : null
  };
});

const reportsDir = path.join(root, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

fs.writeFileSync(path.join(reportsDir, 'index.dom-hooks.matrix.v3.json'), JSON.stringify(results, null, 2));

const linesOut = ['Hook | Present | Line'];
for (const entry of results) {
  linesOut.push(`${entry.hook} | ${entry.present ? 'YES' : 'NO'} | ${entry.line ?? '—'}`);
}
fs.writeFileSync(path.join(reportsDir, 'index.dom-hooks.txt'), linesOut.join('\n'));

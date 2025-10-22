const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'reports', 'emoji_fonts.scan.v3.txt');

const filesToScan = [
  'public/index.html',
  'public/assets/fonts.css'
];
const patterns = [
  { label: "twemoji|emoji", regex: /(twemoji|emoji)/gi },
  { label: "\\.woff2", regex: /\.woff2/gi },
  { label: "Inter-roman", regex: /Inter-roman/gi },
  { label: "Inter", regex: /Inter/gi }
];

const lines = [];
lines.push('EMOJI/FONTS SCAN V3');
lines.push('');
lines.push('PATTERN MATCHES (simulated Select-String)');

filesToScan.forEach(relPath => {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) {
    lines.push(`${relPath}: NOT FOUND`);
    return;
  }
  const content = fs.readFileSync(absPath, 'utf8');
  const contentLines = content.split(/\r?\n/);
  patterns.forEach(({ label, regex }) => {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const before = content.slice(0, match.index);
      const lineNumber = before.split(/\r?\n/).length;
      const lineText = contentLines[lineNumber - 1] ?? '';
      lines.push(`${relPath}:${lineNumber}:${label}:${lineText.trim()}`);
      if (!regex.global) break; // avoid infinite loop if regex lacks global flag
    }
  });
});

lines.push('');
lines.push('ASSET INVENTORY (public/assets)');
const assetsDir = path.join(root, 'public', 'assets');
if (fs.existsSync(assetsDir)) {
  const stack = [assetsDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        lines.push(`${path.relative(root, fullPath).replace(/\\\\/g, '/')} | ${stat.size}`);
      }
    });
  }
} else {
  lines.push('public/assets: NOT FOUND');
}

lines.push('');
lines.push('SUMMARY: emoji/fonts scan complete (read-only). See broken/missing refs above if any.');

fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');

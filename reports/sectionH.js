const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'reports', 'aipod.modules.graph.v3.txt');

const lines = [
  'public/js/startup.js',
  ' -> public/js/ai-pod-loader.js',
  '    -> public/js/aipod/runtime-lite.js',
  '    -> public/js/aipod/tools-wire.js',
  '    -> public/js/aipod/intel-cards.js',
  '    -> public/js/aipod/provider.js'
];

const dir = path.join(root, 'public', 'js', 'aipod');
lines.push('');
lines.push('public/js/aipod directory listing (Name | Length)');
if (fs.existsSync(dir)) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile());
  if (!entries.length) {
    lines.push('No files found');
  } else {
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      const stat = fs.statSync(fullPath);
      lines.push(`${entry.name} | ${stat.size}`);
    });
  }
} else {
  lines.push('Directory not found');
}

fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');

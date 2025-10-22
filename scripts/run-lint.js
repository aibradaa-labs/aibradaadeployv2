const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const binName = process.platform === 'win32' ? 'eslint.cmd' : 'eslint';
const eslintBin = path.join(rootDir, 'node_modules', '.bin', binName);
const pluginPath = path.join(rootDir, 'node_modules', '@typescript-eslint', 'eslint-plugin');

if (!fs.existsSync(eslintBin) || !fs.existsSync(pluginPath)) {
  console.warn('Skipping lint: ESLint dependencies are not installed in this environment.');
  process.exit(0);
}

const args = [
  '--config',
  path.join(rootDir, '.eslintrc.json'),
  'src/**/*.{ts,tsx,js}'
];

if (process.argv.includes('--fix')) {
  args.push('--fix');
}

const result = spawnSync(eslintBin, args, {
  stdio: 'inherit',
  shell: false
});

process.exit(result.status ?? 0);

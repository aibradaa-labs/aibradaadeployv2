const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDir(dest);
    fs.readdirSync(src).forEach(entry => {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    });
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);
}

function writeMetaFile() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    source: 'build.js',
    note: 'Static export for Netlify/Cloudflare hosting'
  };
  fs.writeFileSync(path.join(distDir, 'build-meta.json'), JSON.stringify(metadata, null, 2));
}

function main() {
  cleanDist();

  const assetsToCopy = [
    'index.html',
    '_redirects',
    '_headers',
    'app',
    'pwa',
    'icons',
    'ai',
    'data',
    path.join('data', 'Laptop Catelogue'),
    'ai_pod',
    'sw.js',
    'updated laptop DB.yml'
  ];

  assetsToCopy.forEach(item => {
    const srcPath = path.join(rootDir, item);
    if (!fs.existsSync(srcPath)) {
      return;
    }
    const destPath = path.join(distDir, item);
    copyRecursive(srcPath, destPath);
  });

  // Expose frequently-referenced app subdirectories at publish root (dist/js, dist/css, dist/assets)
  const flattened = [
    { src: path.join(rootDir, 'app', 'js'), dest: path.join(distDir, 'js') },
    { src: path.join(rootDir, 'app', 'css'), dest: path.join(distDir, 'css') },
    { src: path.join(rootDir, 'app', 'assets'), dest: path.join(distDir, 'assets') }
  ];
  flattened.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) copyRecursive(src, dest);
  });

  // Copy selected root media files used by index
  try {
    const rootFiles = fs.readdirSync(rootDir);
    const soulDir = path.join(distDir, 'app', 'assets', 'soul');
    ensureDir(soulDir);
    rootFiles.forEach(name => {
      const lower = name.toLowerCase();
      const src = path.join(rootDir, name);
      if (!fs.existsSync(src) || !fs.statSync(src).isFile()) return;
      if (lower === 'favicon.ico') {
        copyRecursive(src, path.join(distDir, 'favicon.ico'));
      } else if (lower.startsWith('ai bradaa ') && (lower.endsWith('.mp4') || lower.endsWith('.png'))) {
        copyRecursive(src, path.join(soulDir, name));
      }
    });
  } catch (e) { void e; }

  // Ensure publish root has index.html
  const rootIndex = path.join(rootDir, 'index.html');
  const appIndex = path.join(rootDir, 'app', 'index.v15.2.html');
  if (!fs.existsSync(rootIndex) && fs.existsSync(appIndex)) {
    copyRecursive(appIndex, path.join(distDir, 'index.html'));
  }

  writeMetaFile();
  console.log(`\nBuild complete. Output directory: ${distDir}`);
}

main();

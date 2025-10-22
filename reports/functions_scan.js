const fs = require('fs');
const path = require('path');
const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const functionsDir = path.join(root, 'netlify', 'functions');
const netlifyToml = path.join(root, 'netlify.toml');
const packageJson = path.join(root, 'package.json');
const outputPath = path.join(reportsDir, 'functions.scan.v3.txt');

function formatDate(date) {
  return new Date(date).toISOString();
}

const lines = [];
lines.push('NETLIFY FUNCTIONS INVENTORY');
try {
  const entries = fs.readdirSync(functionsDir, { withFileTypes: true })
    .filter(entry => entry.isFile());
  if (!entries.length) {
    lines.push('- none found');
  } else {
    for (const entry of entries) {
      const filePath = path.join(functionsDir, entry.name);
      const stat = fs.statSync(filePath);
      lines.push(`${entry.name} | ${stat.size} bytes | mtime=${formatDate(stat.mtime)}`);
    }
  }
} catch (err) {
  lines.push(`ERROR listing netlify/functions: ${err.message}`);
}

lines.push('\nNETLIFY.TOML (FUNCTION CONFIG EXCERPT)');
try {
  const toml = fs.readFileSync(netlifyToml, 'utf8');
  lines.push(toml.trim() || '[empty netlify.toml]');
} catch (err) {
  lines.push(`ERROR reading netlify.toml: ${err.message}`);
}

lines.push('\nPACKAGE.JSON SCRIPTS (NETLIFY/DEV)');
try {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const scripts = pkg.scripts || {};
  const relevant = Object.entries(scripts)
    .filter(([key, value]) => /netlify|dev/i.test(key) || /netlify|dev/i.test(String(value)));
  if (relevant.length) {
    for (const [key, value] of relevant) {
      lines.push(`${key}: ${value}`);
    }
  } else {
    lines.push('No netlify-specific scripts in package.json');
  }
} catch (err) {
  lines.push(`ERROR reading package.json: ${err.message}`);
}

async function probe() {
  lines.push('\nLOCAL PING (http://127.0.0.1:8888/.netlify/functions/gemini)');
  const url = 'http://127.0.0.1:8888/.netlify/functions/gemini';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    lines.push(`STATUS ${response.status}`);
    const text = await response.text();
    lines.push(`BODY (first 200 chars): ${text.slice(0, 200)}`);
  } catch (err) {
    clearTimeout(timeout);
    lines.push(`ERROR: ${err.message}`);
    if (err && typeof err === 'object') {
      if ('cause' in err && err.cause) {
        lines.push(`CAUSE: ${String(err.cause)}`);
      }
      if (err.name === 'TypeError' && /fetch/.test(err.message)) {
        lines.push('NOTE: Node.js global fetch unavailable or network unreachable.');
      }
    }
  }
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
}

probe().catch(err => {
  lines.push(`FATAL: ${err.message}`);
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
});

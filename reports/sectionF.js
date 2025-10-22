const fs = require('fs');
const path = require('path');
const net = require('net');

(async () => {
  const root = process.cwd();
  const reportPath = path.join(root, 'reports', 'functions.scan.v3.txt');

  const lines = [];
  lines.push('NETLIFY FUNCTIONS INVENTORY');
  const previousErrors = [
    "ERROR (earlier attempt): Invoke-Expression: A positional parameter cannot be found that accepts argument '$null'.",
    "ERROR (earlier attempt): Set-Content: Cannot bind argument to parameter 'Path' because it is null.",
    "ERROR (earlier attempt): Add-Content: Cannot bind argument to parameter 'Path' because it is null.",
    'ERROR (earlier attempt): ParserError: Unexpected token "\"" in expression or statement.',
    "ERROR (earlier attempt): Invoke-Expression: A positional parameter cannot be found that accepts argument 'Get-Location\\'."
  ];
  previousErrors.forEach(msg => lines.push(msg));

  const functionsDir = path.join(root, 'netlify', 'functions');
  if (fs.existsSync(functionsDir)) {
    try {
      const entries = fs.readdirSync(functionsDir, { withFileTypes: true })
        .filter(entry => entry.isFile());
      if (!entries.length) {
        lines.push('netlify/functions: directory present but no files found');
      } else {
        lines.push('FullName | Length | LastWriteTime');
        entries.forEach(entry => {
          const fullPath = path.join(functionsDir, entry.name);
          const stat = fs.statSync(fullPath);
          lines.push(`${fullPath} | ${stat.size} | ${stat.mtime.toISOString()}`);
        });
      }
    } catch (err) {
      lines.push(`ERROR listing netlify/functions: ${err.message}`);
    }
  } else {
    lines.push('netlify/functions: NOT PRESENT');
  }

  lines.push('');
  lines.push('NETLIFY.TOML (first 120 lines)');
  const netlifyToml = path.join(root, 'netlify.toml');
  if (fs.existsSync(netlifyToml)) {
    try {
      const tomlLines = fs.readFileSync(netlifyToml, 'utf8').split(/\r?\n/).slice(0, 120);
      lines.push(...tomlLines);
    } catch (err) {
      lines.push(`ERROR reading netlify.toml: ${err.message}`);
    }
  } else {
    lines.push('netlify.toml: NOT FOUND');
  }

  lines.push('');
  lines.push('PACKAGE.JSON (raw)');
  const packageJson = path.join(root, 'package.json');
  if (fs.existsSync(packageJson)) {
    try {
      lines.push(fs.readFileSync(packageJson, 'utf8'));
    } catch (err) {
      lines.push(`ERROR reading package.json: ${err.message}`);
    }
  } else {
    lines.push('package.json: NOT FOUND');
  }

  lines.push('');
  lines.push('LOCAL REACHABILITY (127.0.0.1:8888)');
  const host = '127.0.0.1';
  const port = 8888;
  let conclusion = 'netlify dev not running on :8888 — skipped';

  function testPort() {
    return new Promise(resolve => {
      const socket = net.createConnection({ host, port });
      let resolved = false;
      socket.setTimeout(1000);
      socket.on('connect', () => {
        resolved = true;
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });
      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });
      socket.on('close', () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });
    });
  }

  const portOpen = await testPort();
  if (portOpen) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`http://${host}:${port}/.netlify/functions/gemini`, { signal: controller.signal });
      clearTimeout(timeout);
      lines.push(`STATUS ${response.status}`);
      const text = await response.text();
      lines.push(`BODY (first 200 chars): ${text.slice(0, 200)}`);
      conclusion = `netlify dev reachable on :8888 (status ${response.status})`;
    } catch (err) {
      lines.push(`ERROR: ${err.message}`);
      if (err && typeof err === 'object' && 'cause' in err && err.cause) {
        lines.push(`CAUSE: ${String(err.cause)}`);
      }
      conclusion = `netlify dev responded with error: ${err.message}`;
    }
  } else {
    lines.push('netlify dev not running on :8888 — skipped');
  }

  lines.push('');
  lines.push(`CONCLUSION: ${conclusion}`);

  fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
})();

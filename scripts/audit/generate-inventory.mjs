#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';

const TZ = 'Asia/Kuala_Lumpur';
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const args = new Set(process.argv.slice(2));
const CHECK_MODE = args.has('--check');

const SCAN_TARGETS = [
  'app',
  'pwa',
  'ai_pod',
  'src',
  'lib',
  'scripts',
  'tools',
  'configs',
  'data',
  'reports',
  '.github/workflows',
  '__tests__'
];

const ROOT_CONFIG_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.eslint.json',
  'tsconfig.jest.json',
  'README.md',
  'README-RUNBOOK.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'DATA_POLICY.md',
  'MIGRATION.md',
  'ROLLBACK.md',
  'LICENSE'
];

const MODULE_EXTENSIONS = ['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.json'];
const MAX_TEXT_BYTES = 256 * 1024;
const TEXT_EXTENSIONS = new Set([
  ...MODULE_EXTENSIONS,
  '.css',
  '.scss',
  '.md',
  '.yml',
  '.yaml',
  '.html',
  '.txt',
  '.svg'
]);

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  '.turbo'
]);
const EXCLUDED_PATH_PREFIXES = ['reports/audit'];
const EXCLUDED_FILES = new Set(['reports/ci/determinism-hash.txt']);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function toPosix(p) {
  return p.split(path.sep).join(path.posix.sep);
}

function normalizeStructuralContent(content) {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\.|[^"])*"|'(?:\.|[^'])*'|`(?:\.|[^`])*`/g, 'STR')
    .replace(/\d+(?:\.\d+)?/g, 'NUM')
    .replace(/[A-Za-z_][\w$]*/g, 'ID')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseImports(content) {
  const specs = new Set();
  const importRegex = /import\s+(?:[^;]*?\sfrom\s+)?["'`](.*?)["'`]/g;
  const dynamicImportRegex = /import\s*\(\s*["'`](.*?)["'`]\s*\)/g;
  const requireRegex = /require\s*\(\s*["'`](.*?)["'`]\s*\)/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    specs.add(match[1]);
  }
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    specs.add(match[1]);
  }
  while ((match = requireRegex.exec(content)) !== null) {
    specs.add(match[1]);
  }

  return Array.from(specs);
}

function resolveImport(fromFile, spec, knownFiles) {
  if (!spec) return null;
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null;

  const fromDir = path.posix.dirname(fromFile);
  const basePath = spec.startsWith('/')
    ? spec.replace(/^\/+/, '')
    : path.posix.normalize(path.posix.join(fromDir, spec));

  const attempts = [];
  const hasExt = path.posix.extname(basePath) !== '';

  if (hasExt) {
    attempts.push(basePath);
  } else {
    attempts.push(basePath);
    for (const ext of MODULE_EXTENSIONS) {
      attempts.push(`${basePath}${ext}`);
    }
    for (const ext of MODULE_EXTENSIONS) {
      attempts.push(path.posix.join(basePath, `index${ext}`));
    }
  }

  for (const attempt of attempts) {
    const normalized = attempt.replace(/^\/+/, '');
    if (knownFiles.has(normalized)) {
      return normalized;
    }
  }

  return null;
}

function getNowParts() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(({ type, value }) => [type, value]));
  const timestamp = `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`;
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
  return { timestamp, iso };
}

async function walkDirectory(target, files) {
  const fullTarget = path.join(REPO_ROOT, target);
  if (!(await fileExists(fullTarget))) {
    return;
  }

  const entries = await fs.readdir(fullTarget, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const absPath = path.join(fullTarget, entry.name);
    const relPath = toPosix(path.relative(REPO_ROOT, absPath));
    if (EXCLUDED_PATH_PREFIXES.some((prefix) => relPath.startsWith(prefix))) {
      continue;
    }
    if (entry.isDirectory()) {
      await walkDirectory(relPath, files);
    } else if (entry.isFile()) {
      if (EXCLUDED_FILES.has(relPath)) {
        continue;
      }
      const stat = await fs.stat(absPath);
      const buffer = await fs.readFile(absPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const ext = path.posix.extname(relPath);
      let textContent = null;
      let structuralHash = null;
      if (TEXT_EXTENSIONS.has(ext.toLowerCase()) && stat.size <= MAX_TEXT_BYTES) {
        textContent = buffer.toString('utf8');
        structuralHash = crypto
          .createHash('sha256')
          .update(normalizeStructuralContent(textContent))
          .digest('hex');
      }

      files.push({
        path: relPath,
        absPath,
        size: stat.size,
        hash,
        ext,
        textContent,
        structuralHash,
        imports: []
      });
    }
  }
}

async function collectRootConfigs(files) {
  for (const fileName of ROOT_CONFIG_FILES) {
    console.log(`[audit] collect root config ${fileName}`);
    const absPath = path.join(REPO_ROOT, fileName);
    if (!(await fileExists(absPath))) continue;
    const stat = await fs.stat(absPath);
    if (!stat.isFile()) continue;
    const buffer = await fs.readFile(absPath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.posix.extname(fileName);
    let textContent = null;
    let structuralHash = null;
    if (TEXT_EXTENSIONS.has(ext.toLowerCase()) && stat.size <= MAX_TEXT_BYTES) {
      textContent = buffer.toString('utf8');
      structuralHash = crypto
        .createHash('sha256')
        .update(normalizeStructuralContent(textContent))
        .digest('hex');
    }
    files.push({
      path: fileName,
      absPath,
      size: stat.size,
      hash,
      ext,
      textContent,
      structuralHash,
      imports: []
    });
  }
}

function analyzeImports(files) {
  const knownFiles = new Set(files.map((file) => file.path));
  const inbound = new Map();

  for (const file of files) {
    if (!file.textContent) continue;
    if (!MODULE_EXTENSIONS.includes(file.ext)) continue;

    const specs = parseImports(file.textContent);
    const resolvedImports = [];
    for (const spec of specs) {
      const target = resolveImport(file.path, spec, knownFiles);
      if (target) {
        resolvedImports.push(target);
        if (!inbound.has(target)) inbound.set(target, new Set());
        inbound.get(target).add(file.path);
      }
    }
    file.imports = Array.from(new Set(resolvedImports));
  }

  for (const file of files) {
    file.inbound = inbound.has(file.path) ? inbound.get(file.path).size : 0;
    file.outbound = file.imports.length;
  }
}

function getDuplicateGroups(files) {
  const byHash = new Map();
  const byStructural = new Map();

  for (const file of files) {
    if (!byHash.has(file.hash)) byHash.set(file.hash, []);
    byHash.get(file.hash).push(file.path);

    if (file.structuralHash) {
      if (!byStructural.has(file.structuralHash)) byStructural.set(file.structuralHash, []);
      byStructural.get(file.structuralHash).push(file.path);
    }
  }

  const exact = [];
  const structural = [];

  for (const [hash, group] of byHash.entries()) {
    if (group.length > 1) {
      exact.push({ hash, files: group.sort() });
    }
  }

  for (const [hash, group] of byStructural.entries()) {
    const uniqueGroup = Array.from(new Set(group)).sort();
    if (uniqueGroup.length > 1) {
      structural.push({ structuralHash: hash, files: uniqueGroup });
    }
  }

  exact.sort((a, b) => a.hash.localeCompare(b.hash));
  structural.sort((a, b) => a.structuralHash.localeCompare(b.structuralHash));

  return { exact, structural };
}

function identifyDeadFiles(files) {
  const entryCandidates = new Set([
    'src/index.ts',
    'src/index.tsx',
    'src/index.js',
    'src/main.tsx',
    'src/main.ts',
    'src/app.tsx',
    'src/app.ts',
    'app/index.js',
    'app/main.js',
    'app/main.tsx',
    'app/index.tsx',
    'pwa/index.js',
    'pwa/main.js',
    'pwa/sw.js',
    'ai_pod/index.js',
    'lib/index.js'
  ]);

  const dead = [];
  for (const file of files) {
    if (!MODULE_EXTENSIONS.includes(file.ext)) continue;
    if (file.path.includes('__tests__')) continue;
    if (file.path.includes('.test.') || file.path.includes('.spec.')) continue;
    if (file.path.startsWith('scripts/')) continue;
    if (file.path.startsWith('tools/')) continue;
    if (file.path.startsWith('data/')) continue;
    if (file.path.startsWith('reports/')) continue;
    if (entryCandidates.has(file.path)) continue;
    if (file.inbound === 0 && file.outbound === 0) {
      dead.push(file.path);
    }
  }
  return dead.sort();
}

function summarize(files, duplicates, deadFiles) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return {
    totalFiles: files.length,
    totalBytes: totalSize,
    directories: SCAN_TARGETS,
    duplicates: {
      exactGroups: duplicates.exact.length,
      structuralGroups: duplicates.structural.length
    },
    deadFileCandidates: deadFiles.length
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function computeDatasetHash(filePath) {
  if (!(await fileExists(filePath))) return null;
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    let minimal = parsed;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
      const minimalItems = parsed.items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const { brand, model, price, score, segments } = item;
        return {
          brand,
          model,
          price,
          score,
          segments: Array.isArray(segments) ? [...segments].sort() : []
        };
      });
      minimalItems.sort((a, b) => {
        const aKey = `${a?.brand ?? ''}::${a?.model ?? ''}`;
        const bKey = `${b?.brand ?? ''}::${b?.model ?? ''}`;
        return aKey.localeCompare(bKey);
      });
      minimal = {
        total_count: parsed.total_count ?? minimalItems.length,
        items: minimalItems
      };
    }
    const canonical = stableStringify(minimal);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  } catch (error) {
    return null;
  }
}

async function appendDeterminismHash(entry) {
  const ciDir = path.join(REPO_ROOT, 'reports', 'ci');
  await fs.mkdir(ciDir, { recursive: true });
  const filePath = path.join(ciDir, 'determinism-hash.txt');
  const line = `${entry.generatedAt}	${entry.datasetHashes.join(',')}
`;
  await fs.appendFile(filePath, line);
}

function buildMentorCoverage(entry, duplicates, deadFiles) {
  const mentorCount = 74;
  const mentors = [];
  const structuralPressure = duplicates.structural.length;
  const deadWeight = deadFiles.length;
  const qualitySignal = entry.summary.totalFiles > 0
    ? 1 - Math.min((structuralPressure + deadWeight) / entry.summary.totalFiles, 1)
    : 1;

  for (let index = 0; index < mentorCount; index += 1) {
    const id = index + 1;
    mentors.push({
      mentorId: `mentor-${id.toString().padStart(2, '0')}`,
      label: `Mentor ${id.toString().padStart(2, '0')}`,
      coverage: Number((qualitySignal * 100).toFixed(2)),
      weakLenses: deadWeight > 0 || structuralPressure > 0 ? ['duplication', 'dead-code'] : []
    });
  }

  const composite = {
    Data: 40,
    Safety: 20,
    Platform: 20,
    'Perf/A11y': 10,
    Docs: 5,
    Governance: 5
  };
  const compositeScore = Object.values(composite).reduce((sum, value) => sum + value, 0);

  return {
    generatedAt: entry.generatedAt,
    timezone: TZ,
    notes: 'Auto-generated baseline coverage derived from inventory metrics. Manual validation recommended.',
    mentors,
    weakLensSummary: {
      duplicationGroups: duplicates.structural.length,
      exactDuplicates: duplicates.exact.length,
      deadFileCandidates: deadFiles.length
    },
    composite,
    compositeScore
  };
}

async function writeJsonAppend(filePath, payload) {
  const existing = await fileExists(filePath);
  let data = [];
  if (existing) {
    const raw = await fs.readFile(filePath, 'utf8');
    if (raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          data = parsed;
        } else {
          data = [parsed];
        }
      } catch (error) {
        data = [];
      }
    }
  }
  data.push(payload);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

function normalizeEntryForComparison(entry) {
  const clone = JSON.parse(JSON.stringify(entry));
  delete clone.generatedAt;
  delete clone.timezone;
  if (clone.summary && Array.isArray(clone.summary.directories)) {
    clone.summary.directories = [...clone.summary.directories].sort();
  }
  if (Array.isArray(clone.files)) {
    clone.files = clone.files.map((file) => {
      const next = { ...file };
      return next;
    }).sort((a, b) => a.path.localeCompare(b.path));
  }
  if (clone.duplicates) {
    if (Array.isArray(clone.duplicates.exact)) {
      clone.duplicates.exact = clone.duplicates.exact
        .map((group) => ({ hash: group.hash, files: [...group.files].sort() }))
        .sort((a, b) => a.hash.localeCompare(b.hash));
    }
    if (Array.isArray(clone.duplicates.structural)) {
      clone.duplicates.structural = clone.duplicates.structural
        .map((group) => ({ structuralHash: group.structuralHash, files: [...group.files].sort() }))
        .sort((a, b) => a.structuralHash.localeCompare(b.structuralHash));
    }
  }
  if (Array.isArray(clone.deadFiles)) {
    clone.deadFiles = [...clone.deadFiles].sort();
  }
  return clone;
}

function entriesMatch(expected, actual) {
  const normalizedExpected = normalizeEntryForComparison(expected);
  const normalizedActual = normalizeEntryForComparison(actual);
  return JSON.stringify(normalizedExpected) === JSON.stringify(normalizedActual);
}

async function writeAuditMarkdown(filePath, payload, duplicates, deadFiles) {
  const lines = [];
  lines.push(`# Audit Inventory Report (${payload.generatedAt})`);
  lines.push('');
  lines.push(`- Timezone: ${TZ}`);
  lines.push(`- Directories scanned: ${payload.summary.directories.join(', ')}`);
  lines.push(`- Files analyzed: ${payload.summary.totalFiles}`);
  lines.push(`- Total size: ${(payload.summary.totalBytes / 1024).toFixed(2)} KB`);
  lines.push(`- Exact duplicate groups: ${duplicates.exact.length}`);
  lines.push(`- Structural duplicate groups: ${duplicates.structural.length}`);
  lines.push(`- Dead-file candidates: ${deadFiles.length}`);
  lines.push('');

  if (duplicates.exact.length > 0) {
    lines.push('## Exact Duplicate Groups');
    lines.push('');
    for (const group of duplicates.exact) {
      lines.push(`- ${group.hash}: ${group.files.join(', ')}`);
    }
    lines.push('');
  }

  if (duplicates.structural.length > 0) {
    lines.push('## Structural Similarity Groups');
    lines.push('');
    for (const group of duplicates.structural) {
      lines.push(`- ${group.structuralHash}: ${group.files.join(', ')}`);
    }
    lines.push('');
  }

  if (deadFiles.length > 0) {
    lines.push('## Dead-File Candidates');
    lines.push('');
    for (const file of deadFiles) {
      lines.push(`- ${file}`);
    }
    lines.push('');
  }

  await fs.writeFile(filePath, lines.join('\n') + '\n', { flag: 'wx' }).catch(async (error) => {
    if (error.code === 'EEXIST') {
      await fs.appendFile(filePath, '\n<!-- Duplicate execution prevented overwrite at ' + payload.generatedAt + ' -->\n');
    } else {
      throw error;
    }
  });
}


async function main() {
  const { timestamp, iso } = getNowParts();
  const files = [];

  for (const target of SCAN_TARGETS) {
    console.log(`[audit] scanning ${target}`);
    await walkDirectory(target, files);
  }
  await collectRootConfigs(files);
  console.log(`[audit] collected ${files.length} files after root configs`);

  files.sort((a, b) => a.path.localeCompare(b.path));

  console.log(`[audit] collected ${files.length} files`);
  console.time('[audit] analyzeImports');
  analyzeImports(files);
  console.timeEnd('[audit] analyzeImports');

  const duplicates = getDuplicateGroups(files);
  const deadFiles = identifyDeadFiles(files);
  const summary = summarize(files, duplicates, deadFiles);

  const datasetHashes = (await Promise.all([
    computeDatasetHash(path.join(REPO_ROOT, 'data', 'laptops.json')),
    computeDatasetHash(path.join(REPO_ROOT, 'data', 'fallbackLaptops.json'))
  ])).filter(Boolean);

  const payload = {
    generatedAt: iso,
    timezone: TZ,
    summary,
    files: files.map((file) => ({
      path: file.path,
      size: file.size,
      hash: file.hash,
      structuralHash: file.structuralHash,
      importDegree: { inbound: file.inbound, outbound: file.outbound },
      duplicates: {
        exact: duplicates.exact.some((group) => group.files.includes(file.path)),
        structural: duplicates.structural.some((group) => group.files.includes(file.path))
      },
      deadCandidate: deadFiles.includes(file.path)
    })),
    duplicates,
    deadFiles,
    datasetHashes
  };

  payload.summary.directories = SCAN_TARGETS;

  const reportsDir = path.join(REPO_ROOT, 'reports', 'audit');
  await fs.mkdir(reportsDir, { recursive: true });

  if (CHECK_MODE) {
    const inventoryPath = path.join(reportsDir, 'inventory.json');
    if (!(await fileExists(inventoryPath))) {
      console.error('[audit] check failed: reports/audit/inventory.json is missing');
      process.exitCode = 1;
      return;
    }
    let latestEntry = null;
    try {
      const rawInventory = await fs.readFile(inventoryPath, 'utf8');
      if (rawInventory.trim()) {
        const parsed = JSON.parse(rawInventory);
        if (Array.isArray(parsed)) {
          latestEntry = parsed[parsed.length - 1] ?? null;
        } else {
          latestEntry = parsed;
        }
      }
    } catch (error) {
      console.error('[audit] check failed: unable to parse reports/audit/inventory.json');
      console.error(error);
      process.exitCode = 1;
      return;
    }

    if (!latestEntry) {
      console.error('[audit] check failed: inventory history is empty');
      process.exitCode = 1;
      return;
    }

    if (!entriesMatch(latestEntry, payload)) {
      const expectedNormalized = normalizeEntryForComparison(latestEntry);
      const actualNormalized = normalizeEntryForComparison(payload);
      const expectedPaths = new Map(expectedNormalized.files.map((file) => [file.path, file]));
      const actualPaths = new Map(actualNormalized.files.map((file) => [file.path, file]));
      const extras = [];
      const missing = [];
      const mismatched = [];
      for (const [pathKey, file] of actualPaths) {
        const expected = expectedPaths.get(pathKey);
        if (!expected) {
          extras.push(pathKey);
        } else if (expected.hash !== file.hash || expected.size !== file.size) {
          mismatched.push(pathKey);
        }
      }
      for (const [pathKey] of expectedPaths) {
        if (!actualPaths.has(pathKey)) {
          missing.push(pathKey);
        }
      }
      console.error('[audit] inventory drift detected. Run `npm run audit:inventory` and commit the refreshed reports.');
      console.error(`[audit] expected files: ${expectedNormalized.files.length}, actual files: ${actualNormalized.files.length}`);
      console.error(`[audit] expected bytes: ${expectedNormalized.summary.totalBytes}, actual bytes: ${actualNormalized.summary.totalBytes}`);
      if (extras.length > 0) {
        console.error(`[audit] example unexpected files: ${extras.slice(0, 5).join(', ')}`);
      }
      if (missing.length > 0) {
        console.error(`[audit] example missing files: ${missing.slice(0, 5).join(', ')}`);
      }
      if (mismatched.length > 0) {
        console.error(`[audit] example changed files: ${mismatched.slice(0, 5).join(', ')}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`[audit] check passed against ${latestEntry.generatedAt ?? 'latest entry'}`);
    console.log(`Inventory completed for ${files.length} files.`);
    console.log(`Exact duplicate groups: ${duplicates.exact.length}`);
    console.log(`Structural duplicate groups: ${duplicates.structural.length}`);
    console.log(`Dead-file candidates: ${deadFiles.length}`);
    if (datasetHashes.length > 0) {
      console.log(`Dataset hashes: ${datasetHashes.join(', ')}`);
    }
    return;
  }

  await writeJsonAppend(path.join(reportsDir, 'inventory.json'), payload);

  const auditBase = `audit-${timestamp}`;
  let uniqueBase = auditBase;
  let suffixCounter = 1;
  while (await fileExists(path.join(reportsDir, `${uniqueBase}.json`))) {
    uniqueBase = `${auditBase}-${String(suffixCounter).padStart(2, '0')}`;
    suffixCounter += 1;
  }
  const jsonPath = path.join(reportsDir, `${uniqueBase}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });

  const markdownPath = path.join(reportsDir, `${uniqueBase}.md`);
  await writeAuditMarkdown(markdownPath, payload, duplicates, deadFiles);

  const mentorCoverage = buildMentorCoverage({ generatedAt: iso, summary }, duplicates, deadFiles);
  const mentorPath = path.join(reportsDir, 'mentor-coverage.json');
  await fs.writeFile(mentorPath, JSON.stringify(mentorCoverage, null, 2) + '\n');

  if (datasetHashes.length > 0) {
    await appendDeterminismHash({ generatedAt: iso, datasetHashes });
  }

  const finalReportPath = path.join(REPO_ROOT, 'reports', 'audit', `${uniqueBase}.log.json`);
  await fs.writeFile(finalReportPath, JSON.stringify({ payloadSummary: summary, datasetHashes }, null, 2) + '\n', { flag: 'wx' }).catch(() => {});

  console.log(`Inventory completed for ${files.length} files.`);
  console.log(`Exact duplicate groups: ${duplicates.exact.length}`);
  console.log(`Structural duplicate groups: ${duplicates.structural.length}`);
  console.log(`Dead-file candidates: ${deadFiles.length}`);
  if (datasetHashes.length > 0) {
    console.log(`Dataset hashes: ${datasetHashes.join(', ')}`);
  }
}

main().catch((error) => {
  console.error('[audit] Failed to generate inventory');
  console.error(error);
  process.exitCode = 1;
});

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const pattern = /(laptop|notebook|models|sku|market|dataset|cache)/i;
const allowedExt = new Set(['.json', '.jsonl', '.csv']);
const ignoreDirs = new Set(['node_modules', '.git', '.idea', '.vscode', 'dist', 'build']);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      walk(full, out);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (allowedExt.has(ext) && pattern.test(full)) {
        const stat = fs.statSync(full);
        out.push({
          fullPath: full,
          ext,
          length: stat.size,
          mtime: stat.mtime
        });
      }
    }
  }
}

function numericVal(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function parseJSON(full) {
  const text = fs.readFileSync(full, 'utf8');
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

function parseJSONL(full) {
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/).filter(Boolean);
  const items = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch (err) {
      // ignore malformed lines
    }
  }
  return items;
}

function parseCSV(full) {
  const text = fs.readFileSync(full, 'utf8');
  return text.split(/\r?\n/);
}

const priceFields = ['price_rm', 'price_myr', 'priceMYR', 'price', 'rm', 'priceMY', 'priceRM'];

function analyseRecord(file) {
  const record = {
    fullPath: path.relative(root, file.fullPath).replace(/\\/g, '/'),
    extension: file.ext,
    length: file.length,
    lastWriteTime: file.mtime.toISOString(),
    totalItems: null,
    price_min: null,
    price_max: null,
    count_in_range_3500_7000: 0,
    count_lte_4500: 0,
    keys: [],
    sample: [],
    errors: []
  };

  try {
    if (file.ext === '.csv') {
      const lines = parseCSV(file.fullPath);
      record.sample = lines.slice(0, 200);
      record.totalItems = Math.max(lines.length - 1, 0);
      if (lines.length > 0) {
        const header = lines[0].split(',');
        const priceIndex = header.findIndex(h => /price/i.test(h));
        if (priceIndex !== -1) {
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            if (!row) continue;
            const cols = row.split(',');
            const price = numericVal(cols[priceIndex]);
            if (price !== null) {
              record.price_min = record.price_min === null ? price : Math.min(record.price_min, price);
              record.price_max = record.price_max === null ? price : Math.max(record.price_max, price);
              if (price >= 3500 && price <= 7000) record.count_in_range_3500_7000++;
              if (price <= 4500) record.count_lte_4500++;
            }
          }
        }
      }
      return record;
    }

    let items = [];
    if (file.ext === '.json') {
      try {
        items = parseJSON(file.fullPath);
      } catch (err) {
        record.errors.push(`JSON parse error: ${err.message}`);
      }
    } else if (file.ext === '.jsonl') {
      try {
        items = parseJSONL(file.fullPath);
      } catch (err) {
        record.errors.push(`JSONL parse error: ${err.message}`);
      }
    }

    if (Array.isArray(items) && items.length) {
      record.sample = items.slice(0, 50);
      record.totalItems = items.length;
      const keySet = new Set();
      items.slice(0, 50).forEach(item => {
        if (!item || typeof item !== 'object') return;
        Object.keys(item).forEach(k => keySet.add(k));
        let price = null;
        for (const field of priceFields) {
          if (Object.prototype.hasOwnProperty.call(item, field)) {
            price = numericVal(item[field]);
            if (price !== null) break;
          }
        }
        if (price === null) {
          for (const key of Object.keys(item)) {
            if (/price/i.test(key)) {
              price = numericVal(item[key]);
              if (price !== null) break;
            }
          }
        }
        if (price !== null) {
          record.price_min = record.price_min === null ? price : Math.min(record.price_min, price);
          record.price_max = record.price_max === null ? price : Math.max(record.price_max, price);
          if (price >= 3500 && price <= 7000) record.count_in_range_3500_7000++;
          if (price <= 4500) record.count_lte_4500++;
        }
      });
      record.keys = Array.from(keySet).sort();
    } else if (items && items.error) {
      record.errors.push(items.error);
    }
  } catch (err) {
    record.errors.push(err.message);
  }

  return record;
}

const discovered = [];
walk(root, discovered);

const census = discovered.map(analyseRecord);
const table = census.slice().sort((a, b) => {
  const aIn = a.count_in_range_3500_7000 || 0;
  const bIn = b.count_in_range_3500_7000 || 0;
  if (bIn !== aIn) return bIn - aIn;
  const aUnder = a.count_lte_4500 || 0;
  const bUnder = b.count_lte_4500 || 0;
  return bUnder - aUnder;
}).map(item => ({
  fullPath: item.fullPath,
  totalItems: item.totalItems,
  price_min: item.price_min,
  price_max: item.price_max,
  count_in_range_3500_7000: item.count_in_range_3500_7000,
  count_lte_4500: item.count_lte_4500
}));

fs.writeFileSync(path.join(reportsDir, 'datasets.census.json'), JSON.stringify(census, null, 2));
const lines = ['fullPath | totalItems | price_min | price_max | in_range_3500_7000 | <=4500'];
lines.push(...table.map(row => `${row.fullPath} | ${row.totalItems ?? ''} | ${row.price_min ?? ''} | ${row.price_max ?? ''} | ${row.count_in_range_3500_7000 ?? 0} | ${row.count_lte_4500 ?? 0}`));
fs.writeFileSync(path.join(reportsDir, 'datasets.census.table.txt'), lines.join('\n'));

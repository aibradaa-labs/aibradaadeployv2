const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const censusPath = path.join(reportsDir, 'datasets.census.json');
if (!fs.existsSync(censusPath)) {
  throw new Error('Missing reports/datasets.census.json. Run dataset census first.');
}
const census = JSON.parse(fs.readFileSync(censusPath, 'utf8'));

const priceFields = ['price_myr', 'price_rm', 'priceMYR', 'price', 'rm', 'priceMY', 'priceRM'];

function coercePrice(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'object') {
    if ('value' in value) {
      return coercePrice(value.value);
    }
    return null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function loadItems(fullPath) {
  const diskPath = path.join(root, fullPath);
  if (!fs.existsSync(diskPath)) {
    return { items: [], errors: [`File missing: ${fullPath}`] };
  }
  try {
    const ext = path.extname(diskPath).toLowerCase();
    const raw = fs.readFileSync(diskPath, 'utf8');
    if (ext === '.json') {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return { items: data };
      }
      if (data && typeof data === 'object' && Array.isArray(data.items)) {
        return { items: data.items };
      }
      return { items: [], errors: ['JSON file did not contain array or items[]'] };
    }
    if (ext === '.jsonl') {
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const items = [];
      const errors = [];
      for (const [idx, line] of lines.entries()) {
        try {
          items.push(JSON.parse(line));
        } catch (err) {
          errors.push(`Line ${idx + 1}: ${err.message}`);
        }
      }
      return { items, errors };
    }
    if (ext === '.csv') {
      const lines = raw.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return { items: [] };
      const header = lines[0].split(',');
      const records = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        header.forEach((key, i) => {
          obj[key.trim()] = values[i] !== undefined ? values[i].trim() : '';
        });
        return obj;
      });
      return { items: records };
    }
    return { items: [], errors: ['Unsupported extension'] };
  } catch (err) {
    return { items: [], errors: [err.message] };
  }
}

function analyseDataset(entry) {
  const { fullPath } = entry;
  if (fullPath.startsWith('reports/')) {
    return null;
  }
  const { items, errors = [] } = loadItems(fullPath);
  const keys = new Set();
  let priceMin = null;
  let priceMax = null;
  let inRange = 0;
  let le4500 = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    Object.keys(item).forEach(k => keys.add(k));
    let price = null;
    for (const field of priceFields) {
      if (Object.prototype.hasOwnProperty.call(item, field)) {
        price = coercePrice(item[field]);
        if (price !== null) break;
      }
    }
    if (price === null) {
      if (Object.prototype.hasOwnProperty.call(item, 'price')) {
        price = coercePrice(item.price);
      }
    }
    if (price !== null) {
      priceMin = priceMin === null ? price : Math.min(priceMin, price);
      priceMax = priceMax === null ? price : Math.max(priceMax, price);
      if (price >= 3500 && price <= 7000) inRange += 1;
      if (price <= 4500) le4500 += 1;
    }
  }
  return {
    fullPath,
    totalItems: items.length,
    price_min: priceMin,
    price_max: priceMax,
    count_in_range_3500_7000: inRange,
    count_lte_4500: le4500,
    keys: Array.from(keys).sort(),
    errors
  };
}

const analysed = census
  .map(analyseDataset)
  .filter(Boolean)
  .sort((a, b) => (b.count_in_range_3500_7000 || 0) - (a.count_in_range_3500_7000 || 0));

fs.writeFileSync(path.join(reportsDir, 'datasets.metrics.json'), JSON.stringify(analysed, null, 2));

const lines = ['fullPath | totalItems | price_min | price_max | in_range_3500_7000 | <=4500'];
for (const row of analysed) {
  lines.push(`${row.fullPath} | ${row.totalItems} | ${row.price_min ?? ''} | ${row.price_max ?? ''} | ${row.count_in_range_3500_7000} | ${row.count_lte_4500}`);
}
fs.writeFileSync(path.join(reportsDir, 'datasets.metrics.table.txt'), lines.join('\n'));

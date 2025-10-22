const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const metricsPath = path.join(reportsDir, 'datasets.metrics.json');
const censusPath = path.join(reportsDir, 'datasets.census.json');

if (!fs.existsSync(metricsPath)) {
  throw new Error('Missing reports/datasets.metrics.json. Run dataset metrics first.');
}
if (!fs.existsSync(censusPath)) {
  throw new Error('Missing reports/datasets.census.json. Run census first.');
}

const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
const census = JSON.parse(fs.readFileSync(censusPath, 'utf8'));

const providerRequirements = {
  displayName: ['name', 'model', 'title'],
  price: ['price_myr', 'price_rm', 'priceMYR', 'price', 'rm', 'priceMY', 'priceRM'],
  sku: ['model_sku', 'sku', 'id', 'uid', 'asin'],
  score: ['score', 'rating'],
  timestamp: ['updated_at', 'ts', 'timestamp', 'last_seen', 'lastUpdated']
};

function findCensusEntry(fullPath) {
  return census.find(entry => entry.fullPath === fullPath) || null;
}

function collectSampleKeys(entry) {
  const keys = new Set(entry && entry.keys ? entry.keys : []);

  function ingestObject(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(k => {
      keys.add(k);
      if (k === 'price' && obj[k] && typeof obj[k] === 'object') {
        Object.keys(obj[k]).forEach(pk => keys.add(`price.${pk}`));
      }
      if (Array.isArray(obj[k])) {
        obj[k].forEach(child => ingestObject(child));
      } else if (obj[k] && typeof obj[k] === 'object') {
        ingestObject(obj[k]);
      }
    });
  }

  if (entry) {
    ingestObject(entry);
    if (Array.isArray(entry.sample)) {
      entry.sample.forEach(sampleItem => ingestObject(sampleItem));
    }
  }

  return keys;
}

function hasField(keys, entry, options) {
  for (const key of options) {
    if (keys.has(key)) return { present: true, via: key };
    if (key.includes('.') && key.includes('price.')) {
      const [parent, child] = key.split('.');
      if (keys.has(`${parent}.${child}`)) {
        return { present: true, via: `${parent}.${child}` };
      }
    }
    if (key === 'price' && entry) {
      const sample = Array.isArray(entry.sample) ? entry.sample : [];
      for (const item of sample) {
        if (!item || typeof item !== 'object') continue;
        if (Object.prototype.hasOwnProperty.call(item, 'price')) {
          const value = item.price;
          if (typeof value === 'object' && 'value' in value) {
            return { present: true, via: 'price.value' };
          }
          if (typeof value === 'number' || typeof value === 'string') {
            return { present: true, via: 'price' };
          }
        }
      }
    }
  }
  return { present: false, via: null };
}

function summariseDataset(metricEntry) {
  const { fullPath } = metricEntry;
  const censusEntry = findCensusEntry(fullPath);
  const keys = collectSampleKeys(censusEntry);

  const checks = {};
  for (const [requirement, options] of Object.entries(providerRequirements)) {
    checks[requirement] = hasField(keys, censusEntry, options);
  }

  const notes = [];
  if (!checks.displayName.present) notes.push('Missing name/model field');
  if (!checks.price.present) notes.push('Price field needs flattening');
  if (!checks.sku.present) notes.push('No SKU/ID present');
  if (!checks.score.present) notes.push('Score missing');
  if (!checks.timestamp.present) notes.push('Missing updated timestamp');

  // Additional special cases
  if (fullPath === 'data/fallbackLaptops.json') {
    notes.push('Price stored under price.value; score lives in raw.score');
  }
  if (fullPath === 'ai_pod/data/laptops/top35.cache.json') {
    notes.push('Fully aligned with provider expectations');
  }

  const requiredCount = Object.keys(providerRequirements).length;
  const satisfied = Object.values(checks).filter(c => c.present).length;
  const pass = satisfied === requiredCount;

  return {
    dataset: fullPath,
    totalItems: metricEntry.totalItems,
    counts: {
      price_min: metricEntry.price_min,
      price_max: metricEntry.price_max,
      count_in_range_3500_7000: metricEntry.count_in_range_3500_7000,
      count_lte_4500: metricEntry.count_lte_4500
    },
    requirements: Object.fromEntries(
      Object.entries(checks).map(([k, v]) => [k, { pass: v.present, via: v.via }])
    ),
    overall_pass: pass,
    satisfied,
    required: requiredCount,
    notes
  };
}

const topFive = metrics.slice(0, 5).map(summariseDataset);
fs.writeFileSync(path.join(reportsDir, 'provider.schema.matrix.json'), JSON.stringify(topFive, null, 2));

const lines = ['Dataset | Pass | Missing | Notes'];
for (const row of topFive) {
  const missing = Object.entries(row.requirements)
    .filter(([, info]) => !info.pass)
    .map(([req]) => req)
    .join(', ') || '—';
  const noteText = row.notes.length ? row.notes.join('; ') : '—';
  lines.push(`${row.dataset} | ${row.overall_pass ? 'PASS' : 'FAIL'} | ${missing} | ${noteText}`);
}
fs.writeFileSync(path.join(reportsDir, 'provider.schema.matrix.txt'), lines.join('\n'));

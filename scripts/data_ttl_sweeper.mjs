#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'yaml';

async function main(){
  const policyPath = path.join('governance','policies','privacy_least_data_ttl.yml');
  const exists = await fs.access(policyPath).then(()=>true).catch(()=>false);
  if (!exists){ console.error('[ttl] policy missing at', policyPath); process.exit(1); }
  const doc = yaml.parse(await fs.readFile(policyPath,'utf8'));
  const classes = doc?.data_classes || [];
  console.log('[ttl] classes:');
  for (const c of classes){
    console.log(` - ${c.id} → ttl_days=${c.ttl_days} (basis=${c.lawful_basis||'n/a'})`);
  }
  console.log('[ttl] purge cadence:', doc?.purge?.cadence || 'n/a');
  console.log('[ttl] access_logs:', doc?.access_logs ? 'enabled' : 'disabled');
  console.log('[ttl] DRY RUN — no deletions performed');
}
main().catch(e=>{ console.error('[ttl] failed', e?.message||e); process.exit(1); });

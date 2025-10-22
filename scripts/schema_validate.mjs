#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const yaml = require('yaml');

async function main(){
  const schema = JSON.parse(await readFile('governance/schemas/master_operation.schema.json','utf8'));
  const arg = process.argv[2] || 'Master Operation Config.yaml';
  const doc = yaml.parse(await readFile(arg,'utf8'));
  const ajv = new Ajv({ allErrors:true, strict:false }); addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(doc);
  if (!ok) { console.error('[schema] errors:', validate.errors); process.exit(1); }
  console.log('[schema] OK');
}
main().catch(e=>{ console.error('[schema] failed', e); process.exit(1); });

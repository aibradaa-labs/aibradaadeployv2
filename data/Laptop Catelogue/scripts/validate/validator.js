// Minimal validator stub — expand with real checks.
const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), 'data', 'laptops');
const schemaPath = path.join(base, 'schema.json');
function requireJSON(p){ return JSON.parse(fs.readFileSync(p,'utf-8')); }
function ensureFile(p,n){ if(!fs.existsSync(p)) throw new Error(`Missing required file: ${n}`); }
function main(){
  ensureFile(schemaPath,'schema.json');
  const schema=requireJSON(schemaPath);
  if(schema.price_band_myr[0]!==3500 || schema.price_band_myr[1]!==7000){ throw new Error('Price band must be RM3,500–RM7,000'); }
  console.log('[validator] schema ok, price band ok');
  process.exit(0);
}
main();
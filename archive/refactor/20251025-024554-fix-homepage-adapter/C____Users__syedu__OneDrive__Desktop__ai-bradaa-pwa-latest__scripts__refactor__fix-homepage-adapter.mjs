// Node 18+ ESM — fixes Step-5 deficits using latest homepage-wiring.json
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry");
const rel = (p)=> path.relative(ROOT,p).split(path.sep).join("/");
const TS = (()=>{const d=new Date(),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`})();
const BAK = path.join(ROOT,"archive","refactor",`${TS}-fix-homepage-adapter`);
await fsp.mkdir(BAK,{recursive:true});

function latest(dir, re=/^\d{8}-\d{6}$/){ if(!fs.existsSync(dir)) return null; const xs=fs.readdirSync(dir).filter(x=>re.test(x)).sort().reverse(); return xs.length? path.join(dir,xs[0]) : null; }
const REPORT_DIR = latest(path.join(ROOT,"reports","homepage"));
if(!REPORT_DIR) { console.log("[fix-homepage-adapter] no homepage report found"); process.exit(0); }
const reportPath = path.join(REPORT_DIR,"homepage-wiring.json");
const rep = JSON.parse(await fsp.readFile(reportPath,"utf8"));

const MISSING = rep.findings.adapter_missing || [];
const PROTO = rep.findings.proto_refs || [];
const INSERT = `import * as hw from \"app/homepage-wiring\";`;

async function ensureLine(pth, line){
  let txt = await fsp.readFile(pth,"utf8");
  if (txt.includes(line)) return {changed:false, txt};
  const newTxt = line + "\n" + txt;
  return {changed: newTxt!==txt, txt:newTxt};
}
function replacePrototype(txt){
  // replace imports from prototype/* to adapter (conservative)
  let changed=false;
  const before=txt;
  txt = txt.replace(/from\s+['"]prototype\/[^'\"]+['"]/g, `from \"app/homepage-wiring\"`);
  txt = txt.replace(/require\(\s*['"]prototype\/[^'\"]+['"]\s*\)/g, `require(\"app/homepage-wiring\")`);
  changed = (txt!==before);
  return {changed, txt};
}
async function backup(p){ const dst = path.join(BAK, p.replace(/[\/\\:]/g,"__")); await fsp.mkdir(path.dirname(dst),{recursive:true}); await fsp.copyFile(p,dst); }

const touches=[];
// 1) Add adapter import to homepage files missing it
for (const file of MISSING){
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) continue;
  const {changed, txt} = await ensureLine(abs, INSERT);
  if (changed){ if(!DRY){ await backup(abs); await fsp.writeFile(abs, txt, "utf8"); } touches.push({type:"add-adapter", file}); }
}
// 2) Replace prototype imports in prod files
for (const entry of PROTO){
  const abs = path.join(ROOT, entry.file);
  if (!fs.existsSync(abs)) continue;
  const raw = await fsp.readFile(abs,"utf8");
  const {changed, txt} = replacePrototype(raw);
  if (changed){ if(!DRY){ await backup(abs); await fsp.writeFile(abs, txt, "utf8"); } touches.push({type:"block-prototype", file: entry.file}); }
}

console.log(`[fix-homepage-adapter] dry=${DRY} changes=${touches.length}`);
for (const t of touches.slice(0,50)){ console.log(` - ${t.type}: ${t.file}`); }

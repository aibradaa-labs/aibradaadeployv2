#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const ROOT=process.cwd(), DATA=path.join(ROOT,"data");
fs.mkdirSync(DATA,{recursive:true}); fs.mkdirSync(path.join(DATA,"archive"),{recursive:true});
const now = new Date(); const ymd = now.toISOString().slice(0,10);
const out = path.join(DATA,"laptops.json"); const arc = path.join(DATA,"archive", `${ymd}-laptops.json` );

// TODO: replace with real sources; for now keep current 35 by reading existing JSON (if any) or skip.
let items = []; if (fs.existsSync(out)) items = JSON.parse(fs.readFileSync(out,"utf8")).items || [];
if (items.length>35) items = items.slice(0,35);
const payload = { generated_at: now.toISOString(), items };
fs.existsSync(out) && fs.copyFileSync(out, arc);
fs.writeFileSync(out, JSON.stringify(payload,null,2)); console.log("Wrote", out, "items:", items.length);

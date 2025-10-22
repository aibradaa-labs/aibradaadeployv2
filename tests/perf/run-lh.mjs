import { execSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const url = 'http://localhost:5179';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function main(){
  let server;
  try {
    server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['http-server','-p','5179','-s','-c','-1'], { stdio: 'inherit' });
    await sleep(1200);
    execSync(`npx lighthouse ${url} --quiet --chrome-flags="--headless" --output=json --output-path=./tests/perf/lh.json --config-path=tests/perf/lighthouse.config.cjs`,{stdio:'inherit'});
    const data = JSON.parse(await fs.readFile('./tests/perf/lh.json','utf8'));
    const cat = data.categories||{};
    const perf = Math.round((cat.performance?.score||0)*100);
    const acc  = Math.round((cat.accessibility?.score||0)*100);
    const bp   = Math.round((cat["best-practices"]?.score||0)*100);
    const seo  = Math.round((cat.seo?.score||0)*100);
    console.log('LH scores:', { perf, acc, bp, seo });
    if (perf<90 || acc<95 || bp<100 || seo<95){
      console.error('Budgets not met');
      process.exit(1);
    }
    console.log('Lighthouse done (budgets met)');
    process.exit(0);
  } catch (e){
    console.error('Lighthouse run failed', e?.message||e);
    process.exit(1);
  } finally {
    try { server && server.kill('SIGINT'); } catch {}
  }
}
main();

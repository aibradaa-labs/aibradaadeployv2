import http from 'node:http';
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';

const port = 5179;
const server = http.createServer(async (req, res) => {
  const html = await readFile('index.html','utf8');
  res.writeHead(200, { 'content-type':'text/html' }); res.end(html);
});
server.listen(port);

const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
const page = await browser.newPage();

const events = [];
await page.exposeFunction('__recvDeckEvent', (e)=>{ events.push(e); });
await page.evaluateOnNewDocument(()=>{
  window.addEventListener('deck:telemetry', (ev)=>{
    const e = ev.detail || { name:'?', data:{} };
    // Bridge back to Node via exposed function
    if (typeof window.__recvDeckEvent === 'function') window.__recvDeckEvent(e);
  });
});

await page.goto(`http://localhost:${port}`);
await page.evaluate(()=>{ window.ModalDeck?.open?.(); });
await page.waitForTimeout(1200);
console.log('[deck-telemetry]', JSON.stringify(events));
await browser.close(); server.close();

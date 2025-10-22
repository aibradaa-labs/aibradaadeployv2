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
await page.goto(`http://localhost:${port}`);

// Open Deck via any available trigger
await page.evaluate(()=>{ window.ModalDeck?.open?.(); });

// Keyboard nav
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowLeft');

// Dots exist and act as buttons
const dotsRole = await page.$eval('#ai-deck-dots', el=>el.getAttribute('role'));
console.log('dots role:', dotsRole);

await browser.close(); server.close();

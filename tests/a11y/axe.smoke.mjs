import http from 'node:http';
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import AxeBuilder from '@axe-core/puppeteer';

const port = 5179;
const server = http.createServer(async (req, res) => {
  const html = await readFile('index.html','utf8');
  res.writeHead(200, { 'content-type':'text/html' }); res.end(html);
});
server.listen(port);

const browser = await puppeteer.launch({ headless:'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
const page = await browser.newPage();
// Reduced-motion path should be honored
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(`http://localhost:${port}`);

// Basic aria roles presence
await page.evaluate(()=>{
  const sheet = document.querySelector('.ai-modal-sheet');
  if (!sheet || sheet.getAttribute('data-deck-experimental')!== '1') throw new Error('deck flag missing');
});

const results = await new AxeBuilder({ page }).analyze();
console.log('a11y violations:', results.violations.length);

// Carousel roles and aria-current
const roledesc = await page.$eval('#ai-deck-root', el => el.getAttribute('aria-roledescription'));
const dotsRole = await page.$eval('#ai-deck-dots', el => el.getAttribute('role'));
console.log('carousel:', roledesc, 'dotsRole:', dotsRole);

await browser.close(); server.close();
process.exit(results.violations.length ? 1 : 0);

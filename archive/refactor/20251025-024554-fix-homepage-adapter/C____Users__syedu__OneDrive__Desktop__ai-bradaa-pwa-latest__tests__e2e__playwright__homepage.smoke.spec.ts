import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import http, { Server } from 'http';
import { promises as fs } from 'fs';
import path from 'path';

const navButtons = [
  { label: 'Matchmaker', id: 'matchmaker' },
  { label: 'Versus', id: 'comparison' },
  { label: 'Explorer', id: 'explorer' },
  { label: 'Ops Command', id: 'toolkit' },
  { label: 'Intel', id: 'intelligence' },
  { label: 'Appendices', id: 'appendices' },
  { label: 'Camera Tech', id: 'camera' }
];

const rootDir = path.resolve(__dirname, '../../..');
const serverPort = 5317;
const baseUrl = `http://127.0.0.1:${serverPort}`;
let server: Server;

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function readFileSafe(filePath: string) {
  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    throw new Error('EISDIR');
  }
  return fs.readFile(filePath);
}

test.beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const rawPath = (req.url ?? '/').split('?')[0];
      const urlPath = decodeURIComponent(rawPath);
      const target = urlPath === '/'
        ? path.join(rootDir, 'app', 'index.v15.2.html')
        : path.join(rootDir, urlPath.replace(/^\//, ''));
      const data = await readFileSafe(target);
      res.writeHead(200, { 'Content-Type': getContentType(target) });
      res.end(data);
    } catch (error) {
      console.warn(`[playwright-server] 404 ${req.url}`);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(serverPort, '127.0.0.1', resolve);
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

async function gotoHomepage(page: Page) {
  await page.goto(`${baseUrl}/app/index.v15.2.html`, { waitUntil: 'domcontentloaded' });
}

test.describe('Homepage smoke', () => {
  test('nav anchors scroll cleanly with no console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      if (type !== 'error') {
        return;
      }

      const text = msg.text();
      if (/Failed to load resource: the server responded with a status of 404/.test(text)) {
        return;
      }

      if (text.includes('[AI POD] proxy error: proxy 404')) {
        return;
      }

      consoleMessages.push(`[${type}] ${text}`);
    });

    await gotoHomepage(page);
    await page.waitForSelector('button[data-target="#matchmaker"]');

    for (const { id } of navButtons) {
      const button = page.locator(`button[data-target="#${id}"]`);
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute('aria-controls', id);

      await button.click();
      const target = page.locator(`#${id}`);
      await expect(target).toBeInViewport();
    }

    expect(consoleMessages, consoleMessages.join('\n')).toHaveLength(0);
  });

  test('critical CTAs available and tappable', async ({ page }) => {
    await gotoHomepage(page);

    const matchmakerCTA = page.locator('#find-match-btn');
    await expect(matchmakerCTA).toBeVisible();
    const box = await matchmakerCTA.boundingBox();
    expect(box && box.width).toBeGreaterThanOrEqual(44);
    expect(box && box.height).toBeGreaterThanOrEqual(44);

    const explorerFilter = page.locator('.segment-filter', { hasText: 'All' });
    await expect(explorerFilter).toBeVisible();
  });
});

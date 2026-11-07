// @vitest-environment node
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { expect, test } from 'vitest';
import { createArtifactPreview } from './preview';

test.skipIf(!process.env.ARTIFACT_BROWSER_TEST)(
  'runs interactive HTML while the browser enforces the preview boundary',
  async () => {
    const browser = await chromium.launch({ headless: true });
    const received: string[] = [];
    const server = createServer((req, res) => {
      received.push(req.url ?? '');
      res.setHeader('Content-Type', 'text/html');
      res.end(
        '<!doctype html><title>Dashboard</title><h1 id="secret">Private dashboard</h1>'
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    const port = (server.address() as { port: number }).port;
    try {
      const page = await browser.newPage();
      const origin = `http://127.0.0.1:${port}`;
      await page.goto(origin);
      received.length = 0;
      const blocked: string[] = [];
      page.on('requestfailed', (request) => {
        if (request.failure()?.errorText === 'csp') blocked.push(request.url());
      });
      const source = `<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'">
      <base href="https://blocked.example/">
      <button id="counter" onclick="this.textContent = 'Clicked'">Click</button>
      <form action="${origin}/form" method="post"><button>Submit</button></form>
      <iframe src="${origin}/nested"></iframe>
      <script src="${origin}/external.js"></script>
      <script>
        window.results = {};
        for (const [key, action] of Object.entries({
          parent: () => parent.document.getElementById('secret').textContent,
          cookie: () => document.cookie,
          storage: () => localStorage.getItem('secret'),
          evaluation: () => eval('1 + 1'),
          navigation: () => top.location.href = '${origin}/escaped'
        })) { try { action(); results[key] = 'allowed'; } catch { results[key] = 'blocked'; } }
        results.popup = window.open('${origin}/popup') === null ? 'blocked' : 'allowed';
        fetch('${origin}/api').then(() => results.fetch = 'allowed', () => results.fetch = 'blocked');
        document.querySelector('form').submit();
      </script>`;
      await page.evaluate((srcDoc) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('sandbox', 'allow-scripts');
        frame.referrerPolicy = 'no-referrer';
        frame.srcdoc = srcDoc;
        document.body.append(frame);
      }, createArtifactPreview(source));
      const frame = await (await page.waitForSelector(
        'body > iframe'
      ))!.contentFrame();
      await frame!.waitForFunction(() => (window as any).results?.fetch);
      await frame!.click('#counter');
      expect(await frame!.textContent('#counter')).toBe('Clicked');
      expect(await frame!.evaluate(() => (window as any).results)).toEqual({
        parent: 'blocked',
        cookie: 'blocked',
        storage: 'blocked',
        evaluation: 'blocked',
        navigation: 'blocked',
        popup: 'blocked',
        fetch: 'blocked',
      });
      expect(await frame!.evaluate(() => document.baseURI)).not.toContain(
        'blocked.example'
      );
      expect(page.url()).toBe(`${origin}/`);
      expect(page.context().pages()).toHaveLength(1);
      expect(received).toEqual([]);
      expect(blocked).toContain(`${origin}/external.js`);
    } finally {
      await browser.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
  30000
);

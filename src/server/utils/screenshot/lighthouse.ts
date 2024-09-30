import puppeteer from 'puppeteer';
import lighthouse, { Result, generateReport } from 'lighthouse';
import { logger } from '../logger.js';
import { env } from '../env.js';

export async function generateLighthouse(url: string): Promise<Result> {
  logger.info('[Lighthouse] Generating Lighthouse report...', { url });

  // Use Puppeteer to launch headless Chrome
  // - Omit `--enable-automation` (See https://github.com/GoogleChrome/lighthouse/issues/12988)
  // - Don't use 800x600 default viewport
  const browser = await puppeteer.launch({
    // Set to false if you want to see the script in action.
    executablePath: env.puppeteerExecutablePath,
    headless: true,
    args: ['--no-sandbox', '--single-process', '--disable-dev-shm-usage'],
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
  });

  try {
    const page = await browser.newPage();

    // Wait for Lighthouse to open url, then inject our stylesheet.
    browser.on('targetchanged', async (target) => {
      if (page && page.url() === url) {
        await page.addStyleTag({ content: '* {color: red}' });
      }
    });

    // Lighthouse will open the URL.
    // Puppeteer will observe `targetchanged` and inject our stylesheet.
    const res = await lighthouse(url, undefined, undefined, page);
    if (!res) {
      throw new Error('Lighthouse failed to generate report');
    }

    await page.close({ runBeforeUnload: false });

    const { lhr } = res;

    return lhr;
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

export function getLighthouseReport(lhr: Result): string {
  return generateReport(lhr);
}

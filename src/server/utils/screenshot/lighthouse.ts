import puppeteer from 'puppeteer';
import lighthouse, { Result } from 'lighthouse';

export async function generateLighthouse(url: string): Promise<Result> {
  // Use Puppeteer to launch headless Chrome
  // - Omit `--enable-automation` (See https://github.com/GoogleChrome/lighthouse/issues/12988)
  // - Don't use 800x600 default viewport
  const browser = await puppeteer.launch({
    // Set to false if you want to see the script in action.
    headless: 'new',
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
  });
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

  const { lhr } = res;

  await browser.close();

  return lhr;
}

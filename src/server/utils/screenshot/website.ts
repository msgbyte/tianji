import puppeteer from 'puppeteer';
import { jwtSign } from '../../middleware/auth';
import { SYSTEM_ROLES } from '../../../shared';
import { settings } from '../settings';

/**
 * take a screenshot for website detail
 */
export async function screenshotWebsiteDetailImage(
  websiteId: string,
  userId: string
) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  try {
    const jwt = jwtSign({
      id: userId,
      username: 'reporter',
      role: SYSTEM_ROLES.user,
    });

    await Promise.all([
      page.setViewport({ width: 1080, height: 1024 }),
      page.setExtraHTTPHeaders({
        Authorization: `Bearer ${jwt}`,
      }),
      page.evaluateOnNewDocument(
        `localStorage.setItem('jsonwebtoken', '${jwt}');`
      ),
    ]);

    await page.goto(
      `http://127.0.0.1:${settings.port}/website/${websiteId}?hideHeader`,
      {
        waitUntil: 'networkidle2',
      }
    );

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    return buffer;
  } catch (err) {
    console.error('[screenshotWebsiteDetail] error', err);
    throw err;
  } finally {
    page.close();
    browser.close();
  }
}

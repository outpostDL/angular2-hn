import { test, expect } from '@playwright/test';

const screenshotDir = 'e2e/playwright/screenshots/angular-baseline';

test.describe('Feed Pages - Laptop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('1. /news/1 renders at least one story with title text', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const stories = page.locator('.post');
    await expect(stories.first()).toBeVisible();
    const title = stories.first().locator('.title');
    await expect(title).toHaveText(/.+/);
  });

  test('2. Each story shows points, username, time_ago, comment count', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const firstItem = page.locator('.post').first().locator('.subtext-laptop');
    // Points text (e.g. "123 points by")
    await expect(firstItem).toContainText(/\d+ points by/);
    // Username link
    const userLink = firstItem.locator('a[href*="/user/"]');
    await expect(userLink).toBeVisible();
    // time_ago text
    await expect(firstItem).toContainText(/ago/);
    // Comment count link
    const commentLink = firstItem.locator('a[href*="/item/"]');
    await expect(commentLink).toBeVisible();
  });

  test('3. Ordered list numbering starts at 1', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('ol', { timeout: 15000 });
    const ol = page.locator('ol');
    await expect(ol).toHaveAttribute('start', '1');
  });

  test('4. Click More navigates to page 2, numbering starts at 31', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.more', { timeout: 15000 });
    await page.click('.more');
    await page.waitForURL('**/news/2');
    await page.waitForSelector('ol', { timeout: 15000 });
    const ol = page.locator('ol');
    await expect(ol).toHaveAttribute('start', '31');
  });

  test('5. Page 2 has Prev link that navigates back to page 1', async ({ page }) => {
    await page.goto('/news/2');
    await page.waitForSelector('.prev', { timeout: 15000 });
    const prev = page.locator('.prev');
    await expect(prev).toBeVisible();
    await prev.click();
    await page.waitForURL('**/news/1');
    await page.waitForSelector('ol', { timeout: 15000 });
    const ol = page.locator('ol');
    await expect(ol).toHaveAttribute('start', '1');
  });

  test('6. /newest/1 loads stories', async ({ page }) => {
    await page.goto('/newest/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const stories = page.locator('.post');
    expect(await stories.count()).toBeGreaterThanOrEqual(1);
  });

  test('7. /show/1 loads stories', async ({ page }) => {
    await page.goto('/show/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const stories = page.locator('.post');
    expect(await stories.count()).toBeGreaterThanOrEqual(1);
  });

  test('8. /ask/1 loads stories', async ({ page }) => {
    await page.goto('/ask/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const stories = page.locator('.post');
    expect(await stories.count()).toBeGreaterThanOrEqual(1);
  });

  test('9. /jobs/1 loads stories and items do NOT show user/points', async ({ page }) => {
    await page.goto('/jobs/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const stories = page.locator('.post');
    expect(await stories.count()).toBeGreaterThanOrEqual(1);
    // Jobs should not show "points by" in the laptop subtext
    const firstSubtext = stories.first().locator('.subtext-laptop');
    await expect(firstSubtext).not.toContainText(/points by/);
  });

  test('10. Jobs page shows Y Combinator header text', async ({ page }) => {
    await page.goto('/jobs/1');
    await page.waitForSelector('.job-header', { timeout: 15000 });
    const header = page.locator('.job-header');
    await expect(header).toContainText('Y Combinator');
  });

  test('11. External URL items have <a> with correct href', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Find a title link that has an external href (starts with http)
    const externalLinks = page.locator('.post a.title[href^="http"]');
    const count = await externalLinks.count();
    if (count > 0) {
      const href = await externalLinks.first().getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test('12. Internal URL items (Ask HN) link to /item/:id', async ({ page }) => {
    await page.goto('/ask/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Ask HN items link internally to /item/:id
    const internalLinks = page.locator('.post a.title[href*="/item/"]');
    const count = await internalLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const href = await internalLinks.first().getAttribute('href');
    expect(href).toMatch(/\/item\/\d+/);
  });

  test('screenshot: feed page at 1280px default theme', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    await page.screenshot({ path: `${screenshotDir}/feed-1280-default.png`, fullPage: true });
  });

  test('screenshot: feed page at 1280px night theme', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Set night theme via settings
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click('input[value="night"]');
    await page.click('.close');
    await page.screenshot({ path: `${screenshotDir}/feed-1280-night.png`, fullPage: true });
  });
});

test.describe('Feed Pages - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('13. /news/1 renders mobile layout', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const stories = page.locator('.post');
    expect(await stories.count()).toBeGreaterThanOrEqual(1);
    // Mobile layout: subtext-palm should be visible
    const palm = stories.first().locator('.subtext-palm');
    await expect(palm).toBeVisible();
  });

  test('14. Top margin applied for fixed header clearance', async ({ page }) => {
    await page.goto('/news/1');
    // The ol element gets .list-margin class which provides margin-top: 55px at mobile
    await page.waitForSelector('ol.list-margin', { timeout: 15000 });
    const listElement = page.locator('ol.list-margin');
    const marginTop = await listElement.evaluate(el => {
      return window.getComputedStyle(el).marginTop;
    });
    // At mobile size, there should be top margin for the fixed header (55px)
    const marginValue = parseInt(marginTop, 10);
    expect(marginValue).toBeGreaterThan(0);
  });

  test('screenshot: feed page at 375px', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    await page.screenshot({ path: `${screenshotDir}/feed-375-default.png`, fullPage: true });
  });
});

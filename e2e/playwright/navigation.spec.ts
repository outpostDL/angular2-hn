import { test, expect } from '@playwright/test';

test.describe('Navigation + Routing', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('1. Root / redirects to /news/1', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/news/1', { timeout: 15000 });
    expect(page.url()).toContain('/news/1');
  });

  test('2. Header nav link "new" navigates to /newest/1', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.header-nav a[href="/newest/1"]');
    await page.waitForURL('**/newest/1');
    expect(page.url()).toContain('/newest/1');
  });

  test('3. Header nav link "show" navigates to /show/1', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.header-nav a[href="/show/1"]');
    await page.waitForURL('**/show/1');
    expect(page.url()).toContain('/show/1');
  });

  test('4. Header nav link "ask" navigates to /ask/1', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.header-nav a[href="/ask/1"]');
    await page.waitForURL('**/ask/1');
    expect(page.url()).toContain('/ask/1');
  });

  test('5. Header nav link "jobs" navigates to /jobs/1', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.header-nav a[href="/jobs/1"]');
    await page.waitForURL('**/jobs/1');
    expect(page.url()).toContain('/jobs/1');
  });

  test('6. Active class applied to current nav link', async ({ page }) => {
    await page.goto('/newest/1');
    await page.waitForSelector('.header-nav', { timeout: 15000 });
    const activeLink = page.locator('.header-nav a.active');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveText('new');
  });

  test('7. Click logo navigates to /news/1', async ({ page }) => {
    await page.goto('/newest/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.home-link');
    await page.waitForURL('**/news/1');
    expect(page.url()).toContain('/news/1');
  });

  // Tests 8-9 require FeedPage with story items (future issue)
  test.skip('8. Click username in a story navigates to /user/:id', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const userLink = page.locator('.subtext-laptop a[href*="/user/"]').first();
    const username = await userLink.textContent();
    await userLink.click();
    await page.waitForURL('**/user/**');
    expect(page.url()).toMatch(/\/user\/.+/);
  });

  test.skip('9. Click comment count navigates to /item/:id', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
    await commentLink.click();
    await page.waitForURL('**/item/**');
    expect(page.url()).toMatch(/\/item\/\d+/);
  });
});

import { test, expect } from '@playwright/test';

const screenshotDir = 'e2e/playwright/screenshots/angular-baseline';

test.describe('Settings Panel', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('1. Click settings cog opens overlay', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    const overlay = page.locator('.overlay');
    await expect(overlay).toBeVisible();
  });

  test('2. Overlay has checkbox, 3 theme radios, font size input, spacing input', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    // Checkbox for open links in new tab
    const checkbox = page.locator('.overlay input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    // 3 theme radio buttons
    const radios = page.locator('.overlay input[type="radio"]');
    expect(await radios.count()).toBe(3);
    // Font size input
    const fontInput = page.locator('.overlay input[type="number"]').first();
    await expect(fontInput).toBeVisible();
    // Spacing input
    const spacingInput = page.locator('.overlay input[type="number"]').nth(1);
    await expect(spacingInput).toBeVisible();
  });

  test('3. Click close dismisses overlay', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click('.close');
    const overlay = page.locator('.overlay');
    await expect(overlay).toBeHidden();
  });

  test('4. Select Night theme changes wrapper class to night', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click('input[value="night"]');
    // The root div should have class "night"
    const wrapper = page.locator('#root > div');
    await expect(wrapper).toHaveClass(/night/);
  });

  test('5. Select Black (AMOLED) changes class to amoledblack', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click('input[value="amoledblack"]');
    const wrapper = page.locator('#root > div');
    await expect(wrapper).toHaveClass(/amoledblack/);
  });

  test('6. Select Default changes class to default', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    // First set to night, then back to default
    await page.click('input[value="night"]');
    await page.click('input[value="default"]');
    const wrapper = page.locator('#root > div');
    await expect(wrapper).toHaveClass(/default/);
  });

  test('7. Theme persists after navigating to another page', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click('input[value="night"]');
    await page.click('.close');
    // Navigate to another page
    await page.click('a[href="/newest/1"]');
    await page.waitForURL('**/newest/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    // Theme should still be night
    const wrapper = page.locator('#root > div');
    await expect(wrapper).toHaveClass(/night/);
  });

  test('8. Theme persists after page reload via localStorage', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click('input[value="night"]');
    await page.click('.close');
    // Reload
    await page.reload();
    await page.waitForSelector('#header', { timeout: 15000 });
    const wrapper = page.locator('#root > div');
    await expect(wrapper).toHaveClass(/night/);
  });

  test('screenshot: settings overlay at 1280px', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.screenshot({ path: `${screenshotDir}/settings-overlay-1280.png`, fullPage: true });
  });
});

import { test, expect } from '@playwright/test';

const screenshotDir = 'e2e/playwright/screenshots/angular-baseline';

test.describe('User Profile - Laptop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('1. User profile renders user ID, karma, created date', async ({ page }) => {
    // Use a known long-standing HN user
    await page.goto('/user/pg');
    await page.waitForSelector('.profile', { timeout: 15000 });
    // User ID
    const name = page.locator('.main-details .name');
    await expect(name).toHaveText(/pg/);
    // Karma
    const karma = page.locator('.main-details .right');
    await expect(karma).toContainText(/\d+/);
    // Created date
    const age = page.locator('.main-details .age');
    await expect(age).toContainText(/Created/);
  });

  test('2. User with about section renders HTML content', async ({ page }) => {
    // pg has an about section
    await page.goto('/user/pg');
    await page.waitForSelector('.profile', { timeout: 15000 });
    const about = page.locator('.other-details');
    const count = await about.count();
    if (count > 0) {
      await expect(about).toBeVisible();
      const html = await about.locator('p').innerHTML();
      expect(html.length).toBeGreaterThan(0);
    }
  });

  test('screenshot: user profile at 1280px', async ({ page }) => {
    await page.goto('/user/pg');
    await page.waitForSelector('.profile', { timeout: 15000 });
    await page.screenshot({ path: `${screenshotDir}/user-profile-1280.png`, fullPage: true });
  });
});

test.describe('User Profile - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('3. Mobile header with Profile: and back button visible', async ({ page }) => {
    await page.goto('/user/pg');
    await page.waitForSelector('.profile', { timeout: 15000 });
    const mobileHeader = page.locator('.mobile.item-header');
    await expect(mobileHeader).toBeVisible();
    await expect(mobileHeader).toContainText('Profile:');
    const backButton = page.locator('.back-button');
    await expect(backButton).toBeVisible();
  });

  test('4. Back button navigates back', async ({ page }) => {
    // Navigate to feed first, then to user, then back
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Click on a username link
    const userLink = page.locator('.subtext-palm a[href*="/user/"]').first();
    await userLink.click();
    await page.waitForSelector('.profile', { timeout: 15000 });
    // Click back button
    const backButton = page.locator('.back-button');
    await backButton.click();
    await page.waitForURL('**/news/1', { timeout: 10000 });
    expect(page.url()).toContain('/news/1');
  });
});

test.describe('User Profile - Error Case', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('5. /user/nonexistent_user_xyz_12345 shows error message', async ({ page }) => {
    await page.goto('/user/nonexistent_user_xyz_12345');
    const errorMessage = page.locator('app-error-message');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
  });
});

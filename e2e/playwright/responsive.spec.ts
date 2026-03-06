import { test, expect } from '@playwright/test';

test.describe('Responsive Layout - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('1. Header is fixed position at mobile', async ({ page }) => {
    await page.goto('/news/1');
    // Wait for feed content to confirm page loaded
    await page.waitForSelector('.post', { timeout: 15000 });
    // The #header div (inside <header> element) gets position: fixed at mobile
    const headerDiv = page.locator('#header');
    await expect(headerDiv).toBeAttached();
    const position = await headerDiv.evaluate(el => {
      return window.getComputedStyle(el).position;
    });
    expect(position).toBe('fixed');
  });

  test('2. Feed page items use mobile layout', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const firstPost = page.locator('.post').first();
    // Mobile layout: subtext-palm should be visible
    const palm = firstPost.locator('.subtext-palm');
    await expect(palm).toBeVisible();
    // Laptop subtext should be hidden
    const laptop = firstPost.locator('.subtext-laptop');
    await expect(laptop).toBeHidden();
  });
});

test.describe('Responsive Layout - Laptop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('3. Header is static/relative position at laptop', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    const headerDiv = page.locator('#header');
    const position = await headerDiv.evaluate(el => {
      return window.getComputedStyle(el).position;
    });
    // Should be static or relative, not fixed
    expect(['static', 'relative']).toContain(position);
  });

  test('4. Feed page items use laptop layout', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const firstPost = page.locator('.post').first();
    // Laptop layout: subtext-laptop should be visible
    const laptop = firstPost.locator('.subtext-laptop');
    await expect(laptop).toBeVisible();
    // Palm subtext should be hidden
    const palm = firstPost.locator('.subtext-palm');
    await expect(palm).toBeHidden();
  });
});

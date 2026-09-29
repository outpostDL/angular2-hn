import { test, expect } from '@playwright/test';

/**
 * Theme Checkpoint Tests (DAN-40)
 * Validates theme switching, SCSS scoping, and responsive layouts
 * at 375px (mobile) and 1280px (laptop) for all 3 themes.
 */

const themes = ['default', 'night', 'amoledblack'] as const;

// Expected header background colors per theme
const expectedHeaderBg: Record<string, string> = {
  default: 'rgb(185, 43, 39)',   // #b92b27
  night: 'rgb(38, 50, 56)',      // #263238
  amoledblack: 'rgb(0, 0, 0)',   // #000
};

// Expected body-cover background colors per theme
const expectedBodyBg: Record<string, string> = {
  default: 'rgb(255, 255, 255)', // #fff
  night: 'rgb(55, 71, 79)',      // #37474F
  amoledblack: 'rgb(0, 0, 0)',   // #000
};

async function switchTheme(page: import('@playwright/test').Page, theme: string) {
  await page.click('.settings');
  await page.waitForSelector('.overlay', { timeout: 5000 });
  await page.click(`input[value="${theme}"]`);
  await page.click('.close');
}

// ─── Theme Switching at Laptop (1280px) ───

test.describe('Theme Checkpoint - Laptop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const theme of themes) {
    test(`1. ${theme} theme: header bg, body bg, footer border change correctly`, async ({ page }) => {
      await page.goto('/news/1');
      await page.waitForSelector('#header', { timeout: 15000 });

      if (theme !== 'default') {
        await switchTheme(page, theme);
      }

      // Verify header background color
      const headerBg = await page.locator('#header').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(headerBg).toBe(expectedHeaderBg[theme]);

      // Verify body-cover background color
      const bodyBg = await page.locator('.body-cover').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bodyBg).toBe(expectedBodyBg[theme]);

      // Verify footer border-top exists (non-empty border)
      const footerBorder = await page.locator('#footer').evaluate(el =>
        window.getComputedStyle(el).borderTopStyle
      );
      expect(footerBorder).toBe('solid');
    });
  }

  test('2. Theme wrapper class matches selected theme', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });

    const wrapper = page.locator('#root > div');

    // Default theme
    await expect(wrapper).toHaveClass(/default/);

    // Switch to night
    await switchTheme(page, 'night');
    await expect(wrapper).toHaveClass(/night/);

    // Switch to amoledblack
    await switchTheme(page, 'amoledblack');
    await expect(wrapper).toHaveClass(/amoledblack/);

    // Switch back to default
    await switchTheme(page, 'default');
    await expect(wrapper).toHaveClass(/default/);
  });
});

// ─── Theme Switching at Mobile (375px) ───

test.describe('Theme Checkpoint - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const theme of themes) {
    test(`3. ${theme} theme at mobile: header bg, body bg change correctly`, async ({ page }) => {
      await page.goto('/news/1');
      await page.waitForSelector('#header', { timeout: 15000 });

      if (theme !== 'default') {
        await switchTheme(page, theme);
      }

      // Verify header background color
      const headerBg = await page.locator('#header').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(headerBg).toBe(expectedHeaderBg[theme]);

      // Verify body-cover background color (mobile uses wrapper-mobile-background-color)
      const bodyBg = await page.locator('.body-cover').evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      // On mobile, default uses white wrapper-mobile-bg, night uses #263238, amoledblack uses #000
      const expectedMobileBg: Record<string, string> = {
        default: 'rgb(255, 255, 255)', // #fff
        night: 'rgb(38, 50, 56)',      // #263238
        amoledblack: 'rgb(0, 0, 0)',   // #000
      };
      expect(bodyBg).toBe(expectedMobileBg[theme]);
    });
  }

  test('4. Footer is hidden on mobile', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    const footer = page.locator('#footer');
    await expect(footer).toBeHidden();
  });
});

// ─── SCSS Scoping Validation ───

test.describe('SCSS Scoping - No Leaking', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('5. Header styles do not leak into page content', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });
    await page.waitForSelector('.feed-page', { timeout: 15000 });

    // The feed-page paragraph should NOT have header background color
    const feedPageBg = await page.locator('.feed-page').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    // Feed page should have transparent bg (inherits from wrapper, not header)
    expect(feedPageBg).not.toBe(expectedHeaderBg['default']);
  });

  test('6. Theme class scoping: night theme only affects elements inside .night wrapper', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });

    // Switch to night theme
    await switchTheme(page, 'night');

    // The wrapper div should have night class
    const wrapper = page.locator('#root > div');
    await expect(wrapper).toHaveClass(/night/);

    // Header should have night background
    const headerBg = await page.locator('#header').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(headerBg).toBe(expectedHeaderBg['night']);

    // Body element itself should NOT have the night wrapper background directly
    // (it's applied through .body-cover, not body element)
    const bodyBg = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    // body bg should not be the night wrapper bg color
    expect(bodyBg).not.toBe('rgb(38, 50, 56)');
  });
});

// ─── Responsive Layout Checkpoint ───

test.describe('Responsive Layout Checkpoint - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('7. Mobile (375px): wrapper is 100% width', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });

    const wrapperWidth = await page.locator('.wrapper').evaluate(el => {
      return el.getBoundingClientRect().width;
    });
    // At mobile, wrapper should be ~100% of 375px
    expect(wrapperWidth).toBeGreaterThanOrEqual(370);
    expect(wrapperWidth).toBeLessThanOrEqual(375);
  });
});

test.describe('Responsive Layout Checkpoint - Laptop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('8. Laptop (1280px): wrapper is ~85% width', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('#header', { timeout: 15000 });

    const wrapperWidth = await page.locator('.wrapper').evaluate(el => {
      return el.getBoundingClientRect().width;
    });
    // At 1280px, wrapper should be ~85% = ~1088px
    expect(wrapperWidth).toBeGreaterThanOrEqual(1050);
    expect(wrapperWidth).toBeLessThanOrEqual(1100);
  });
});

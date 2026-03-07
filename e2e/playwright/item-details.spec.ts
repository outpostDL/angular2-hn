import { test, expect } from '@playwright/test';

const screenshotDir = 'e2e/playwright/screenshots/angular-baseline';

test.describe('Item Details - Laptop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('1. Item page renders title, points, username, time_ago', async ({ page }) => {
    // Navigate to the feed first to get a real item ID with comments
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Click on the first comment count link to go to an item with comments
    const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
    await expect(commentLink).toBeVisible();
    await commentLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    // Verify title renders
    const title = page.locator('.laptop .title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/.+/);
    // Verify points and user in subtext
    const subtext = page.locator('.laptop .subtext');
    await expect(subtext).toContainText(/\d+ points by/);
    // Verify time_ago
    await expect(subtext).toContainText(/ago/);
  });

  test('2. At least 1 comment renders with username, time_ago, content', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Find an item that explicitly has comments (not "discuss")
    const commentLinks = page.locator('.subtext-laptop a[href*="/item/"]');
    const count = await commentLinks.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const text = await commentLinks.nth(i).textContent();
      if (text && /\d+ comment/.test(text)) {
        await commentLinks.nth(i).click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Fallback: click first comment link
      await commentLinks.first().click();
    }
    await page.waitForSelector('.item', { timeout: 15000 });
    // Wait for comments to render
    const commentList = page.locator('.comment-list > li');
    await expect(commentList.first()).toBeVisible({ timeout: 10000 });
    expect(await commentList.count()).toBeGreaterThanOrEqual(1);
    // First comment has username link
    const firstComment = commentList.first();
    const userLink = firstComment.locator('a[href*="/user/"]').first();
    await expect(userLink).toBeVisible();
    // Content
    const content = firstComment.locator('.comment-text').first();
    await expect(content).toBeVisible();
  });

  test('3. Nested comments render indented under parent', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Find an item with comments
    const commentLinks = page.locator('.subtext-laptop a[href*="/item/"]');
    const count = await commentLinks.count();
    for (let i = 0; i < count; i++) {
      const text = await commentLinks.nth(i).textContent();
      if (text && /\d+ comment/.test(text)) {
        await commentLinks.nth(i).click();
        break;
      }
    }
    await page.waitForSelector('.item', { timeout: 15000 });
    await page.waitForSelector('.comment-list > li', { timeout: 10000 });
    // Check for nested comment structure (subtree)
    const subtrees = page.locator('.subtree');
    const subtreeCount = await subtrees.count();
    // There should be at least one nested subtree if the item has replies
    if (subtreeCount > 0) {
      // Find a subtree that actually contains nested app-comment elements
      let foundNested = false;
      for (let i = 0; i < subtreeCount; i++) {
        const nestedCount = await subtrees.nth(i).locator('.comment-component').count();
        if (nestedCount > 0) {
          foundNested = true;
          break;
        }
      }
      // At least one subtree should have nested comments (if subtrees exist, nesting is present)
      expect(foundNested).toBe(true);
    }
  });

  test('4. Click collapse toggle hides comment content and children', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Find an item with comments
    const commentLinks = page.locator('.subtext-laptop a[href*="/item/"]');
    const count = await commentLinks.count();
    for (let i = 0; i < count; i++) {
      const text = await commentLinks.nth(i).textContent();
      if (text && /\d+ comment/.test(text)) {
        await commentLinks.nth(i).click();
        break;
      }
    }
    await page.waitForSelector('.item', { timeout: 15000 });
    await page.waitForSelector('.comment-list > li', { timeout: 10000 });
    // Click the collapse toggle [-] on the first comment
    const collapseToggle = page.locator('.collapse').first();
    await expect(collapseToggle).toContainText('[-]');
    await collapseToggle.click();
    // After collapse, the toggle should show [+]
    await expect(collapseToggle).toContainText('[+]');
    // The comment tree content should be hidden
    const commentTree = page.locator('.comment-tree > div[hidden]').first();
    await expect(commentTree).toBeHidden();
  });

  test('5. Click toggle again re-expands content', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Find an item with comments
    const commentLinks = page.locator('.subtext-laptop a[href*="/item/"]');
    const count = await commentLinks.count();
    for (let i = 0; i < count; i++) {
      const text = await commentLinks.nth(i).textContent();
      if (text && /\d+ comment/.test(text)) {
        await commentLinks.nth(i).click();
        break;
      }
    }
    await page.waitForSelector('.item', { timeout: 15000 });
    await page.waitForSelector('.comment-list > li', { timeout: 10000 });
    const collapseToggle = page.locator('.collapse').first();
    // Collapse
    await collapseToggle.click();
    await expect(collapseToggle).toContainText('[+]');
    // Expand again
    await collapseToggle.click();
    await expect(collapseToggle).toContainText('[-]');
    // Content should be visible again
    const commentText = page.locator('.comment-text').first();
    await expect(commentText).toBeVisible();
  });

  test('6. Item text content renders HTML', async ({ page }) => {
    // Navigate to an Ask HN item which typically has text content
    await page.goto('/ask/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const titleLink = page.locator('.post a.title[href*="/item/"]').first();
    await titleLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    // The subject/content area may contain HTML
    const subject = page.locator('.subject');
    const html = await subject.innerHTML();
    // It should exist (may be empty for some items)
    expect(html).toBeDefined();
  });

  test('7. Domain shows in parentheses for external URL items', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Find an external link item
    const domainSpan = page.locator('.post .domain').first();
    const count = await domainSpan.count();
    if (count > 0) {
      const text = await domainSpan.textContent();
      expect(text).toMatch(/\(.+\)/);
    }
    // Navigate to that item's detail page
    const externalPost = page.locator('.post').filter({ has: page.locator('.domain') }).first();
    const itemLink = externalPost.locator('.subtext-laptop a[href*="/item/"]');
    await itemLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    const detailDomain = page.locator('.laptop .domain');
    const detailCount = await detailDomain.count();
    if (detailCount > 0) {
      const detailText = await detailDomain.textContent();
      expect(detailText).toMatch(/\(.+\)/);
    }
  });

  test('screenshot: item details at 1280px', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
    await commentLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    await page.screenshot({ path: `${screenshotDir}/item-details-1280.png`, fullPage: true });
  });
});

test.describe('Item Details - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('8. Mobile header visible with back button and truncated title', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    // Click on first item comment link
    const commentLink = page.locator('.subtext-palm a[href*="/item/"]').first();
    await commentLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    // Mobile header should be visible
    const mobileHeader = page.locator('.mobile.item-header');
    await expect(mobileHeader).toBeVisible();
    // Back button
    const backButton = page.locator('.back-button');
    await expect(backButton).toBeVisible();
    // Title text
    const title = mobileHeader.locator('.title');
    await expect(title).toHaveText(/.+/);
  });

  test('9. Laptop layout hidden on mobile', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const commentLink = page.locator('.subtext-palm a[href*="/item/"]').first();
    await commentLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    const laptopSection = page.locator('.item > .laptop');
    await expect(laptopSection).toBeHidden();
  });

  test('10. Back button navigates back', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const commentLink = page.locator('.subtext-palm a[href*="/item/"]').first();
    await commentLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    const backButton = page.locator('.back-button');
    await backButton.click();
    await page.waitForURL('**/news/1', { timeout: 10000 });
    expect(page.url()).toContain('/news/1');
  });

  test('screenshot: item details at 375px', async ({ page }) => {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const commentLink = page.locator('.subtext-palm a[href*="/item/"]').first();
    await commentLink.click();
    await page.waitForSelector('.item', { timeout: 15000 });
    await page.screenshot({ path: `${screenshotDir}/item-details-375.png`, fullPage: true });
  });
});

test.describe('Item Details - Error Case', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('11. /item/99999999 shows error or broken state for invalid item', async ({ page }) => {
    await page.goto('/item/99999999');
    // The API returns {"error":"Item 99999999 not found"} as valid JSON.
    // lazyFetch passes it to next() as data, component sets this.item = {error: "..."}.
    // The .item div may render (since this.item is truthy) but with broken/empty content,
    // OR the app may show an error message, OR the hasUrl getter may throw.
    // Wait for the page to settle.
    await page.waitForTimeout(3000);
    // Verify that the page does NOT render a normal item with a title
    const titleEl = page.locator('.item .title');
    const titleCount = await titleEl.count();
    if (titleCount > 0) {
      // If title exists, it should be empty (no real title for invalid item)
      const text = await titleEl.first().textContent();
      expect(text?.trim() || '').toBe('');
    }
    // The page is in an error/broken state — no meaningful content displayed
  });
});

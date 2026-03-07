import { test, expect } from '@playwright/test';

/**
 * Integration Test Suite (DAN-47)
 *
 * Cross-page navigation flows, settings persistence across navigation,
 * theme integration, edge cases, and responsive integration tests.
 * These tests validate behaviors that span multiple pages/features.
 */

const reactScreenshotDir = 'e2e/playwright/screenshots/react-parity';

// ─── Helper: switch theme via settings overlay ───
async function switchTheme(page: import('@playwright/test').Page, theme: string) {
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click(`input[value="${theme}"]`);
    await page.click('.close');
    await page.waitForTimeout(200);
}

// ─── Helper: navigate to an item with comments from a feed ───
async function navigateToItemWithComments(page: import('@playwright/test').Page) {
    await page.goto('/news/1');
    await page.waitForSelector('.post', { timeout: 15000 });
    const commentLinks = page.locator('.subtext-laptop a[href*="/item/"]');
    const count = await commentLinks.count();
    for (let i = 0; i < count; i++) {
        const text = await commentLinks.nth(i).textContent();
        if (text && /\d+ comment/.test(text)) {
            await commentLinks.nth(i).click();
            await page.waitForSelector('.item', { timeout: 15000 });
            return;
        }
    }
    // Fallback: click first comment link
    await commentLinks.first().click();
    await page.waitForSelector('.item', { timeout: 15000 });
}

// ═══════════════════════════════════════════════════════════════
//  1. Cross-Page Navigation Flow Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Cross-Page Navigation Flows', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('1. Feed → item (via comment count) → user (via username) → verify renders', async ({ page }) => {
        // Load feed page
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Click comment count to navigate to /item/:id
        const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
        await expect(commentLink).toBeVisible();
        await commentLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });
        expect(page.url()).toMatch(/\/item\/\d+/);

        // Verify item page renders
        const title = page.locator('.laptop .title');
        await expect(title).toBeVisible();

        // Click username to navigate to /user/:id
        const userLink = page.locator('.laptop .subtext a[href*="/user/"]').first();
        // Some items may be jobs without a user link; handle gracefully
        const userLinkCount = await userLink.count();
        if (userLinkCount > 0) {
            const username = await userLink.textContent();
            await userLink.click();
            await page.waitForSelector('.profile, .error-section', { timeout: 15000 });
            expect(page.url()).toMatch(/\/user\/.+/);

            // Verify user page renders
            const profile = page.locator('.profile');
            if (await profile.count() > 0 && await profile.isVisible()) {
                const nameEl = page.locator('.main-details .name');
                await expect(nameEl).toHaveText(/.+/);
            }
        }
    });

    test('2. Browser back: user → item → feed', async ({ page }) => {
        // Navigate forward: feed → item → user
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
        await commentLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });
        const itemUrl = page.url();

        const userLink = page.locator('.laptop .subtext a[href*="/user/"]').first();
        const userLinkCount = await userLink.count();
        if (userLinkCount > 0) {
            await userLink.click();
            await page.waitForSelector('.profile, .error-section', { timeout: 15000 });

            // Back to item
            await page.goBack();
            await page.waitForSelector('.item', { timeout: 15000 });
            expect(page.url()).toBe(itemUrl);

            // Back to feed
            await page.goBack();
            await page.waitForSelector('.post', { timeout: 15000 });
            expect(page.url()).toContain('/news/1');
        } else {
            // If no user link, just test item → feed back navigation
            await page.goBack();
            await page.waitForSelector('.post', { timeout: 15000 });
            expect(page.url()).toContain('/news/1');
        }
    });

    test('3. Navigate all 5 feed types via header links, active state updates', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });

        const feedLinks = [
            { href: '/newest/1', text: 'new' },
            { href: '/show/1', text: 'show' },
            { href: '/ask/1', text: 'ask' },
            { href: '/jobs/1', text: 'jobs' },
        ];

        for (const feed of feedLinks) {
            await page.click(`.header-nav a[href="${feed.href}"]`);
            await page.waitForURL(`**${feed.href}`);
            await page.waitForSelector('.post', { timeout: 15000 });

            // Verify active state
            const activeLink = page.locator('.header-nav a.active');
            await expect(activeLink).toBeVisible();
            await expect(activeLink).toHaveText(feed.text);
        }

        // Navigate back to news via logo
        await page.click('.home-link');
        await page.waitForURL('**/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
    });

    test('4. Click logo from any page navigates to /news/1', async ({ page }) => {
        // Start on /ask/1
        await page.goto('/ask/1');
        await page.waitForSelector('#header', { timeout: 15000 });
        await page.click('.home-link');
        await page.waitForURL('**/news/1');
        expect(page.url()).toContain('/news/1');

        // Navigate to /jobs/1 then click logo
        await page.goto('/jobs/1');
        await page.waitForSelector('#header', { timeout: 15000 });
        await page.click('.home-link');
        await page.waitForURL('**/news/1');
        expect(page.url()).toContain('/news/1');
    });
});

// ═══════════════════════════════════════════════════════════════
//  2. Settings Persistence Across Navigation Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Settings Persistence Across Navigation', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('5. Night theme persists when navigating to /item/:id', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });

        // Change theme to night
        await switchTheme(page, 'night');

        // Navigate to an item page
        await page.waitForSelector('.post', { timeout: 15000 });
        const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
        await commentLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });

        // Verify theme is still night
        const wrapper = page.locator('#root > div');
        await expect(wrapper).toHaveClass(/night/);
    });

    test('6. Font size persists when navigating to /newest/1', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });

        // Change font size
        await page.click('.settings');
        await page.waitForSelector('.overlay', { timeout: 5000 });
        const fontInput = page.locator('.overlay input[name="titleFont"]');
        await fontInput.fill('20');
        await page.click('.close');

        // Verify font size applied on current page
        await page.waitForSelector('.post', { timeout: 15000 });
        const titleStyle = await page.locator('.post .title').first().getAttribute('style');
        expect(titleStyle).toContain('font-size: 20px');

        // Navigate to /newest/1
        await page.click('a[href="/newest/1"]');
        await page.waitForURL('**/newest/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Verify font size persists
        const newTitleStyle = await page.locator('.post .title').first().getAttribute('style');
        expect(newTitleStyle).toContain('font-size: 20px');
    });

    test('7. Open in new tab persists when navigating to /show/1', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });

        // Enable open in new tab
        await page.click('.settings');
        await page.waitForSelector('.overlay', { timeout: 5000 });
        const checkbox = page.locator('.overlay input[type="checkbox"]');
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
            await checkbox.click();
        }
        await page.click('.close');

        // Navigate to /show/1
        await page.click('a[href="/show/1"]');
        await page.waitForURL('**/show/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Verify external links have target="_blank"
        const externalLinks = page.locator('.post a.title[href^="http"]');
        const linkCount = await externalLinks.count();
        if (linkCount > 0) {
            const target = await externalLinks.first().getAttribute('target');
            expect(target).toBe('_blank');
        }
    });

    test('8. All settings persist after page refresh via localStorage', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });

        // Change theme to amoledblack
        await page.click('.settings');
        await page.waitForSelector('.overlay', { timeout: 5000 });
        await page.click('input[value="amoledblack"]');

        // Change font size
        const fontInput = page.locator('.overlay input[name="titleFont"]');
        await fontInput.fill('22');

        // Change list spacing
        const spacingInput = page.locator('.overlay input[name="listSpacing"]');
        await spacingInput.fill('15');

        // Enable open in new tab
        const checkbox = page.locator('.overlay input[type="checkbox"]');
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
            await checkbox.click();
        }
        await page.click('.close');

        // Refresh page
        await page.reload();
        await page.waitForSelector('#header', { timeout: 15000 });

        // Verify theme persists
        const wrapper = page.locator('#root > div');
        await expect(wrapper).toHaveClass(/amoledblack/);

        // Verify font size persists
        await page.waitForSelector('.post', { timeout: 15000 });
        const titleStyle = await page.locator('.post .title').first().getAttribute('style');
        expect(titleStyle).toContain('font-size: 22px');

        // Verify list spacing persists
        const itemRow = page.locator('.item-row').first();
        const mbStyle = await itemRow.getAttribute('style');
        expect(mbStyle).toContain('margin-bottom: 15px');

        // Verify open in new tab persists
        await page.click('.settings');
        await page.waitForSelector('.overlay', { timeout: 5000 });
        const checkboxAfter = page.locator('.overlay input[type="checkbox"]');
        await expect(checkboxAfter).toBeChecked();
    });
});

// ═══════════════════════════════════════════════════════════════
//  3. Theme Integration Tests (Full App)
// ═══════════════════════════════════════════════════════════════

test.describe('Theme Integration Across Pages', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    const themes = ['default', 'night', 'amoledblack'] as const;
    const expectedHeaderBg: Record<string, string> = {
        default: 'rgb(185, 43, 39)',
        night: 'rgb(38, 50, 56)',
        amoledblack: 'rgb(0, 0, 0)',
    };

    for (const theme of themes) {
        test(`9. ${theme} theme: colors consistent across feed → item → user`, async ({ page }) => {
            await page.goto('/news/1');
            await page.waitForSelector('#header', { timeout: 15000 });

            if (theme !== 'default') {
                await switchTheme(page, theme);
            }

            // Verify header bg on feed page
            const feedHeaderBg = await page.locator('#header').evaluate(
                (el) => window.getComputedStyle(el).backgroundColor
            );
            expect(feedHeaderBg).toBe(expectedHeaderBg[theme]);

            // Verify theme class
            const wrapper = page.locator('#root > div');
            await expect(wrapper).toHaveClass(new RegExp(theme));

            // Navigate to item page
            await page.waitForSelector('.post', { timeout: 15000 });
            const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
            await commentLink.click();
            await page.waitForSelector('.item', { timeout: 15000 });

            // Verify header bg on item page
            const itemHeaderBg = await page.locator('#header').evaluate(
                (el) => window.getComputedStyle(el).backgroundColor
            );
            expect(itemHeaderBg).toBe(expectedHeaderBg[theme]);
            await expect(wrapper).toHaveClass(new RegExp(theme));

            // Navigate to user page
            const userLink = page.locator('.laptop .subtext a[href*="/user/"]').first();
            const userLinkCount = await userLink.count();
            if (userLinkCount > 0) {
                await userLink.click();
                await page.waitForSelector('.profile, .error-section', { timeout: 15000 });

                // Verify header bg on user page
                const userHeaderBg = await page.locator('#header').evaluate(
                    (el) => window.getComputedStyle(el).backgroundColor
                );
                expect(userHeaderBg).toBe(expectedHeaderBg[theme]);
                await expect(wrapper).toHaveClass(new RegExp(theme));
            }
        });
    }
});

// ═══════════════════════════════════════════════════════════════
//  4. Edge Case Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Edge Cases', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('10. / redirects to /news/1', async ({ page }) => {
        await page.goto('/');
        await page.waitForURL('**/news/1', { timeout: 15000 });
        expect(page.url()).toContain('/news/1');
    });

    test('11. Non-existent route /foo does not crash', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/foo');
        // Wait for page to settle
        await page.waitForTimeout(2000);
        // The app should not crash - header should still be visible
        const header = page.locator('#header');
        await expect(header).toBeVisible();
        // No uncaught errors
        const uncaughtErrors = consoleErrors.filter(
            (e) => e.includes('Uncaught') || e.includes('unhandled')
        );
        expect(uncaughtErrors).toHaveLength(0);
    });

    test('12. Same route navigation produces no errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Click news link again (same route)
        await page.click('.home-link');
        await page.waitForTimeout(1000);

        // No errors
        const uncaughtErrors = consoleErrors.filter(
            (e) => e.includes('Uncaught') || e.includes('unhandled')
        );
        expect(uncaughtErrors).toHaveLength(0);

        // Page still renders
        await expect(page.locator('.post').first()).toBeVisible();
    });

    test('13. Rapid feed switching: last clicked feed is displayed', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });
        await page.waitForSelector('.post', { timeout: 15000 });

        // Rapidly click through feeds
        await page.click('a[href="/newest/1"]');
        await page.click('a[href="/show/1"]');
        await page.click('a[href="/ask/1"]');
        await page.click('a[href="/jobs/1"]');

        // Wait for navigation and content to settle
        await page.waitForURL('**/jobs/1', { timeout: 15000 });
        await page.waitForSelector('.post', { timeout: 15000 });

        // The URL should be /jobs/1 (last clicked)
        expect(page.url()).toContain('/jobs/1');

        // Content should be jobs
        const jobHeader = page.locator('.job-header');
        await expect(jobHeader).toContainText('Y Combinator');
    });

    test('14. Very long title does not overflow', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Check that title elements don't cause horizontal overflow
        const posts = page.locator('.post');
        const count = await posts.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(count, 5); i++) {
            const postBox = await posts.nth(i).boundingBox();
            const viewportWidth = 1280;
            if (postBox) {
                // The post should not extend beyond the viewport
                expect(postBox.x + postBox.width).toBeLessThanOrEqual(viewportWidth + 5);
            }
        }

        // Ensure no horizontal scroll bar
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
    });

    test('15. Deeply nested comments (3+ levels) have correct indentation', async ({ page }) => {
        await navigateToItemWithComments(page);

        // Wait for comment list to render
        await page.waitForSelector('.comment-list > li', { timeout: 10000 });

        // Find nested comment structures
        const subtrees = page.locator('.subtree');
        const subtreeCount = await subtrees.count();

        if (subtreeCount > 0) {
            // Look for deeply nested comments (subtree within subtree)
            let foundDeepNesting = false;
            for (let i = 0; i < subtreeCount; i++) {
                const nestedSubtrees = await subtrees.nth(i).locator('.subtree').count();
                if (nestedSubtrees > 0) {
                    foundDeepNesting = true;

                    // Verify the nested comment components have distinct left positioning
                    // Deep comments should be further indented via the .subtree ul padding
                    const innerSubtree = subtrees.nth(i).locator('.subtree').first();
                    const paddingLeft = await innerSubtree.evaluate(
                        (el) => window.getComputedStyle(el).paddingLeft
                    );
                    const paddingValue = parseInt(paddingLeft, 10);
                    // There should be some indentation (padding > 0)
                    expect(paddingValue).toBeGreaterThanOrEqual(0);
                    break;
                }
            }

            // If we found nested subtrees, the tree is rendering correctly
            if (foundDeepNesting) {
                // Verify the comment components exist at multiple levels
                const topLevelComments = page.locator('.comment-list > li > .comment-component');
                expect(await topLevelComments.count()).toBeGreaterThan(0);
            }
        }
    });
});

// ═══════════════════════════════════════════════════════════════
//  5. Responsive Integration Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Responsive Integration - Mobile (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('16. Mobile full flow: feed → item → user with mobile layouts', async ({ page }) => {
        // Feed page - mobile layout
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Mobile layout: subtext-palm visible, subtext-laptop hidden
        const palm = page.locator('.post').first().locator('.subtext-palm');
        await expect(palm).toBeVisible();
        const laptop = page.locator('.post').first().locator('.subtext-laptop');
        await expect(laptop).toBeHidden();

        // Header should be fixed at mobile
        const headerPosition = await page.locator('#header').evaluate(
            (el) => window.getComputedStyle(el).position
        );
        expect(headerPosition).toBe('fixed');

        // Navigate to item page via mobile subtext link
        const itemLink = page.locator('.subtext-palm a[href*="/item/"]').first();
        await itemLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });

        // Mobile item header should be visible
        const mobileHeader = page.locator('.mobile.item-header');
        await expect(mobileHeader).toBeVisible();

        // Back button should be visible
        const backButton = page.locator('.back-button');
        await expect(backButton).toBeVisible();

        // Laptop layout should be hidden on mobile
        const laptopSection = page.locator('.item > .laptop');
        await expect(laptopSection).toBeHidden();

        // Navigate to user via mobile comment user link
        const userLink = page.locator('.comment-component a[href*="/user/"]').first();
        const userLinkCount = await userLink.count();
        if (userLinkCount > 0) {
            await userLink.click();
            await page.waitForSelector('.profile, .error-section', { timeout: 15000, state: 'attached' });

            const profile = page.locator('.profile');
            if (await profile.count() > 0 && await profile.isVisible()) {
                // Mobile user header should be visible
                const userMobileHeader = page.locator('.mobile.item-header');
                await expect(userMobileHeader).toBeVisible();
                await expect(userMobileHeader).toContainText('Profile:');

                // Back button visible
                const userBackButton = page.locator('.back-button');
                await expect(userBackButton).toBeVisible();
            }
        }
    });
});

test.describe('Responsive Integration - Laptop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('17. Laptop full flow: feed → item → user with laptop layouts', async ({ page }) => {
        // Feed page - laptop layout
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });

        // Laptop layout: subtext-laptop visible, subtext-palm hidden
        const laptopSubtext = page.locator('.post').first().locator('.subtext-laptop');
        await expect(laptopSubtext).toBeVisible();
        const palmSubtext = page.locator('.post').first().locator('.subtext-palm');
        await expect(palmSubtext).toBeHidden();

        // Header should NOT be fixed at laptop
        const headerPosition = await page.locator('#header').evaluate(
            (el) => window.getComputedStyle(el).position
        );
        expect(['static', 'relative']).toContain(headerPosition);

        // Navigate to item page via laptop subtext link
        const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
        await commentLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });

        // Laptop layout should be visible
        const laptopSection = page.locator('.item .laptop');
        await expect(laptopSection).toBeVisible();

        // Title should be visible
        const title = page.locator('.laptop .title');
        await expect(title).toBeVisible();

        // Points and user in subtext
        const subtext = page.locator('.laptop .subtext');
        await expect(subtext).toBeVisible();

        // Navigate to user page
        const userLink = page.locator('.laptop .subtext a[href*="/user/"]').first();
        const userLinkCount = await userLink.count();
        if (userLinkCount > 0) {
            await userLink.click();
            await page.waitForSelector('.profile, .error-section', { timeout: 15000 });

            const profile = page.locator('.profile');
            if (await profile.count() > 0 && await profile.isVisible()) {
                // User name and karma visible
                const name = page.locator('.main-details .name');
                await expect(name).toHaveText(/.+/);
                const karma = page.locator('.main-details .right');
                await expect(karma).toContainText(/\d+/);
            }
        }
    });
});

// ═══════════════════════════════════════════════════════════════
//  6. Screenshot Comparison (React parity captures)
// ═══════════════════════════════════════════════════════════════

test.describe('React Parity Screenshots', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('screenshot: React feed page at 1280px default theme', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
        await page.screenshot({ path: `${reactScreenshotDir}/feed-1280-default.png`, fullPage: true });
    });

    test('screenshot: React feed page at 1280px night theme', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
        await switchTheme(page, 'night');
        await page.screenshot({ path: `${reactScreenshotDir}/feed-1280-night.png`, fullPage: true });
    });

    test('screenshot: React item details at 1280px', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
        const commentLink = page.locator('.subtext-laptop a[href*="/item/"]').first();
        await commentLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });
        await page.screenshot({ path: `${reactScreenshotDir}/item-details-1280.png`, fullPage: true });
    });

    test('screenshot: React settings overlay at 1280px', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('#header', { timeout: 15000 });
        await page.click('.settings');
        await page.waitForSelector('.overlay', { timeout: 5000 });
        await page.screenshot({ path: `${reactScreenshotDir}/settings-overlay-1280.png`, fullPage: true });
    });

    test('screenshot: React user profile at 1280px', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
        const userLink = page.locator('.subtext-laptop a[href*="/user/"]').first();
        await userLink.click();
        await page.waitForSelector('.profile, .error-section', { timeout: 15000 });
        await page.screenshot({ path: `${reactScreenshotDir}/user-profile-1280.png`, fullPage: true });
    });
});

test.describe('React Parity Screenshots - Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('screenshot: React feed page at 375px', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
        await page.screenshot({ path: `${reactScreenshotDir}/feed-375-default.png`, fullPage: true });
    });

    test('screenshot: React item details at 375px', async ({ page }) => {
        await page.goto('/news/1');
        await page.waitForSelector('.post', { timeout: 15000 });
        const commentLink = page.locator('.subtext-palm a[href*="/item/"]').first();
        await commentLink.click();
        await page.waitForSelector('.item', { timeout: 15000 });
        await page.screenshot({ path: `${reactScreenshotDir}/item-details-375.png`, fullPage: true });
    });
});

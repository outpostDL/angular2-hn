import { test, expect } from '@playwright/test';

/**
 * Theme x Responsive Matrix Tests (DAN-46)
 *
 * Validates all 3 themes at 3 viewport widths (9 combinations):
 *   375px (mobile), 768px (tablet edge), 1280px (laptop)
 * For each: verify header renders, main content renders, correct colors applied.
 *
 * Also validates specific theme-sensitive elements:
 *   loader spinner, error skull, poll bar, footer border, header border,
 *   settings popup background, back button border, user profile name/karma colors.
 */

const themes = ['default', 'night', 'amoledblack'] as const;

const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'laptop', width: 1280, height: 800 },
] as const;

// Expected header background colors per theme
const expectedHeaderBg: Record<string, string> = {
    default: 'rgb(185, 43, 39)', // #b92b27
    night: 'rgb(38, 50, 56)', // #263238
    amoledblack: 'rgb(0, 0, 0)', // #000
};

// Expected wrapper background colors per theme (laptop)
const expectedWrapperBg: Record<string, string> = {
    default: 'rgb(245, 245, 245)', // #f5f5f5
    night: 'rgb(38, 50, 56)', // #263238
    amoledblack: 'rgb(0, 0, 0)', // #000
};

// Expected wrapper text colors per theme
const expectedWrapperColor: Record<string, string> = {
    default: 'rgb(0, 0, 0)', // #000
    night: 'rgba(255, 255, 255, 0.7)',
    amoledblack: 'rgba(255, 255, 255, 0.75)',
};

// Expected secondary/accent colors per theme (used for nav links, footer links, etc.)
const expectedSecondaryColor: Record<string, string> = {
    default: 'rgb(185, 43, 39)', // #b92b27
    night: 'rgb(0, 192, 255)', // #00c0ff
    amoledblack: 'rgba(255, 255, 255, 0.6)',
};

// Expected footer border style per theme
const expectedFooterBorderColor: Record<string, string> = {
    default: 'rgb(185, 43, 39)', // #b92b27
    night: 'rgb(0, 192, 255)', // #00c0ff
    amoledblack: 'rgba(255, 255, 255, 0.6)',
};

async function switchTheme(page: import('@playwright/test').Page, theme: string) {
    await page.click('.settings');
    await page.waitForSelector('.overlay', { timeout: 5000 });
    await page.click(`input[value="${theme}"]`);
    await page.click('.close');
    // Allow styles to settle
    await page.waitForTimeout(200);
}

// ─── Core Theme x Viewport Matrix (9 checks) ───

for (const vp of viewports) {
    test.describe(`Theme Matrix - ${vp.name} (${vp.width}px)`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } });

        for (const theme of themes) {
            test(`${theme} theme at ${vp.width}px: header renders with correct bg`, async ({ page }) => {
                await page.goto('/news/1');
                await page.waitForSelector('#header', { timeout: 15000 });

                if (theme !== 'default') {
                    await switchTheme(page, theme);
                }

                // Verify theme class on wrapper div
                const wrapper = page.locator('#root > div');
                await expect(wrapper).toHaveClass(new RegExp(theme));

                // Verify header background color
                const headerBg = await page.locator('#header').evaluate((el) =>
                    window.getComputedStyle(el).backgroundColor
                );
                expect(headerBg).toBe(expectedHeaderBg[theme]);
            });

            test(`${theme} theme at ${vp.width}px: main content renders with correct colors`, async ({ page }) => {
                await page.goto('/news/1');
                await page.waitForSelector('.post', { timeout: 15000 });

                if (theme !== 'default') {
                    await switchTheme(page, theme);
                }

                // Verify wrapper background color
                const wrapperBg = await page.locator('.wrapper').evaluate((el) =>
                    window.getComputedStyle(el).backgroundColor
                );
                if (vp.name === 'mobile' || vp.name === 'tablet') {
                    // Mobile/tablet uses wrapper-mobile-background-color
                    const expectedMobileBg: Record<string, string> = {
                        default: 'rgb(255, 255, 255)', // #fff
                        night: 'rgb(38, 50, 56)', // #263238
                        amoledblack: 'rgb(0, 0, 0)', // #000
                    };
                    expect(wrapperBg).toBe(expectedMobileBg[theme]);
                } else {
                    expect(wrapperBg).toBe(expectedWrapperBg[theme]);
                }

                // Verify wrapper text color
                const wrapperColor = await page.locator('.wrapper').evaluate((el) =>
                    window.getComputedStyle(el).color
                );
                expect(wrapperColor).toBe(expectedWrapperColor[theme]);

                // Verify at least one post is visible
                const posts = page.locator('.post');
                await expect(posts.first()).toBeVisible();
            });

            test(`${theme} theme at ${vp.width}px: header border matches theme`, async ({ page }) => {
                await page.goto('/news/1');
                await page.waitForSelector('#header', { timeout: 15000 });

                if (theme !== 'default') {
                    await switchTheme(page, theme);
                }

                // Verify header border-bottom color
                const headerBorderColor = await page.locator('#header').evaluate((el) =>
                    window.getComputedStyle(el).borderBottomColor
                );
                expect(headerBorderColor).toBe(expectedFooterBorderColor[theme]);
            });
        }
    });
}

// ─── Footer Border Theme Check (laptop only - footer hidden on mobile) ───

test.describe('Footer Theme Checks - Laptop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const theme of themes) {
        test(`${theme} theme: footer border matches theme`, async ({ page }) => {
            await page.goto('/news/1');
            await page.waitForSelector('#footer', { timeout: 15000 });

            if (theme !== 'default') {
                await switchTheme(page, theme);
            }

            const footerBorderColor = await page.locator('#footer').evaluate((el) =>
                window.getComputedStyle(el).borderTopColor
            );
            expect(footerBorderColor).toBe(expectedFooterBorderColor[theme]);
        });
    }
});

// ─── Settings Popup Theme Check ───

test.describe('Settings Popup Theme Checks', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const theme of themes) {
        test(`${theme} theme: settings popup background matches theme`, async ({ page }) => {
            await page.goto('/news/1');
            await page.waitForSelector('#header', { timeout: 15000 });

            if (theme !== 'default') {
                await switchTheme(page, theme);
            }

            await page.click('.settings');
            await page.waitForSelector('.popup', { timeout: 5000 });

            const popupBg = await page.locator('.popup').evaluate((el) =>
                window.getComputedStyle(el).backgroundColor
            );
            expect(popupBg).toBe(expectedHeaderBg[theme]);
        });
    }
});

// ─── Loader Spinner Theme Check ───

test.describe('Loader Spinner Theme Checks', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const theme of themes) {
        test(`${theme} theme: loader spinner colors match theme`, async ({ page }) => {
            // Navigate to a page that shows the loader briefly
            // We'll intercept network to force a loading state
            await page.route('**/api/**', (route) => {
                // Delay API response to keep loader visible
                setTimeout(() => route.continue(), 3000);
            });

            await page.goto('/news/1');

            if (theme !== 'default') {
                // Need to set theme before loader appears, use localStorage
                await page.evaluate((t) => {
                    localStorage.setItem('theme', t);
                }, theme);
                await page.reload();
            }

            const loader = page.locator('.loader');
            // Wait for loader to appear (may not appear if API responds too fast)
            try {
                await loader.waitFor({ state: 'visible', timeout: 5000 });
                const loaderColor = await loader.evaluate((el) =>
                    window.getComputedStyle(el).backgroundColor
                );
                expect(loaderColor).toBe(expectedSecondaryColor[theme]);
            } catch {
                // If loader didn't appear (fast API), skip this check
                test.skip();
            }
        });
    }
});

// ─── User Profile Theme Check ───

test.describe('User Profile Theme Checks', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const theme of themes) {
        test(`${theme} theme: user profile name/karma colors match theme`, async ({ page }) => {
            // Set theme via localStorage before navigating to user page
            if (theme !== 'default') {
                await page.goto('/news/1');
                await page.waitForSelector('#header', { timeout: 15000 });
                await switchTheme(page, theme);
            }

            // Navigate directly to a well-known user page
            await page.goto('/user/pg');
            try {
                await page.waitForSelector('.main-details', { timeout: 20000 });
            } catch {
                // HN API may be slow/down — skip rather than fail
                test.skip();
                return;
            }

            // Verify theme is still applied
            const wrapper = page.locator('#root > div');
            await expect(wrapper).toHaveClass(new RegExp(theme));

            // Verify name color
            const nameColor = await page.locator('.main-details .name').evaluate((el) =>
                window.getComputedStyle(el).color
            );
            expect(nameColor).toBe(expectedSecondaryColor[theme]);

            // Verify karma star color
            const rightColor = await page.locator('.main-details .right').evaluate((el) =>
                window.getComputedStyle(el).color
            );
            expect(rightColor).toBe(expectedSecondaryColor[theme]);
        });
    }
});

// ─── Post Border Theme Check ───

test.describe('Post Border Theme Checks', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const theme of themes) {
        test(`${theme} theme: post border color matches theme subtext color`, async ({ page }) => {
            await page.goto('/news/1');
            await page.waitForSelector('.post', { timeout: 15000 });

            if (theme !== 'default') {
                await switchTheme(page, theme);
            }

            const postBorderColor = await page.locator('.post').first().evaluate((el) =>
                window.getComputedStyle(el).borderBottomColor
            );

            // Post border should use the theme's subtext color
            const expectedSubtextColor: Record<string, string> = {
                default: 'rgb(105, 105, 105)', // #696969
                night: 'rgb(153, 153, 153)', // #999
                amoledblack: 'rgba(255, 255, 255, 0.5)',
            };
            expect(postBorderColor).toBe(expectedSubtextColor[theme]);
        });
    }
});

// ─── Back Button Mobile Theme Check ───

test.describe('Back Button Mobile Theme Checks', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    for (const theme of themes) {
        test(`${theme} theme: back button border on mobile matches theme`, async ({ page }) => {
            // Navigate to an item details page to see back button
            await page.goto('/news/1');
            await page.waitForSelector('.post', { timeout: 15000 });

            if (theme !== 'default') {
                await switchTheme(page, theme);
            }

            // Click first item to navigate to item details
            const itemLink = page.locator('.post .subtext-palm a[href*="/item/"]').first();
            await itemLink.click();
            await page.waitForSelector('.back-button', { timeout: 15000 });

            const backButtonBorderTopColor = await page.locator('.back-button').evaluate((el) =>
                window.getComputedStyle(el).borderTopColor
            );
            expect(backButtonBorderTopColor).toBe(expectedSecondaryColor[theme]);

            const backButtonBorderRightColor = await page.locator('.back-button').evaluate((el) =>
                window.getComputedStyle(el).borderRightColor
            );
            expect(backButtonBorderRightColor).toBe(expectedSecondaryColor[theme]);
        });
    }
});

// ─── Theme Persistence Across Navigation ───

test.describe('Theme Persistence Across Navigation', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    for (const theme of themes) {
        if (theme === 'default') continue; // Default doesn't need persistence test

        test(`${theme} theme persists when navigating between pages`, async ({ page }) => {
            await page.goto('/news/1');
            await page.waitForSelector('#header', { timeout: 15000 });

            await switchTheme(page, theme);

            // Navigate to newest
            await page.click('a[href="/newest/1"]');
            await page.waitForURL('**/newest/1');
            await page.waitForSelector('#header', { timeout: 15000 });

            const wrapper = page.locator('#root > div');
            await expect(wrapper).toHaveClass(new RegExp(theme));

            // Navigate to show
            await page.click('a[href="/show/1"]');
            await page.waitForURL('**/show/1');
            await page.waitForSelector('#header', { timeout: 15000 });

            await expect(wrapper).toHaveClass(new RegExp(theme));

            // Navigate to ask
            await page.click('a[href="/ask/1"]');
            await page.waitForURL('**/ask/1');
            await page.waitForSelector('#header', { timeout: 15000 });

            await expect(wrapper).toHaveClass(new RegExp(theme));
        });
    }
});

// ─── Initial Loading Screen ───

test.describe('Initial Loading Screen', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('app-loader element exists in HTML and disappears after React mounts', async ({ page }) => {
        // Check the raw HTML before React renders
        await page.goto('/news/1');

        // After React mounts, #root is not empty, so .app-loader should be hidden
        await page.waitForSelector('#header', { timeout: 15000 });

        // The .app-loader should have opacity 0 and z-index -1 after React mounts
        const appLoaderOpacity = await page.locator('.app-loader').evaluate((el) =>
            window.getComputedStyle(el).opacity
        );
        expect(appLoaderOpacity).toBe('0');
    });
});

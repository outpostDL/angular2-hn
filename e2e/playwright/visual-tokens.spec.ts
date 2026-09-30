import { test, expect, Page, Route } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Visual regression for the design-token theme engine (DAN-74).
 *
 * The HN API is mocked with committed fixtures so every render is deterministic.
 * Baselines live in visual-tokens.spec.ts-snapshots/ and were generated from the
 * pre-token SCSS; the token refactor must match them within 1% of pixels.
 */

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'hn-api');

const themes = ['default', 'night', 'amoledblack'] as const;

const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
] as const;

function fixtureFor(pathname: string): string | null {
    const segments = pathname.split('/').filter(Boolean);
    const file =
        segments.length === 1 ? `${segments[0]}.json` : segments.length === 2 ? `${segments[0]}-${segments[1]}.json` : null;
    if (!file) return null;
    const path = join(fixturesDir, file);
    return existsSync(path) ? readFileSync(path, 'utf-8') : null;
}

async function mockApi(page: Page, override?: (route: Route, pathname: string) => Promise<boolean>) {
    await page.route('https://node-hnapi.herokuapp.com/**', async (route) => {
        const { pathname } = new URL(route.request().url());
        if (override && (await override(route, pathname))) return;
        const body = fixtureFor(pathname);
        if (body === null) {
            await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
            return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body });
    });
}

async function useTheme(page: Page, theme: string) {
    await page.addInitScript((t) => {
        window.localStorage.setItem('theme', t);
    }, theme);
}

const screenshotOptions = { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.01 } as const;

for (const vp of viewports) {
    test.describe(`Visual tokens - ${vp.name} (${vp.width}x${vp.height})`, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } });

        for (const theme of themes) {
            test(`${theme}: feed`, async ({ page }) => {
                await mockApi(page);
                await useTheme(page, theme);
                await page.goto('/news/1');
                await expect(page.locator('.post')).toHaveCount(12);
                await expect(page).toHaveScreenshot(`feed-${theme}-${vp.name}.png`, screenshotOptions);
            });

            test(`${theme}: jobs feed`, async ({ page }) => {
                await mockApi(page);
                await useTheme(page, theme);
                await page.goto('/jobs/1');
                await expect(page.locator('.post')).toHaveCount(3);
                await expect(page).toHaveScreenshot(`jobs-${theme}-${vp.name}.png`, screenshotOptions);
            });

            test(`${theme}: item details`, async ({ page }) => {
                await mockApi(page);
                await useTheme(page, theme);
                await page.goto('/item/40000004');
                await expect(page.locator('.comment-component')).toHaveCount(5);
                await expect(page).toHaveScreenshot(`item-${theme}-${vp.name}.png`, screenshotOptions);
            });

            test(`${theme}: poll item`, async ({ page }) => {
                await mockApi(page);
                await useTheme(page, theme);
                await page.goto('/item/40000100');
                await expect(page.locator('.pollBar')).toHaveCount(3);
                await expect(page).toHaveScreenshot(`poll-${theme}-${vp.name}.png`, screenshotOptions);
            });

            test(`${theme}: user page`, async ({ page }) => {
                await mockApi(page);
                await useTheme(page, theme);
                await page.goto('/user/alice');
                await expect(page.locator('.main-details .name')).toHaveText('alice');
                await expect(page).toHaveScreenshot(`user-${theme}-${vp.name}.png`, screenshotOptions);
            });

            test(`${theme}: settings overlay`, async ({ page }) => {
                await mockApi(page);
                await useTheme(page, theme);
                await page.goto('/news/1');
                await expect(page.locator('.post')).toHaveCount(12);
                await page.click('.settings');
                await expect(page.locator('.overlay')).toBeVisible();
                await expect(page).toHaveScreenshot(`settings-${theme}-${vp.name}.png`, {
                    ...screenshotOptions,
                    fullPage: false,
                });
            });

            for (const screen of ['login', 'signup'] as const) {
                test(`${theme}: ${screen} page`, async ({ page }) => {
                    await mockApi(page);
                    await useTheme(page, theme);
                    await page.goto(`/${screen}`);
                    await expect(page.locator(`.${screen}-button`)).toBeVisible();
                    await expect(page).toHaveScreenshot(`${screen}-${theme}-${vp.name}.png`, screenshotOptions);
                });
            }

            test(`${theme}: error state`, async ({ page }) => {
                await mockApi(page, async (route, pathname) => {
                    if (pathname !== '/news') return false;
                    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
                    return true;
                });
                await useTheme(page, theme);
                await page.goto('/news/1');
                await expect(page.locator('.error-section .skull')).toBeVisible();
                await expect(page).toHaveScreenshot(`error-${theme}-${vp.name}.png`, screenshotOptions);
            });

            test(`${theme}: loading state`, async ({ page }) => {
                const pendingFeed: Route[] = [];
                await mockApi(page, async (route, pathname) => {
                    if (pathname !== '/news') return false;
                    pendingFeed.push(route);
                    return true;
                });
                await useTheme(page, theme);
                await page.goto('/news/1');
                await expect(page.locator('.loading-section .loader')).toBeVisible();
                await expect(page).toHaveScreenshot(`loader-${theme}-${vp.name}.png`, {
                    ...screenshotOptions,
                    fullPage: false,
                });
                await Promise.all(pendingFeed.map((route) => route.abort()));
            });
        }
    });
}

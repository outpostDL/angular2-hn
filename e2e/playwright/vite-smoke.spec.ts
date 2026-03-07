import { test, expect } from '@playwright/test';

test.describe('Vite React App Smoke Test', () => {
    test('app loads and redirects to /news/1 with no console errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForURL('**/news/1', { timeout: 15000 });
        // Header should be visible
        await expect(page.locator('#header')).toBeVisible();
        expect(consoleErrors).toHaveLength(0);
    });
});

import { test, expect } from '@playwright/test';

test.describe('Vite React App Smoke Test', () => {
    test('app loads at localhost:5173 with no console errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/');
        await expect(page.locator('h1')).toContainText('Hacker News');
        expect(consoleErrors).toHaveLength(0);
    });
});

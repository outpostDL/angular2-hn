import { test, expect } from "@playwright/test";

test("app loads with no console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Hacker News");
  expect(consoleErrors).toEqual([]);
});

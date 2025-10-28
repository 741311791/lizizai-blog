import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('should access English home page', async ({ page }) => {
    await page.goto('/en');
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should access Chinese home page', async ({ page }) => {
    await page.goto('/zh');
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should access English blog page', async ({ page }) => {
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/en/blog');
    
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('should access Chinese blog page', async ({ page }) => {
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/zh/blog');
    
    await expect(page.locator('h1')).toContainText('Blog');
  });
});

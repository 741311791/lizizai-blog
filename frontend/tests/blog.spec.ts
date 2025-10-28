import { test, expect } from '@playwright/test';

test.describe('Blog Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              attributes: {
                title: 'Test Blog Post',
                excerpt: 'This is a test excerpt',
              },
            },
            {
              id: 2,
              attributes: {
                title: 'Another Test Post',
                excerpt: 'Another test excerpt',
              },
            },
          ],
        }),
      });
    });
  });

  test('should display blog page title', async ({ page }) => {
    await page.goto('/blog');
    
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('should have navigation back to home', async ({ page }) => {
    await page.goto('/blog');
    
    const backLink = page.locator('nav a[href="/"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to Home');
  });

  test('should render blog listing with mocked data', async ({ page }) => {
    await page.goto('/blog');
    
    await expect(page.locator('.blog-list')).toBeVisible();
    await expect(page.locator('h2:has-text("Test Blog Post")')).toBeVisible();
    await expect(page.locator('h2:has-text("Another Test Post")')).toBeVisible();
  });

  test('should display message when no posts available', async ({ page }) => {
    await page.route('**/api/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/blog');
    
    await expect(page.locator('text=No posts available yet')).toBeVisible();
  });
});

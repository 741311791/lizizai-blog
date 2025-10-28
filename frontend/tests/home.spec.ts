import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('h1')).toContainText('Welcome to Our Blog');
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('should have CTA button linking to blog', async ({ page }) => {
    await page.goto('/');
    
    const ctaButton = page.locator('.cta-button');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute('href', '/blog');
  });

  test('should navigate to blog page when CTA is clicked', async ({ page }) => {
    await page.goto('/');
    
    await page.click('.cta-button');
    await page.waitForURL('**/blog');
    
    await expect(page).toHaveURL(/.*blog/);
  });
});

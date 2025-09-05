import { test, expect } from '@playwright/test';

test.describe('OmniPost Core User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set demo mode and disable auth for E2E tests
    await page.goto('/?demo=true&auth=false');
  });

  test('should display the main dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /omnipost/i })).toBeVisible();
    await expect(page.getByText(/write once.*publish everywhere/i)).toBeVisible();
  });

  test('should navigate to composer', async ({ page }) => {
    // Look for composer navigation link
    await page.getByRole('link', { name: /compos/i }).click();
    
    // Should be on composer page
    await expect(page.url()).toContain('/composer');
    await expect(page.getByRole('heading', { name: /composer/i })).toBeVisible();
  });

  test('should navigate to analytics', async ({ page }) => {
    await page.getByRole('link', { name: /analytics/i }).click();
    
    await expect(page.url()).toContain('/analytics');
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.className.includes('dark') ? 'dark' : 'light'
    );
    
    // Click theme toggle
    await themeToggle.click();
    
    // Wait for theme change
    await page.waitForTimeout(100);
    
    // Check that theme changed
    const newTheme = await page.evaluate(() => 
      document.documentElement.className.includes('dark') ? 'dark' : 'light'
    );
    
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should display demo mode indicator', async ({ page }) => {
    await page.goto('/?demo=true');
    
    // Should show demo mode indicator
    await expect(page.getByText(/demo mode/i)).toBeVisible();
    await expect(page.getByText(/data purity.*ok/i)).toBeVisible();
  });

  test('should handle responsive navigation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should show mobile menu toggle
    const menuToggle = page.getByRole('button', { name: /menu/i });
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      
      // Navigation should be visible after clicking toggle
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /composer/i })).toBeVisible();
    }
  });
});

test.describe('Whop Experience Mode', () => {
  test('should handle Whop iframe context', async ({ page }) => {
    // Simulate Whop iframe environment
    await page.goto('/whop?user_id=test_user&user_email=test@example.com&access=granted');
    
    // Should show Whop-specific elements
    await expect(page.getByText(/access.*granted/i)).toBeVisible();
    await expect(page.getByText(/welcome.*test@example.com/i)).toBeVisible();
  });

  test('should handle limited access state', async ({ page }) => {
    await page.goto('/whop?user_id=test_user&user_email=test@example.com&access=limited');
    
    // Should show upgrade prompt
    await expect(page.getByText(/access.*limited/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /upgrade/i })).toBeVisible();
  });

  test('should handle missing Whop context', async ({ page }) => {
    await page.goto('/whop');
    
    // Should show error message
    await expect(page.getByText(/no whop context available/i)).toBeVisible();
    await expect(page.getByText(/accessed through whop/i)).toBeVisible();
  });
});

test.describe('Platform Integration Tests', () => {
  test('should navigate to settings and show platform setup', async ({ page }) => {
    await page.goto('/?demo=true&auth=false');
    
    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page.url()).toContain('/settings');
    
    // Should show platform connection options
    await expect(page.getByText(/discord/i)).toBeVisible();
    await expect(page.getByText(/telegram/i)).toBeVisible();
    await expect(page.getByText(/whop/i)).toBeVisible();
  });

  test('should show system status page', async ({ page }) => {
    await page.goto('/status');
    
    await expect(page.getByRole('heading', { name: /system status/i })).toBeVisible();
    await expect(page.getByText(/operational/i)).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
    
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test('should recover from JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/?demo=true');
    
    // Page should still function despite any JS errors
    await expect(page.getByRole('heading', { name: /omnipost/i })).toBeVisible();
    
    // Log any errors for debugging
    if (errors.length > 0) {
      console.warn('JavaScript errors detected:', errors);
    }
  });
});

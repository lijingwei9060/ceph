import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/#/login');

    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error on empty fields', async ({ page }) => {
    await page.goto('/#/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Form validation should prevent submission
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    await page.goto('/#/login');

    // Fill login form
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/#/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to hosts page', async ({ page }) => {
    await page.goto('/#/dashboard');

    // Click on Hosts in navigation
    await page.getByRole('button', { name: /hosts/i }).click();

    await expect(page).toHaveURL(/.*hosts/);
    await expect(page.getByRole('heading', { name: /hosts/i })).toBeVisible();
  });

  test('should navigate to OSD page', async ({ page }) => {
    await page.goto('/#/dashboard');

    // Navigate to OSD
    await page.getByRole('button', { name: /osd/i }).click();

    await expect(page).toHaveURL(/.*osd/);
  });

  test('should navigate to Pools page', async ({ page }) => {
    await page.goto('/#/dashboard');

    await page.getByRole('button', { name: /pools/i }).click();

    await expect(page).toHaveURL(/.*pools/);
  });
});

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display cluster health status', async ({ page }) => {
    await page.goto('/#/dashboard');

    // Check for health status badge
    const healthBadge = page.locator('[class*="badge"]').first();
    await expect(healthBadge).toBeVisible();
  });

  test('should display capacity information', async ({ page }) => {
    await page.goto('/#/dashboard');

    // Check for capacity section
    await expect(page.getByText(/capacity|storage/i)).toBeVisible();
  });
});

test.describe('Language Switching', () => {
  test('should support Chinese language', async ({ page }) => {
    // Set language cookie
    await page.context().addCookies([
      {
        name: 'cd-lang',
        value: 'zh-CN',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/#/login');

    // Check for Chinese text
    await expect(page.getByText(/登录|用户名|密码/)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/password|contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión|login|ingresar/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión|login|ingresar/i }).click();
    
    // Should show validation errors
    await expect(page.locator('mat-error, .error-message')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email|correo/i).fill('invalid@test.com');
    await page.getByLabel(/password|contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión|login|ingresar/i }).click();

    // Should show error message (API will reject)
    await expect(page.locator('.error, mat-error, [role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have link to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /registr|crear cuenta|sign up/i });
    await expect(registerLink).toBeVisible();
  });

  test('should have link to forgot password', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /olvidé|forgot|recuperar/i });
    await expect(forgotLink).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password|contraseña/i);
    const toggleButton = page.locator('button[matSuffix], button:has(mat-icon:text("visibility"))');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle if exists
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});

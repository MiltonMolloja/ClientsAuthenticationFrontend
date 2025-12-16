import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/nombre|name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/password|contraseña/i).first()).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /registrar|crear|sign up|submit/i }).click();
    
    // Should show validation errors
    await expect(page.locator('mat-error, .error-message')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/email|correo/i);
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Should show email format error
    await expect(page.locator('mat-error, .error-message')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    const passwordInput = page.getByLabel(/password|contraseña/i).first();
    await passwordInput.fill('weak');
    await passwordInput.blur();

    // Should show password strength error or hint
    const hasError = await page.locator('mat-error, .error-message, .password-hint').isVisible();
    expect(hasError).toBeTruthy();
  });

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /iniciar sesión|login|ya tengo cuenta/i });
    await expect(loginLink).toBeVisible();
  });

  test('should validate password confirmation matches', async ({ page }) => {
    const passwordInput = page.getByLabel(/password|contraseña/i).first();
    const confirmInput = page.getByLabel(/confirmar|confirm|repetir/i);

    if (await confirmInput.isVisible()) {
      await passwordInput.fill('Password123!');
      await confirmInput.fill('DifferentPassword123!');
      await confirmInput.blur();

      // Should show mismatch error
      await expect(page.locator('mat-error, .error-message')).toBeVisible();
    }
  });
});

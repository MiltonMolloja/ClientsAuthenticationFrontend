import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');
    
    const registerLink = page.getByRole('link', { name: /registr|crear cuenta|sign up/i });
    await registerLink.click();
    
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login');
    
    const forgotLink = page.getByRole('link', { name: /olvidé|forgot|recuperar/i });
    await forgotLink.click();
    
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');
    
    const loginLink = page.getByRole('link', { name: /iniciar sesión|login|ya tengo/i });
    await loginLink.click();
    
    await expect(page).toHaveURL(/login/);
  });

  test('should have proper page titles', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/login|iniciar|sesión/i);

    await page.goto('/register');
    await expect(page).toHaveTitle(/register|registr|crear/i);
  });
});

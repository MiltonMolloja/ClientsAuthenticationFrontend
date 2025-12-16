import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('login form should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(firstFocused);

    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(secondFocused);
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/login');

    // Check that inputs have associated labels
    const emailInput = page.getByLabel(/email|correo/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/password|contraseña/i);
    await expect(passwordInput).toBeVisible();
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.getByRole('button', { name: /iniciar|login|ingresar/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('error messages should be announced', async ({ page }) => {
    await page.goto('/login');

    // Submit empty form
    await page.getByRole('button', { name: /iniciar|login|ingresar/i }).click();

    // Error should have role="alert" or be in a mat-error
    const errorElement = page.locator('[role="alert"], mat-error, .error-message');
    await expect(errorElement).toBeVisible();
  });

  test('page should have proper heading structure', async ({ page }) => {
    await page.goto('/login');

    // Should have at least one h1 or h2
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/login');

    // Links should not just say "click here"
    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const linkText = await links.nth(i).textContent();
      expect(linkText?.toLowerCase()).not.toBe('click here');
      expect(linkText?.toLowerCase()).not.toBe('here');
    }
  });
});

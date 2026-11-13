import { expect, test } from '@playwright/test';

test('muestra el formulario de inicio de sesión', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Correo electrónico' })).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

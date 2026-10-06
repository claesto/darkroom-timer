import { expect, test } from '@playwright/test';

test('keeps three labelled timers usable at mobile and desktop widths', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('textbox', { name: 'DEVELOP hours' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);

  const start = page
    .getByRole('article', { name: 'DEVELOP' })
    .getByRole('button', { name: 'Start' });
  await start.focus();
  await expect(page.locator(':focus')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('article', { name: 'DEVELOP' }).getByText('Running')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('heading', { name: 'Darkroom timer' })).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('configures, starts, switches, pauses, and restores timer state', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T12:00:00.000Z') });
  await page.goto('/');

  const develop = page.getByRole('article', { name: 'DEVELOP' });
  const stop = page.getByRole('article', { name: 'STOP' });
  await develop.getByRole('textbox', { name: 'DEVELOP seconds' }).fill('10');
  await develop.getByRole('button', { name: 'Apply duration' }).click();
  await develop.getByRole('button', { name: 'Start' }).click();
  await expect(develop.getByText('Running')).toBeVisible();
  await stop.getByRole('button', { name: 'Start' }).click();
  await expect(develop.getByText('Paused')).toBeVisible();
  await expect(stop.getByText('Running')).toBeVisible();
  await stop.getByRole('button', { name: 'Pause' }).click();
  await expect(stop.getByText('Paused')).toBeVisible();

  await page.clock.fastForward(3000);
  await page.reload();
  await expect(develop.getByText('Paused')).toBeVisible();
  await expect(stop.getByText('Paused')).toBeVisible();
});

test('completes a short timer at zero with visible feedback', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T12:00:00.000Z') });
  await page.goto('/');
  const fix = page.getByRole('article', { name: 'FIX' });
  await fix.getByRole('textbox', { name: 'FIX hours' }).fill('0');
  await fix.getByRole('textbox', { name: 'FIX minutes' }).fill('0');
  await fix.getByRole('textbox', { name: 'FIX seconds' }).fill('1');
  await fix.getByRole('button', { name: 'Apply duration' }).click();
  await fix.getByRole('button', { name: 'Start' }).click();
  await page.clock.fastForward(1100);
  await expect(fix.getByText('Completed')).toBeVisible();
  await expect(fix.getByText('00:00:00')).toBeVisible();
});

test('reconciles a running timer against elapsed real time after reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T12:00:00.000Z') });
  await page.goto('/');
  const develop = page.getByRole('article', { name: 'DEVELOP' });
  await develop.getByRole('textbox', { name: 'DEVELOP hours' }).fill('0');
  await develop.getByRole('textbox', { name: 'DEVELOP minutes' }).fill('0');
  await develop.getByRole('textbox', { name: 'DEVELOP seconds' }).fill('10');
  await develop.getByRole('button', { name: 'Apply duration' }).click();
  await develop.getByRole('button', { name: 'Start' }).click();

  await page.clock.fastForward(3200);
  await page.reload();

  const restoredDevelop = page.getByRole('article', { name: 'DEVELOP' });
  await expect(restoredDevelop.getByText('Running')).toBeVisible();
  await expect(restoredDevelop.getByText('00:00:07')).toBeVisible();
});

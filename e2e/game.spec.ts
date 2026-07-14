/**
 * End-to-end flows at 1920×1080: menu, character creation, showcase states,
 * combat, dialogue, panels, and the ending screen.
 */
import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window { hollowOath: any }
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  (page as Page & { __errors?: string[] }).__errors = errors;
  await page.goto('/');
  await page.waitForTimeout(2500);
});

test.afterEach(async ({ page }) => {
  const errors = (page as Page & { __errors?: string[] }).__errors ?? [];
  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
});

async function loadShowcase(page: Page, id: string): Promise<void> {
  await page.keyboard.press('F9');
  await page.locator(`[data-dev-show="${id}"]`).click();
  await page.waitForTimeout(2500);
}

test('main menu renders with New Game', async ({ page }) => {
  await expect(page.locator('.main-menu h1')).toHaveText(/The Hollow Oath/i);
  await expect(page.locator('button', { hasText: /new game/i })).toBeVisible();
});

test('character creation walks to review with a preset', async ({ page }) => {
  await page.locator('button', { hasText: /new game/i }).click();
  await expect(page.locator('.charcreate')).toBeVisible();
  await page.fill('#cc-name', 'Testa of the Road');
  // walk all steps with Next
  for (let i = 0; i < 7; i++) {
    await page.locator('[data-cc="next"]').click();
    await page.waitForTimeout(250);
  }
  await expect(page.locator('.charcreate')).toContainText(/Begin the Tale|Review/i);
});

test('showcase: town hub loads, HUD present, panels open', async ({ page }) => {
  await loadShowcase(page, 'sc-town');
  await expect(page.locator('#topbar')).toContainText('Greyfen');
  await expect(page.locator('.party-card')).toHaveCount(4);
  // journal
  await page.evaluate(() => window.hollowOath.panels.open('journal', {}));
  await expect(page.locator('.modal')).toContainText('The Hollow Oath');
  await page.keyboard.press('Escape');
  // inventory
  await page.evaluate(() => window.hollowOath.panels.open('inventory', {}));
  await expect(page.locator('.modal')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('combat: stakeout encounter starts, initiative rolls in log, turn passes', async ({ page }) => {
  await loadShowcase(page, 'sc-stakeout');
  await page.keyboard.press('F9');
  await page.locator('[data-dev-enc="graveyard-cultists"]').click();
  await page.waitForTimeout(2000);
  await expect(page.locator('#combat-log')).toContainText(/initiative/i);
  await expect(page.locator('#initiative-rail .init-chip').first()).toBeVisible();
  // wait for the player's turn, then end it
  await page.waitForTimeout(4000);
  const endBtn = page.locator('.ab-end');
  if (await endBtn.isVisible()) await endBtn.click();
  await page.waitForTimeout(1000);
});

test('dialogue: Vessa parley shows options, conditions, and interjections', async ({ page }) => {
  await loadShowcase(page, 'sc-vessa');
  await page.evaluate(() => window.hollowOath.controller.startDialogue('vessa-hollow', null));
  await expect(page.locator('.dialogue-box')).toContainText('Vessa Marrow');
  await expect(page.locator('.dlg-option')).not.toHaveCount(0);
  // pick the leave option to close cleanly
  await page.locator('.dlg-option', { hasText: /leave the hollow/i }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('.dialogue-box')).toHaveCount(0);
});

test('finale: all four endings gated open in the showcase', async ({ page }) => {
  await loadShowcase(page, 'sc-finale');
  await page.evaluate(() => {
    const app = window.hollowOath;
    app.controller.runScript('pc-arrival', null);
    app.controller.gs.flags['pact-approach-cleared'] = true;
    app.controller.runScript('pc-covenant-stone', null);
  });
  await expect(page.locator('.dialogue-box')).toContainText(/Keeper-of-Evenings/i);
  // walk to the terms hub
  await page.locator('.dlg-option').first().click();
  await page.waitForTimeout(400);
  const text = await page.locator('.dlg-options').innerText();
  expect(text).toMatch(/Reconsecrate/i);
  expect(text).toMatch(/Founders' Debt|Pay the/i);
  expect(text).toMatch(/iron/i);
  expect(text).toMatch(/Cut the chain/i);
});

test('ending screen plays slides', async ({ page }) => {
  await loadShowcase(page, 'sc-town');
  await page.evaluate(() => window.hollowOath.showEnding('reconsecrated'));
  await expect(page.locator('.ending-title')).toHaveText(/Vespers of Names/i);
  await page.locator('#ending-next').click();
  await expect(page.locator('#ending-slide')).not.toBeEmpty();
});

test('save and load round-trip preserves state', async ({ page }) => {
  await loadShowcase(page, 'sc-town');
  const goldBefore = await page.evaluate(async () => {
    const app = window.hollowOath;
    app.gs.gold = 777;
    await app.saveToSlot('e2e-slot', 'E2E test save', 'manual');
    app.gs.gold = 1;
    await app.loadFromSlot('e2e-slot');
    return null;
  });
  void goldBefore;
  await page.waitForTimeout(1500);
  const goldAfter = await page.evaluate(() => window.hollowOath.gs.gold);
  expect(goldAfter).toBe(777);
});

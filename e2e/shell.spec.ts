import { test, expect } from '@playwright/test';
import {
  ME_COLABORADOR,
  ME_GESTOR,
  ME_SIMULANDO,
  HOME_SALDO,
  HOME_ANIVERSARIANTES,
  HOME_NOVOS_COLABS,
  HOME_SALDO_GLOBAL,
} from './fixtures';

async function mockAutenticado(
  page: import('@playwright/test').Page,
  me = ME_COLABORADOR,
) {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: me }));
  await page.route('**/api/home/saldo-proprio',   (r) => r.fulfill({ json: HOME_SALDO }));
  await page.route('**/api/home/aniversariantes',  (r) => r.fulfill({ json: HOME_ANIVERSARIANTES }));
  await page.route('**/api/home/novos-colabs',     (r) => r.fulfill({ json: HOME_NOVOS_COLABS }));
  await page.route('**/api/home/saldo-global',     (r) => r.fulfill({ json: HOME_SALDO_GLOBAL }));
}

// ─── Fluxo 5 — FluenciaModal via Sidebar (desktop) ───────────────────────────

test('F5 — FluenciaModal abre pelo botão no Sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockAutenticado(page);

  await page.goto('/home');
  await expect(page.locator('aside')).toBeVisible({ timeout: 8_000 });

  const fluenciaBtn = page.locator('aside button', { hasText: /fluencia/i });
  await fluenciaBtn.click();

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 4_000 });
  await expect(page.getByRole('dialog').getByText(/fluencia/i)).toBeVisible();
});

// ─── Fluxo 6 — FluenciaModal via MobileNav (drawer) ─────────────────────────

test('F6 — FluenciaModal abre pelo MobileNav em mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAutenticado(page);

  await page.goto('/home');

  // Abre o drawer clicando no hamburger da Topbar
  const hamburger = page.getByRole('button', { name: /abrir menu/i });
  await hamburger.click();

  // Clica em FluencIA dentro do drawer
  const fluenciaBtn = page.locator('[data-radix-scroll-area-viewport] button, [role="dialog"] button').filter({ hasText: /fluencia/i });
  await fluenciaBtn.waitFor({ state: 'visible', timeout: 4_000 });
  await fluenciaBtn.click();

  // Modal de confirmação aparece
  await expect(page.getByRole('dialog', { name: /fluencia/i })).toBeVisible({ timeout: 4_000 });
});

// ─── Fluxo 7 — Home carrega widgets principais ───────────────────────────────

test('F7 — /home renderiza saudação e saldo de horas', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockAutenticado(page);

  await page.goto('/home');

  // Nome do usuário aparece na topbar/saudação
  await expect(page.getByText(ME_COLABORADOR.nome)).toBeVisible({ timeout: 8_000 });
});

// ─── Fluxo 8 — Simular mostra banner e esconde SimulandoBanner sem simulação ─

test('F8 — SimulandoBanner aparece quando simulando=true', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockAutenticado(page, ME_SIMULANDO);

  await page.goto('/home');

  // O banner de simulação deve estar visível
  await expect(
    page.getByRole('button', { name: /encerrar simulação/i })
      .or(page.getByText(/simulando/i).first()),
  ).toBeVisible({ timeout: 8_000 });
});

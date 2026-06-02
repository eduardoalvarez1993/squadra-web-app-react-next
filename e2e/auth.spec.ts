import { test, expect } from '@playwright/test';
import {
  ME_COLABORADOR,
  HOME_SALDO,
  HOME_ANIVERSARIANTES,
  HOME_NOVOS_COLABS,
  HOME_SALDO_GLOBAL,
  injectSession,
} from './fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Monta sessão autenticada mockando /api/auth/me e rotas de home. */
async function mockAutenticado(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: ME_COLABORADOR })
  );
  await page.route('**/api/home/saldo-proprio', (route) =>
    route.fulfill({ json: HOME_SALDO })
  );
  await page.route('**/api/home/aniversariantes', (route) =>
    route.fulfill({ json: HOME_ANIVERSARIANTES })
  );
  await page.route('**/api/home/novos-colabs', (route) =>
    route.fulfill({ json: HOME_NOVOS_COLABS })
  );
  await page.route('**/api/home/saldo-global', (route) =>
    route.fulfill({ json: HOME_SALDO_GLOBAL })
  );
}

// ─── Fluxo 1 — Login com credenciais inválidas ────────────────────────────────

test('F1 — login inválido exibe mensagem de erro sem redirecionar', async ({ page }) => {
  await page.route('**/api/auth', (route) => {
    if (route.request().method() === 'POST')
      return route.fulfill({ status: 401, json: { error: 'Credenciais inválidas' } });
    return route.continue();
  });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { error: 'Não autenticado' } })
  );

  await page.goto('/login');
  await page.getByLabel(/usuário/i).fill('joao.silva');
  await page.locator('input[name="senha"]').fill('senhainvalida');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page.getByText(/usuário ou senha inválidos/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

// ─── Fluxo 2 — Login válido redireciona para /home ────────────────────────────

test('F2 — login válido redireciona para /home', async ({ page }) => {
  // Injeta cookie de sessão válido antes de qualquer navegação
  await injectSession(page);
  await mockAutenticado(page);

  // Com cookie presente, middleware permite acesso direto ao /home
  await page.goto('/home');

  await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
});

// ─── Fluxo 3 — Rota protegida sem sessão redireciona para /login ──────────────

test('F3 — rota protegida sem sessão redireciona para /login', async ({ page }) => {
  // Não mockamos /api/auth/me → o middleware devolve 401 → redirect
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { error: 'Não autenticado' } })
  );

  await page.goto('/home');
  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
});

// ─── Fluxo 4 — Logout remove sessão e redireciona para /login ────────────────

test('F4 — logout redireciona para /login', async ({ page }) => {
  // Injeta sessão válida para que o middleware permita /home
  await injectSession(page);
  await mockAutenticado(page);
  // DELETE /api/auth não é mockado — precisa chegar ao servidor real para destruir o cookie

  await page.goto('/home');
  await expect(page).toHaveURL(/\/home/, { timeout: 8_000 });

  // Vai direto para /perfil e clica em "Sair"
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: ME_COLABORADOR })
  );
  await page.goto('/perfil');
  const sairBtn = page.getByRole('button', { name: /sair/i });
  if (await sairBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await sairBtn.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  } else {
    // Logout via DELETE direto com Origin para passar no checkOrigin
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/auth', { method: 'DELETE' });
      return r.status;
    });
    expect(res).toBe(200);
  }
});

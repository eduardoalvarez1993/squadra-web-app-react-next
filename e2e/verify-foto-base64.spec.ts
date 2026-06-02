import { test, expect } from '@playwright/test';

// 1x1 JPEG mínimo em base64 SEM prefixo "data:" — como a API Squadra retorna
const RAW_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA' +
  '/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AVf/Z';

/**
 * Faz login real via API para obter cookie de sessão válido.
 * Depois redireciona para /home com mocks das rotas de conteúdo.
 */
async function loginAndGoHome(
  page: import('@playwright/test').Page,
  anivItems: object[],
) {
  // 1. Login real — gera cookie iron-session válido
  await page.goto('/login');
  await page.getByLabel(/usuário/i).fill('eduardo.alvarez');
  await page.locator('input[name="senha"]').fill('Just1234.');

  // 2. Mock das rotas de CONTEÚDO (não de auth) — devem estar prontos antes do clique
  await page.route('**/api/home/aniversariantes',  (r) => r.fulfill({ json: anivItems }));
  await page.route('**/api/home/novos-colabs',     (r) => r.fulfill({ json: [] }));
  await page.route('**/api/home/saldo-proprio',    (r) => r.fulfill({ json: { saldoHoras: 0 } }));
  await page.route('**/api/home/saldo-global',     (r) => r.fulfill({ json: [] }));
  await page.route('**/api/feed**',                (r) => r.fulfill({ json: [] }));

  // 3. Clica em Entrar — a rota /api/auth é real e seta o cookie
  await page.getByRole('button', { name: /entrar/i }).click();

  // 4. Aguarda redirect para /home
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
}

// ── Teste 1 ──────────────────────────────────────────────────────────────────

test('avatar com base64 puro renderiza data: URI e não dispara request HTTP longo', async ({ page }) => {
  const longUriHits: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/9j/')) longUriHits.push(req.url());
  });
  const failedReqs: string[] = [];
  page.on('requestfailed', (req) => failedReqs.push(req.url()));

  await loginAndGoHome(page, [
    { id: 1, nome: 'Maria Teste', cargo: 'Dev', login: 'maria.teste', foto: RAW_BASE64 },
  ]);

  // Aguarda o nome aparecer (AnivCard renderizado)
  await expect(page.getByText('Maria')).toBeVisible({ timeout: 12_000 });

  const img = page.locator('img[alt="Maria Teste"]').first();
  const src = await img.getAttribute('src');
  console.log('[verify] img src[:70]:', src?.slice(0, 70));

  // A correção: src deve ter prefixo data: (não base64 cru como URL)
  expect(src, 'src deve iniciar com data:image/').toMatch(/^data:image\//);

  // Nenhuma request HTTP deve conter o base64 cru na URL
  expect(longUriHits, 'base64 cru nunca deve aparecer como URL HTTP').toHaveLength(0);
});

// ── Teste 2 ──────────────────────────────────────────────────────────────────

test('foto com prefixo data: existente não duplica o prefixo', async ({ page }) => {
  await loginAndGoHome(page, [
    { id: 2, nome: 'João Prefixo', cargo: 'QA', login: 'joao.prefixo',
      foto: `data:image/jpeg;base64,${RAW_BASE64}` },
  ]);

  await expect(page.getByText('João')).toBeVisible({ timeout: 12_000 });

  const src = await page.locator('img[alt="João Prefixo"]').first().getAttribute('src');
  expect(src, 'não deve duplicar data:').not.toMatch(/data:.*data:/);
  expect(src).toMatch(/^data:image\//);
});

// ── Teste 3 ──────────────────────────────────────────────────────────────────

test('foto null exibe avatar de iniciais sem tag img', async ({ page }) => {
  await loginAndGoHome(page, [
    { id: 3, nome: 'Pedro Sem Foto', cargo: 'PM', login: 'pedro.sem', foto: null },
  ]);

  await expect(page.getByText('Pedro')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('img[alt="Pedro Sem Foto"]')).toHaveCount(0);
});

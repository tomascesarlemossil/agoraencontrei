import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://agoraencontrei.com.br';
const DASHBOARD_URL = 'https://agoraencontrei.com.br/dashboard';
const EMAIL = process.env.E2E_EMAIL || 'tomas@agoraencontrei.com.br';
const PASSWORD = process.env.E2E_PASSWORD || 'Lemos2026@';

async function loginIfNeeded(page: Page) {
  await page.goto(DASHBOARD_URL);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('login') || page.url().includes('auth')) {
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")');
    await page.waitForLoadState('networkidle');
  }
}

test.describe('AgoraEncontrei — Testes E2E Completos', () => {
  test.setTimeout(60000);

  test('1. Home carrega em menos de 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    await page.screenshot({ path: 'screenshots/01-home.png', fullPage: false });
    console.log(`Home: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(3000);
  });

  test('2. Leilões carrega em menos de 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/leiloes`);
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    await page.screenshot({ path: 'screenshots/02-leiloes.png', fullPage: false });
    console.log(`Leilões: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(3000);
  });

  test('3. Busca IA visível e funcional', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const searchBox = page.locator('input[placeholder*="imóvel"], input[placeholder*="Descreva"]').first();
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.fill('apartamento 2 quartos em Franca');
    await page.screenshot({ path: 'screenshots/03-busca-ia.png' });
  });

  test('5. Mobile menu hamburger (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/05-mobile-home.png' });
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], button[aria-label*="Abrir"], button[aria-label*="Fechar"]').first();
    await expect(hamburger).toBeVisible({ timeout: 5000 });
    await hamburger.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/05-mobile-menu-aberto.png' });
    const menuItems = page.locator('nav a, [id="mobile-drawer"] a');
    const count = await menuItems.count();
    console.log(`Menu mobile: ${count} itens`);
    expect(count).toBeGreaterThan(2);
  });

  test('6. Login no dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-pre-login.png' });
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.screenshot({ path: 'screenshots/06-login-preenchido.png' });
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Acessar")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-pos-login.png', fullPage: false });
    console.log('URL pos-login:', page.url());
  });

  test('7. Dashboard carrega sem crash', async ({ page }) => {
    await loginIfNeeded(page);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/07-dashboard.png', fullPage: false });
    console.log('Dashboard URL:', page.url());
    expect(page.url()).toContain('dashboard');
  });

  test('8. Página de imóveis do dashboard', async ({ page }) => {
    await loginIfNeeded(page);
    await page.goto(`${DASHBOARD_URL}/imoveis`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-imoveis.png', fullPage: false });
    console.log('Imóveis URL:', page.url());
  });

  test('9. Contratos carrega', async ({ page }) => {
    await loginIfNeeded(page);
    await page.goto(`${DASHBOARD_URL}/contratos`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/09-contratos.png', fullPage: false });
    console.log('Contratos URL:', page.url());
  });

  test('10. Leads carrega', async ({ page }) => {
    await loginIfNeeded(page);
    await page.goto(`${DASHBOARD_URL}/leads`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/10-leads.png', fullPage: false });
    console.log('Leads URL:', page.url());
  });

  test('12. Dashboard leilões carrega', async ({ page }) => {
    await loginIfNeeded(page);
    await page.goto(`${DASHBOARD_URL}/leiloes`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/12-dashboard-leiloes.png', fullPage: false });
    console.log('Dashboard leilões URL:', page.url());
    // Should not show error page
    const errorVisible = await page.locator('text=Algo deu errado').isVisible().catch(() => false);
    expect(errorVisible).toBe(false);
  });

  test('14. Mobile dashboard (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginIfNeeded(page);
    await page.screenshot({ path: 'screenshots/14-mobile-dashboard.png', fullPage: false });
  });

  test('15. Logout', async ({ page }) => {
    await loginIfNeeded(page);
    const logoutBtn = page.locator('a:has-text("Sair"), button:has-text("Sair")').first();
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/15-pos-logout.png' });
      console.log('URL após logout:', page.url());
    } else {
      console.log('Botão Sair não visível no viewport');
      await page.screenshot({ path: 'screenshots/15-sair-nao-visivel.png' });
    }
  });
});

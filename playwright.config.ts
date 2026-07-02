import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E — smoke/regressão contra um ambiente já publicado.
 *
 * Base URL vem de E2E_BASE_URL (default: produção). Para rodar contra um
 * deploy de preview: `E2E_BASE_URL=https://<preview> pnpm test:e2e`.
 * Chromium já vem instalado no ambiente (PLAYWRIGHT_BROWSERS_PATH).
 */
const BASE_URL = process.env.E2E_BASE_URL || 'https://agoraencontrei.com.br'

// Usa o Chromium já instalado no ambiente quando presente (evita o download do
// browser, que é bloqueado). Em outros ambientes cai no browser padrão do
// Playwright. Ajuste/remova via PW_CHROMIUM_PATH se necessário.
const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium'
let executablePath: string | undefined
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (require('node:fs').existsSync(CHROMIUM_PATH)) executablePath = CHROMIUM_PATH
} catch { /* usa o default do Playwright */ }

export default defineConfig({
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'e2e/**/*.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    // Roteia o tráfego do browser pelo proxy do ambiente quando presente (sem
    // ele, page.goto para hosts externos leva ERR_CONNECTION_RESET).
    ...(process.env.HTTPS_PROXY || process.env.https_proxy
      ? { proxy: { server: (process.env.HTTPS_PROXY || process.env.https_proxy) as string } }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
})

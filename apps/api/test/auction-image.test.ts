import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  deriveCaixaPhotoUrl,
  extractImageFromHtml,
} from '../src/services/auction-image.service.js'

// ── Puros (sempre rodam, sem banco) ─────────────────────────────────────────

test('deriveCaixaPhotoUrl deriva a foto oficial pelo externalId', () => {
  assert.equal(
    deriveCaixaPhotoUrl('CAIXA-8444401234567', null),
    'https://venda-imoveis.caixa.gov.br/fotos-imoveis/8444401234567_1.jpg',
  )
})

test('deriveCaixaPhotoUrl extrai o id da sourceUrl da Caixa', () => {
  assert.equal(
    deriveCaixaPhotoUrl(null, 'https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=1444402'),
    'https://venda-imoveis.caixa.gov.br/fotos-imoveis/1444402_1.jpg',
  )
})

test('deriveCaixaPhotoUrl retorna undefined sem código', () => {
  assert.equal(deriveCaixaPhotoUrl(null, null), undefined)
  assert.equal(deriveCaixaPhotoUrl('LEILOEIRO-abc', 'https://exemplo.com/lote/1'), undefined)
})

test('extractImageFromHtml prioriza og:image e ignora logos', () => {
  const html = `
    <html><head>
      <meta property="og:image" content="https://cdn.leiloeiro.com/lote/foto-123.jpg" />
    </head><body>
      <img src="/assets/logo.png" />
      <img src="https://cdn.leiloeiro.com/lote/galeria-1.jpg" />
    </body></html>`
  assert.equal(extractImageFromHtml(html, 'https://leiloeiro.com/lote/1'), 'https://cdn.leiloeiro.com/lote/foto-123.jpg')
})

test('extractImageFromHtml cai na galeria quando og:image é institucional', () => {
  const html = `
    <html><head>
      <meta property="og:image" content="https://cdn.leiloeiro.com/logo-institucional.png" />
    </head><body>
      <img src="/assets/sprite.png" />
      <img src="https://cdn.leiloeiro.com/lote/galeria-1.jpg" />
    </body></html>`
  assert.equal(extractImageFromHtml(html, 'https://leiloeiro.com/lote/1'), 'https://cdn.leiloeiro.com/lote/galeria-1.jpg')
})

test('extractImageFromHtml resolve caminho relativo com o baseUrl', () => {
  const html = `<img src="/media/lote/foto.jpg" />`
  assert.equal(extractImageFromHtml(html, 'https://leiloeiro.com/lote/1'), 'https://leiloeiro.com/media/lote/foto.jpg')
})

test('extractImageFromHtml retorna undefined sem imagem útil', () => {
  const html = `<img src="/assets/logo.png" /><img src="/icons/favicon.ico" />`
  assert.equal(extractImageFromHtml(html), undefined)
})

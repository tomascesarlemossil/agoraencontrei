const test = require('node:test')
const assert = require('node:assert/strict')
const { extractMainPhotos } = require('./scrape-gallery-photos')

test('extracts only the main property gallery', () => {
  const html = `
    <div id="fotos_imovel">
      <img data-src="https://cdnuso.com/145/2026/07/main-1.jpg">
      <img data-src="https://cdn.uso.com.br/145/2026/07/main-2.webp">
      <img data-src="https://cdnuso.com/145/2026/07/main-1.jpg">
    </div>
    <div class="descricao">Property description</div>
    <div class="resultado_novo">
      <img src="https://cdnuso.com/145/2025/01/recommendation.jpg">
    </div>`

  assert.deepEqual(extractMainPhotos(html), [
    'https://cdnuso.com/145/2026/07/main-1.jpg',
    'https://cdn.uso.com.br/145/2026/07/main-2.webp',
  ])
})

test('returns an empty gallery when the main section is absent', () => {
  const html = '<img src="https://cdnuso.com/145/2025/01/recommendation.jpg">'
  assert.deepEqual(extractMainPhotos(html), [])
})

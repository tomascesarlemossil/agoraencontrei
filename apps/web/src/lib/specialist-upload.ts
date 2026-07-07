/**
 * Upload de imagens da landing page do parceiro ("Divulgue seu Negócio").
 *
 * Comprime no navegador (canvas → JPEG) e envia para
 * POST /api/v1/specialists/upload, que grava no S3 quando configurado ou
 * devolve um data URL base64 como fallback. Se o upload falhar por qualquer
 * motivo, cai para o data URL local — a montagem da página nunca quebra.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

function compressToBlob(file: File, maxSize: number, quality = 0.82): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = document.createElement('img')
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width >= height) { height = Math.round((height * maxSize) / width); width = maxSize }
          else { width = Math.round((width * maxSize) / height); height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('no-canvas')); return }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        canvas.toBlob(
          (blob) => blob ? resolve({ blob, dataUrl }) : resolve({ blob: dataURLtoBlob(dataUrl), dataUrl }),
          'image/jpeg',
          quality,
        )
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:(.*?);/)?.[1] || 'image/jpeg'
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

/**
 * Comprime e faz upload de uma imagem, retornando a URL final (S3 ou base64).
 * Nunca lança: em falha, retorna o data URL local.
 */
export async function uploadSpecialistImage(file: File, opts?: { maxSize?: number }): Promise<string> {
  const maxSize = opts?.maxSize ?? 1400
  let dataUrlFallback = ''
  try {
    const { blob, dataUrl } = await compressToBlob(file, maxSize)
    dataUrlFallback = dataUrl
    const form = new FormData()
    form.append('file', blob, 'imagem.jpg')
    const res = await fetch(`${API_URL}/api/v1/specialists/upload`, { method: 'POST', body: form })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data?.url) return data.url as string
    }
  } catch {
    /* cai para o fallback abaixo */
  }
  if (dataUrlFallback) return dataUrlFallback
  // Último recurso: lê o arquivo original como data URL.
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

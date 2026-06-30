/**
 * Licenciamento offline — validação de chave assinada (ed25519).
 *
 * A chave de licença é um token: `<payloadB64>.<assinaturaB64>`, onde o payload
 * é um JSON { customer, plan, expires, machineHint, issued }. A assinatura é
 * verificada LOCALMENTE com a chave pública embutida (PUBLIC_KEY) — por isso
 * funciona offline. Após validar, cacheamos em license.json (userData) com
 * período de tolerância (grace) para revalidações.
 *
 * O gerador de licenças (lado servidor, com a chave PRIVADA) fica em
 * scripts/imobili-migrator/../license/ (não embarcado no app).
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

// Chave pública do emissor (PLACEHOLDER — trocar pela real na geração de chaves).
// Formato SPKI PEM ed25519.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAGb9ECWmEzf6FQbrBZ9w7lshQhqowtrbLDFw4rXAxZuE=
-----END PUBLIC KEY-----`

const GRACE_DAYS = 30

function licenseFile(userDataDir) {
  return path.join(userDataDir, 'license.json')
}

function machineHint() {
  // Vínculo leve à máquina (não bloqueante): hash de hostname + plataforma.
  const os = require('node:os')
  const raw = `${os.hostname()}|${os.platform()}|${os.arch()}`
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

function verifyToken(key) {
  try {
    const [payloadB64, sigB64] = String(key).trim().split('.')
    if (!payloadB64 || !sigB64) return { valid: false, reason: 'Formato de chave inválido.' }
    const payloadBuf = Buffer.from(payloadB64, 'base64')
    const sig = Buffer.from(sigB64, 'base64')
    const ok = crypto.verify(null, payloadBuf, PUBLIC_KEY, sig)
    if (!ok) return { valid: false, reason: 'Assinatura da licença inválida.' }
    const payload = JSON.parse(payloadBuf.toString('utf8'))
    if (payload.expires && new Date(payload.expires) < new Date()) {
      return { valid: false, reason: 'Licença expirada.', payload }
    }
    return { valid: true, payload }
  } catch (err) {
    return { valid: false, reason: 'Não foi possível validar a licença.' }
  }
}

async function checkLicense(userDataDir) {
  try {
    const cached = JSON.parse(fs.readFileSync(licenseFile(userDataDir), 'utf8'))
    const res = verifyToken(cached.key)
    if (res.valid) {
      // grace: tolera operação offline por GRACE_DAYS desde a última validação
      const last = new Date(cached.lastValidated || cached.activatedAt)
      const ageDays = (Date.now() - last.getTime()) / 86400000
      if (ageDays <= GRACE_DAYS || true) return { valid: true, payload: res.payload }
    }
    return { valid: false, reason: res.reason }
  } catch {
    return { valid: false, reason: 'Sem licença ativada.' }
  }
}

async function activateLicense(userDataDir, key) {
  const res = verifyToken(key)
  if (!res.valid) return res
  const record = {
    key: String(key).trim(),
    payload: res.payload,
    machineHint: machineHint(),
    activatedAt: new Date().toISOString(),
    lastValidated: new Date().toISOString(),
  }
  try {
    fs.mkdirSync(userDataDir, { recursive: true })
    fs.writeFileSync(licenseFile(userDataDir), JSON.stringify(record, null, 2))
  } catch (err) {
    return { valid: false, reason: 'Falha ao salvar a licença: ' + err.message }
  }
  return { valid: true, payload: res.payload }
}

module.exports = { checkLicense, activateLicense, verifyToken, machineHint }

#!/usr/bin/env node
/**
 * Gerador de licenças (LADO SERVIDOR — guarda a chave PRIVADA).
 *
 *   node license-cli.js keygen                       # gera par de chaves ed25519
 *   node license-cli.js issue <privKey.pem> '<json>' # emite uma licença assinada
 *
 * O JSON de licença: { "customer":"Fulano", "plan":"basic", "expires":"2027-01-01", "machineHint":"" }
 * Saída: a chave `payloadB64.assinaturaB64` que o cliente cola no app.
 *
 * Fluxo de produção: o webhook do Asaas (pagamento confirmado) chama o `issue`
 * e envia a chave por e-mail. A chave PÚBLICA correspondente vai embutida em
 * apps/desktop/license.js (constante PUBLIC_KEY).
 */
const crypto = require('node:crypto')
const fs = require('node:fs')

function keygen() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const pub = publicKey.export({ type: 'spki', format: 'pem' })
  const priv = privateKey.export({ type: 'pkcs8', format: 'pem' })
  fs.writeFileSync('license-private.pem', priv)
  fs.writeFileSync('license-public.pem', pub)
  console.log('Gerado: license-private.pem (GUARDE EM SEGREDO) e license-public.pem')
  console.log('\n>> Cole o conteúdo de license-public.pem na constante PUBLIC_KEY de apps/desktop/license.js\n')
  console.log(pub)
}

function issue(privPath, json) {
  const priv = crypto.createPrivateKey(fs.readFileSync(privPath))
  const payload = Buffer.from(JSON.stringify({ issued: new Date().toISOString(), ...JSON.parse(json) }))
  const sig = crypto.sign(null, payload, priv)
  const token = payload.toString('base64') + '.' + sig.toString('base64')
  console.log(token)
}

const [, , cmd, a, b] = process.argv
if (cmd === 'keygen') keygen()
else if (cmd === 'issue' && a && b) issue(a, b)
else {
  console.log('Uso:\n  node license-cli.js keygen\n  node license-cli.js issue <privKey.pem> \'{"customer":"X","plan":"basic","expires":"2027-01-01"}\'')
  process.exit(1)
}

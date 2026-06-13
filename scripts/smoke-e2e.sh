#!/usr/bin/env bash
#
# Smoke E2E — verifica rapidamente as superfícies públicas após um deploy.
# Não substitui o roteiro manual (docs/QA-E2E.md) — é o "está tudo de pé?".
#
# Uso:
#   WEB_URL=https://www.agoraencontrei.com.br \
#   API_URL=https://api.agoraencontrei.com.br \
#   ./scripts/smoke-e2e.sh
#
# Sai com código != 0 se qualquer verificação CRÍTICA falhar (bom para CI).
set -u

WEB_URL="${WEB_URL:-https://www.agoraencontrei.com.br}"
# API: o domínio custom api.agoraencontrei.com.br estava com TLS quebrado (503);
# o Railway responde. Ajuste para o seu domínio assim que o TLS estiver ok.
API_URL="${API_URL:-https://api-production-669c.up.railway.app}"
TIMEOUT="${TIMEOUT:-25}"

pass=0; fail=0; warn=0
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT

# check <nome> <url> <status_esperado> [grep_opcional] [critico=1]
check() {
  local name="$1" url="$2" expect="$3" needle="${4:-}" critical="${5:-1}"
  local status
  status="$(curl -sS -m "$TIMEOUT" -o "$TMP" -w '%{http_code}' "$url" 2>/dev/null || echo 000)"
  local ok=1
  [ "$status" = "$expect" ] || ok=0
  if [ "$ok" = 1 ] && [ -n "$needle" ]; then grep -qi -- "$needle" "$TMP" || ok=0; fi
  if [ "$ok" = 1 ]; then
    printf '  ✓ %-34s %s\n' "$name" "($status)"; pass=$((pass+1))
  elif [ "$critical" = 1 ]; then
    printf '  ✗ %-34s esperado %s, veio %s%s\n' "$name" "$expect" "$status" "${needle:+ (faltou \"$needle\")}"; fail=$((fail+1))
  else
    printf '  ⚠ %-34s esperado %s, veio %s (não-crítico)\n' "$name" "$expect" "$status"; warn=$((warn+1))
  fi
}

# check_post <nome> <url> <status_esperado> <json> [critico=1]
check_post() {
  local name="$1" url="$2" expect="$3" data="$4" critical="${5:-1}"
  local status
  status="$(curl -sS -m "$TIMEOUT" -o /dev/null -w '%{http_code}' \
    -X POST "$url" -H 'Content-Type: application/json' -d "$data" 2>/dev/null || echo 000)"
  if [ "$status" = "$expect" ]; then
    printf '  ✓ %-34s %s\n' "$name" "($status)"; pass=$((pass+1))
  elif [ "$critical" = 1 ]; then
    printf '  ✗ %-34s esperado %s, veio %s\n' "$name" "$expect" "$status"; fail=$((fail+1))
  else
    printf '  ⚠ %-34s esperado %s, veio %s (não-crítico)\n' "$name" "$expect" "$status"; warn=$((warn+1))
  fi
}

echo "🌐 Vitrine pública — $WEB_URL"
check "home"                  "$WEB_URL/"                       200
check "/imoveis"              "$WEB_URL/imoveis"                200
check "/leiloes"             "$WEB_URL/leiloes"                200
check "/sistema (vendas)"     "$WEB_URL/sistema"                200 "Fundador"   0
check "/pitch (deck)"         "$WEB_URL/pitch"                  200             0
check "/parceiros/planos"     "$WEB_URL/parceiros/planos"       200
check "/seja-parceiro"        "$WEB_URL/seja-parceiro"          200
check "/politica-privacidade" "$WEB_URL/politica-privacidade"   200
check "/termos-uso"           "$WEB_URL/termos-uso"             200
check "/cookies"              "$WEB_URL/cookies"                200
check "/primeiro-acesso"      "$WEB_URL/primeiro-acesso"        200             "" 0
check "/contato"              "$WEB_URL/contato"                200

echo ""
echo "🔌 API — $API_URL"
# /health = liveness real. Os endpoints de dados respondem 403 a acesso
# automatizado (proteção anti-bot da API: "Automated access is not permitted"),
# então 403 aqui = API no ar e protegida (não é falha). No navegador funcionam.
check "health (liveness)"     "$API_URL/health"                 200             "status"
check "auctions (anti-bot)"   "$API_URL/api/v1/auctions"        403             "" 0
check "auctions/map (anti-bot)" "$API_URL/api/v1/auctions/map"  403             "" 0

echo ""
echo "🔒 Segurança"
# Webhooks sem o header asaas-access-token DEVEM recusar (401) quando o
# ASAAS_WEBHOOK_SECRET está setado em produção (fail-closed). 200 aqui = alerta.
check_post "webhook SaaS sem segredo → 401" "$API_URL/api/v1/webhooks/asaas" 401 \
  '{"event":"PAYMENT_CONFIRMED","payment":{"id":"smoke-test"}}' 0
check_post "webhook especialistas sem segredo → 401" "$API_URL/api/v1/specialists/payments/webhook" 401 \
  '{"event":"PAYMENT_CONFIRMED","payment":{"id":"smoke-test"}}' 0

echo ""
echo "──────────────────────────────────────────────"
echo "Resultado: ✓ $pass   ✗ $fail   ⚠ $warn"
[ "$fail" -eq 0 ] && echo "✅ Smoke OK (verificações críticas passaram)" || echo "❌ Smoke FALHOU — revise os ✗ acima"
exit "$fail"

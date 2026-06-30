# AgoraEncontrei Software — Edição Offline (Desktop)

Empacotamento da plataforma para rodar **instalada no Windows**, offline, com
banco **SQLite local** e **ativação por licença assinada**.

> Status: **scaffold funcional**. Licenciamento testado (sign/verify ed25519 OK).
> Faltam as etapas de bundling do servidor e SQLite (ver Roadmap).

## Estrutura

| Arquivo | Função |
|---|---|
| `main.js` | Processo principal Electron: checa licença → sobe servidor local → abre janela |
| `license.js` | Validação **offline** da chave (ed25519) + cache com grace period |
| `preload.js` | Bridge seguro renderer↔main (só ativação de licença) |
| `renderer/activate.html` | Tela de ativação (cola a chave) |
| `tools/license-cli.js` | **Servidor**: gera par de chaves e emite licenças assinadas |
| `package.json` | electron + electron-builder (gera `.exe` NSIS) |

## Ativação de licença (já funciona)

```bash
cd tools
node license-cli.js keygen            # gera license-private.pem + license-public.pem
# >> cole o license-public.pem na constante PUBLIC_KEY de ../license.js

node license-cli.js issue license-private.pem \
  '{"customer":"Imobiliaria Lemos","plan":"basic","expires":"2027-12-31"}'
# imprime a CHAVE (payload.assinatura) que o cliente cola no app
```

O app valida a chave **localmente** (sem internet) contra a chave pública embutida.
Em produção, o **webhook do Asaas** (pagamento confirmado) chama o `issue` e envia a
chave por e-mail — fechando o fluxo de venda automatizado da versão offline.

## Build do instalador (Windows)

```bash
pnpm install
pnpm --filter @agoraencontrei/desktop dist   # gera dist/AgoraEncontrei Software Setup.exe
```

## Roadmap para 100% offline

1. **SQLite:** adaptar o schema Prisma para `provider = "sqlite"` (datasource alternativo) e
   gerar migrations SQLite. Os tipos `Decimal`/arrays precisam de ajuste.
2. **Servidor embarcado:** empacotar a API Fastify + Next standalone em `./server` e dar
   `spawn` no `startEmbeddedServer()` de `main.js`, com `DATABASE_URL=file:agora.db`.
3. **Importador local:** embutir o leitor DBF/Paradox (`scripts/imobili-migrator/`) para o
   cliente importar a carteira legada direto no app.
4. **Auto-update:** `electron-updater` apontando para os releases (quando online).

## Segurança

- A chave **privada** (`license-private.pem`) **nunca** vai para o repositório nem para o app
  (ver `.gitignore`). Só a pública é embarcada.
- Senhas de usuário usam hash (argon2, como na API) — diferente do legado IMOBILI (texto puro).

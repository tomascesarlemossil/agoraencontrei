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
| `preload.js` | Bridge seguro renderer↔main (ativação + onboarding) |
| `renderer/activate.html` | Tela de ativação (cola a chave) |
| `renderer/onboarding.html` | 1ª execução: **começar do zero** ou **importar backup** |
| `db.js` | **PostgreSQL embarcado** (portátil) + `prisma migrate deploy` local |
| `tools/license-cli.js` | **Servidor**: gera par de chaves e emite licenças assinadas |
| `scripts/bundle-server.mjs` | Monta `./server` (prisma + builds) antes de empacotar |
| `package.json` | electron + electron-builder (gera `.exe` NSIS) |

## O produto sai VAZIO (sem dados de terceiros)

O instalador entrega o sistema **limpo**. No fluxo de boot:

```
ativação de licença → 1ª execução? → onboarding → app
                                       ├─ "Começar do zero"  → painel limpo
                                       └─ "Importar backup"   → assistente de importação
```

O comprador escolhe começar do zero **ou** importar o backup do seu sistema antigo
(IMOBILI/Paradox, Uniloc/DBF, etc.) usando o migrador em `scripts/imobili-migrator/`.
Nenhum dado da Imobiliária Lemos (ou de qualquer outra) é embarcado.

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

## Banco local: PostgreSQL embarcado (não SQLite)

`db.js` sobe um **Postgres portátil** (`embedded-postgres`) em `userData/pgdata`, na porta local
54329, e aplica as **36 migrations** existentes via `prisma migrate deploy`. Assim o **mesmo schema
e o mesmo código** da versão nuvem rodam offline — sem reescrever nada.
Motivo: o schema usa arrays/`Decimal`/enums nativos do Postgres, incompatíveis com SQLite no Prisma.

## Roadmap para 100% offline

1. ✅ **Banco:** Postgres embarcado + migrations (`db.js`).
2. **Servidor embarcado:** buildar os apps (`pnpm build`), rodar `pnpm --filter @agoraencontrei/desktop bundle`
   (monta `./server`) e ativar o `spawn` do servidor em `startEmbeddedServer()`.
3. **Importador local:** embutir o leitor DBF/Paradox (`scripts/imobili-migrator/`) na tela de importação.
4. **Auto-update:** `electron-updater` apontando para os releases (quando online).

## Segurança

- A chave **privada** (`license-private.pem`) **nunca** vai para o repositório nem para o app
  (ver `.gitignore`). Só a pública é embarcada.
- Senhas de usuário usam hash (argon2, como na API) — diferente do legado IMOBILI (texto puro).

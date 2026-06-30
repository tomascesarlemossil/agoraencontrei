# Migrador de sistemas legados → AgoraEncontrei Software

Importa a carteira de sistemas imobiliários legados para a plataforma.
Cobre dois formatos de banco:

- **Paradox `.DB`** (sistema **IMOBILI** — Delphi/BDE) → `paradox_reader.py`
- **DBF / FoxPro** (sistema **Uniloc**) → `dbf_reader.py`

## Pipeline completo (Uniloc) — ✅ validado com dados reais

```
DBF (data/uniloc) → build_import.py → import_payload.json → load_to_db.mjs → banco
       leitura          mapeamento        (PII, gitignored)     gravação (Prisma)
```

### 1. Dry-run (lê + mapeia + valida, NÃO grava)
```bash
python3 build_import.py /caminho/backup_extraido
```
Resultado real na carteira da Imobiliária Lemos:

| Métrica | Valor |
|---|---|
| Clients (252 locadores + 904 inquilinos + 1025 fiadores) | **2.181** |
| Properties | **623** (0 sem dono) |
| Contracts **100% resolvidos** (locador+inquilino+imóvel) | **982 / 982** |
| Contratos com fiador (via junção `contfia`) | **809** |
| Pessoas sem CPF/CNPJ | **0** |

### 2. Carga no banco (idempotente, grava só com `--confirm`)
```bash
# simulação (não grava)
DATABASE_URL=... node load_to_db.mjs --company <companyId> --user <userId>
# carga real (validar antes com --limit 20)
DATABASE_URL=... node load_to_db.mjs --company <id> --user <id> --limit 20 --confirm
DATABASE_URL=... node load_to_db.mjs --company <id> --user <id> --confirm
```
Idempotente por `legacyId` + `importSource: 'uniloc'` — reexecutar **não duplica**.

## Ferramentas

| Arquivo | Função |
|---|---|
| `dbf_reader.py` | Lê tabelas DBF/FoxPro (esquema + registros + memo `.fpt`), encoding cp1252 |
| `paradox_reader.py` | Lê tabelas Paradox `.DB` (IMOBILI) — esquema validado |
| `build_import.py` | Mapeia DBF → payloads Prisma + valida vínculos (dry-run) |
| `load_to_db.mjs` | Grava o payload no banco via Prisma (idempotente, guarded) |

## Segurança / LGPD

- Os JSON exportados contêm **dados pessoais reais** (CPF, nomes) e estão **fora do Git** (`.gitignore`).
- `load_to_db.mjs` só grava com `--confirm` explícito e credenciais de banco fornecidas pelo operador.
- Recomenda-se primeira carga com `--limit` para conferência antes do volume total.

## Para o IMOBILI (Paradox)

Quando a pasta de dados do IMOBILI (`C:\DB\*.DB`) estiver disponível, o mesmo fluxo se aplica
trocando o leitor por `paradox_reader.py`. O `build_import.py` pode ganhar um modo `--paradox`.

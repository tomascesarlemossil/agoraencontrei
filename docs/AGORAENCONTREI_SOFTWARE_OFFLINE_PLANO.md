# AgoraEncontrei Software — Plano de Modernização & Empacotamento Offline

> Como transformar o legado **IMOBILI** (desktop Win32 de locação) no produto
> **AgoraEncontrei Software — Edição Locação**, vendável online e offline.

---

## 1. Realidade técnica

| | Legado IMOBILI | AgoraEncontrei (atual) |
|---|---|---|
| Tipo | Desktop Win32 (Delphi/VB?) | Web — Next.js 15 + Fastify + PostgreSQL |
| Instalação | Local na máquina | Nuvem (multi-tenant) |
| Foco | Locação (aluguéis) | Venda + CRM + IA + portais |
| Dados | Banco local (provável Access/Firebird/SQL local) | PostgreSQL (Neon) |

**Conclusão:** não há "cópia de arquivos". O caminho é **reconstruir as funções do IMOBILI**
na stack moderna e **empacotar** uma versão que rode também offline.

---

## 2. Lacuna de funcionalidade (o que falta para igualar o IMOBILI)

A plataforma já tem Proprietários, Imóveis, Contratos, Financeiro, Comissões, Usuários.
Para cobrir 100% do IMOBILI, falta reforçar o **núcleo de locação**:

| Módulo IMOBILI | Existe? | Ação |
|---|---|---|
| Proprietários | ✅ `PropertyOwner` | reutilizar |
| Imóveis | ✅ `Property` | reutilizar |
| Inquilinos | 🟡 parcial (`Client`/`Contact`) | mapear como locatário |
| Fiadores | 🔴 não | criar modelo `Guarantor` |
| Corretores | ✅ `User`/`Specialist` | reutilizar |
| Contratos (locação) | 🟡 `Contract`/`Rental` | reforçar fluxo de locação |
| Parcelas | 🟡 `Transaction`/`Invoice` | gerar parcelas mensais do aluguel |
| A Pagar (repasse) | ✅ `OwnerRepasse` | reutilizar |
| Conta Corrente | 🟡 `Transaction` | extrato por proprietário |
| Usuários / Empresa | ✅ `User`/`Company` | reutilizar |

> Os modelos `Contract`, `Rental`, `Transaction`, `OwnerRepasse` já existem no Prisma —
> a maior parte do trabalho é **fluxo e telas de locação**, não fundação nova.

---

## 3. Estratégia de empacotamento offline (recomendada)

### Opção A — Desktop wrapper (Electron) — **recomendada**
1. **Banco local:** Prisma com **SQLite** (arquivo único no PC do cliente) — sem servidor de banco.
2. **App embarcado:** Next.js standalone + Fastify rodando em `localhost` dentro do Electron.
3. **Instalador:** `electron-builder` → `.exe` (NSIS) para Windows, ícone próprio.
4. **Aparência:** abre como um programa normal (igual ao IMOBILI), mas moderno.
5. **Atualização:** `electron-updater` quando houver internet.

### Opção B — Docker Desktop
- `docker-compose` empacotado. Mais robusto, porém exige Docker (fricção para leigo). Não recomendado para Basic.

> **Decisão:** Opção A para o Basic. Migrar o schema para suportar SQLite é o item técnico principal.

---

## 4. Licenciamento (anti-pirataria, funciona offline)

```
Pagamento (Asaas) confirmado
  → servidor gera CHAVE assinada (ed25519): { cliente, plano, validade, hardwareHint }
  → e-mail com instalador + chave
  → app valida assinatura LOCALMENTE (chave pública embutida) → ativa
  → revalida online a cada 30 dias; tolera offline por X dias (grace period)
```

- Chave **assinada** = não precisa de internet para validar (só a 1ª ativação e revalidações).
- Vincular a um "hardware hint" (ex.: hash de CPU/disco) evita repasse da mesma licença.

🔴 **Depende de você:** definir política (1 máquina por licença? quantas reativações?).

---

## 5. Roadmap de execução

| Fase | Entregável | Depende de |
|---|---|---|
| **F0 — Spec** | Mapear 100% das telas do IMOBILI | 🔴 screenshots de cada tela (ou código) |
| **F1 — Locação** | Modelos `Guarantor`, fluxo de Inquilino/Contrato/Parcelas | eu |
| **F2 — Edição** | Plano "Locação Basic" no catálogo + gating | eu |
| **F3 — Offline** | Schema SQLite + wrapper Electron + build `.exe` | eu (+ teste no Windows) |
| **F4 — Licença** | Gerador + validador de chave | eu + 🔴 política |
| **F5 — Pagamento** | Ligar Asaas produção | 🔴 chave + CNPJ |
| **F6 — Lançar** | Landing + e-mails + suporte | 🔴 domínio/verba |

---

## 6. O que eu preciso de você para a Fase 0 (a mais barata e rápida)

Em vez de brigar com a linha de comando, o caminho mais simples:

**Me mande screenshots das telas do IMOBILI** — uma de cada item do menu:
Proprietários, Imóveis, Inquilinos, Fiadores, Contratos, Parcelas, A Pagar, Conta Corrente.

Com isso eu mapeio os **campos exatos** de cada cadastro e reconstruo idêntico (e melhor).
Não preciso do código-fonte para modernizar — preciso ver **o que cada tela faz e quais campos tem**.

> Alternativa, se quiser trazer o código: zipar `C:\Imobili` e subir num repositório.
> Mas, para um desktop legado, **as telas já me dizem 90% do que preciso.**

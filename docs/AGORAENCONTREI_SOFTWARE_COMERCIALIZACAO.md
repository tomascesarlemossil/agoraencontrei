# AgoraEncontrei Software — Blueprint de Comercialização

> Plano mestre para transformar a plataforma AgoraEncontrei num **produto de software vendável**,
> em duas modalidades: **Online (SaaS)** e **Offline (instalável na máquina do cliente)**.
> Versão de entrada: **Basic / Lite**.
>
> Status do documento: **v1 — base construída sobre o que já existe no repositório.**
> Itens marcados com 🔴 dependem de você (credenciais, CNPJ, código legado `C:\Imobili`).

---

## 0. Resumo executivo

A plataforma `agoraencontrei` **já é** um sistema imobiliário completo e **já tem a infraestrutura de venda pronta**:

| Componente já existente | Arquivo | O que faz |
|---|---|---|
| Catálogo de planos | `apps/api/src/services/bootstrap-plans.ts` | Semeia Simples / Premium / Super Premium / Nível Máximo |
| Espelho estático dos planos | `apps/web/src/lib/site-factory/plan-registry.ts` | Usado em `/sistema`, `/pitch` |
| Checkout automático | `apps/api/src/routes/billing/saas-checkout.ts` | Cria assinatura via **Asaas** |
| Liberação por plano | `apps/api/src/services/plan-gating.service.ts` | Bloqueia/libera módulos |
| Multi-tenant | `apps/web/src/middleware.ts` | Cada cliente ganha um subdomínio |
| Página de planos | `apps/web/src/app/(public)/parceiros/planos/page.tsx` | Vitrine pública |

**Conclusão:** não precisamos construir a "máquina de vender" do zero. Precisamos **embalar e posicionar**
um produto chamado **AgoraEncontrei Software**, criar a **modalidade offline**, e fechar os itens
operacionais (pagamento, fiscal, marketing, suporte).

---

## 0.5 Inventário do sistema legado — IMOBILI (observado via tela)

> Capturado diretamente de capturas de tela do sistema rodando em `C:\Imobili`.
> Ainda **não temos o código-fonte**; este inventário é o que dá para mapear visualmente.

- **Produto:** "IMOBILI — Sistema Administrativo de Imóveis"
- **Tipo:** Aplicação **desktop Windows (Win32/MDI)** — janela clássica, provável Delphi/VB.
  **Não é web.** Roda local na máquina.
- **Foco:** Administração de **locação** (aluguéis), não venda. Gestão de carteira de imóveis alugados.
- **Menu principal (módulos):**
  | Menu | Função provável |
  |---|---|
  | Proprietários | Cadastro de donos dos imóveis |
  | Imóveis | Cadastro da carteira de imóveis |
  | Inquilinos | Cadastro de locatários |
  | Fiadores | Garantidores dos contratos |
  | Corretores | Equipe / comissões |
  | Contratos | Contratos de locação |
  | Parcelas | Parcelas/mensalidades dos contratos |
  | A Pagar | Contas a pagar (repasse a proprietários etc.) |
  | Conta Corrente | Movimentação financeira / extrato |
  | Usuários | Controle de acesso ao sistema |
  | Empresa | Dados da imobiliária |
  | Configurações / Ajuda / Sair | Sistema |

### Implicação estratégica
"Copiar o sistema offline" de um app Win32 legado **não é copiar binário** — é **reconstruir/modernizar** o
conjunto de funcionalidades acima como software novo. A boa notícia: a plataforma `agoraencontrei` já cobre
**Proprietários, Imóveis, Contratos, Financeiro, Comissões, Usuários** — falta apenas reforçar o módulo de
**locação** (Inquilinos, Fiadores, Parcelas, Conta Corrente do proprietário), que o IMOBILI tem como núcleo.

> **Decisão de produto:** o "AgoraEncontrei Software — Edição Locação" entrega tudo que o IMOBILI faz,
> porém **modernizado** (web + offline), substituindo o legado.

---

## 1. Definição do produto

### 1.1 Nome comercial
**AgoraEncontrei Software** — "O sistema imobiliário inteligente, online ou no seu computador."

### 1.2 Modalidades

| Eixo | **Online (SaaS)** | **Offline (Local)** |
|---|---|---|
| Entrega | Subdomínio `cliente.agoraencontrei.com.br` | Instalador para Windows (`.exe`) |
| Hospedagem | Nossa nuvem (Railway/Vercel/Neon) | Máquina do próprio cliente |
| Atualizações | Automáticas | Via atualizador embutido (quando online) |
| Dados | Banco na nuvem | Banco local (PostgreSQL/SQLite embarcado) |
| Internet | Necessária | Opcional (funciona sem) |
| Público | Quem quer começar rápido, sem TI | Quem exige dados na própria máquina |

### 1.3 Edição de entrada — **Basic / Lite** (equivale ao plano "Simples")

Recursos inclusos (espelhando `bootstrap-plans.ts → slug: 'lite'`):
- Cadastro e gestão de até **30 imóveis**
- **CRM básico** (leads + contatos)
- Site/vitrine profissional (online) ou painel local (offline)
- **Tomás IA** — 50 conversas/mês (online; no offline, requer chave de IA do cliente — ver §6)
- Suporte por e-mail

> A edição Basic é deliberadamente enxuta para ser o **degrau de entrada** (R$ 97/mês online).
> Upsell natural para Premium (R$ 297) e Super Premium (R$ 597).

---

## 2. Posicionamento e pricing

### 2.1 Tabela de preços (online — já no banco)

| Edição | Mensal | Anual | Limite imóveis |
|---|---|---|---|
| **Basic/Lite (Simples)** | R$ 97 | R$ 970 (~2 meses grátis) | 30 |
| Premium | R$ 297 | R$ 2.970 | 200 |
| Super Premium | R$ 597 | R$ 5.970 | ilimitado |
| Nível Máximo | R$ 3.500 | R$ 35.000 | ilimitado + Editor de Vídeo IA |

### 2.2 Preço sugerido — modalidade Offline

A versão offline tem **custo de suporte/atualização** mas **zero custo de hospedagem nossa**. Modelo recomendado:

| Opção | Preço sugerido | Racional |
|---|---|---|
| **Licença vitalícia Basic** | R$ 1.497 (pagamento único) | 🔴 confirmar | Cliente "compra" o software |
| **Licença anual Basic** | R$ 797/ano | Inclui atualizações + suporte |
| **Add-on online** | + R$ 47/mês | Sincronização nuvem para quem quiser híbrido |

> 🔴 **Decisão sua:** vitalícia vs. anual. Recomendo **anual** (receita recorrente + cobre suporte).

---

## 3. Branding de vendas

### 3.1 Identidade
- **Marca-mãe:** AgoraEncontrei
- **Submarca:** AgoraEncontrei **Software**
- **Tagline:** *"Seu sistema imobiliário completo — na nuvem ou no seu PC."*
- **Promessa:** *"No ar em 24h (online) ou instalado em 10 minutos (offline)."*

### 3.2 Mensagens-chave (copy)
1. **Controle total** — "Seus dados na sua máquina, se você quiser."
2. **IA de verdade** — "Tomás, o corretor virtual que atende seus leads 24/7."
3. **Sem complicação** — "Pague online, comece na hora."
4. **Cresça quando quiser** — "Comece no Basic, suba para Premium num clique."

### 3.3 Ativos de marketing a produzir
- [x] Landing page de vendas (entregue em `public/software/index.html`)
- [ ] 🔴 Vídeo demo (precisa do sistema rodando / capturas)
- [ ] 🔴 Conta de anúncios (Google/Meta) + verba
- [ ] Sequência de e-mails de onboarding (rascunho em §8)

---

## 4. Fluxo de venda 100% automatizado (online)

```
Visitante → Landing (/software) → Escolhe plano → Checkout Asaas
   → Webhook Asaas confirma pagamento → Provisiona tenant automaticamente
   → E-mail com acesso (subdomínio + senha) → Cliente entra e usa
```

Pontos já existentes no código:
- Checkout: `apps/api/src/routes/billing/saas-checkout.ts`
- Webhook financeiro: `apps/api/src/routes/finance/webhook.ts`

🔴 **Necessário de você para ativar:**
- `ASAAS_API_KEY` (produção) — chave da sua conta Asaas
- CNPJ ativo cadastrado no Asaas (para receber)
- Confirmar e-mail transacional (`SMTP_*`)

---

## 5. Fluxo de venda — modalidade Offline

```
Visitante → Landing → "Quero a versão local" → Checkout Asaas (licença)
   → Pagamento confirmado → Gera CHAVE DE LICENÇA única
   → E-mail com link do instalador (.exe) + chave
   → Cliente instala → cola a chave → software ativa (valida online 1x)
   → Funciona offline; revalida licença a cada N dias quando houver internet
```

Componentes a construir (ver §7 — plano técnico):
- Gerador/validador de licença (assinatura criptográfica)
- Instalador empacotado
- Tela de ativação no app

---

## 6. Tratamento da IA (Tomás) no offline

O Tomás depende de API de IA (Anthropic/OpenAI). Offline puro não tem como chamar a nuvem. Estratégias:

| Estratégia | Como | Trade-off |
|---|---|---|
| **A) Cliente usa a própria chave** | Campo "cole sua ANTHROPIC_API_KEY" | Cliente paga IA direto; precisa de internet p/ IA |
| **B) Proxy nosso com cota** | App chama nosso endpoint, autenticado pela licença | Controlamos cota; exige internet p/ IA |
| **C) Modo sem IA** | Basic offline vende sem Tomás; IA é upsell | Mais simples; IA vira diferencial pago |

> **Recomendação:** **C** no Basic (sem IA por padrão) + **B** como add-on. Mantém o offline funcionando 100% sem internet, e a IA vira upsell claro.

---

## 7. Plano técnico — empacotamento offline

> ⚠️ A app web é **Next.js 15 + API Fastify + PostgreSQL**. Empacotar isso "offline" tem caminhos distintos.
> A escolha final depende do que o `C:\Imobili` realmente é (🔴 ainda não temos esse código).

### Caminho recomendado: **Desktop wrapper (Electron) + serviços embarcados**
1. **Banco:** trocar PostgreSQL por **PostgreSQL portátil embarcado** ou **SQLite** via Prisma (Prisma suporta SQLite — exige ajuste de schema/migrations).
2. **API + Web:** rodar Fastify + Next em modo standalone dentro do processo Electron (localhost).
3. **Empacotar:** `electron-builder` gera `.exe` (NSIS) para Windows.
4. **Licença:** módulo de ativação que valida chave assinada (ed25519) contra nosso servidor 1x, depois cacheia.
5. **Atualizações:** `electron-updater` quando houver internet.

### Caminho alternativo: **Docker Desktop**
- Entregar `docker-compose` + instalador que sobe Postgres+Redis+API+Web locais.
- Mais robusto, porém exige Docker no PC do cliente (fricção maior para leigo).

> 🔴 **Decisão sua** após vermos o `C:\Imobili`: se o sistema legado já é desktop (.NET/Java/PHP local?), o caminho muda — possivelmente **modernizamos o legado** em vez de empacotar o Next.

---

## 8. Operação e pós-venda

### 8.1 E-mails automatizados (rascunho)
- **E1 — Boas-vindas + acesso** (imediato pós-pagamento)
- **E2 — Primeiros passos** (dia 1)
- **E3 — "Já cadastrou seus imóveis?"** (dia 3)
- **E4 — Upsell Premium** (dia 14)
- **E5 — Renovação/retenção** (D-7 do vencimento)

### 8.2 Suporte
- Canal: e-mail + WhatsApp (já há integração WhatsApp Cloud API no código)
- SLA Basic: resposta em até 48h úteis

### 8.3 Jurídico / fiscal 🔴
- [ ] Termos de Uso + Política de Privacidade (LGPD)
- [ ] Contrato de licença de software (EULA) — para a versão offline
- [ ] Emissão de NF-e de serviço (há módulo `fiscal` no código)
- [ ] CNPJ + enquadramento tributário

---

## 9. Checklist "100% apto a vender"

### Já pronto no código ✅
- [x] Planos e preços definidos (banco + espelho)
- [x] Checkout Asaas
- [x] Provisionamento multi-tenant
- [x] Plan gating
- [x] Landing de vendas do Software (este pacote)

### A construir (eu consigo, neste repo) 🟡
- [ ] Página `/software` integrada ao Next (além da estática)
- [ ] Edição "Basic Offline" no catálogo de planos
- [ ] Módulo de licença (gerador + validador)
- [ ] Esqueleto Electron / build offline
- [ ] Sequência de e-mails (templates)
- [ ] Termos/EULA (rascunho)

### Bloqueado — depende de você 🔴
- [ ] **Código real do `C:\Imobili`** (subir pro GitHub ou colar inventário)
- [ ] `ASAAS_API_KEY` de produção + CNPJ
- [ ] Domínio/landing pública apontada
- [ ] Verba e contas de anúncio (marketing pago)
- [ ] Decisões de pricing offline (vitalícia x anual)
- [ ] Chave de IA para o Tomás (estratégia §6)

---

## 10. Próximos passos imediatos

1. **Você:** trazer o `C:\Imobili` (subir ao GitHub **ou** colar o inventário técnico).
   → Sem isso, "copiar o sistema offline da sua máquina" é literalmente impossível deste ambiente.
2. **Eu:** com o inventário, decidir se **modernizamos o legado** ou **empacotamos a plataforma atual** como offline.
3. **Eu:** implementar edição Basic Offline + módulo de licença.
4. **Você:** ligar Asaas produção + CNPJ → venda automatizada no ar.

> Enquanto o item 1 não chega, **tudo que não depende do código legado já está sendo adiantado** neste pacote.

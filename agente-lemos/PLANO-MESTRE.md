# PLANO MESTRE — Agente Gestor Lemos

> **Projeto novo, do zero, separado.** Não tem relação com o código do AgoraEncontrei.
> Objetivo: um agente pessoal que conhece 100% dos seus negócios e ajuda a organizar
> **rotina, clientes, negócios, resoluções e decisões** em todas as suas frentes.

**Dono / operador:** Tomás César Lemos
**Data de início:** 2026-07-25
**Status:** Fundação montada (v0.1) — pronto para ser alimentado com dados reais.

---

## 1. O que é este agente

Não é um app de CRM tradicional que você tem que ficar preenchendo. É um **cérebro de negócios**
que vive dentro do Claude Code / Claude e que:

1. **Conhece você e todos os seus negócios** — através de uma base de conhecimento estruturada
   em texto (Markdown), que fica neste repositório. Tudo versionado, tudo seu, funciona offline.
2. **Organiza sua rotina** — agenda, tarefas, rituais diários/semanais/mensais, follow-ups.
3. **Acompanha clientes e negócios** — uma ficha por cliente e por negócio, com histórico.
4. **Ajuda a decidir e resolver** — quando você chega com um problema ("devo comprar esse
   terreno?", "esse inquilino está atrasado, o que faço?"), ele responde com base no que já
   sabe de você + conhecimento técnico das áreas.
5. **Cresce com você** — cada conversa pode virar uma nova anotação na base. Quanto mais você
   usa, mais ele sabe.

### Por que Markdown + Skill (e não um app pesado agora)

- **Sempre disponível / "offline":** os arquivos são seus, ficam no repositório, não dependem
  de servidor no ar. Abriu o Claude Code, o agente já sabe de tudo.
- **Zero fricção para começar:** dá para alimentar hoje, sem esperar programar telas.
- **Evolutivo:** quando a base estiver madura, dá para plugar um app web/mobile por cima
  (ver Fase 3). A base de conhecimento continua a mesma.

---

## 2. Suas frentes de negócio (o mapa)

| # | Frente | O que envolve | Pasta |
|---|--------|---------------|-------|
| 1 | **Imobiliária Lemos** (locação) | Carteira de aluguéis, contratos, repasses, cobrança, IPTU, rescisões, vistorias | `conhecimento/01-imobiliaria-lemos/` |
| 1 | **Imobiliária Lemos** (vendas) | Captação, venda de imóveis, comissões, propostas | `conhecimento/01-imobiliaria-lemos/` |
| 2 | **Loteamento** | Compra/desenvolvimento de terreno, aprovação, infraestrutura, venda de lotes | `conhecimento/02-loteamento/` |
| 3 | **Construção** | Obras, orçamento, cronograma, fornecedores, mão de obra | `conhecimento/03-construcao/` |
| 4 | **Reforma / Flip** | Comprar, reformar e revender casas; análise de retorno | `conhecimento/04-reforma-flip/` |
| 5 | **Investimentos** | Alocação de capital, imóveis de renda, oportunidades | `conhecimento/05-investimentos/` |
| 6 | **Leilões** | Análise, arremate, desocupação, revenda | `conhecimento/06-leiloes/` |
| 7 | **AgoraEncontrei** | Sua startup / plataforma (papel de fundador) | `conhecimento/07-agora-encontrei/` |
| 8 | **Financeiro pessoal / holding** | Fluxo de caixa consolidado, contas, impostos, patrimônio | `conhecimento/08-financeiro/` |
| 9 | **Jurídico / documentos** | Contratos-modelo, procurações, certidões, prazos | `conhecimento/09-juridico-docs/` |

> A **Imobiliária Lemos** foi fundada pela sua mãe, Noemia, em 2002. Hoje você administra.
> Carteira de locação é o coração operacional; existe também venda, e as outras frentes
> orbitam o mesmo capital e a mesma agenda.

---

## 3. Como o agente se organiza (arquitetura)

```
agente-lemos/
├── PLANO-MESTRE.md          ← este documento (a bússola)
├── README.md                ← como usar no dia a dia
│
├── .claude/skills/gestor-lemos/
│   └── SKILL.md             ← a "personalidade" e as regras do agente
│
├── conhecimento/            ← O QUE O AGENTE SABE (base de conhecimento)
│   ├── 00-perfil.md         ← quem é você, objetivos, preferências, decisões
│   ├── 01-imobiliaria-lemos/
│   ├── 02-loteamento/
│   ├── ... (uma pasta por frente)
│
├── rotina/                  ← ORGANIZAÇÃO DO TEMPO
│   ├── rituais.md           ← o que revisar todo dia/semana/mês
│   ├── agenda.md            ← compromissos e prazos
│   └── tarefas.md           ← lista viva de pendências (por área)
│
├── clientes/                ← UMA FICHA POR CLIENTE (usa templates/)
├── negocios/                ← UMA FICHA POR NEGÓCIO/DEAL
└── templates/               ← modelos para criar fichas novas rápido
```

**Fluxo mental do agente ao te ajudar:**

1. Lê o `00-perfil.md` para lembrar quem é você e seus objetivos.
2. Identifica de qual frente é o assunto → abre a pasta de conhecimento certa.
3. Puxa clientes/negócios/tarefas relacionados.
4. Responde ou executa a ação (registrar tarefa, atualizar ficha, sugerir decisão).

---

## 4. Roadmap de execução

### Fase 1 — Fundação (FEITO nesta v0.1)
- [x] Estrutura de pastas separada do AgoraEncontrei
- [x] Plano mestre + README
- [x] Skill do agente (personalidade + regras)
- [x] Templates de perfil, cliente, negócio, imóvel, tarefa
- [x] Esqueleto de conhecimento por frente (a preencher)
- [x] Rituais de rotina (diário/semanal/mensal)

### Fase 2 — Alimentação (PRÓXIMO — precisa de você)
- [ ] Preencher `00-perfil.md` com seus objetivos e preferências reais
- [ ] Preencher cada frente com a realidade (quantos imóveis, quais obras, etc.)
- [ ] Cadastrar os principais clientes e negócios em aberto
- [ ] Listar as pendências reais em `rotina/tarefas.md`
- [ ] *Modo entrevista:* o agente te faz perguntas e preenche sozinho

### Fase 3 — Automação e app (FUTURO, opcional)
- [ ] Painel web/mobile por cima da base (visão consolidada)
- [ ] Lembretes automáticos (WhatsApp/e-mail) de prazos e follow-ups
- [ ] Importação de planilhas existentes (financeiro, carteira de locação)
- [ ] Integração com o sistema da imobiliária, se fizer sentido

---

## 5. Princípios (regras do jogo)

1. **Tudo separado.** Este projeto nunca mistura com o código do AgoraEncontrei.
2. **Você é dono dos dados.** Tudo é texto, versionado, exportável, seu.
3. **Nada de inventar fatos.** O agente só afirma o que está registrado; o que não sabe,
   ele pergunta. Campos a preencher ficam marcados com `> A PREENCHER`.
4. **Privacidade.** Dados sensíveis (valores, documentos, pessoas) ficam neste repositório
   privado. Nada é publicado sem você mandar.
5. **Simples primeiro.** Começar útil hoje; sofisticar depois.

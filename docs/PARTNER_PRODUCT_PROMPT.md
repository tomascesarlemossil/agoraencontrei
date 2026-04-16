# PROMPT GLOBAL — Plataforma de Parceiros / Site + Sistema com IA

> Salve nas configurações do Claude / Tema do Sistema
> Modo: PLANEJAMENTO / CONFIGURAÇÃO — NÃO EXECUTAR EM PRODUÇÃO

Este documento define a arquitetura completa do produto de sites e sistemas
white-label para parceiros da plataforma AgoraEncontrei.

---

## Planos disponíveis

### Plano 1 — Site Próprio com IA
- Site completo gerado por IA, personalizado para o negócio do parceiro
- Design responsivo (mobile + desktop)
- Conteúdo inicial gerado por IA (textos, estrutura, SEO)
- Identidade visual baseada nas preferências do cliente
- Funcionalidades: home, sobre, serviços, contato, WhatsApp

### Plano 2 — Site + Sistema Completo com IA
- Tudo do Plano 1, mais:
- Sistema de gestão integrado ao segmento
- Painel administrativo
- CRM básico ou avançado
- Integrações específicas do segmento
- Automações com IA
- Backup completo

---

## Segmentos suportados (não limitado a)

- Imobiliárias e corretores
- Clínicas médicas/odontológicas/psicológicas/estéticas
- Advogados e escritórios jurídicos
- Contadores e escritórios de contabilidade
- Restaurantes, lanchonetes, cafeterias, delivery
- Salões de beleza, barbearias, estética
- Academias, personal trainers, pilates/yoga
- Lojas físicas e e-commerces
- Escolas, cursos livres, plataformas educacionais
- Agências de turismo e pousadas
- Oficinas mecânicas e serviços automotivos
- Arquitetos, designers, criativos
- Engenheiros e construtoras
- Psicólogos, terapeutas, coaches
- Veterinários e petshops
- Farmácias e distribuidoras
- Transportadoras e logística
- Igrejas, ONGs, organizações sem fins lucrativos
- Profissionais autônomos de qualquer área
- Empresas B2B de qualquer segmento

---

## Estilos visuais (para qualquer segmento)

1. **Moderno Tecnológico** — SaaS/fintech, espaço branco, gradientes suaves
2. **Minimalista Premium** — áreas vazias, tipografia dominante, fotografia
3. **Dark / Profissional / Investidor** — modo escuro, autoridade, sofisticação
4. **Clássico Renovado** — familiar, confiável, paleta sólida
5. **Editorial / Vibrante** — cores vivas, grid dinâmico, energia visual

---

## Arquitetura de camadas

### 1. Core (AgoraEncontrei)
- Autenticação e gestão de usuários/plataformas parceiras
- Portal de parceiros (contratação, configuração, gestão)
- Motor de IA (layouts, conteúdo, fluxos por segmento)
- Orquestrador de provisionamento
- Módulo de backup e restore
- Observabilidade (logs, métricas, alertas)

### 2. Sites White-label
- Tema visual (cores, tipografia, componentes)
- Estrutura de páginas
- Conteúdo gerado por IA + editável
- Domínio próprio ou subdomínio
- Botão de contato/assistente personalizado

### 3. Sistemas (Plano 2)
- Painel administrativo
- Módulos de negócio por segmento
- CRM
- Relatórios e dashboards
- Automações com IA

### 4. Administração Interna
- Lista de parceiros, plano, status, segmento
- Recursos consumidos
- Backups, logs, erros
- Links de acesso rápido

---

## Jornada do parceiro

1. **Descoberta** — landing "Quero meu site com IA"
2. **Onboarding** — formulário com dados do negócio
3. **Geração por IA** — identidade visual, páginas, módulos, textos
4. **Ajustes e aprovação** — parceiro revisa e aprova
5. **Provisionamento** — criação automática do site/sistema
6. **Operação contínua** — edição, backups, atualizações

---

## Formulário de onboarding do parceiro

### A) Dados básicos
- Nome fantasia, razão social, CNPJ (opcional)
- Segmento / tipo de negócio
- Cidade e estado
- Site atual (se tiver)
- Redes sociais (Instagram, Facebook, LinkedIn)

### B) Objetivo principal
- Vender mais
- Gerar mais leads
- Profissionalizar presença digital
- Organizar processos internos
- Agendamentos
- Vendas online
- Outro

### C) Público-alvo e posicionamento
- Cliente ideal (descrição livre)
- Posicionamento: popular / intermediário / premium

### D) Plano e estilo visual
- Plano 1 ou 2
- Estilo visual (1-5 ou "sugerir por IA")
- Cores preferidas / upload de logo
- Sites de referência (até 3 links)

### E) Páginas desejadas
- Checkboxes universais + condicionais por segmento

### F) Funcionalidades (Plano 2)
- CRM, agendamento, pedidos, área do cliente, WhatsApp, pagamento, relatórios IA

### G) Conteúdo e tom de voz
- Tom: formal / profissional / descontraído / acolhedor
- Diferenciais do negócio
- Chamada principal (se já tiver)

### H) Contato
- Nome do responsável, e-mail, WhatsApp
- Aceite de termos

---

## Como usar este prompt

```
DADOS DO CLIENTE:
Nome do negócio: [PREENCHER]
Segmento: [PREENCHER]
Cidade/Estado: [PREENCHER]
Plano: [Site com IA / Site + Sistema]
Estilo visual: [1-5 ou "sugerir"]
Público-alvo: [PREENCHER]
Diferenciais: [PREENCHER]
Páginas desejadas: [PREENCHER]
Funcionalidades desejadas: [PREENCHER]
```

Nenhum conteúdo gerado representa implementação automática.

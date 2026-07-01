# Relatório de Auditoria e Melhorias — Plataforma AgoraEncontrei

Este relatório documenta a auditoria completa realizada nos fluxos de criação de parceiro, login, contratação de pacotes, gerenciamento de imóveis e categorias de destaque, bem como as melhorias implementadas nos layouts de sites prontos.

## 1. Auditoria do Fluxo de Criação de Parceiro

### 1.1. Cadastro e Checkout (SaaS)
O fluxo de cadastro (`/parceiros/cadastro`) foi analisado detalhadamente. Ele utiliza o componente `DynamicPlans` para exibir os planos disponíveis (Lite, Premium, Super Premium, Nível Máximo) e o formulário de checkout.

**Descobertas:**
- O checkout cria corretamente a `Company`, o `Tenant` e o `User` (Admin) em uma única transação no banco de dados.
- O plano é ativado inicialmente com o status `TRIAL`.
- Uma senha temporária é gerada e armazenada em texto plano no campo `settings` do tenant (`tempPasswordPlain`), junto com a flag `tempPasswordIssued: true`.
- O Asaas é integrado corretamente para criar o cliente e a assinatura (`asaasSubscriptionId`).

### 1.2. Webhook de Pagamento (Asaas)
O arquivo `saas-webhook.ts` gerencia os eventos de pagamento do Asaas.

**Descobertas:**
- Quando o evento `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` é recebido, o status do plano do tenant é atualizado para `ACTIVE`.
- O webhook verifica se a flag `tempPasswordIssued` é verdadeira. Se for, ele gera um token de configuração de senha (`createPasswordSetupToken`) e envia um e-mail de boas-vindas com o link para o primeiro acesso (`/primeiro-acesso?token=...`).
- O envio de e-mail e WhatsApp (se configurado) está implementado corretamente para notificar o parceiro sobre a ativação do site e o acesso ao painel.

### 1.3. Primeiro Acesso e Login
A rota de primeiro acesso (`/primeiro-acesso`) permite que o parceiro defina sua própria senha usando o token recebido por e-mail.

**Descobertas:**
- O fluxo de definição de senha está seguro, utilizando o modelo `PasswordReset` e a biblioteca `argon2` para o hash da senha.
- Após definir a senha, o usuário pode fazer login no painel administrativo (`/login`).

## 2. Auditoria de Contratação de Pacotes e Destaques

A página de planos do parceiro (`/parceiros/planos`) exibe os pacotes de imóveis e os planos de destaque.

**Problemas Identificados:**
- Os botões "Assinar" para pacotes de imóveis (`IMOVEIS_PLANS`) e planos de destaque (`DESTAQUE_PLANS`) no componente `PlanosContent` eram apenas links para o WhatsApp da equipe comercial.
- Não havia um fluxo automatizado de checkout (via Asaas) para a contratação desses pacotes adicionais.
- O modelo `PlanDefinition` possui o campo `maxProperties`, mas não havia um sistema claro para adicionar pacotes avulsos de imóveis (ex: `+10 imóveis`) à cota base do plano.

## 3. Auditoria de Gerenciamento de Imóveis e Site Principal

O gerenciamento de imóveis no painel do parceiro (`/dashboard/properties`) e a exibição no site do tenant (`_tenant/[slug]/page.tsx`) foram analisados.

**Problemas Identificados:**
- **Site do Tenant Estático:** O site do tenant (`_tenant/[slug]/page.tsx`) estava exibindo imóveis de exemplo estáticos ("Casa exemplo 1", "Casa exemplo 2"), em vez de carregar os imóveis reais do banco de dados vinculados àquele tenant.
- **Filtro da API Pública:** A rota pública da API (`/api/v1/public/properties`) não possuía um filtro para buscar imóveis de um tenant específico (`companyId` ou `tenantSlug`). Ela retornava imóveis de todas as empresas (comportamento de marketplace).

**Melhorias Implementadas:**
- **Filtro na API:** Adicionado suporte para filtrar imóveis por `companyId` ou `tenantSlug` na rota `/api/v1/public/properties`.
- **Site do Tenant Dinâmico:** O arquivo `_tenant/[slug]/page.tsx` foi completamente reescrito para buscar e exibir os imóveis reais do tenant.
- **Ordenação de Destaques:** A exibição dos imóveis no site do tenant agora prioriza os imóveis marcados como `isPremium` (Super Destaque), seguidos pelos marcados como `isFeatured` (Destaque), e depois os demais.

## 4. Melhorias nos Layouts de Sites Prontos

O sistema de seleção e visualização de layouts de sites prontos foi aprimorado para oferecer uma experiência mais rica e sofisticada.

**Melhorias Implementadas:**
- **ThemePreviewModal v2:** O modal de pré-visualização de temas foi completamente refeito (passando de ~130 para ~470 linhas).
  - Adicionada navegação interativa entre os temas (setas e dots) sem fechar o modal.
  - Adicionado suporte para visualização em modos Desktop, Tablet e Mobile.
  - Inclusão de estatísticas simuladas de conversão e "mood" para cada tema.
  - Exibição de cards de imóveis reais na pré-visualização, com badges de Destaque e Super Destaque.
- **DynamicPlans (Cards de Tema):** Os mini-cards de seleção de tema no formulário de checkout foram aprimorados.
  - Substituição dos blocos simples de cor por mockups estilo "browser" mais detalhados e sofisticados.
  - Adição de efeitos de hover e transições suaves.

## 5. Resumo das Correções e Próximos Passos

A plataforma possui uma arquitetura robusta, mas algumas pontas soltas foram amarradas durante esta auditoria.

**Correções Realizadas:**
1.  O site do tenant agora exibe os imóveis reais do parceiro, com ordenação correta de Destaque e Super Destaque.
2.  A API pública de imóveis foi atualizada para suportar filtragem por tenant.
3.  A experiência de seleção de layouts foi significativamente melhorada com mockups e um modal de pré-visualização interativo.

**Recomendações para Próximos Passos:**
1.  **Automatizar Contratação de Pacotes:** Substituir os links de WhatsApp na página de planos por integrações reais com o checkout do Asaas (usando o endpoint `/module` ou criando um novo fluxo para quotas).
2.  **Gerenciamento de Quotas:** Implementar a lógica no banco de dados (ex: modelo `TenantAddon` ou `PropertyQuota`) para somar pacotes avulsos à cota base do plano (`PlanDefinition.maxProperties`).
3.  **Configurações do Site:** Expandir as opções de personalização no painel do parceiro para permitir a edição de banners, vídeos e seções específicas da página principal do tenant.

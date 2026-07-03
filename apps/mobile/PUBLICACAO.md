# Publicação do app AgoraEncontrei (App Store + Google Play)

Roteiro sob medida para publicar o app Expo (`apps/mobile`) nas lojas.
O código está pronto e verde (typecheck + Expo Doctor no CI). O que falta é
**operacional** — contas, credenciais e a ficha de cada loja.

---

## 0. Pré-requisitos (uma vez)

| Item | Onde | Custo |
|------|------|-------|
| Conta **Apple Developer** | developer.apple.com | US$ 99/ano |
| Conta **Google Play Console** | play.google.com/console | US$ 25 (única) |
| Conta **Expo (EAS)** | expo.dev | grátis p/ começar |
| EAS CLI | `npm i -g eas-cli` | — |

Identificadores já definidos em `app.json` (não mudar depois de publicar):
- **Bundle ID (iOS):** `com.agoraencontrei.app`
- **Package (Android):** `com.agoraencontrei.app`
- **Versão:** `1.0.0`

---

## 1. Ligar o projeto ao EAS

```bash
cd apps/mobile
eas login
eas init            # cria o projeto no Expo e grava extra.eas.projectId no app.json
```

> `eas.json` já tem os perfis `preview` (APK/simulador interno) e `production`
> (`autoIncrement: true`, `appVersionSource: remote` → o EAS cuida do
> buildNumber/versionCode automaticamente a cada build).

---

## 2. Build

```bash
# Teste interno antes de subir p/ loja:
eas build --profile preview --platform android   # gera APK p/ instalar no celular
eas build --profile preview --platform ios       # roda no simulador

# Builds de LOJA:
eas build --profile production --platform android # gera .aab
eas build --profile production --platform ios     # gera .ipa (pede credenciais Apple)
```

Na 1ª build o EAS gera/gerencia as credenciais (keystore Android, certificados
e provisioning iOS) — deixe o EAS gerenciar (`eas credentials` se precisar ver).

---

## 3. Submissão

```bash
eas submit --profile production --platform android   # envia o .aab ao Play Console
eas submit --profile production --platform ios       # envia o .ipa ao App Store Connect
```

Android pede uma **service account JSON** do Google Play (Play Console →
Configurações → acesso via API). iOS pede login Apple / chave de API do App
Store Connect.

---

## 4. Ficha da loja (preparar antes)

**Textos** (pt-BR):
- **Nome:** AgoraEncontrei
- **Subtítulo/curto:** Imóveis, aluguel, avaliação e leilões
- **Descrição:** usar a de `app.json` como base e expandir com os recursos:
  busca de imóveis, favoritos, avaliação imediata, leilões ao vivo, contato
  direto com a Imobiliária Lemos.
- **Palavras-chave:** imóveis, imobiliária, aluguel, comprar casa, apartamento,
  leilão de imóveis, Franca SP, avaliação de imóvel.

**Assets:**
- Ícone 1024×1024 (o `icon.png` já é RGB sem alfa — ok p/ Apple).
- **Screenshots** (obrigatórios): iPhone 6.7" e 6.5"; Android telefone.
  Gerar rodando o app no simulador (Home, Busca, Detalhe, Leilões, Avaliação).
- Feature graphic 1024×500 (Google Play).

**Links (já no ar, HTTP 200):**
- Política de privacidade: https://www.agoraencontrei.com.br/politica-privacidade
- Termos de uso: https://www.agoraencontrei.com.br/termos-uso
- Suporte: contato@agoraencontrei.com.br · (16) 3723-0045

**Classificação / privacidade:**
- Categoria: **Estilo de vida** (ou Negócios).
- Classificação etária: **Livre / 4+**.
- **Coleta de dados** (App Privacy / Data safety): o app coleta **nome, e-mail,
  telefone e CPF** na tela de Avaliação e no cadastro/login — declarar isso nos
  formulários das duas lojas (uso: funcionalidade do app / conta; não vende dados).

---

## 5. Checklist técnico de aprovação (já resolvido no código)

- [x] App **navegável sem login** (Apple rejeita apps que exigem conta p/ ver conteúdo).
- [x] Ícone iOS **sem canal alfa** (`icon.png` em RGB).
- [x] Sem permissões nativas desnecessárias (`android.permissions: []`; só usa rede + storage).
- [x] `ITSAppUsesNonExemptEncryption: false` (pula a pergunta de export compliance a cada envio).
- [x] Endpoints do app batendo com a API de produção (imóveis, leilões, avaliação, favoritos, login).
- [x] Bundle IDs e versão definidos.

## 6. Pontos de marca a decidir (opcionais)

- **Ícone**: hoje é o monograma AE azul-marinho/dourado; o site/instalador usam
  o logo verde "AgoraEncontrei". Padronizar é decisão de marca.
- **Pós-cadastro no app**: como no site, o cadastro online exige verificação por
  e-mail; hoje o app volta sem avisar "verifique seu e-mail". Login funciona.

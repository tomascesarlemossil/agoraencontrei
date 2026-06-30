# AgoraEncontrei — App Mobile (iOS + Android)

App **Expo (React Native + TypeScript)** do marketplace AgoraEncontrei.
**Espelhado** na plataforma web: consome o **mesmo backend Fastify + Postgres**,
então cadastros, imóveis, leads e dados são os mesmos ao vivo em qualquer acesso.

## Stack
- Expo SDK 51 · React Native 0.74 · TypeScript (strict)
- React Navigation (bottom tabs) · Context API + AsyncStorage
- Design system navy/gold · dark mode · haptics · acessibilidade

## Estrutura
```
src/
  components/   Brand, PropertyCard
  context/      AppContext (tema, idioma, sessão)
  navigation/   MainNavigator (5 abas)
  screens/      Home, Search, Auctions, Partners, Profile
  services/     api.ts (cliente do MESMO backend da web)
  utils/        theme, performance (haptics/flatlist), i18n
```

## Configuração
- API: `app.json → expo.extra.apiUrl` (default: API de produção no Railway).
- Bundle IDs: `com.agoraencontrei.app` (iOS e Android).

## Rodar (dev)
```bash
pnpm --filter @agoraencontrei/mobile install   # primeira vez
pnpm --filter @agoraencontrei/mobile start     # abre o Expo (QR code)
```
Escaneie o QR com o app **Expo Go** (iOS/Android) para testar no celular.

## Pagamentos
Assinaturas de planos são feitas **pela web** (sem comissão de loja). A aba
Parceiros abre o checkout do site. O app em si é gratuito.

## Publicação (próximos passos)
- Conta **Apple Developer** (US$ 99/ano) + **Google Play** (US$ 25 único).
- Build dos binários com **EAS Build** (`eas build -p ios|android`).
- Ícone/splash oficiais: adicionar em `src/assets/` (icon.png, splash.png,
  adaptive-icon.png) a partir do logo AE.

## Assets pendentes
Coloque o logo oficial (monograma AE) em `src/assets/`:
`icon.png` (1024×1024), `splash.png`, `adaptive-icon.png`.
Enquanto isso o app usa a marca textual (componente `Brand`).

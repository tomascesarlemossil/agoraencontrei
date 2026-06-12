# 💰 Custos da Operação — AgoraEncontrei

> Mapa completo dos serviços pagos do projeto: o que é, como cobra, se é
> essencial, e onde gerenciar. Use isto para revisar gastos e evitar surpresas.
>
> **Regra de ouro:** separe **assinatura** (paga todo mês mesmo parado) de
> **uso** (só paga quando usa). O dinheiro que sangra à toa está nas assinaturas.

---

## 🔴 Assinaturas (cobram mensalmente, mesmo sem uso)

| Serviço | Função | Essencial? | Onde gerenciar |
|---------|--------|-----------|----------------|
| **Vercel Pro** | Hospeda o site (web) | ✅ Sim | vercel.com → Settings → Billing |
| **Railway** | Hospeda a API | ✅ Sim | railway.app → projeto |
| **Neon** | Banco PostgreSQL | ✅ Sim | neon.tech |
| **Redis Cloud** | Filas (BullMQ) / cache | ✅ Sim (tem fallback em memória) | redis.com |
| **Domínio .com.br** | Endereço do site | ✅ Sim | registro.br / registrar |
| **Apify** | Scraping de leilões | ⚠️ Só se usa leilões | apify.com |
| **v0** (v0.app) | Gerador de UI com IA | ❌ **NÃO** — zero uso no código | **v0.app → Settings → Billing → Cancel** |

### ⚠️ Ações de assinatura
- **Cancelar o v0** → economia direta de **US$ 100/mês**. Não tem nenhuma
  referência no código; cancelar não afeta o site.
- **Vercel → Spend Management:** definir teto de gasto + alerta por e-mail
  para nunca mais ser suspenso por surpresa.
- **Vercel → Usage:** conferir a quebra (Bandwidth / Function Invocations /
  Image Optimization) quando a fatura de infraestrutura subir.

---

## 🟢 Por uso (só cobram quando a funcionalidade é usada)

Estas custam ~R$0 se ninguém usar. Para **blindar** contra uso acidental,
remova a chave correspondente no Railway (Variables) da funcionalidade que
você não usa.

| Serviço | Função | Onde é usado no código | Manter? |
|---------|--------|------------------------|---------|
| **Anthropic (Claude)** | Tomás + IA principal | núcleo do sistema (25+ arquivos) | ✅ Essencial |
| **OpenAI** | Voz (Whisper) + texto | busca por voz, transcrição | ✅ Se usa voz |
| **AWS S3** | Upload de fotos/vídeos | armazenamento de mídia | ✅ Essencial |
| **WhatsApp Cloud (Meta)** | Mensagens | integração WhatsApp | ✅ (faixa grátis + por conversa) |
| **Google Maps** | Mapas / Street View | busca, mapa de imóveis | ✅ (tem crédito grátis mensal) |
| **Cloudinary** | Otimização de imagem / marca d'água | processamento de imagem | ⚠️ Avaliar redundância com S3 |
| **Veras** | Render fotorrealista de imóvel | `apps/api/src/workers/visual-ai.worker.ts` (tela ai-visual) | ✅ **Em uso** (tela Foto IA) — manter |
| **MNML** | Staging virtual | `visual-ai.worker.ts` (tela ai-visual) | ✅ **Em uso** (tela Foto IA) — manter |
| **Google Imagen** | Edição de fotos em lote | `visual-ai.worker.ts` (tela ai-visual) | ✅ **Em uso** (tela Foto IA) — manter |
| **AssemblyAI** | Legendas de vídeo | `services/video-editor/captions.service.ts` | ✅ **Em uso** (Editor de Vídeo) — manter |
| **Luma** | B-roll de vídeo com IA | `services/video-editor/luma.service.ts` | ✅ **Em uso** (Editor de Vídeo) — manter |
| **Clicksign** | Assinatura digital de contrato | fluxo de contratos | ✅ Se assina contrato |
| **Asaas** | Pagamentos / boletos | sistema de receita | ✅ Essencial (é a receita) |

### ⚠️ Observações
- **Veras, MNML, Imagen, AssemblyAI e Luma estão EM USO** (telas "Foto IA"
  e "Editor de Vídeo" do painel) — **NÃO remover**. São cobradas por uso,
  então só geram custo quando você efetivamente gera fotos/vídeos.
- **`GEMINI_API_KEY` foi removida do código** — estava declarada mas nunca
  era usada em runtime. Pode apagar a chave no Railway também (segurança).
- Todas as chaves são **opcionais**: se faltar, a funcionalidade apenas se
  desabilita com uma mensagem amigável — **não quebra o site**.

---

## 🧹 Como blindar custo (sem quebrar nada)

No **Railway → API → Variables**:

- Sempre seguro remover: `GEMINI_API_KEY` (não usada no código).
- **Manter** `VERAS_API_KEY`, `MNML_API_KEY`, `GOOGLE_IMAGEN_API_KEY`,
  `LUMA_API_KEY`, `ASSEMBLYAI_API_KEY` — as telas Foto IA e Editor de
  Vídeo estão em uso. (São por uso: custam ~R$0 quando não há geração.)

> Remover uma chave **desabilita** a feature graciosamente. Para reativar,
> basta colocar a chave de volta.

---

## 📉 Otimização de banda

### ✅ Feito: removida a tag `<meta keywords>` gigante
O `layout.tsx` despejava **3.127 keywords** (`FRANCA_GEO_KEYWORDS`, arquivo de
3.179 linhas) numa única tag `<meta name="keywords">` em toda página que herda
o metadata padrão (~90 KB por página). A tag `<meta keywords>` é **ignorada
pelo Google desde 2009** — zero valor de SEO. Removida sem nenhum impacto
visual ou de ranking. O arquivo `seo-geo-keywords.ts` deixou de ser importado
(sai do bundle); pode ser apagado num próximo passo se ninguém mais usar.

### ℹ️ Sobre a home (já está razoável)
A home pesa ~930 KB sem compressão, mas a Vercel entrega ~214 KB com brotli.
Ela **já é eficiente em custo**: usa `<img>` puro nas fotos (evita o custo de
Image Optimization da Vercel) e `revalidate=60` (ISR — servida de cache, não
re-renderiza a cada visita). O peso restante é o payload de hidratação (RSC)
do Next.js App Router.

**Melhorias futuras (fazer com teste, sem pressa — NÃO mexer às pressas):**
1. Reduzir componentes `"use client"` na home (cada um infla o payload RSC).
2. Extrair SVGs repetidos (ex.: ícone do Instagram aparece 2x) para componente.
3. Manter `<img>` puro nas fotos de imóvel (trocar por `next/image`
   **aumentaria** o custo de Image Optimization da Vercel).

---

_Última revisão: 2026-06. Mantenha este arquivo atualizado ao adicionar ou
remover qualquer serviço pago._

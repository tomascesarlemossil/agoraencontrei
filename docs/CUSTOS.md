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
| **Veras** | Render fotorrealista de imóvel | `apps/api/src/workers/visual-ai.worker.ts` (tela ai-visual) | ⚠️ Só se usa "Foto IA" |
| **MNML** | Staging virtual | `visual-ai.worker.ts` (tela ai-visual) | ⚠️ Só se usa "Foto IA" |
| **Google Imagen** | Edição de fotos em lote | `visual-ai.worker.ts` (tela ai-visual) | ⚠️ Só se usa "Foto IA" |
| **AssemblyAI** | Legendas de vídeo | `services/video-editor/captions.service.ts` | ⚠️ **Duplica o Whisper** — pode cortar |
| **Luma** | B-roll de vídeo com IA | `services/video-editor/luma.service.ts` | ⚠️ Só se usa "Editor de Vídeo" |
| **Clicksign** | Assinatura digital de contrato | fluxo de contratos | ✅ Se assina contrato |
| **Asaas** | Pagamentos / boletos | sistema de receita | ✅ Essencial (é a receita) |

### ⚠️ Observações
- **AssemblyAI duplica o Whisper (OpenAI):** `captions.service.ts` já usa
  Whisper como fallback. Dá para cancelar a AssemblyAI e manter só o OpenAI.
- **`GEMINI_API_KEY` foi removida do código** — estava declarada mas nunca
  era usada em runtime. Pode apagar a chave no Railway também.
- Todas as chaves são **opcionais**: se faltar, a funcionalidade apenas se
  desabilita com uma mensagem amigável — **não quebra o site**.

---

## 🧹 Como blindar custo (sem quebrar nada)

No **Railway → API → Variables**, remova as chaves das funcionalidades que
você **não usa**:

- Se **NÃO usa** a tela `Dashboard → Foto IA (ai-visual)`:
  remova `VERAS_API_KEY`, `MNML_API_KEY`, `GOOGLE_IMAGEN_API_KEY`.
- Se **NÃO usa** a tela `Dashboard → Editor de Vídeo (video-editor)`:
  remova `LUMA_API_KEY`, `ASSEMBLYAI_API_KEY`.
- Sempre seguro remover: `GEMINI_API_KEY` (não usada no código).

> Remover a chave **desabilita** a feature graciosamente. Para reativar,
> basta colocar a chave de volta.

---

## 📉 Otimização de banda (home)

A home pesa ~930 KB sem compressão, mas a Vercel já entrega ~214 KB com
brotli. Composição: ~480 KB de payload de hidratação (RSC) + ~483 KB de
texto SEO renderizado direto na página.

**Melhorias possíveis (a fazer com teste, sem pressa):**
1. Mover blocos pesados de texto SEO para fora do render principal da home.
2. Reduzir componentes `"use client"` na home (cada um infla o payload RSC).
3. Garantir que todas as imagens usam `next/image` (otimização automática).

---

_Última revisão: 2026-06. Mantenha este arquivo atualizado ao adicionar ou
remover qualquer serviço pago._

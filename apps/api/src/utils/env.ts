import { z } from 'zod'

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3100),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  APP_URL: z.string().url().default('http://localhost:3100'),
  WEB_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  COOKIE_SECRET: z.string().min(32),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  VERAS_API_KEY: z.string().optional(),
  MNML_API_KEY: z.string().optional(),
  GOOGLE_IMAGEN_API_KEY: z.string().optional(),

  // WhatsApp Cloud API
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default('lemoschat_verify'),
  WHATSAPP_BUSINESS_ID: z.string().optional(),

  // Storage
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Redis (Upstash)
  REDIS_URL: z.string().optional(),
  REDIS_TOKEN: z.string().optional(),

  // Public portal
  PUBLIC_COMPANY_ID: z.string().optional(),

  // Asaas — cobranças e boletos
  ASAAS_API_KEY:        z.string().optional(),
  ASAAS_BASE_URL:       z.string().default('https://www.asaas.com/api/v3'),
  ASAAS_WALLET_ID:      z.string().optional(),
  ASAAS_WEBHOOK_SECRET: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Apify — web scraping platform
  APIFY_API_TOKEN: z.string().optional(),

  // Social Media Integration
  INSTAGRAM_TOKEN_LEMOS: z.string().optional(),         // @imobiliarialemos access token
  INSTAGRAM_TOKEN_TOMAS: z.string().optional(),         // @tomaslemosbr access token
  YOUTUBE_API_KEY: z.string().optional(),               // YouTube Data API v3 key
  YOUTUBE_CHANNEL_ID: z.string().optional(),            // UCKpTcdWhQZIPMX8EF_nNckw
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(), // Instagram Business Account ID
  INSTAGRAM_PAGE_ACCESS_TOKEN: z.string().optional(),   // Page access token (publish)
  FACEBOOK_PAGE_ID: z.string().optional(),              // 932688306232065
  META_PIXEL_ID: z.string().optional(),                 // 932688306232065

  // Cloudinary — image optimization & watermark
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_LOGO_ID: z.string().optional(),

  // Gemini — vision & content generation (alternative to Anthropic)
  GEMINI_API_KEY: z.string().optional(),

  // Google Maps / Street View
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Vercel Domains API
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),

  // Clicksign — digital signatures
  CLICKSIGN_ACCESS_TOKEN: z.string().optional(),
  CLICKSIGN_BASE_URL: z.string().optional(),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    console.error('⚠️ Missing/invalid environment variables (server will start with defaults):')
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(', ')}`)
    }
    // Don't exit — start with defaults so healthcheck passes on Railway
    // Required vars get safe fallbacks; features that need them will fail gracefully
    const fallback = {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      JWT_SECRET: process.env.JWT_SECRET || 'development-jwt-secret-placeholder-min-32-chars!!',
      COOKIE_SECRET: process.env.COOKIE_SECRET || 'development-cookie-secret-placeholder-32-chars!',
    }
    const retryResult = envSchema.safeParse(fallback)
    if (retryResult.success) return retryResult.data
    // If still fails, return whatever we can
    console.error('⚠️ Could not parse env even with fallbacks, using raw process.env')
    return envSchema.parse({
      ...fallback,
      NODE_ENV: 'production',
      PORT: parseInt(process.env.PORT || '3100', 10),
    })
  }
  return result.data
}

export const env = parseEnv()
export type Env = typeof env

/** Log warnings for optional-but-important variables that are missing at startup */
export function logEnvWarnings(logger: { warn: (msg: string) => void }) {
  const warnings: [string, string][] = [
    ['ANTHROPIC_API_KEY',    'AI agents (PDF, audio, copywriter, visual) will not work'],
    ['SMTP_HOST',            'Email notifications (leads, proposals, evaluations) will not be sent'],
    ['REDIS_URL',            'BullMQ job queue and session cache will use in-memory fallback'],
    ['AWS_S3_BUCKET',        'Photo uploads will fail — S3 not configured'],
    ['WHATSAPP_TOKEN',       'WhatsApp notifications and inbox will not work'],
    ['ASAAS_API_KEY',        'Boleto/cobrança via Asaas will not work'],
    ['APIFY_API_TOKEN',      'Apify scrapers (Caixa, Santander, OLX) will not run'],
    ['CLOUDINARY_CLOUD_NAME','Cloudinary image presets and watermark will not work'],
  ]
  for (const [key, impact] of warnings) {
    if (!process.env[key]) {
      logger.warn(`⚠️  Missing optional env var ${key}: ${impact}`)
    }
  }
}

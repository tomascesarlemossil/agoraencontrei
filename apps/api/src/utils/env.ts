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

  // Social Media Integration
  INSTAGRAM_TOKEN_LEMOS: z.string().optional(),    // @imobiliarialemos access token
  INSTAGRAM_TOKEN_TOMAS: z.string().optional(),    // @tomaslemosbr access token
  YOUTUBE_API_KEY: z.string().optional(),          // YouTube Data API v3 key
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    console.error('❌ Invalid environment variables:')
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(', ')}`)
    }
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
export type Env = typeof env

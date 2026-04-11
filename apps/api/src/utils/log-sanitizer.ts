/**
 * Log Sanitizer — masks sensitive data before logging
 *
 * Prevents API keys, tokens, and credentials from appearing in logs.
 * Used by the Pino serializer to auto-mask payloads.
 */

const SENSITIVE_KEYS = [
  'token', 'secret', 'password', 'apikey', 'api_key', 'authorization',
  'cookie', 'access_token', 'refresh_token', 'whatsapp_token',
  'asaas_api_key', 'anthropic_api_key', 'openai_api_key', 'jwt_secret',
  'cookie_secret', 'aws_secret_access_key', 'smtp_pass', 'redis_token',
  'cloudinary', 'gemini_api_key', 'google_maps_api_key', 'vercel_token',
  'clicksign_access_token', 'apify_api_token',
]

const SENSITIVE_PATTERNS = [
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/gi,
  // API keys (long alphanumeric strings)
  /sk-[A-Za-z0-9]{20,}/g,
  /EAA[A-Za-z0-9]{50,}/g, // Meta/Facebook tokens
  // Asaas keys
  /\$aact_[A-Za-z0-9]+/g,
]

/**
 * Mask a string value — shows first 4 chars + ***
 */
function maskValue(val: string): string {
  if (val.length <= 8) return '***'
  return val.slice(0, 4) + '***' + val.slice(-2)
}

/**
 * Deep-sanitize an object, masking sensitive fields
 */
export function sanitizePayload(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]'
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') {
    let result = obj
    for (const pattern of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, '***REDACTED***')
    }
    return result
  }
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item, depth + 1))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const keyLower = key.toLowerCase().replace(/[-_]/g, '')
    const isSensitive = SENSITIVE_KEYS.some(sk =>
      keyLower.includes(sk.toLowerCase().replace(/[-_]/g, '')),
    )

    if (isSensitive && typeof val === 'string') {
      sanitized[key] = maskValue(val)
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizePayload(val, depth + 1)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

/**
 * Pino serializer that masks sensitive data in logged objects
 */
export const sensitiveSerializer = {
  req(req: any) {
    return {
      method: req.method,
      url: req.url,
      hostname: req.hostname,
      remoteAddress: req.remoteAddress,
      headers: req.headers
        ? sanitizePayload(req.headers)
        : undefined,
    }
  },
  err(err: any) {
    return {
      type: err.type,
      message: typeof err.message === 'string'
        ? sanitizePayload(err.message)
        : err.message,
      stack: typeof err.stack === 'string'
        ? sanitizePayload(err.stack)
        : undefined,
    }
  },
}

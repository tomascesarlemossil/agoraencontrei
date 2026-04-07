import argon2 from 'argon2'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { OAuth2Client } from 'google-auth-library'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, User } from '@prisma/client'
import type { JwtPayload } from '../plugins/jwt.js'
import { env } from '../utils/env.js'
import { sendEmail, isEmailConfigured } from './email.service.js'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  companyId?: string
  companyName?: string  // create company if no companyId
  phone?: string
}

export interface LoginInput {
  email: string
  password: string
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly app: FastifyInstance,
  ) {}

  private async verifyPassword(passwordHash: string, plainPassword: string): Promise<boolean> {
    if (!passwordHash) return false

    if (passwordHash.startsWith('$argon2')) {
      return argon2.verify(passwordHash, plainPassword)
    }

    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')) {
      return bcrypt.compare(plainPassword, passwordHash)
    }

    return false
  }

  private needsRehashToArgon2(passwordHash: string): boolean {
    return !passwordHash.startsWith('$argon2')
  }

  // ── Register ─────────────────────────────────────────────────────────────

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    })
    if (existing) {
      throw Object.assign(new Error('E-mail já cadastrado'), { statusCode: 409, code: 'EMAIL_EXISTS' })
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    })

    // Create or use existing company
    let companyId = input.companyId
    if (!companyId) {
      const company = await this.prisma.company.create({
        data: { name: input.companyName ?? input.name + ' Imobiliária' },
      })
      companyId = company.id
    }

    const user = await this.prisma.user.create({
      data: {
        companyId,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone,
        passwordHash,
        role: 'ADMIN',
        status: 'PENDING_VERIFICATION',
      },
      select: this.userSelect,
    })

    // Send verification email
    await this.sendVerificationEmail(user.email, user.id)

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId: user.id,
        action: 'user.register',
        resource: 'user',
        resourceId: user.id,
      },
    })

    // Return user WITHOUT tokens — user must verify email first
    return { user, pendingVerification: true }
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    })

    if (!user || !user.passwordHash) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401, code: 'INVALID_CREDENTIALS' })
    }

    if (user.status === 'PENDING_VERIFICATION') {
      throw Object.assign(new Error('Verifique seu e-mail antes de fazer login. Enviamos um link de confirmação para ' + user.email), { statusCode: 403, code: 'PENDING_VERIFICATION' })
    }

    if (user.status === 'SUSPENDED') {
      throw Object.assign(new Error('Conta suspensa. Contate o administrador.'), { statusCode: 403, code: 'ACCOUNT_SUSPENDED' })
    }

    if (user.status === 'INACTIVE') {
      throw Object.assign(new Error('Conta inativa. Contate o administrador.'), { statusCode: 403, code: 'ACCOUNT_INACTIVE' })
    }

    const valid = await this.verifyPassword(user.passwordHash, input.password)
    if (!valid) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401, code: 'INVALID_CREDENTIALS' })
    }

    if (this.needsRehashToArgon2(user.passwordHash)) {
      const migratedHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
      })

      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: migratedHash },
      })

      user.passwordHash = migratedHash
    }

    const tokens = await this.generateTokens(user, user.companyId)

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'user.login',
        resource: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    })

    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: this.userSelect,
    })

    return { user: safeUser, ...tokens }
  }

  // ── Refresh Token ────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored) {
      throw Object.assign(new Error('Refresh token inválido'), { statusCode: 401, code: 'INVALID_REFRESH_TOKEN' })
    }

    if (stored.usedAt) {
      // Token reuse detected — invalidate entire family
      await this.prisma.refreshToken.deleteMany({ where: { family: stored.family } })
      throw Object.assign(new Error('Token reutilizado detectado'), { statusCode: 401, code: 'TOKEN_REUSE_DETECTED' })
    }

    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } })
      throw Object.assign(new Error('Refresh token expirado'), { statusCode: 401, code: 'REFRESH_TOKEN_EXPIRED' })
    }

    // Mark as used
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } })

    const tokens = await this.generateTokens(stored.user, stored.user.companyId, stored.family)

    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.user.id },
      select: this.userSelect,
    })

    return { user: safeUser, ...tokens }
  }

  // ── Logout ───────────────────────────────────────────────────────────────

  async logout(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (stored) {
      await this.prisma.refreshToken.deleteMany({ where: { family: stored.family } })
    }
  }

  // ── Me ───────────────────────────────────────────────────────────────────

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        ...this.userSelect,
        company: {
          select: { id: true, name: true, tradeName: true, logoUrl: true, plan: true },
        },
      },
    })
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────

  async googleLogin(credential: string, ipAddress?: string, userAgent?: string) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw Object.assign(new Error('Google OAuth não configurado'), { statusCode: 501, code: 'GOOGLE_NOT_CONFIGURED' })
    }

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload?.email) {
      throw Object.assign(new Error('Token Google inválido'), { statusCode: 401, code: 'INVALID_GOOGLE_TOKEN' })
    }

    const { sub: googleId, email, name, picture } = payload

    // Find existing user by Google OAuth account
    let user = await this.prisma.user.findFirst({
      where: { oauthAccounts: { some: { provider: 'google', providerUserId: googleId } } },
    })

    if (!user) {
      // Try finding by email
      user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } })

      if (user) {
        // Link Google account to existing user
        await this.prisma.oAuthAccount.upsert({
          where: { provider_providerUserId: { provider: 'google', providerUserId: googleId } },
          create: { userId: user.id, provider: 'google', providerUserId: googleId },
          update: {},
        })
      } else {
        // Create new user + company
        const company = await this.prisma.company.findFirst({ where: { isActive: true } })
          ?? await this.prisma.company.create({ data: { name: (name ?? email) + ' Imobiliária' } })

        user = await this.prisma.user.create({
          data: {
            companyId: company.id,
            name: name ?? email,
            email: email.toLowerCase(),
            avatarUrl: picture ?? null,
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
            oauthAccounts: {
              create: { provider: 'google', providerUserId: googleId },
            },
          },
        })
      }
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw Object.assign(new Error('Conta inativa'), { statusCode: 403, code: 'ACCOUNT_INACTIVE' })
    }

    const tokens = await this.generateTokens(user, user.companyId)

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'user.login.google',
        resource: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    })

    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: this.userSelect,
    })

    return { user: safeUser, ...tokens }
  }

  // ── Change Password ──────────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    if (!user.passwordHash) {
      throw Object.assign(new Error('Usuário sem senha local'), { statusCode: 400, code: 'NO_LOCAL_PASSWORD' })
    }

    const valid = await this.verifyPassword(user.passwordHash, currentPassword)
    if (!valid) {
      throw Object.assign(new Error('Senha atual incorreta'), { statusCode: 401, code: 'WRONG_PASSWORD' })
    }

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id })
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } })

    // Revoke all refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } })
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async generateTokens(user: User, companyId: string, existingFamily?: string): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      cid: companyId,
      role: user.role,
    }

    const accessToken = this.app.jwt.sign(payload, { expiresIn: env.JWT_ACCESS_EXPIRES })

    // Refresh token — store in DB (rotation + family detection)
    const family  = existingFamily ?? nanoid(32)
    const token   = nanoid(64)
    const days    = parseInt(env.JWT_REFRESH_EXPIRES.replace('d', ''), 10)
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    await this.prisma.refreshToken.create({
      data: { userId: user.id, token, family, expiresAt },
    })

    return {
      accessToken,
      refreshToken: token,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }
  }

  // ── Email Verification ───────────────────────────────────────────────────

  async sendVerificationEmail(email: string, userId: string) {
    // Create verification token
    const token = nanoid(64)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await this.prisma.emailVerification.create({
      data: { email: email.toLowerCase(), token, expiresAt },
    })

    const verifyUrl = `${env.WEB_URL}/verificar-email?token=${token}`

    if (isEmailConfigured()) {
      await sendEmail({
        to: email,
        subject: 'Confirme seu e-mail — AgoraEncontrei',
        html: `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#1B2B5B;padding:24px 32px;text-align:center">
    <h1 style="color:#C9A84C;font-size:22px;margin:0">AgoraEncontrei</h1>
    <p style="color:#fff;opacity:0.7;margin:8px 0 0;font-size:14px">Marketplace Imobiliário</p>
  </div>
  <div style="padding:32px;color:#333;font-size:15px;line-height:1.7">
    <p>Olá! Obrigado por se cadastrar no <strong>AgoraEncontrei</strong>.</p>
    <p>Para ativar sua conta, clique no botão abaixo:</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${verifyUrl}" style="background:#1B2B5B;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
        Confirmar meu e-mail
      </a>
    </div>
    <p style="font-size:13px;color:#888">Se o botão não funcionar, copie e cole este link: <br/>${verifyUrl}</p>
    <p style="font-size:13px;color:#888">Este link expira em 24 horas.</p>
  </div>
  <div style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center">
    AgoraEncontrei | Franca — SP
  </div>
</div>
</body></html>`,
      })
    }

    return { token, verifyUrl }
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
    })

    if (!verification) {
      throw Object.assign(new Error('Token de verificação inválido'), { statusCode: 400, code: 'INVALID_TOKEN' })
    }

    if (verification.usedAt) {
      throw Object.assign(new Error('Este link já foi utilizado'), { statusCode: 400, code: 'TOKEN_ALREADY_USED' })
    }

    if (verification.expiresAt < new Date()) {
      throw Object.assign(new Error('Link expirado. Solicite um novo.'), { statusCode: 400, code: 'TOKEN_EXPIRED' })
    }

    // Mark token as used
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    })

    // Activate user
    const user = await this.prisma.user.findFirst({
      where: { email: verification.email, status: 'PENDING_VERIFICATION' },
    })

    if (!user) {
      throw Object.assign(new Error('Usuário não encontrado ou já verificado'), { statusCode: 400, code: 'USER_NOT_FOUND' })
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })

    // Generate tokens so user can login immediately after verification
    const tokens = await this.generateTokens(user, user.companyId)

    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: this.userSelect,
    })

    return { user: safeUser, ...tokens }
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || user.status !== 'PENDING_VERIFICATION') {
      // Don't reveal if user exists — return success either way
      return { success: true }
    }

    await this.sendVerificationEmail(user.email, user.id)
    return { success: true }
  }

  private userSelect = {
    id: true,
    companyId: true,
    name: true,
    email: true,
    phone: true,
    avatarUrl: true,
    role: true,
    status: true,
    creciNumber: true,
    bio: true,
    emailVerifiedAt: true,
    lastLoginAt: true,
    createdAt: true,
  } as const
}

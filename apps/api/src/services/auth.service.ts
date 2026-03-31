import * as argon2 from 'argon2'
import { nanoid } from 'nanoid'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, User } from '@prisma/client'
import type { JwtPayload } from '../plugins/jwt.js'
import { env } from '../utils/env.js'

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
        status: 'ACTIVE', // TODO: require email verification in prod
      },
      select: this.userSelect,
    })

    const tokens = await this.generateTokens(user as User, companyId)

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId: user.id,
        action: 'user.register',
        resource: 'user',
        resourceId: user.id,
      },
    })

    return { user, ...tokens }
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    })

    if (!user || !user.passwordHash) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401, code: 'INVALID_CREDENTIALS' })
    }

    if (user.status === 'SUSPENDED') {
      throw Object.assign(new Error('Conta suspensa'), { statusCode: 403, code: 'ACCOUNT_SUSPENDED' })
    }

    if (user.status === 'INACTIVE') {
      throw Object.assign(new Error('Conta inativa'), { statusCode: 403, code: 'ACCOUNT_INACTIVE' })
    }

    const valid = await argon2.verify(user.passwordHash, input.password)
    if (!valid) {
      throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401, code: 'INVALID_CREDENTIALS' })
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

  // ── Change Password ──────────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    if (!user.passwordHash) {
      throw Object.assign(new Error('Usuário sem senha local'), { statusCode: 400, code: 'NO_LOCAL_PASSWORD' })
    }

    const valid = await argon2.verify(user.passwordHash, currentPassword)
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

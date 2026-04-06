/**
 * Standalone Prisma client for use outside Fastify plugin context
 * (e.g., in routes that import prisma directly instead of using app.prisma)
 */
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

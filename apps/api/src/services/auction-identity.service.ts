/**
 * Auction Identity Service — identidade canônica do imóvel.
 *
 * Um mesmo imóvel pode ir a leilão várias vezes (praças diferentes, anos
 * diferentes, fontes diferentes). Aqui agrupamos todas as ocorrências sob uma
 * identidade única, chaveada por matrícula+cartório (chave forte, extraída do
 * edital na Fase 2) ou, na falta, pelo endereço completo. Assim conseguimos a
 * linha do tempo "este imóvel já foi a leilão 3x desde 2023".
 */

import type { PrismaClient } from '@prisma/client'

function norm(s?: string | null): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

interface AuctionKeyFields {
  registryNumber?: string | null
  registryOffice?: string | null
  city?: string | null
  state?: string | null
  street?: string | null
  number?: string | null
}

/** Chave forte por matrícula+cartório, ou fallback por endereço completo. Null se insuficiente. */
export function computeIdentityKey(a: AuctionKeyFields): { registryKey?: string; addressKey?: string } | null {
  const regNum = (a.registryNumber || '').replace(/\D/g, '')
  const regOff = norm(a.registryOffice)
  if (regNum.length >= 3 && regOff.length >= 3) {
    return { registryKey: `${regOff}#${regNum}` }
  }
  // Fallback: endereço completo (cidade + rua + número) — alta precisão para
  // evitar fundir imóveis diferentes do mesmo bairro.
  const city = norm(a.city), street = norm(a.street), number = norm(a.number)
  if (city && street && number) {
    return { addressKey: `${norm(a.state)}|${city}|${street}|${number}` }
  }
  return null
}

/**
 * Resolve (ou cria) a identidade canônica de um leilão e o vincula.
 * Idempotente: mesma chave → mesma identidade. Recalcula os agregados.
 */
export async function resolveAuctionIdentity(
  prisma: PrismaClient,
  auctionId: string,
): Promise<string | null> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true, registryNumber: true, registryOffice: true,
      city: true, state: true, street: true, number: true, neighborhood: true,
    },
  })
  if (!auction) return null

  const key = computeIdentityKey(auction)
  if (!key) return null

  const where = key.registryKey ? { registryKey: key.registryKey } : { addressKey: key.addressKey! }
  const base = {
    city: auction.city, state: auction.state, neighborhood: auction.neighborhood,
    ...key,
  }

  const identity = await prisma.auctionPropertyIdentity.upsert({
    where: where as any,
    create: base,
    update: {},
  })

  await prisma.auction.update({ where: { id: auctionId }, data: { identityId: identity.id } }).catch(() => {})
  await recomputeIdentityAggregates(prisma, identity.id)
  return identity.id
}

/** Recalcula contagem e datas de primeiro/último leilão da identidade. */
async function recomputeIdentityAggregates(prisma: PrismaClient, identityId: string): Promise<void> {
  const auctions = await prisma.auction.findMany({
    where: { identityId },
    select: { auctionDate: true, createdAt: true },
  })
  if (!auctions.length) return
  const dates = auctions.map((a) => a.auctionDate || a.createdAt).filter(Boolean) as Date[]
  const first = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null
  const last = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null
  await prisma.auctionPropertyIdentity.update({
    where: { id: identityId },
    data: { auctionCount: auctions.length, firstAuctionAt: first, lastAuctionAt: last },
  }).catch(() => {})
}

/** Linha do tempo do imóvel: todas as vezes que foi a leilão, em ordem. */
export async function getPropertyTimeline(prisma: PrismaClient, identityId: string) {
  const identity = await prisma.auctionPropertyIdentity.findUnique({
    where: { id: identityId },
    include: {
      auctions: {
        orderBy: [{ auctionDate: 'asc' }, { createdAt: 'asc' }],
        select: {
          slug: true, title: true, source: true, status: true,
          appraisalValue: true, minimumBid: true, soldValue: true,
          discountPercent: true, auctionDate: true, soldDate: true, createdAt: true,
        },
      },
    },
  })
  if (!identity) return null
  const num = (v: unknown) => (v == null ? null : Number(v))
  return {
    id: identity.id,
    city: identity.city, state: identity.state, neighborhood: identity.neighborhood,
    auctionCount: identity.auctionCount,
    firstAuctionAt: identity.firstAuctionAt,
    lastAuctionAt: identity.lastAuctionAt,
    timeline: identity.auctions.map((a) => ({
      slug: a.slug, title: a.title, source: a.source, status: a.status,
      appraisalValue: num(a.appraisalValue), minimumBid: num(a.minimumBid), soldValue: num(a.soldValue),
      discountPercent: a.discountPercent, auctionDate: a.auctionDate, soldDate: a.soldDate,
      url: `https://agoraencontrei.com.br/leiloes/${a.slug}`,
    })),
  }
}

/** Passe agendado: vincula leilões que ainda não têm identidade e podem ser chaveados. */
export async function runAuctionIdentityBatch(
  prisma: PrismaClient,
  limit = 100,
): Promise<{ processed: number; linked: number }> {
  const pending = await prisma.auction.findMany({
    where: {
      identityId: null,
      OR: [
        { AND: [{ registryNumber: { not: null } }, { registryOffice: { not: null } }] },
        { AND: [{ street: { not: null } }, { number: { not: null } }, { city: { not: null } }] },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  let linked = 0
  for (const a of pending) {
    const id = await resolveAuctionIdentity(prisma, a.id)
    if (id) linked++
  }
  return { processed: pending.length, linked }
}

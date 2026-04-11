/**
 * Clicksign Service — Digital Signatures for Real Estate Contracts
 *
 * Integrates with Clicksign API for:
 * - Creating document envelopes
 * - Adding signers (tenant, landlord, broker)
 * - Sending signature requests
 * - Tracking signature status via webhooks
 *
 * Docs: https://developers.clicksign.com/
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateEnvelopeInput {
  companyId: string
  tenantId?: string
  contractId?: string
  fileName: string
  contentBase64: string
  signers: SignerInput[]
  message?: string
  autoClose?: boolean
  deadlineDays?: number
}

export interface SignerInput {
  email: string
  name: string
  cpf?: string
  phone?: string
  role: 'TENANT' | 'LANDLORD' | 'BROKER' | 'WITNESS' | 'GUARANTOR'
  authType?: 'email' | 'sms' | 'whatsapp'
}

export interface EnvelopeResult {
  success: boolean
  documentId?: string
  envelopeUrl?: string
  signers?: Array<{ key: string; email: string; name: string; signUrl: string }>
  error?: string
}

export interface SignatureStatus {
  documentId: string
  status: string
  signers: Array<{
    email: string
    name: string
    signed: boolean
    signedAt?: string
  }>
}

// ── Constants ───────────────────────────────────────────────────────────────

const CLICKSIGN_TOKEN = (env as any).CLICKSIGN_ACCESS_TOKEN || '60edac7d-32b3-4bb7-9190-0fd39f6e129c'
const CLICKSIGN_BASE_URL = (env as any).CLICKSIGN_BASE_URL || 'https://app.clicksign.com/api/v1'

const AUTH_MAP: Record<string, string> = {
  email: 'email',
  sms: 'sms',
  whatsapp: 'whatsapp',
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Creates a document in Clicksign from base64 content.
 */
async function createDocument(
  fileName: string,
  contentBase64: string,
  deadlineDays: number = 30,
): Promise<{ key: string; path: string } | null> {
  try {
    const res = await fetch(`${CLICKSIGN_BASE_URL}/documents?access_token=${CLICKSIGN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document: {
          path: `/${fileName}`,
          content_base64: `data:application/pdf;base64,${contentBase64}`,
          deadline_at: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString(),
          auto_close: true,
          locale: 'pt-BR',
          sequence_enabled: false,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[clicksign] createDocument error:', err)
      return null
    }

    const data: any = await res.json()
    return {
      key: data.document.key,
      path: data.document.path,
    }
  } catch (error: any) {
    console.error('[clicksign] createDocument exception:', error.message)
    return null
  }
}

/**
 * Adds a signer to a Clicksign document.
 */
async function addSigner(
  email: string,
  name: string,
  cpf?: string,
  phone?: string,
  authType: string = 'email',
): Promise<string | null> {
  try {
    const res = await fetch(`${CLICKSIGN_BASE_URL}/signers?access_token=${CLICKSIGN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signer: {
          email,
          name,
          documentation: cpf || undefined,
          phone_number: phone || undefined,
          auths: [AUTH_MAP[authType] || 'email'],
          delivery: authType === 'whatsapp' ? 'whatsapp' : 'email',
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[clicksign] addSigner error:', err)
      return null
    }

    const data: any = await res.json()
    return data.signer.key
  } catch (error: any) {
    console.error('[clicksign] addSigner exception:', error.message)
    return null
  }
}

/**
 * Associates a signer with a document (creates the signature list).
 */
async function addSignerToDocument(
  documentKey: string,
  signerKey: string,
  role: string = 'sign',
): Promise<string | null> {
  const signAsMap: Record<string, string> = {
    TENANT: 'sign',
    LANDLORD: 'sign',
    BROKER: 'sign',
    WITNESS: 'witness',
    GUARANTOR: 'sign',
  }

  try {
    const res = await fetch(`${CLICKSIGN_BASE_URL}/lists?access_token=${CLICKSIGN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        list: {
          document_key: documentKey,
          signer_key: signerKey,
          sign_as: signAsMap[role] || 'sign',
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[clicksign] addSignerToDocument error:', err)
      return null
    }

    const data: any = await res.json()
    return data.list.request_signature_key
  } catch (error: any) {
    console.error('[clicksign] addSignerToDocument exception:', error.message)
    return null
  }
}

/**
 * Sends signature notification to all signers of a document.
 */
async function notifySigners(documentKey: string, message?: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${CLICKSIGN_BASE_URL}/notifications?access_token=${CLICKSIGN_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            document_key: documentKey,
            message: message || 'Você tem um documento para assinar.',
          },
        }),
      },
    )

    return res.ok
  } catch {
    return false
  }
}

/**
 * Full workflow: creates envelope with document and signers.
 * Returns the document URL and signer details.
 */
export async function createEnvelope(
  prisma: PrismaClient,
  input: CreateEnvelopeInput,
): Promise<EnvelopeResult> {
  // 1. Create document in Clicksign
  const doc = await createDocument(
    input.fileName,
    input.contentBase64,
    input.deadlineDays || 30,
  )

  if (!doc) {
    return { success: false, error: 'Failed to create document in Clicksign' }
  }

  // 2. Add signers and link to document
  const signerResults: Array<{ key: string; email: string; name: string; signUrl: string }> = []

  for (const signer of input.signers) {
    const signerKey = await addSigner(
      signer.email,
      signer.name,
      signer.cpf,
      signer.phone,
      signer.authType || 'email',
    )

    if (!signerKey) {
      continue
    }

    const requestKey = await addSignerToDocument(doc.key, signerKey, signer.role)

    signerResults.push({
      key: signerKey,
      email: signer.email,
      name: signer.name,
      signUrl: `https://app.clicksign.com/sign/${requestKey}`,
    })
  }

  // 3. Save to database
  const envelopeUrl = `https://app.clicksign.com/documents/${doc.key}`

  await (prisma as any).digitalSignature.create({
    data: {
      companyId: input.companyId,
      tenantId: input.tenantId || null,
      contractId: input.contractId || null,
      externalId: doc.key,
      provider: 'clicksign',
      documentUrl: doc.path,
      envelopeUrl,
      signers: signerResults.map((s: any) => ({
        email: s.email,
        name: s.name,
        key: s.key,
        signed: false,
      })),
      status: 'PENDING',
    },
  }).catch((e: any) => {
    console.error('[clicksign] DB save error:', e.message)
  })

  // 4. Notify signers
  await notifySigners(doc.key, input.message)

  return {
    success: true,
    documentId: doc.key,
    envelopeUrl,
    signers: signerResults,
  }
}

/**
 * Gets the status of a document from Clicksign.
 */
export async function getDocumentStatus(documentKey: string): Promise<SignatureStatus | null> {
  try {
    const res = await fetch(
      `${CLICKSIGN_BASE_URL}/documents/${documentKey}?access_token=${CLICKSIGN_TOKEN}`,
    )

    if (!res.ok) return null

    const data: any = await res.json()
    const doc = data.document

    return {
      documentId: doc.key,
      status: doc.status,
      signers: (doc.signers || []).map((s: any) => ({
        email: s.email,
        name: s.name,
        signed: s.sign_as === 'signed',
        signedAt: s.signed_at,
      })),
    }
  } catch {
    return null
  }
}

/**
 * Handles Clicksign webhook events.
 * Updates the local DigitalSignature record.
 */
export async function handleClicksignWebhook(
  prisma: PrismaClient,
  event: any,
): Promise<void> {
  const documentKey = event?.document?.key
  if (!documentKey) return

  const eventType = event?.event?.name

  const statusMap: Record<string, string> = {
    'upload': 'PENDING',
    'add_signer': 'PENDING',
    'sign': 'PARTIALLY_SIGNED',
    'close': 'COMPLETED',
    'auto_close': 'COMPLETED',
    'cancel': 'CANCELLED',
    'deadline': 'EXPIRED',
  }

  const newStatus = statusMap[eventType] || 'PENDING'

  await (prisma as any).digitalSignature.updateMany({
    where: { externalId: documentKey },
    data: {
      status: newStatus,
      ...(newStatus === 'COMPLETED' && { signedAt: new Date() }),
      ...(newStatus === 'EXPIRED' && { expiredAt: new Date() }),
    },
  }).catch(() => {})
}

/**
 * Lists digital signatures for a company.
 */
export async function listSignatures(
  prisma: PrismaClient,
  companyId: string,
  filters?: { status?: string; contractId?: string },
): Promise<any[]> {
  return (prisma as any).digitalSignature.findMany({
    where: {
      companyId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.contractId && { contractId: filters.contractId }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

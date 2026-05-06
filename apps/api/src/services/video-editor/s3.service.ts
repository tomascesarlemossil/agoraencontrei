/**
 * Video editor — dedicated S3 client for the video bucket.
 *
 * The video bucket is separate from the main app bucket so we can apply a
 * 24h lifecycle rule to **everything** inside it — uploaded clips, renders,
 * thumbnails — without risking the rest of the app's assets. After a job
 * is delivered the keys are deleted; this is the safety net.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../../utils/env.js'

const client = env.AWS_ACCESS_KEY_ID
  ? new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId:     env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null

const bucket = env.AWS_S3_VIDEO_BUCKET

export const videoS3 = {
  isConfigured: () => !!client && !!bucket,

  /** Pre-signed PUT URL for direct browser/multipart uploads. */
  presignPut: async (key: string, contentType: string, expiresIn = 600): Promise<string> => {
    if (!client || !bucket) throw new Error('Video S3 bucket not configured')
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
    return getSignedUrl(client, cmd, { expiresIn })
  },

  /** Pre-signed GET URL for the client to download the final render. */
  presignGet: async (key: string, expiresIn = env.VIDEO_EDITOR_SIGNED_URL_TTL): Promise<string> => {
    if (!client || !bucket) throw new Error('Video S3 bucket not configured')
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key })
    return getSignedUrl(client, cmd, { expiresIn })
  },

  /** Server-side upload (used by the worker to push the final render). */
  putBuffer: async (key: string, body: Buffer, contentType: string): Promise<void> => {
    if (!client || !bucket) throw new Error('Video S3 bucket not configured')
    await client.send(new PutObjectCommand({
      Bucket: bucket, Key: key, Body: body, ContentType: contentType,
    }))
  },

  /** Object metadata — used to verify uploads completed before render. */
  head: async (key: string): Promise<{ size: number; contentType?: string } | null> => {
    if (!client || !bucket) return null
    try {
      const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      return { size: Number(res.ContentLength ?? 0), contentType: res.ContentType }
    } catch {
      return null
    }
  },

  delete: async (key: string): Promise<void> => {
    if (!client || !bucket) return
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  },
}

/** Build a deterministic key inside the video bucket. */
export function buildVideoKey(parts: {
  companyId: string
  jobId:     string
  kind:      'input' | 'audio' | 'output' | 'thumbnail' | 'broll'
  filename:  string
}): string {
  // companyId/jobId/kind/filename → easy to enumerate per-tenant in S3 console
  const safe = parts.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${parts.companyId}/${parts.jobId}/${parts.kind}/${safe}`
}

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../utils/env.js'

const client = env.AWS_ACCESS_KEY_ID
  ? new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null

const bucket = env.AWS_S3_BUCKET

export const s3Service = {
  isConfigured: () => !!client && !!bucket,

  upload: async (key: string, body: Buffer, contentType: string): Promise<string> => {
    if (!client || !bucket) throw new Error('S3 not configured')

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    )

    return `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`
  },

  signedUrl: async (key: string, expiresIn = 3600): Promise<string> => {
    if (!client || !bucket) throw new Error('S3 not configured')

    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    return getSignedUrl(client, command, { expiresIn })
  },

  delete: async (key: string): Promise<void> => {
    if (!client || !bucket) return

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  },

  /** Generate a pre-signed PUT URL for direct browser upload */
  presignPut: async (key: string, contentType: string, expiresIn = 300): Promise<string> => {
    if (!client || !bucket) throw new Error('S3 not configured')
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
    return getSignedUrl(client, command, { expiresIn })
  },
}

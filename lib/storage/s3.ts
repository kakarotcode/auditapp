import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

// ─── S3 client singleton ──────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET ?? 'kavachai-reports'

// ─── AES-256 encryption helpers ───────────────────────────────────────────────

const ENCRYPTION_KEY_HEX = process.env.CONTENT_ENCRYPTION_KEY

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY_HEX) {
    throw new Error('CONTENT_ENCRYPTION_KEY env var must be set for encrypted uploads')
  }
  const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex')
  if (key.length !== 32) {
    throw new Error('CONTENT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return key
}

function encryptContent(plaintext: string): { encrypted: Buffer; iv: string } {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return { encrypted: Buffer.concat([iv, encrypted]), iv: iv.toString('hex') }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function uploadPdf(key: string, buffer: Buffer): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    ServerSideEncryption: 'AES256',
    Metadata: {
      'uploaded-by': 'kavachai',
      'uploaded-at': new Date().toISOString(),
    },
  })

  await s3.send(command)
  return key
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 7 * 24 * 60 * 60 // 7 days in seconds
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  const url = await getSignedUrl(s3, command, { expiresIn })
  return url
}

export async function uploadEncryptedContent(
  key: string,
  content: string
): Promise<string> {
  const { encrypted } = encryptContent(content)

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: encrypted,
    ContentType: 'application/octet-stream',
    ServerSideEncryption: 'AES256',
    Metadata: {
      'encryption': 'aes-256-cbc',
      'uploaded-by': 'kavachai',
      'uploaded-at': new Date().toISOString(),
    },
  })

  await s3.send(command)
  return key
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  await s3.send(command)
}

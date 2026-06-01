/**
 * AES-256-GCM symmetric encryption for OAuth tokens and other secrets.
 *
 * Encrypted format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Requires TOKEN_ENCRYPTION_KEY in the environment — a 64-character hex string
 * representing 32 bytes (256 bits).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12  // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128-bit auth tag

function getKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be set and be exactly 64 hex characters (32 bytes).'
    )
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param text - The plaintext to encrypt.
 * @returns A string in the format "iv:authTag:ciphertext" (all hex encoded).
 */
export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 *
 * @param encryptedText - A string in the format "iv:authTag:ciphertext" (all hex encoded).
 * @returns The original plaintext.
 * @throws If the ciphertext has been tampered with (GCM auth tag mismatch).
 */
export function decrypt(encryptedText: string): string {
  const key = getKey()
  const parts = encryptedText.split(':')

  if (parts.length !== 3) {
    throw new Error(
      'Invalid encrypted text format. Expected "iv:authTag:ciphertext".'
    )
  }

  const [ivHex, authTagHex, ciphertextHex] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * Safely attempts to decrypt a value, returning null if decryption fails.
 * Useful when you don't want to throw on corrupted/missing tokens.
 */
export function safeDecrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null
  try {
    return decrypt(encryptedText)
  } catch {
    return null
  }
}

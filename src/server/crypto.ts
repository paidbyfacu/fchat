// Cifrado de tokens (AES-256-GCM), contraseñas (scrypt), firmas (HMAC) y la
// firma de los webhooks de Meta. Solo node:crypto, sin dependencias.

import { createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

function key32(b64: string): Buffer {
  const k = Buffer.from(b64, "base64")
  if (k.length !== 32) throw new Error("TOKEN_ENC_KEY tiene que ser 32 bytes en base64")
  return k
}

/** iv(12) | tag(16) | ciphertext */
export function encrypt(plain: string, keyB64: string): Buffer {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", key32(keyB64), iv)
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), body])
}

export function decrypt(blob: Uint8Array, keyB64: string): string {
  const b = Buffer.from(blob)
  const d = createDecipheriv("aes-256-gcm", key32(keyB64), b.subarray(0, 12))
  d.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8")
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(pw, salt, 64)
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, saltB64, hashB64] = stored.split("$")
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, "base64")
  const got = await scryptAsync(pw, Buffer.from(saltB64, "base64"), expected.length)
  return timingSafeEqual(got, expected)
}

/** Compara dos secretos sin que el tiempo de respuesta delate cuántos caracteres coinciden. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false
  const ha = createHmac("sha256", "cmp").update(a).digest()
  const hb = createHmac("sha256", "cmp").update(b).digest()
  return timingSafeEqual(ha, hb)
}

const b64url = (b: Buffer) => b.toString("base64url")

/** Token firmado: base64url(json).base64url(hmac). Sirve para la sesión y el state de OAuth. */
export function sign(payload: object, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  const mac = b64url(createHmac("sha256", secret).update(body).digest())
  return `${body}.${mac}`
}

export function verify<T extends { exp: number }>(token: string | undefined, secret: string): T | null {
  if (!token) return null
  const [body, mac] = token.split(".")
  if (!body || !mac) return null
  const expected = createHmac("sha256", secret).update(body).digest()
  const got = Buffer.from(mac, "base64url")
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T
    return typeof data.exp === "number" && data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

/** X-Hub-Signature-256 de Meta, calculada sobre el body crudo con la clave secreta de Instagram. */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest()
  const got = Buffer.from(header.slice(7), "hex")
  return got.length === expected.length && timingSafeEqual(got, expected)
}

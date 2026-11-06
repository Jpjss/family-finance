import { createHmac, timingSafeEqual } from "node:crypto"

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) throw new Error("Configure AUTH_SECRET com pelo menos 32 caracteres.")
  return value
}

export function createToken(userId: string, email: string) {
  const payload = Buffer.from(JSON.stringify({ userId, email, exp: Date.now() + 7 * 86400000 })).toString("base64url")
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function verifyToken(token: string): { userId: string; email: string; exp: number } {
  const [payload, signature, extra] = token.split(".")
  if (!payload || !signature || extra) throw new Error("Token inválido")
  const expected = createHmac("sha256", secret()).update(payload).digest()
  const actual = Buffer.from(signature, "base64url")
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Token inválido")
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString())
  if (!/^[a-f0-9]{24}$/i.test(decoded.userId) || !Number.isFinite(decoded.exp) || decoded.exp <= Date.now()) {
    throw new Error("Token inválido ou expirado")
  }
  return decoded
}

export function getTokenFromRequest(req: Request) {
  const value = req.headers.get("authorization")
  return value?.startsWith("Bearer ") ? value.slice(7) : null
}

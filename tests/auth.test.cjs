const { test } = require("node:test")
const assert = require("node:assert/strict")
const { createHmac } = require("node:crypto")
const { createToken, verifyToken } = require("../lib/auth.ts")
process.env.AUTH_SECRET = "test-secret-for-signing-at-least-32-characters"

test("somente tokens assinados e não expirados autorizam a conta", () => {
  const token = createToken("123456789012345678901234", "test@example.com")
  assert.equal(verifyToken(token).userId, "123456789012345678901234")
  assert.throws(() => verifyToken(Buffer.from(JSON.stringify({ userId: "123456789012345678901234" })).toString("base64")))
  assert.throws(() => verifyToken(token + "x"))
  const payload = Buffer.from(JSON.stringify({ userId: "123456789012345678901234", exp: Date.now() - 1 })).toString("base64url")
  const signature = createHmac("sha256", process.env.AUTH_SECRET).update(payload).digest("base64url")
  assert.throws(() => verifyToken(`${payload}.${signature}`))
})

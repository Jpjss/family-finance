const { test } = require("node:test")
const assert = require("node:assert/strict")
const { runReminders } = require("../lib/reminder-worker.ts")
const { sendReminder, DeliveryError } = require("../lib/reminder-provider.ts")
const { notificationSettingsSchema } = require("../lib/notification-settings.ts")
const { fakeDb } = require("./fake-db.cjs")

Object.assign(process.env, { RESEND_API_KEY: "test", NOTIFICATION_FROM_EMAIL: "test@example.com", TWILIO_ACCOUNT_SID: "test", TWILIO_AUTH_TOKEN: "test", TWILIO_WHATSAPP_FROM: "whatsapp:+5511999999999", TWILIO_WHATSAPP_CONTENT_SID: "HXtest" })
const now = new Date("2026-11-05T12:00:00Z")
const base = { _id: "t1", userId: "u1", type: "despesa", amount: 200, description: "Geladeira", dueDate: "2026-11-05", isPaid: false }
function fixture(rows = [base]) { return fakeDb({ transactions: rows, users: [{ _id: "u1", email: "test@example.com", notificationSettings: { emailEnabled: true, whatsappEnabled: true, whatsappPhone: "+5511999999999" } }] }) }

test("reexecuções e execuções concorrentes não repetem parcela/dia/canal", async () => {
  const db = fixture(); const calls = []
  const send = async (...args) => { calls.push(args); return "provider-id" }
  await Promise.all([runReminders(db, { now, send }), runReminders(db, { now, send })])
  await runReminders(db, { now, send })
  assert.equal(calls.length, 2)
  assert.equal(db.collection("notificationDeliveries").rows.length, 2)
  assert.ok(db.collection("notificationDeliveries").rows.every(row => row.status === "accepted"))
})
test("vencida avisa no dia seguinte e para após pagamento", async () => {
  const db = fixture(); let calls = 0
  const send = async () => { calls++; return "id" }
  await runReminders(db, { now, send })
  await runReminders(db, { now: new Date("2026-11-06T12:00:00Z"), send })
  assert.equal(calls, 4)
  db.collection("transactions").rows[0].isPaid = true
  await runReminders(db, { now: new Date("2026-11-07T12:00:00Z"), send })
  assert.equal(calls, 4)
})
test("não envia receita, D-1, futura, paga ou sem vencimento", async () => {
  const db = fixture([{ ...base, type: "receita" }, { ...base, _id: "t2", dueDate: "2026-11-06" }, { ...base, _id: "t3", dueDate: "2026-11-08" }, { ...base, _id: "t4", isPaid: true }, { ...base, _id: "t5", dueDate: undefined }])
  const result = await runReminders(db, { now, send: async () => { throw new Error("Should not send") } })
  assert.equal(result.eligible, 0)
})
test("pagamento entre a consulta e envio é respeitado", async () => {
  const db = fixture()
  db.collection("transactions").beforeFindOne = async () => { db.collection("transactions").rows[0].isPaid = true }
  const result = await runReminders(db, { now, send: async () => { throw new Error("Should not send") } })
  assert.equal(result.accepted, 0)
  assert.ok(db.collection("notificationDeliveries").rows.every(row => row.status === "cancelled"))
})
test("desativar canal não impede o outro; dryRun não reserva envios", async () => {
  const db = fixture(); db.collection("users").rows[0].notificationSettings.whatsappEnabled = false
  let calls = 0
  const send = async channel => { assert.equal(channel, "email"); calls++; return "id" }
  const preview = await runReminders(db, { now, dryRun: true, send })
  assert.equal(preview.eligible, 1); assert.equal(calls, 0); assert.equal(db.collection("notificationDeliveries").rows.length, 0)
  await runReminders(db, { now, send }); assert.equal(calls, 1)
})
test("falha de um canal é registrada e não bloqueia o outro", async () => {
  const db = fixture()
  const result = await runReminders(db, { now, send: async channel => { if (channel === "email") throw new DeliveryError("HTTP 429", false); return "id" } })
  assert.equal(result.failed, 1); assert.equal(result.accepted, 1)
  const failure = db.collection("notificationDeliveries").rows.find(row => row.status === "failed")
  failure.updatedAt = new Date(Date.now() - 11 * 60000)
  let retried = 0
  await runReminders(db, { now, send: async () => { retried++; return "id" } })
  assert.equal(retried, 1); assert.equal(failure.attempts, 2)
})
test("timeout não é reenviado automaticamente no mesmo dia", async () => {
  const db = fixture(); let calls = 0
  const send = async () => { calls++; throw new DeliveryError("timeout", true) }
  await runReminders(db, { now, send }); await runReminders(db, { now, send })
  assert.equal(calls, 2)
  assert.ok(db.collection("notificationDeliveries").rows.every(row => row.status === "uncertain"))
})
test("Resend recebe texto, destinatário e chave de idempotência", async () => {
  const id = await sendReminder("email", "user@example.com", base, "2026-11-05", "unique-key", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails")
    assert.equal(options.headers["Idempotency-Key"], "unique-key")
    const body = JSON.parse(options.body)
    assert.deepEqual(body.to, ["user@example.com"])
    assert.match(body.text, /vence hoje/)
    return new Response(JSON.stringify({ id: "email-id" }), { status: 200 })
  })
  assert.equal(id, "email-id")
})
test("Twilio usa template aprovado e variáveis", async () => {
  await sendReminder("whatsapp", "+5511999999999", { ...base, installmentNumber: 2, installmentCount: 6 }, "2026-11-05", "key", async (url, options) => {
    assert.match(url, /Messages.json$/)
    assert.equal(options.body.get("To"), "whatsapp:+5511999999999")
    assert.equal(options.body.get("ContentSid"), "HXtest")
    assert.match(JSON.parse(options.body.get("ContentVariables"))["1"], /2\/6/)
    return new Response(JSON.stringify({ sid: "whatsapp-id" }), { status: 201 })
  })
})
test("erros de provedor não são tratados como sucesso", async () => {
  await assert.rejects(sendReminder("email", "a@example.com", base, "2026-11-05", "key", async () => new Response("{}", { status: 429 })), error => error instanceof DeliveryError && !error.uncertain)
  await assert.rejects(sendReminder("whatsapp", "+5511999999999", base, "2026-11-05", "key", async () => { throw new Error("timeout") }), error => error instanceof DeliveryError && error.uncertain)
})
test("preferências exigem número internacional quando WhatsApp está ativo", () => {
  assert.equal(notificationSettingsSchema.safeParse({ emailEnabled: true, whatsappEnabled: true, whatsappPhone: "11999999999" }).success, false)
  assert.equal(notificationSettingsSchema.parse({ emailEnabled: true, whatsappEnabled: true, whatsappPhone: "+55 (11) 99999-9999" }).whatsappPhone, "+5511999999999")
})

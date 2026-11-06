const { test } = require("node:test")
const assert = require("node:assert/strict")
const { ObjectId } = require("mongodb")
const { Transaction } = require("../lib/models/Transaction.ts")
const { fakeDb } = require("./fake-db.cjs")
const input = { requestId: "123e4567-e89b-42d3-a456-426614174000", description: "Compra", category: "outros", type: "despesa", amount: 100, installmentCount: 3, firstDueDate: "2026-11-05" }

test("repetir criação não duplica parcelas nem desfaz pagamento", async () => {
  const db = fakeDb(); const model = new Transaction(db); const userId = new ObjectId()
  const rows = await model.create(input, userId)
  await model.updatePaymentStatus(rows[0]._id, userId, true)
  await model.create(input, userId)
  assert.equal(db.collection("transactions").rows.length, 3)
  assert.equal((await model.findByUserId(userId)).filter(row => row.isPaid).length, 1)
  await assert.rejects(model.create({ ...input, amount: 200 }, userId), error => error.code === 11000)
})
test("outro usuário não altera o pagamento", async () => {
  const db = fakeDb(); const model = new Transaction(db); const userId = new ObjectId()
  const rows = await model.create(input, userId)
  const result = await model.updatePaymentStatus(rows[0]._id, new ObjectId(), true)
  assert.equal(result.matchedCount, 0)
})
test("importação pode ser repetida sem duplicar nem restaurar status antigo", async () => {
  const db = fakeDb(); const model = new Transaction(db); const userId = new ObjectId()
  const rows = [{ _id: "legacy-1", userId: "legacy", description: "Conta", amount: 50, category: "contas", type: "despesa", createdAt: "2026-11-05T12:00:00Z", isPaid: false }]
  await model.saveOnce(rows, userId, "import")
  const saved = db.collection("transactions").rows[0]
  await model.updatePaymentStatus(saved._id, userId, true)
  await model.saveOnce(rows, userId, "import")
  assert.equal(db.collection("transactions").rows.length, 1)
  assert.equal(saved.isPaid, true)
})

const { test, beforeEach, afterEach } = require("node:test")
const assert = require("node:assert/strict")
const { createTransactions, loadTransactions, updatePayment, importLocalTransactions } = require("../lib/finance-client.ts")
const originalFetch = global.fetch
let storage
beforeEach(() => {
  storage = new Map()
  Object.defineProperty(global, "localStorage", { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } })
  storage.set("user", JSON.stringify({ id: "local-user", storage: "local" }))
})
afterEach(() => { global.fetch = originalFetch })
const input = { requestId: "123e4567-e89b-42d3-a456-426614174000", description: "Compra", category: "outros", type: "despesa", amount: 100, installmentCount: 3, firstDueDate: "2026-11-05" }

test("modo local persiste parcelas e pagamentos em lote sem perder atualizações", async () => {
  await createTransactions(input)
  await createTransactions(input)
  const rows = await loadTransactions()
  assert.equal(rows.length, 3)
  await Promise.all(rows.map(row => updatePayment(row._id, true)))
  assert.ok((await loadTransactions()).every(row => row.isPaid))
})
test("falha ao salvar pagamento no servidor não altera a cópia local", async () => {
  storage.set("user", JSON.stringify({ id: "server-user", storage: "cloud" }))
  storage.set("transactions_server-user", "[]")
  global.fetch = async () => new Response(JSON.stringify({ error: "Servidor indisponível" }), { status: 503 })
  await assert.rejects(updatePayment("id", true), /Servidor indisponível/)
  assert.equal(storage.get("transactions_server-user"), "[]")
  await assert.rejects(loadTransactions(), /Servidor indisponível/)
})
test("modo sincronizado envia cadastro e status à API autenticada", async () => {
  storage.set("user", JSON.stringify({ id: "server-user", storage: "cloud" }))
  storage.set("token", "signed-test-token")
  const calls = []
  global.fetch = async (path, options) => {
    calls.push({ path, options })
    assert.equal(options.headers.Authorization, "Bearer signed-test-token")
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }
  await createTransactions(input)
  await updatePayment("transaction-id", true)
  assert.equal(calls[0].path, "/api/transactions")
  assert.equal(JSON.parse(calls[0].options.body).installmentCount, 3)
  assert.equal(calls[1].options.method, "PATCH")
  assert.deepEqual(JSON.parse(calls[1].options.body), { isPaid: true })
})
test("importação preserva backup local e só marca conclusão após sucesso", async () => {
  storage.set("user", JSON.stringify({ id: "server-user", storage: "cloud", legacyLocalId: "legacy" }))
  const backup = JSON.stringify([{ _id: "legacy-row", amount: 100 }])
  storage.set("transactions_legacy", backup)
  global.fetch = async () => new Response(JSON.stringify({ error: "Falha" }), { status: 503 })
  await assert.rejects(importLocalTransactions())
  assert.equal(storage.has("imported_server-user"), false)
  assert.equal(storage.get("transactions_legacy"), backup)
  global.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })
  await importLocalTransactions()
  assert.equal(storage.get("imported_server-user"), "true")
  assert.equal(storage.get("transactions_legacy"), backup)
})

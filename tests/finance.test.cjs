const { test } = require("node:test")
const assert = require("node:assert/strict")
const { installmentSchedule, todayInSaoPaulo, reminderKind, transactionMonth, isDateOnly } = require("../lib/finance.ts")
const { buildTransactions } = require("../lib/transaction-input.ts")

test("R$ 1.200 em seis parcelas conserva total e gera seis meses", () => {
  const rows = installmentSchedule(1200, 6, "2026-12-10")
  assert.equal(rows.length, 6)
  assert.ok(rows.every(row => row.amount === 200))
  assert.equal(rows[5].dueDate, "2027-05-10")
})
test("centavos são distribuídos sem perder dinheiro", () => {
  assert.deepEqual(installmentSchedule(100, 3, "2026-11-05").map(row => row.amount), [33.34, 33.33, 33.33])
  for (const count of [1, 2, 3, 7, 12, 360]) {
    const rows = installmentSchedule(12345.67, count, "2026-01-31")
    assert.equal(rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0), 1234567)
  }
})
test("dia 31 se adapta a fevereiro sem deslocar março", () => {
  assert.deepEqual(installmentSchedule(300, 3, "2026-01-31").map(row => row.dueDate), ["2026-01-31", "2026-02-28", "2026-03-31"])
  assert.equal(installmentSchedule(300, 3, "2028-01-31")[1].dueDate, "2028-02-29")
})
test("rejeita valores, contagens e datas inválidas", () => {
  for (const value of [0, -1, NaN, Infinity, 1e15]) assert.throws(() => installmentSchedule(value, 2, "2026-11-05"))
  for (const count of [0, -1, 1.5, 361, NaN]) assert.throws(() => installmentSchedule(100, count, "2026-11-05"))
  assert.throws(() => installmentSchedule(0.01, 2, "2026-11-05"))
  for (const date of ["2026-02-30", "2026-13-01", "2026-01-01T00:00:00Z", ""]) assert.equal(isDateOnly(date), false)
})
test("data usa Brasília inclusive na virada UTC", () => {
  assert.equal(todayInSaoPaulo(new Date("2026-11-06T01:30:00Z")), "2026-11-05")
  assert.equal(todayInSaoPaulo(new Date("2026-11-06T03:00:00Z")), "2026-11-06")
})
test("avisos em D-2, D0 e todos os dias vencidos, nunca D-1 nem pagos", () => {
  assert.equal(reminderKind("2026-11-07", false, "2026-11-05"), "upcoming")
  assert.equal(reminderKind("2026-11-06", false, "2026-11-05"), null)
  assert.equal(reminderKind("2026-11-05", false, "2026-11-05"), "due")
  for (const date of ["2026-11-06", "2026-11-07", "2027-01-01"]) assert.equal(reminderKind("2026-11-05", false, date), "overdue")
  assert.equal(reminderKind("2026-11-05", true, "2026-11-07"), null)
  assert.equal(reminderKind(undefined, false, "2026-11-05"), null)
})
test("mês financeiro usa vencimento, com compatibilidade de registros antigos", () => {
  assert.equal(transactionMonth({ dueDate: "2027-03-31", createdAt: "2026-11-05T12:00:00Z" }), "2027-03")
  assert.equal(transactionMonth({ createdAt: "2026-12-01T01:00:00Z" }), "2026-11")
})
test("compra gera apenas parcelas e mantém identidade estável em nova tentativa", () => {
  const input = { requestId: "123e4567-e89b-42d3-a456-426614174000", description: "Geladeira", category: "moradia", type: "despesa", amount: 100, installmentCount: 3, firstDueDate: "2026-11-05" }
  const rows = buildTransactions(input, "user")
  assert.equal(rows.length, 3)
  assert.equal(rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0), 10000)
  assert.deepEqual(rows.map(row => row._id), buildTransactions(input, "user").map(row => row._id))
  assert.ok(rows.every(row => !row.isPaid && row.totalAmount === 100))
  assert.throws(() => buildTransactions({ ...input, type: "receita" }, "user"))
})

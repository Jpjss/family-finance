import { buildTransactions, type TransactionInput } from "./transaction-input"
import type { FinanceTransaction } from "./finance"

export interface FinanceUser { id: string; name: string; email: string; storage?: "local" | "cloud"; legacyLocalId?: string }
export function currentUser(): FinanceUser {
  const user = JSON.parse(localStorage.getItem("user") || "null")
  if (!user?.id) throw new Error("Entre na sua conta para continuar.")
  return user
}
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, cache: "no-store", headers: {
    "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}`, ...options.headers,
  } })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Não foi possível salvar. Tente novamente.")
  return data
}
export async function loadTransactions(): Promise<FinanceTransaction[]> {
  const user = currentUser()
  if (user.storage === "cloud") return (await api("/api/transactions")).transactions
  return JSON.parse(localStorage.getItem(`transactions_${user.id}`) || "[]")
}
export async function createTransactions(input: TransactionInput) {
  const user = currentUser()
  if (user.storage === "cloud") return api("/api/transactions", { method: "POST", body: JSON.stringify(input) })
  const rows = buildTransactions(input, user.id)
  const existing = await loadTransactions()
  const ids = new Set(existing.map(row => row._id))
  localStorage.setItem(`transactions_${user.id}`, JSON.stringify([...existing, ...rows.filter(row => !ids.has(row._id))]))
}
export async function updatePayment(id: string, isPaid: boolean) {
  const user = currentUser()
  if (user.storage === "cloud") return api(`/api/transactions/${id}`, { method: "PATCH", body: JSON.stringify({ isPaid }) })
  // Read and write synchronously to preserve concurrent bulk payment updates.
  const key = `transactions_${user.id}`
  const rows: FinanceTransaction[] = JSON.parse(localStorage.getItem(key) || "[]")
  localStorage.setItem(key, JSON.stringify(rows.map(row => row._id === id ? { ...row, isPaid } : row)))
}
export function localImportRows(): FinanceTransaction[] {
  const user = currentUser()
  if (!user.legacyLocalId) return []
  return JSON.parse(localStorage.getItem(`transactions_${user.legacyLocalId}`) || "[]")
}
export async function importLocalTransactions() {
  const rows = localImportRows()
  for (let i = 0; i < rows.length; i += 500) {
    await api("/api/transactions/import", { method: "POST", body: JSON.stringify({ transactions: rows.slice(i, i + 500) }) })
  }
  // Keep the original data as a local backup, even after a successful import.
  localStorage.setItem(`imported_${currentUser().id}`, "true")
}

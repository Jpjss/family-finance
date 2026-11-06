export interface FinanceTransaction {
  _id: string
  userId: string
  type: "receita" | "despesa"
  amount: number
  category: string
  description: string
  createdAt: string
  isPaid?: boolean
  dueDate?: string
  installmentNumber?: number
  installmentCount?: number
  installmentGroupId?: string
  totalAmount?: number
}

export function todayInSaoPaulo(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)!.value
  return `${get("year")}-${get("month")}-${get("day")}`
}

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function addCalendarMonths(firstDueDate: string, offset: number): string {
  if (!isDateOnly(firstDueDate)) throw new Error("Informe um vencimento válido.")
  const [year, month, day] = firstDueDate.split("-").map(Number)
  const lastDay = new Date(Date.UTC(year, month + offset, 0))
  return new Date(Date.UTC(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), Math.min(day, lastDay.getUTCDate()))).toISOString().slice(0, 10)
}

export function installmentSchedule(total: number, count: number, firstDueDate: string) {
  const cents = Math.round(total * 100)
  if (!Number.isFinite(total) || !Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000_000) {
    throw new Error("Informe um valor positivo de até R$ 1 bilhão.")
  }
  if (!Number.isInteger(count) || count < 1 || count > 360 || cents < count) {
    throw new Error("Use de 1 a 360 parcelas, com pelo menos R$ 0,01 por parcela.")
  }
  if (!isDateOnly(firstDueDate) || firstDueDate < "1900-01-01" || firstDueDate > "2100-12-31") {
    throw new Error("Informe um vencimento entre 1900 e 2100.")
  }
  const base = Math.floor(cents / count)
  const remainder = cents % count
  return Array.from({ length: count }, (_, index) => ({
    amount: (base + (index < remainder ? 1 : 0)) / 100,
    dueDate: addCalendarMonths(firstDueDate, index),
    installmentNumber: index + 1,
    installmentCount: count,
  }))
}

export function reminderKind(dueDate: string | undefined, isPaid: boolean | undefined, today: string) {
  if (isPaid || !isDateOnly(dueDate) || !isDateOnly(today)) return null
  const days = (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000
  if (days === 2) return "upcoming" as const
  if (days === 0) return "due" as const
  if (days < 0) return "overdue" as const
  return null
}

export function transactionMonth(transaction: Pick<FinanceTransaction, "dueDate" | "createdAt">) {
  return transaction.dueDate?.slice(0, 7) || todayInSaoPaulo(new Date(transaction.createdAt)).slice(0, 7)
}

export function formatDateOnly(value: string) { return value.split("-").reverse().join("/") }
export function formatBRL(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }

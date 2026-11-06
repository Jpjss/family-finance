import { z } from "zod"
import { installmentSchedule, todayInSaoPaulo, type FinanceTransaction } from "./finance"

export const transactionInput = z.object({
  requestId: z.string().uuid(),
  description: z.string().trim().min(1, "Informe a descrição.").max(300),
  amount: z.number().finite().positive().max(1_000_000_000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001, "Informe no máximo duas casas decimais."),
  category: z.string().trim().min(1).max(60),
  type: z.enum(["receita", "despesa"]),
  installmentCount: z.number().int().min(1).max(360).default(1),
  firstDueDate: z.string().optional(),
})
export type TransactionInput = z.input<typeof transactionInput>

export function buildTransactions(input: TransactionInput, userId: string, now = new Date()): FinanceTransaction[] {
  const value = transactionInput.parse(input)
  if (value.type === "receita" && value.installmentCount !== 1) throw new Error("Parcelamento disponível apenas para despesas.")
  const schedule = installmentSchedule(value.amount, value.installmentCount,
    value.type === "despesa" ? value.firstDueDate || "" : todayInSaoPaulo(now))
  return schedule.map(part => ({
    _id: `${value.requestId}-${part.installmentNumber}`,
    userId, description: value.description, category: value.category, type: value.type,
    amount: part.amount, createdAt: now.toISOString(), isPaid: value.type === "receita",
    ...(value.type === "despesa" ? { ...part, installmentGroupId: value.requestId, totalAmount: value.amount } : {}),
  }))
}

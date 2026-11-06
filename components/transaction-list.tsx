"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatBRL, formatDateOnly, todayInSaoPaulo, type FinanceTransaction } from "@/lib/finance"

export function TransactionList({ transactions, onUpdateTransaction }: {
  transactions: FinanceTransaction[]
  onUpdateTransaction: (id: string, updates: Partial<FinanceTransaction>) => Promise<boolean>
}) {
  const [filter, setFilter] = useState("all")
  const [busy, setBusy] = useState<string[]>([])
  const today = todayInSaoPaulo()
  const overdue = (row: FinanceTransaction) => row.type === "despesa" && !row.isPaid && row.dueDate && row.dueDate < today
  const rows = transactions.filter(row => filter === "all" || (filter === "paid" ? row.type === "despesa" && row.isPaid : filter === "overdue" ? overdue(row) : row.type === "despesa" && !row.isPaid))
    .sort((a, b) => (a.dueDate || a.createdAt).localeCompare(b.dueDate || b.createdAt))
  async function toggle(row: FinanceTransaction) {
    setBusy(value => [...value, row._id])
    try { await onUpdateTransaction(row._id, { isPaid: !row.isPaid }) }
    finally { setBusy(value => value.filter(id => id !== row._id)) }
  }
  return <Card>
    <CardHeader><CardTitle>Controle de transações</CardTitle><CardDescription>Parcelas organizadas pelo vencimento no período selecionado.</CardDescription>
      <div className="flex flex-wrap gap-2 pt-2">{[["all", "Todas"], ["pending", "Pendentes"], ["paid", "Pagas"], ["overdue", "Vencidas"]].map(([key, label]) => <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key)}>{label}</Button>)}</div>
    </CardHeader>
    <CardContent><div className="space-y-3 max-h-[700px] overflow-y-auto">
      {rows.length === 0 && <p className="py-8 text-center text-slate-500">Nenhuma transação neste filtro.</p>}
      {rows.map(row => <div key={row._id} className={`rounded-xl border p-4 ${row.isPaid ? "bg-slate-50" : overdue(row) ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-semibold break-words">{row.description || "Sem descrição"}</p>
            {(row.installmentCount || 1) > 1 && <p className="text-sm font-medium text-indigo-700">Parcela {row.installmentNumber}/{row.installmentCount}{row.totalAmount ? ` · Compra de ${formatBRL(row.totalAmount)}` : ""}</p>}
            <p className="text-xs text-slate-600 capitalize">{row.category}</p>
            <p className="text-sm">{row.dueDate ? `Vencimento: ${formatDateOnly(row.dueDate)}` : `Registro: ${new Date(row.createdAt).toLocaleDateString("pt-BR")}`}</p>
            {row.type === "despesa" && <p className={`text-sm font-medium ${overdue(row) ? "text-red-700" : "text-slate-600"}`}>{row.isPaid ? "Paga" : overdue(row) ? "Vencida" : row.dueDate === today ? "Vence hoje" : "Pendente"}</p>}
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <p className={`text-lg font-bold ${row.type === "receita" ? "text-emerald-700" : "text-orange-700"}`}>{row.type === "receita" ? "+" : "−"}{formatBRL(row.amount)}</p>
            {row.type === "despesa" && <Button size="sm" variant="outline" disabled={busy.includes(row._id)} onClick={() => toggle(row)} aria-label={`${row.isPaid ? "Marcar pendente" : "Marcar paga"}: ${row.description}, parcela ${row.installmentNumber || 1}`}>
              {busy.includes(row._id) ? "Salvando..." : row.isPaid ? "Marcar pendente" : "Marcar como paga"}
            </Button>}
          </div>
        </div>
      </div>)}
    </div></CardContent>
  </Card>
}

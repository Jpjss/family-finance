"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatBRL, formatDateOnly, type FinanceTransaction } from "@/lib/finance"

export function QuickActions({ transactions, onUpdateTransaction }: {
  transactions: FinanceTransaction[]
  onUpdateTransaction: (id: string, updates: Partial<FinanceTransaction>) => Promise<boolean>
}) {
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const pending = transactions.filter(row => row.type === "despesa" && !row.isPaid)
  const selectedRows = pending.filter(row => selected.includes(row._id))
  async function pay(rows: FinanceTransaction[]) {
    if (rows.length > 1 && !window.confirm(`Marcar estas ${rows.length} despesas como pagas?`)) return
    setBusy(true)
    try {
      for (const row of rows) {
        if (!await onUpdateTransaction(row._id, { isPaid: true })) break
        setSelected(ids => ids.filter(id => id !== row._id))
      }
    } finally { setBusy(false) }
  }
  return <Card><CardHeader><CardTitle>Ações rápidas</CardTitle></CardHeader><CardContent className="space-y-3">
    <p className="text-sm text-slate-600">{pending.length} despesa(s) pendente(s) no período selecionado.</p>
    <p className="font-semibold text-orange-700">{formatBRL(pending.reduce((sum, row) => sum + row.amount, 0))}</p>
    {pending.length > 0 && <fieldset disabled={busy} className="space-y-3">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedRows.length === pending.length} onChange={event => setSelected(event.target.checked ? pending.map(row => row._id) : [])} />Selecionar todas</label>
      <div className="max-h-64 overflow-y-auto space-y-2">{pending.map(row => <label key={row._id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
        <input className="mt-1" type="checkbox" checked={selected.includes(row._id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, row._id] : ids.filter(id => id !== row._id))} />
        <span className="min-w-0 break-words">{row.description || "Sem descrição"}{(row.installmentCount || 1) > 1 ? ` · ${row.installmentNumber}/${row.installmentCount}` : ""}<span className="block text-xs text-slate-600">{formatBRL(row.amount)}{row.dueDate ? ` · ${formatDateOnly(row.dueDate)}` : ""}</span></span>
      </label>)}</div>
      {selectedRows.length > 0 && <Button className="w-full" onClick={() => pay(selectedRows)}>Pagar selecionadas ({formatBRL(selectedRows.reduce((sum, row) => sum + row.amount, 0))})</Button>}
      <Button variant="outline" className="w-full" onClick={() => pay(pending)}>{busy ? "Salvando..." : "Marcar todas como pagas"}</Button>
      <Button variant="ghost" className="w-full" onClick={() => setSelected([])}>Limpar seleção</Button>
    </fieldset>}
  </CardContent></Card>
}

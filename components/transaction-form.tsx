"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { installmentSchedule, todayInSaoPaulo, formatBRL, formatDateOnly } from "@/lib/finance"
import { createTransactions } from "@/lib/finance-client"

const categories = {
  despesa: ["alimentacao", "transporte", "moradia", "saude", "educacao", "lazer", "roupas", "contas", "outros"],
  receita: ["salario", "freelance", "investimentos", "vendas", "bonus", "outros"],
}
export function TransactionForm({ onTransactionAdded }: { onTransactionAdded: (month?: string) => void }) {
  const [type, setType] = useState<"receita" | "despesa">("despesa")
  const [amount, setAmount] = useState("")
  const [count, setCount] = useState("1")
  const [dueDate, setDueDate] = useState(todayInSaoPaulo())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const request = useRef<{ body: string; id: string } | null>(null)
  const submitting = useRef(false)
  const numericAmount = Number(amount.replace(/\D/g, "")) / 100
  let preview: ReturnType<typeof installmentSchedule> = []
  let previewError = ""
  if (numericAmount > 0 && type === "despesa") {
    try { preview = installmentSchedule(numericAmount, Number(count), dueDate) }
    catch (error) { previewError = (error as Error).message }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setLoading(true); setError("")
    const form = event.currentTarget
    const data = new FormData(form)
    const input = { type, amount: numericAmount, description: String(data.get("description") || ""),
      category: String(data.get("category") || ""), installmentCount: type === "despesa" ? Number(count) : 1,
      firstDueDate: type === "despesa" ? dueDate : undefined }
    const body = JSON.stringify(input)
    if (request.current?.body !== body) request.current = { body, id: crypto.randomUUID() }
    try {
      await createTransactions({ ...input, requestId: request.current.id })
      onTransactionAdded(type === "despesa" ? dueDate.slice(0, 7) : todayInSaoPaulo().slice(0, 7))
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível salvar.") }
    finally { submitting.current = false; setLoading(false) }
  }
  return <Card>
    <CardHeader><CardTitle>Nova transação</CardTitle><CardDescription>Registre uma receita ou distribua um gasto entre os meses.</CardDescription></CardHeader>
    <CardContent>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={loading} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant={type === "receita" ? "default" : "outline"} onClick={() => setType("receita")}>💰 Entrada</Button>
            <Button type="button" variant={type === "despesa" ? "default" : "outline"} onClick={() => setType("despesa")}>💸 Saída</Button>
          </div>
          <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Input id="description" name="description" required maxLength={300} placeholder="Ex.: compra de uma geladeira" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="amount">{type === "despesa" ? "Valor total da compra (R$)" : "Valor (R$)"}</Label>
              <Input id="amount" inputMode="numeric" value={amount} required placeholder="0,00" onChange={event => {
                const digits = event.target.value.replace(/\D/g, "")
                setAmount(digits ? (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "")
              }} />
            </div>
            <div className="space-y-2"><Label htmlFor="category">Categoria</Label>
              <select key={type} id="category" name="category" className="w-full h-10 rounded-md border bg-background px-3 capitalize" required>
                {categories[type].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
          </div>
          {type === "despesa" && <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="installments">Quantidade de parcelas</Label><Input id="installments" type="number" min={1} max={360} step={1} required value={count} onChange={event => setCount(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="dueDate">{Number(count) > 1 ? "Primeiro vencimento" : "Vencimento"}</Label><Input id="dueDate" type="date" min="1900-01-01" max="2100-12-31" required value={dueDate} onChange={event => setDueDate(event.target.value)} /></div>
            </div>
            {previewError && <p role="alert" className="text-sm text-red-700">{previewError}</p>}
            {preview.length > 0 && <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
              <p className="font-medium text-sm">{preview.length} parcela(s) · Total {formatBRL(numericAmount)}</p>
              <div className="max-h-48 overflow-y-auto"><table className="w-full text-sm text-left">
                <thead><tr><th className="py-1">Parcela</th><th>Vencimento</th><th className="text-right">Valor</th></tr></thead>
                <tbody>{preview.map(row => <tr key={row.installmentNumber}><td className="py-1">{row.installmentNumber}/{row.installmentCount}</td><td>{formatDateOnly(row.dueDate)}</td><td className="text-right">{formatBRL(row.amount)}</td></tr>)}</tbody>
              </table></div>
              <p className="text-xs text-slate-600">Os centavos são distribuídos entre as primeiras parcelas. Cada parcela pode ser marcada como paga separadamente.</p>
            </div>}
          </>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading || Boolean(previewError)}>{loading ? "Salvando..." : type === "despesa" && Number(count) > 1 ? "Registrar parcelas" : "Registrar transação"}</Button>
        </fieldset>
      </form>
    </CardContent>
  </Card>
}

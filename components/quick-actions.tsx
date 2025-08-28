"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Transaction {
  _id: string
  type: "receita" | "despesa"
  amount: number
  category: string
  description: string
  createdAt: string
  isPaid?: boolean
  userId: string
}

interface QuickActionsProps {
  transactions: Transaction[]
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void
}

export function QuickActions({ transactions, onUpdateTransaction }: QuickActionsProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])

  const pendingExpenses = transactions.filter((t) => t.type === "despesa" && !t.isPaid)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const handleSelectTransaction = (transactionId: string, selected: boolean) => {
    if (selected) {
      setSelectedTransactions([...selectedTransactions, transactionId])
    } else {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId))
    }
  }

  const handleMarkAllAsPaid = () => {
    selectedTransactions.forEach(id => {
      onUpdateTransaction(id, { isPaid: true })
    })
    setSelectedTransactions([])
  }

  const handleSelectAll = () => {
    const allIds = pendingExpenses.map(t => t._id)
    setSelectedTransactions(selectedTransactions.length === allIds.length ? [] : allIds)
  }

  const totalSelected = selectedTransactions.reduce((sum, id) => {
    const transaction = pendingExpenses.find(t => t._id === id)
    return sum + (transaction?.amount || 0)
  }, 0)

  if (pendingExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>Ações Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-medium">Parabéns!</p>
            <p className="text-sm">Você não tem despesas pendentes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>⚡</span>
          <span>Ações Rápidas</span>
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {pendingExpenses.length} despesa(s) pendente(s)
          </p>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {formatCurrency(pendingExpenses.reduce((sum, t) => sum + t.amount, 0))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={selectedTransactions.length === pendingExpenses.length && pendingExpenses.length > 0}
              onCheckedChange={handleSelectAll}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">
              Selecionar todas ({selectedTransactions.length}/{pendingExpenses.length})
            </span>
          </div>
          
          {selectedTransactions.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-700">
                {formatCurrency(totalSelected)}
              </Badge>
              <Button
                size="sm"
                onClick={handleMarkAllAsPaid}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✅ Marcar como Pagas
              </Button>
            </div>
          )}
        </div>

        {/* Lista de despesas pendentes */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pendingExpenses.map((transaction) => (
            <div
              key={transaction._id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                selectedTransactions.includes(transaction._id)
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedTransactions.includes(transaction._id)}
                  onCheckedChange={(checked) => 
                    handleSelectTransaction(transaction._id, checked as boolean)
                  }
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-sm">
                    {transaction.description || "Sem descrição"}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {transaction.category}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-orange-600">
                  {formatCurrency(transaction.amount)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateTransaction(transaction._id, { isPaid: true })}
                  className="mt-1 text-xs border-green-300 text-green-600 hover:bg-green-50"
                >
                  ✅ Pagar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Botões de ação rápida */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              pendingExpenses.forEach(t => {
                onUpdateTransaction(t._id, { isPaid: true })
              })
            }}
            className="text-sm border-green-300 text-green-600 hover:bg-green-50"
          >
            ✅ Pagar Todas
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedTransactions([])}
            className="text-sm"
          >
            🔄 Limpar Seleção
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
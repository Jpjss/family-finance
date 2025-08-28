"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

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

interface TransactionListProps {
  transactions: Transaction[]
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void
}

export function TransactionList({ transactions, onUpdateTransaction }: TransactionListProps) {
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all")
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      alimentacao: "🍽️",
      transporte: "🚗",
      moradia: "🏠",
      saude: "🏥",
      educacao: "📚",
      lazer: "🎮",
      roupas: "👕",
      contas: "📄",
      salario: "💼",
      freelance: "💻",
      investimentos: "📈",
      vendas: "🛍️",
      bonus: "🎁",
      outros: "📦",
    }
    return icons[category] || "📦"
  }

  const handlePaymentToggle = (transactionId: string, isPaid: boolean) => {
    onUpdateTransaction(transactionId, { isPaid })
  }

  // Filtrar transações baseado no filtro selecionado
  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === "all") return true
    if (filter === "paid") return transaction.type === "despesa" && transaction.isPaid
    if (filter === "pending") return transaction.type === "despesa" && !transaction.isPaid
    return true
  })

  // Estatísticas para os filtros
  const despesas = transactions.filter((t) => t.type === "despesa")
  const despesasPagas = despesas.filter((t) => t.isPaid).length
  const despesasPendentes = despesas.filter((t) => !t.isPaid).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📋</span>
          <span>Controle de Transações</span>
        </CardTitle>
        <CardDescription>Gerencie suas movimentações financeiras</CardDescription>
        
        {/* Filtros */}
        <div className="flex items-center space-x-2 pt-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            📊 Todas ({transactions.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "paid" ? "default" : "outline"}
            onClick={() => setFilter("paid")}
            className="text-xs bg-green-600 hover:bg-green-700 text-white"
            disabled={despesasPagas === 0}
          >
            ✅ Pagas ({despesasPagas})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
            disabled={despesasPendentes === 0}
          >
            ⏳ Pendentes ({despesasPendentes})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-3">
                {filter === "all" ? "📝" : filter === "paid" ? "✅" : "⏳"}
              </div>
              <p className="font-medium">
                {filter === "all" ? "Nenhuma transação encontrada" : 
                 filter === "paid" ? "Nenhuma despesa paga" : 
                 "Nenhuma despesa pendente"}
              </p>
              <p className="text-sm">
                {filter === "all" ? "Adicione sua primeira transação para começar" : 
                 filter === "paid" ? "Marque algumas despesas como pagas" :
                 "Todas as despesas estão pagas!"}
              </p>
            </div>
          ) : (
            filteredTransactions
              .slice(-10)
              .reverse()
              .map((transaction) => (
                <div
                  key={transaction._id}
                  className={`p-3 sm:p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                    transaction.type === "receita"
                      ? "border-green-200 bg-green-50 hover:bg-green-100"
                      : transaction.isPaid
                      ? "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      : "border-orange-200 bg-orange-50 hover:bg-orange-100"
                  }`}
                >
                  {/* Layout Mobile - Empilhado */}
                  <div className="block sm:hidden space-y-3">
                    {/* Linha 1: Ícone, título e badge */}
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getCategoryIcon(transaction.category)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <p
                            className={`font-semibold text-sm truncate ${
                              transaction.type === "despesa" && transaction.isPaid
                                ? "text-gray-500 line-through"
                                : transaction.type === "receita"
                                ? "text-green-700"
                                : "text-orange-700"
                            }`}
                          >
                            {transaction.description || "Sem descrição"}
                          </p>
                          {transaction.type === "receita" ? (
                            <Badge className="bg-green-600 text-white text-xs flex-shrink-0">💰</Badge>
                          ) : transaction.isPaid ? (
                            <Badge className="bg-gray-600 text-white text-xs flex-shrink-0">✅</Badge>
                          ) : (
                            <Badge className="bg-orange-600 text-white text-xs flex-shrink-0">⏳</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 capitalize">📂 {transaction.category}</p>
                      </div>
                    </div>

                    {/* Linha 2: Valor (bem destacado) */}
                    <div className="text-center py-2">
                      <p
                        className={`font-bold text-2xl ${
                          transaction.type === "receita"
                            ? "text-green-600"
                            : transaction.isPaid
                            ? "text-gray-400 line-through"
                            : "text-orange-600"
                        }`}
                      >
                        {transaction.type === "receita" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">📅 {formatDate(transaction.createdAt)}</p>
                    </div>

                    {/* Linha 3: Controles para despesas */}
                    {transaction.type === "despesa" && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={transaction.isPaid || false}
                            onCheckedChange={(checked) => handlePaymentToggle(transaction._id, checked as boolean)}
                            className="w-4 h-4 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <span className="text-xs text-gray-600">
                            {transaction.isPaid ? "Pago" : "Marcar como pago"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePaymentToggle(transaction._id, !transaction.isPaid)}
                          className={`text-xs ${
                            transaction.isPaid
                              ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {transaction.isPaid ? "🔄 Pendente" : "✅ Pagar"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Layout Desktop - Horizontal */}
                  <div className="hidden sm:flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Checkbox para despesas */}
                      {transaction.type === "despesa" && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Checkbox
                            checked={transaction.isPaid || false}
                            onCheckedChange={(checked) => handlePaymentToggle(transaction._id, checked as boolean)}
                            className="w-5 h-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <span className="text-xs text-gray-600">
                            {transaction.isPaid ? "Pago" : "Marcar"}
                          </span>
                        </div>
                      )}

                      {/* Ícone e info */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="text-3xl flex-shrink-0">{getCategoryIcon(transaction.category)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p
                              className={`font-semibold text-lg truncate ${
                                transaction.type === "despesa" && transaction.isPaid
                                  ? "text-gray-500 line-through"
                                  : transaction.type === "receita"
                                  ? "text-green-700"
                                  : "text-orange-700"
                              }`}
                            >
                              {transaction.description || "Sem descrição"}
                            </p>
                            {/* Badge inline para desktop */}
                            {transaction.type === "receita" ? (
                              <Badge className="bg-green-600 text-white text-xs flex-shrink-0">💰 ENTRADA</Badge>
                            ) : transaction.isPaid ? (
                              <Badge className="bg-gray-600 text-white text-xs flex-shrink-0">✅ PAGO</Badge>
                            ) : (
                              <Badge className="bg-orange-600 text-white text-xs flex-shrink-0">⏳ PENDENTE</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 capitalize font-medium">
                            📂 {transaction.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            📅 {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Valor e ações - lado direito desktop */}
                    <div className="text-right ml-4 flex-shrink-0">
                      <p
                        className={`font-bold text-xl mb-2 ${
                          transaction.type === "receita"
                            ? "text-green-600"
                            : transaction.isPaid
                            ? "text-gray-400 line-through"
                            : "text-orange-600"
                        }`}
                      >
                        {transaction.type === "receita" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      
                      {/* Botão de ação rápida para despesas */}
                      {transaction.type === "despesa" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePaymentToggle(transaction._id, !transaction.isPaid)}
                          className={`text-xs ${
                            transaction.isPaid
                              ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {transaction.isPaid ? "🔄 Marcar Pendente" : "✅ Marcar Pago"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
        
        {/* Resumo no final */}
        {transactions.length > 0 && (
          <div className="mt-6 p-4 bg-slate-100 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{despesasPagas}</p>
                <p className="text-xs text-gray-600">Pagas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{despesasPendentes}</p>
                <p className="text-xs text-gray-600">Pendentes</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

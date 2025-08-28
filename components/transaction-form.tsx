"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface TransactionFormProps {
  onTransactionAdded: () => void
}

export function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [selectedType, setSelectedType] = useState<"receita" | "despesa" | "">("")

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    const formattedValue = (Number(numericValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formattedValue
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setAmount(formatted)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const formData = new FormData(e.currentTarget)
    const numericAmount = Number.parseFloat(amount.replace(/\./g, "").replace(",", "."))

    try {
      // Verificar se o usuário está logado
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      console.log("Usuário encontrado:", user)
      
      if (!user.id) {
        throw new Error('Usuário não encontrado')
      }

      const transactionData = {
        _id: Date.now().toString(),
        type: selectedType as "receita" | "despesa",
        amount: numericAmount,
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        createdAt: new Date().toISOString(),
        isPaid: selectedType === "receita" ? true : false,
        userId: user.id,
      }

      console.log("Dados da transação:", transactionData)

      const existingTransactions = JSON.parse(localStorage.getItem(`transactions_${user.id}`) || "[]")
      console.log("Transações existentes:", existingTransactions)
      
      existingTransactions.push(transactionData)
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(existingTransactions))
      
      console.log("Transação salva. Total de transações:", existingTransactions.length)

      setMessage("Transação adicionada com sucesso!")

      // Reset form
      e.currentTarget.reset()
      setAmount("")
      setSelectedType("")
      onTransactionAdded()

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error adding transaction:", error)
      setMessage("Erro ao adicionar transação")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>💰</span>
          <span>Nova Transação</span>
        </CardTitle>
        <CardDescription>Registre suas entradas e saídas financeiras</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.includes("sucesso")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção Visual de Tipo */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Transação</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedType("receita")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === "receita"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-semibold">ENTRADA</div>
                  <div className="text-sm text-gray-600">Receitas, salários, vendas</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedType("despesa")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === "despesa"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💸</div>
                  <div className="font-semibold">SAÍDA</div>
                  <div className="text-sm text-gray-600">Gastos, contas, compras</div>
                </div>
              </button>
            </div>
            <input type="hidden" name="type" value={selectedType} />
          </div>

          {selectedType && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center space-x-2">
                    <span>💵</span>
                    <span>Valor (R$)</span>
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    required
                    className={`border-2 focus:ring-2 text-right font-mono text-lg ${
                      selectedType === "receita"
                        ? "border-green-200 focus:border-green-500 focus:ring-green-200"
                        : "border-red-200 focus:border-red-500 focus:ring-red-200"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center space-x-2">
                    <span>🏷️</span>
                    <span>Categoria</span>
                  </Label>
                  <Select name="category" required>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Escolha uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedType === "receita" ? (
                        <>
                          <SelectItem value="salario">💼 Salário</SelectItem>
                          <SelectItem value="freelance">💻 Freelance</SelectItem>
                          <SelectItem value="investimentos">📈 Investimentos</SelectItem>
                          <SelectItem value="vendas">🛍️ Vendas</SelectItem>
                          <SelectItem value="bonus">🎁 Bônus</SelectItem>
                          <SelectItem value="outros">🔄 Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="alimentacao">🍽️ Alimentação</SelectItem>
                          <SelectItem value="transporte">🚗 Transporte</SelectItem>
                          <SelectItem value="moradia">🏠 Moradia</SelectItem>
                          <SelectItem value="saude">🏥 Saúde</SelectItem>
                          <SelectItem value="educacao">📚 Educação</SelectItem>
                          <SelectItem value="lazer">🎮 Lazer</SelectItem>
                          <SelectItem value="roupas">👕 Roupas</SelectItem>
                          <SelectItem value="contas">📄 Contas</SelectItem>
                          <SelectItem value="outros">🔄 Outros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center space-x-2">
                  <span>📝</span>
                  <span>Descrição</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={
                    selectedType === "receita"
                      ? "Ex: Salário do mês, freelance do projeto X..."
                      : "Ex: Compras no supermercado, conta de luz..."
                  }
                  className="border-2 focus:ring-2"
                />
              </div>

              <Button 
                type="submit" 
                className={`w-full text-white font-semibold py-3 text-lg transition-all ${
                  selectedType === "receita"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-200"
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-200"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>{selectedType === "receita" ? "💰" : "💸"}</span>
                    <span>
                      {selectedType === "receita" ? "Registrar Entrada" : "Registrar Saída"}
                    </span>
                  </span>
                )}
              </Button>
            </>
          )}

          {!selectedType && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-3">👆</div>
              <p className="text-lg font-medium">Escolha o tipo de transação</p>
              <p className="text-sm">Selecione se é uma entrada ou saída de dinheiro</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

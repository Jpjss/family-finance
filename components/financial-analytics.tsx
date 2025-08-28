"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

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

interface FinancialAnalyticsProps {
  transactions: Transaction[]
}

export function FinancialAnalytics({ transactions }: FinancialAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  // Calcular métricas principais
  const receitas = transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)
  const despesasTotal = transactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0)
  const despesasPagas = transactions.filter((t) => t.type === "despesa" && t.isPaid).reduce((sum, t) => sum + t.amount, 0)
  const despesasPendentes = despesasTotal - despesasPagas
  
  // Análise por categoria
  const categoriaGastos = transactions
    .filter((t) => t.type === "despesa")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const categoriaReceitas = transactions
    .filter((t) => t.type === "receita")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  // Top 5 categorias de gastos
  const topGastos = Object.entries(categoriaGastos)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Top 5 categorias de receitas
  const topReceitas = Object.entries(categoriaReceitas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Calcular percentuais
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0
  }

  // Status financeiro
  const saldo = receitas - despesasTotal
  const eficiencia = receitas > 0 ? ((receitas - despesasTotal) / receitas) * 100 : 0
  const comprometimento = receitas > 0 ? (despesasTotal / receitas) * 100 : 0

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-red-600 bg-red-50"
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 20) return "text-green-600 bg-green-50"
    if (efficiency >= 0) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>Análise Financeira</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Eficiência Financeira */}
            <div className="text-center">
              <div className={`rounded-lg p-4 ${getEfficiencyColor(eficiencia)}`}>
                <div className="text-2xl font-bold">
                  {eficiencia >= 0 ? "+" : ""}{eficiencia.toFixed(1)}%
                </div>
                <div className="text-sm font-medium">Eficiência</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {eficiencia >= 20 ? "Excelente controle!" : eficiencia >= 0 ? "Equilibrado" : "Atenção necessária"}
              </p>
            </div>

            {/* Comprometimento */}
            <div className="text-center">
              <div className={`rounded-lg p-4 ${getStatusColor(comprometimento)}`}>
                <div className="text-2xl font-bold">{comprometimento.toFixed(1)}%</div>
                <div className="text-sm font-medium">Comprometimento</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {comprometimento >= 80 ? "Alto risco" : comprometimento >= 60 ? "Moderado" : "Saudável"}
              </p>
            </div>

            {/* Status de Pagamentos */}
            <div className="text-center">
              <div className="rounded-lg p-4 bg-blue-50 text-blue-600">
                <div className="text-2xl font-bold">
                  {despesasTotal > 0 ? ((despesasPagas / despesasTotal) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm font-medium">Pagamentos</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(despesasPagas)} de {formatCurrency(despesasTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🔴</span>
              <span>Principais Gastos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topGastos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span>📝</span>
                <p className="mt-2">Nenhum gasto registrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topGastos.map(([category, amount], index) => {
                  const percentage = getPercentage(amount, despesasTotal)
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={index === 0 ? "destructive" : "secondary"}>
                            {index + 1}º
                          </Badge>
                          <span className="capitalize font-medium">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            {formatCurrency(amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Análise de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🟢</span>
              <span>Principais Receitas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReceitas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span>💰</span>
                <p className="mt-2">Nenhuma receita registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topReceitas.map(([category, amount], index) => {
                  const percentage = getPercentage(amount, receitas)
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index + 1}º
                          </Badge>
                          <span className="capitalize font-medium">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2 bg-green-100" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparativo Entradas vs Saídas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚖️</span>
            <span>Comparativo Financeiro</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Barra comparativa */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Receitas vs Despesas</span>
                <span>{formatCurrency(Math.abs(saldo))} {saldo >= 0 ? "sobra" : "falta"}</span>
              </div>
              <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${receitas > 0 ? (receitas / (receitas + despesasTotal)) * 100 : 0}%` }}
                >
                  {receitas > 0 && `${((receitas / (receitas + despesasTotal)) * 100).toFixed(0)}%`}
                </div>
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${despesasTotal > 0 ? (despesasTotal / (receitas + despesasTotal)) * 100 : 0}%` }}
                >
                  {despesasTotal > 0 && `${((despesasTotal / (receitas + despesasTotal)) * 100).toFixed(0)}%`}
                </div>
              </div>
            </div>

            {/* Detalhamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 font-medium">💰 Total Entradas</span>
                  <span className="text-green-700 font-bold">{formatCurrency(receitas)}</span>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-red-700 font-medium">💸 Total Saídas</span>
                  <span className="text-red-700 font-bold">{formatCurrency(despesasTotal)}</span>
                </div>
              </div>
            </div>

            {/* Status de Pagamentos Detalhado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-medium">✅ Despesas Pagas</span>
                  <span className="text-blue-700 font-bold">{formatCurrency(despesasPagas)}</span>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-orange-700 font-medium">⏳ Despesas Pendentes</span>
                  <span className="text-orange-700 font-bold">{formatCurrency(despesasPendentes)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💡</span>
            <span>Insights e Recomendações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {saldo < 0 && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <span className="text-red-500">⚠️</span>
                <div>
                  <p className="font-medium text-red-700">Atenção: Gastos excedem receitas</p>
                  <p className="text-sm text-red-600">
                    Você está gastando {formatCurrency(Math.abs(saldo))} a mais do que ganha.
                  </p>
                </div>
              </div>
            )}

            {comprometimento > 80 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-500">⚡</span>
                <div>
                  <p className="font-medium text-yellow-700">Alto comprometimento da renda</p>
                  <p className="text-sm text-yellow-600">
                    {comprometimento.toFixed(1)}% da sua renda está comprometida com gastos.
                  </p>
                </div>
              </div>
            )}

            {despesasPendentes > receitas * 0.3 && (
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-500">📋</span>
                <div>
                  <p className="font-medium text-orange-700">Muitas despesas pendentes</p>
                  <p className="text-sm text-orange-600">
                    Você tem {formatCurrency(despesasPendentes)} em despesas não pagas.
                  </p>
                </div>
              </div>
            )}

            {eficiencia >= 20 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-500">🎉</span>
                <div>
                  <p className="font-medium text-green-700">Excelente controle financeiro!</p>
                  <p className="text-sm text-green-600">
                    Você está conseguindo economizar {eficiencia.toFixed(1)}% da sua renda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
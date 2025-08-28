"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionList } from "@/components/transaction-list"
import { FinancialAnalytics } from "@/components/financial-analytics"
import { QuickActions } from "@/components/quick-actions"

interface User {
  id: string
  email: string
  name: string
}

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

interface MonthlyNotes {
  month: string
  expenses: string
  income: string
}

interface MonthOption {
  value: string
  label: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview")
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const generateMonthOptions = (): MonthOption[] => {
    const options: MonthOption[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      
      // Verificar se há anotações para este mês
      const hasNotes = user ? hasMonthlyNotes(monthValue) : false;
      
      options.push({
        value: monthValue,
        label: hasNotes 
          ? `📝 ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}` 
          : monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      });
    }
    
    return options;
  };

  const hasMonthlyNotes = (month: string): boolean => {
    if (!user) return false;
    
    const storageKey = `monthly_notes_${user.id}_${month}`;
    const savedNotes = localStorage.getItem(storageKey);
    
    if (!savedNotes) return false;
    
    try {
      const notes = JSON.parse(savedNotes);
      return !!(notes.expenses || notes.income);
    } catch {
      return false;
    }
  };

  const [monthlyNotes, setMonthlyNotes] = useState<MonthlyNotes>({
    month: getCurrentMonth(),
    expenses: "",
    income: "",
  });
  const [monthOptionsKey, setMonthOptionsKey] = useState(0); // Para forçar re-render do select

  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      console.log("Carregando transações para usuário:", user)
      
      if (!user.id) {
        console.log("Usuário não encontrado")
        return
      }

      const savedTransactions = localStorage.getItem(`transactions_${user.id}`)
      console.log("Transações encontradas no localStorage:", savedTransactions)
      
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions)
        console.log("Transações parseadas:", parsedTransactions)
        setTransactions(parsedTransactions)
      } else {
        console.log("Nenhuma transação encontrada")
        setTransactions([])
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")

    if (!userData) {
      console.log("Usuário não encontrado, redirecionando para login")
      window.location.href = "/"
      return
    }

    const parsedUser = JSON.parse(userData)
    console.log("Usuário logado:", parsedUser)
    setUser(parsedUser)

    // Carregar transações
    fetchTransactions();

    // Carregar notas mensais do localStorage (manteremos isso por enquanto)
    const currentMonth = getCurrentMonth();
    console.log("Mês atual:", currentMonth)
    
    const storageKey = `monthly_notes_${parsedUser.id}_${currentMonth}`
    const savedNotes = localStorage.getItem(storageKey)
    console.log(`Procurando anotações na chave: ${storageKey}`)
    console.log("Anotações encontradas:", savedNotes)
    
    if (savedNotes) {
      const notes = JSON.parse(savedNotes)
      console.log("Anotações parseadas:", notes)
      setMonthlyNotes({
        month: currentMonth,
        expenses: notes.expenses || "",
        income: notes.income || "",
      })
    } else {
      console.log("Nenhuma anotação encontrada, usando valores padrão")
      setMonthlyNotes({
        month: currentMonth,
        expenses: "",
        income: "",
      })
    }

    setLoading(false)
  }, [])

  const saveMonthlyNotes = (field: "expenses" | "income", value: string) => {
    const updatedNotes = { ...monthlyNotes, [field]: value }
    setMonthlyNotes(updatedNotes)

    if (user) {
      const storageKey = `monthly_notes_${user.id}_${monthlyNotes.month}`
      localStorage.setItem(storageKey, JSON.stringify(updatedNotes))
      console.log(`Anotação salva para ${field}:`, value)
      console.log(`Chave do localStorage: ${storageKey}`)
      console.log(`Dados salvos:`, updatedNotes)
      
      // Atualizar indicador visual no select
      setMonthOptionsKey(prev => prev + 1)
    }
  }

  const loadMonthlyNotes = (selectedMonth: string) => {
    if (user) {
      const storageKey = `monthly_notes_${user.id}_${selectedMonth}`
      const savedNotes = localStorage.getItem(storageKey)
      console.log(`Carregando anotações para ${selectedMonth}:`, savedNotes)
      
      if (savedNotes) {
        const notes = JSON.parse(savedNotes)
        setMonthlyNotes({
          month: selectedMonth,
          expenses: notes.expenses || "",
          income: notes.income || "",
        })
      } else {
        setMonthlyNotes({
          month: selectedMonth,
          expenses: "",
          income: "",
        })
      }
    }
  }

  const clearMonthlyNotes = () => {
    if (user && window.confirm(`Deseja limpar todas as anotações de ${formatMonth(monthlyNotes.month)}?`)) {
      const storageKey = `monthly_notes_${user.id}_${monthlyNotes.month}`
      localStorage.removeItem(storageKey)
      setMonthlyNotes({
        month: monthlyNotes.month,
        expenses: "",
        income: "",
      })
      console.log(`Anotações de ${monthlyNotes.month} foram limpas`)
      
      // Atualizar indicador visual no select
      setMonthOptionsKey(prev => prev + 1)
    }
  }

  const exportAllNotes = () => {
    if (!user) return;

    const allNotes: { [key: string]: any } = {};
    
    // Buscar todas as anotações do usuário no localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`monthly_notes_${user.id}_`)) {
        const month = key.replace(`monthly_notes_${user.id}_`, '');
        const notes = JSON.parse(localStorage.getItem(key) || '{}');
        if (notes.expenses || notes.income) {
          allNotes[month] = notes;
        }
      }
    }

    const dataStr = JSON.stringify(allNotes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `anotacoes_mensais_${user.name}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Anotações exportadas:', allNotes);
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  const handleTransactionAdded = () => {
    console.log("handleTransactionAdded chamado")
    fetchTransactions() // Recarrega as transações
    setShowForm(false)
  }

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return

    try {
      const updatedTransactions = transactions.map((t) => (t._id === id ? { ...t, ...updates } : t))
      
      setTransactions(updatedTransactions)
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTransactions))
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
    }
  }

  const calculateMetrics = () => {
    console.log("Calculando métricas para transações:", transactions)
    
    const receitas = transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0)
    const despesas = transactions.filter((t) => t.type === "despesa" && !t.isPaid).reduce((sum, t) => sum + t.amount, 0)

    const despesasPagas = transactions
      .filter((t) => t.type === "despesa" && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0)

    // Saldo disponível = receitas - apenas as despesas que já foram pagas
    const saldo = receitas - despesasPagas
    const economia = saldo > 0 ? saldo * 0.1 : 0 // 10% do saldo positivo como meta de economia

    console.log("Métricas calculadas:", { receitas, despesas, saldo, economia, despesasPagas })
    console.log("Lógica do saldo: receitas (", receitas, ") - despesas pagas (", despesasPagas, ") = ", saldo)
    console.log("Despesas pendentes não afetam o saldo disponível:", despesas)

    return { receitas, despesas, saldo, economia, despesasPagas }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const { receitas, despesas, saldo, economia, despesasPagas } = calculateMetrics()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">Finanças</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3 py-2 sm:px-4"
              >
                {showForm ? "✕" : "+"}
                <span className="hidden sm:inline ml-1">{showForm ? "Cancelar" : "Nova"}</span>
              </Button>
              <span className="text-xs sm:text-sm text-slate-600 hidden sm:inline">Olá, {user.name}</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-slate-200 hover:bg-slate-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
      <div className="bg-white border-b sticky top-14 sm:top-16 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "analytics"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📈 Análise Detalhada
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card
            className={`${saldo >= 0 ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-red-500 to-pink-600"} text-white border-0`}
          >
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className={`${saldo >= 0 ? "text-emerald-100" : "text-red-100"} text-xs sm:text-sm`}>
                Saldo Disponível
              </CardDescription>
              <CardTitle className="text-sm sm:text-2xl font-bold leading-tight">{formatCurrency(saldo)}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className="text-blue-100 text-xs sm:text-sm">Receitas</CardDescription>
              <CardTitle className="text-sm sm:text-2xl font-bold leading-tight">{formatCurrency(receitas)}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className="text-orange-100 text-xs sm:text-sm">Contas a Pagar</CardDescription>
              <CardTitle className="text-sm sm:text-2xl font-bold leading-tight">{formatCurrency(despesas)}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className="text-green-100 text-xs sm:text-sm">Contas Pagas</CardDescription>
              <CardTitle className="text-sm sm:text-2xl font-bold leading-tight">
                {formatCurrency(despesasPagas)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {showForm && (
          <div className="mb-6 sm:mb-8">
            <TransactionForm onTransactionAdded={handleTransactionAdded} />
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Anotações Mensais</span>
                </CardTitle>
                <div className="min-w-[200px]">
                  <Select key={monthOptionsKey} value={monthlyNotes.month} onValueChange={loadMonthlyNotes}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateMonthOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription className="text-sm">Registre suas observações mensais sobre receitas e gastos</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">💸 Observações sobre Gastos</label>
                    <span className="text-xs text-slate-500">{monthlyNotes.expenses.length} caracteres</span>
                  </div>
                  <Textarea
                    placeholder="Ex: Gastei mais com supermercado este mês devido às compras especiais..."
                    value={monthlyNotes.expenses}
                    onChange={(e) => saveMonthlyNotes("expenses", e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">💰 Observações sobre Receitas</label>
                    <span className="text-xs text-slate-500">{monthlyNotes.income.length} caracteres</span>
                  </div>
                  <Textarea
                    placeholder="Ex: Recebi um bônus no trabalho, freelance extra este mês..."
                    value={monthlyNotes.income}
                    onChange={(e) => saveMonthlyNotes("income", e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                  />
                </div>
                {(monthlyNotes.expenses || monthlyNotes.income) && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      Anotações salvas automaticamente • Última atualização: agora
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAllNotes}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        📤 Exportar Todas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearMonthlyNotes}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️ Limpar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <TransactionList transactions={transactions} onUpdateTransaction={handleUpdateTransaction} />
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <QuickActions transactions={transactions} onUpdateTransaction={handleUpdateTransaction} />
            
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Resumo por Categoria</CardTitle>
                <CardDescription className="text-sm">Gastos por categoria</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
              {transactions.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm sm:text-base">Dados insuficientes</p>
                  <p className="text-xs sm:text-sm">Adicione transações para ver o resumo</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(
                    transactions
                      .filter((t) => t.type === "despesa")
                      .reduce(
                        (acc, t) => {
                          acc[t.category] = (acc[t.category] || 0) + t.amount
                          return acc
                        },
                        {} as Record<string, number>,
                      ),
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between py-1">
                        <span className="capitalize text-slate-700 text-sm sm:text-base">{category}</span>
                        <span className="font-semibold text-red-600 text-sm sm:text-base">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </div>
          </>
        )}

        {activeTab === "analytics" && (
          <FinancialAnalytics transactions={transactions} />
        )}
      </main>
    </div>
  )
}

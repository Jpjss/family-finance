"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthPage() {
  const [mode, setMode] = useState<"local" | "cloud">("local")
  const [cloudAvailable, setCloudAvailable] = useState(false)
  useEffect(() => {
    fetch("/api/config").then(response => response.json()).then(data => {
      setCloudAvailable(Boolean(data.cloudEnabled))
      if (data.cloudEnabled) setMode("cloud")
    }).catch(() => {})
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 3000)
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email") || "").trim().toLowerCase()
    const password = formData.get("password") as string

    try {
      if (mode === "cloud") {
        const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
        const data = await response.json()
        if (!response.ok) { showMessage(data.error || "Não foi possível entrar.", "error"); return }
        const localUsers = JSON.parse(localStorage.getItem("users") || "[]")
        const legacy = localUsers.find((u: any) => u.email.toLowerCase() === email)
        localStorage.setItem("user", JSON.stringify({ id: data.user._id, name: data.user.name, email: data.user.email, storage: "cloud", legacyLocalId: legacy?.id }))
        localStorage.setItem("token", data.token)
        window.location.href = "/dashboard"
        return
      }
      // Verificar usuários no localStorage
      const usersData = localStorage.getItem("users")
      const users = JSON.parse(usersData || "[]")

      const user = users.find((u: any) => u.email.toLowerCase() === email && u.password === password)

      if (!user) {
        showMessage("Email ou senha incorretos. Verifique suas credenciais.", "error")
        return
      }

      // Gerar token simples
      const token = btoa(JSON.stringify({ userId: user.id, email: user.email, timestamp: Date.now() }))

      // Armazena os dados do usuário e token
      localStorage.setItem("user", JSON.stringify({ id: user.id, name: user.name, email: user.email, storage: "local" }))
      localStorage.setItem("token", token)

      showMessage("Login realizado com sucesso!", "success")

      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    } catch (error) {
      console.log("[v0] Login error:", error)
      showMessage("Não foi possível fazer login. Tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = String(formData.get("email") || "").trim().toLowerCase()
    const password = formData.get("password") as string

    try {
      if (mode === "cloud") {
        const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) })
        const data = await response.json()
        showMessage(response.ok ? "Conta sincronizada criada. Entre para continuar e importar seus gastos locais." : data.error || "Não foi possível cadastrar.", response.ok ? "success" : "error")
        return
      }
      // Verificar usuários existentes
      const usersData = localStorage.getItem("users")
      const users = JSON.parse(usersData || "[]")

      if (users.find((u: any) => u.email === email)) {
        showMessage("Essa conta já existe", "error")
        return
      }

      // Criar novo usuário
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      }

      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))

      showMessage("Conta criada com sucesso! Faça login para continuar.", "success")

      setTimeout(() => {
        const loginTab = document.querySelector('[data-value="login"]') as HTMLElement
        if (loginTab) {
          loginTab.click()
        }
      }, 1500)
    } catch (error) {
      console.log("[v0] Registration error:", error)
      showMessage("Não foi possível criar conta. Tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Finanças Familiares</CardTitle>
          <CardDescription className="text-slate-600">Gerencie suas finanças de forma inteligente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <Label htmlFor="storage-mode">Onde salvar os dados</Label>
            <select id="storage-mode" className="w-full rounded-md border p-2 text-sm" value={mode} disabled={isLoading} onChange={event => setMode(event.target.value as "local" | "cloud")}>
              <option value="local">Neste navegador</option>
              <option value="cloud" disabled={!cloudAvailable}>Sincronizado — com lembretes</option>
            </select>
            <p className="text-xs text-slate-600">{mode === "cloud" ? "Se sua conta existia apenas neste navegador, cadastre-a no modo sincronizado e importe os gastos no painel." : cloudAvailable ? "Para receber avisos, escolha o modo sincronizado." : "O parcelamento está disponível. Os avisos precisam da configuração do servidor."}</p>
          </div>
          {message && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                messageType === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger
                value="login"
                data-value="login"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                data-value="register"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    minLength={mode === "cloud" ? 8 : undefined}
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

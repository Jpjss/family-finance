import { NextResponse } from "next/server"

// Função simples para criar token sem dependência externa
function createSimpleToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Simular autenticação enquanto o MongoDB não está configurado
    const mockUser = {
      _id: "66c9a123456789123456789",
      name: "Usuário Teste",
      email: email,
    }

    // Gerar token simples sem dependências externas
    const token = createSimpleToken(mockUser._id, mockUser.email)

    return NextResponse.json({
      message: "Login realizado com sucesso",
      user: mockUser,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
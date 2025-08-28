import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("family-finance")
    const userModel = new User(db)

    const { user, token } = await userModel.authenticate(email, password)

    return NextResponse.json({
      message: "Login realizado com sucesso",
      user,
      token,
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

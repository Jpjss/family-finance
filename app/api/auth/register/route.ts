import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("family-finance")
    const userModel = new User(db)

    const user = await userModel.create({ name, email, password })

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: { _id: user._id, name: user.name, email: user.email },
    })
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { verifyToken, getTokenFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const client = await clientPromise
    const db = client.db("family-finance")
    const userModel = new User(db)

    const user = await userModel.findById(new ObjectId(decoded.userId))
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      user: { _id: user._id, name: user.name, email: user.email },
    })
  } catch (error: any) {
    console.error("Me error:", error)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }
}

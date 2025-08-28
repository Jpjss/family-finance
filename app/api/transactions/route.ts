import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { Transaction } from "@/lib/models/Transaction"
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
    const transactionModel = new Transaction(db)

    const transactions = await transactionModel.findByUserId(new ObjectId(decoded.userId))

    return NextResponse.json({ transactions })
  } catch (error: any) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const { description, amount, category, type } = await request.json()

    if (!description || !amount || !category || !type) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("family-finance")
    const transactionModel = new Transaction(db)

    const transactionData = {
      userId: new ObjectId(decoded.userId),
      description,
      amount: Number.parseFloat(amount),
      category,
      type,
      isPaid: type === "receita" ? true : false, // Receitas são sempre "pagas"
    }

    const transaction = await transactionModel.create(transactionData)

    return NextResponse.json({
      message: "Transação criada com sucesso",
      transaction,
    })
  } catch (error: any) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

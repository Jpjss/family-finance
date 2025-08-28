import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { Transaction } from "@/lib/models/Transaction"
import { verifyToken, getTokenFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const { isPaid } = await request.json()

    if (typeof isPaid !== "boolean") {
      return NextResponse.json({ error: "Status de pagamento inválido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("family-finance")
    const transactionModel = new Transaction(db)

    const result = await transactionModel.updatePaymentStatus(
      new ObjectId(params.id),
      new ObjectId(decoded.userId),
      isPaid,
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Status de pagamento atualizado com sucesso",
    })
  } catch (error: any) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const client = await clientPromise
    const db = client.db("family-finance")
    const transactionModel = new Transaction(db)

    const result = await transactionModel.delete(new ObjectId(params.id), new ObjectId(decoded.userId))

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Transação excluída com sucesso",
    })
  } catch (error: any) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

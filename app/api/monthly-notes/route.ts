import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { MonthlyNote } from "@/lib/models/MonthlyNote"
import { verifyToken, getTokenFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (!month || !year) {
      return NextResponse.json({ error: "Mês e ano são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("family-finance")
    const monthlyNoteModel = new MonthlyNote(db)

    const note = await monthlyNoteModel.findByUserAndDate(
      new ObjectId(decoded.userId),
      Number.parseInt(month),
      Number.parseInt(year),
    )

    return NextResponse.json({
      note: note || { expenseNotes: "", incomeNotes: "" },
    })
  } catch (error: any) {
    console.error("Get monthly notes error:", error)
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
    const { month, year, expenseNotes, incomeNotes } = await request.json()

    if (!month || !year) {
      return NextResponse.json({ error: "Mês e ano são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("family-finance")
    const monthlyNoteModel = new MonthlyNote(db)

    await monthlyNoteModel.upsert(new ObjectId(decoded.userId), Number.parseInt(month), Number.parseInt(year), {
      expenseNotes: expenseNotes || "",
      incomeNotes: incomeNotes || "",
    })

    return NextResponse.json({
      message: "Anotações salvas com sucesso",
    })
  } catch (error: any) {
    console.error("Save monthly notes error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

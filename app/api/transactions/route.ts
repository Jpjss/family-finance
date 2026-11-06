import { NextResponse } from "next/server"
import { Transaction } from "@/lib/models/Transaction"
import { authenticatedDb, apiError, ApiError } from "@/lib/server-api"
import { buildTransactions, transactionInput } from "@/lib/transaction-input"

export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  try {
    const { db, userId } = await authenticatedDb(request)
    return NextResponse.json({ transactions: await new Transaction(db).findByUserId(userId) })
  } catch (error) { return apiError(error) }
}
export async function POST(request: Request) {
  try {
    const { db, userId } = await authenticatedDb(request)
    const parsed = transactionInput.safeParse(await request.json())
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message)
    try { buildTransactions(parsed.data, userId.toHexString()) }
    catch (error) { throw new ApiError(400, (error as Error).message) }
    const transactions = await new Transaction(db).create(parsed.data, userId)
    return NextResponse.json({ transactions }, { status: 201 })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return apiError(new ApiError(409, "Este cadastro já foi recebido com outros valores. Recarregue a página."))
    return apiError(error)
  }
}

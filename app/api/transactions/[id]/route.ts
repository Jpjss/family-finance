import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { Transaction } from "@/lib/models/Transaction"
import { authenticatedDb, apiError, ApiError } from "@/lib/server-api"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, userId } = await authenticatedDb(request)
    if (!/^[a-f0-9]{24}$/i.test(params.id)) throw new ApiError(400, "Transação inválida.")
    const { isPaid } = await request.json()
    if (typeof isPaid !== "boolean") throw new ApiError(400, "Status de pagamento inválido.")
    const result = await new Transaction(db).updatePaymentStatus(new ObjectId(params.id), userId, isPaid)
    if (!result.matchedCount) throw new ApiError(404, "Despesa não encontrada.")
    return NextResponse.json({ success: true })
  } catch (error) { return apiError(error) }
}
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, userId } = await authenticatedDb(request)
    if (!/^[a-f0-9]{24}$/i.test(params.id)) throw new ApiError(400, "Transação inválida.")
    const result = await new Transaction(db).delete(new ObjectId(params.id), userId)
    if (!result.deletedCount) throw new ApiError(404, "Transação não encontrada.")
    return NextResponse.json({ success: true })
  } catch (error) { return apiError(error) }
}

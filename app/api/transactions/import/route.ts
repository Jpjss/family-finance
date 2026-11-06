import { NextResponse } from "next/server"
import { z } from "zod"
import { Transaction } from "@/lib/models/Transaction"
import { isDateOnly } from "@/lib/finance"
import { authenticatedDb, apiError, ApiError } from "@/lib/server-api"

const schema = z.object({ transactions: z.array(z.object({
  _id: z.string().min(1).max(100), type: z.enum(["receita", "despesa"]),
  description: z.string().max(300), category: z.string().min(1).max(60),
  amount: z.number().finite().positive().max(1_000_000_000),
  createdAt: z.string().datetime(), isPaid: z.boolean().optional(),
  dueDate: z.string().refine(isDateOnly).optional(),
  installmentNumber: z.number().int().min(1).max(360).optional(),
  installmentCount: z.number().int().min(1).max(360).optional(),
  installmentGroupId: z.string().max(100).optional(), totalAmount: z.number().positive().optional(),
})).max(500) })

export async function POST(request: Request) {
  try {
    const { db, userId } = await authenticatedDb(request)
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) throw new ApiError(400, "Há dados locais inválidos. Nenhum registro deste lote foi importado.")
    await new Transaction(db).saveOnce(parsed.data.transactions.map(row => ({
      ...row, userId: userId.toHexString(), isPaid: row.type === "receita" || Boolean(row.isPaid),
    })), userId, "import")
    return NextResponse.json({ success: true })
  } catch (error) { return apiError(error) }
}

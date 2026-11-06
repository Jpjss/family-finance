import { NextResponse } from "next/server"
import { z } from "zod"
import getMongoClient from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { apiError, ApiError } from "@/lib/server-api"

export async function POST(request: Request) {
  try {
    const input = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(254), password: z.string().min(8).max(72) }).safeParse(await request.json())
    if (!input.success) throw new ApiError(400, "Informe nome, e-mail válido e senha entre 8 e 72 caracteres.")
    if ((process.env.AUTH_SECRET?.length || 0) < 32) throw new ApiError(503, "O modo sincronizado ainda precisa ser configurado.")
    const db = (await getMongoClient()).db("family-finance")
    const user = await new User(db).create(input.data)
    return NextResponse.json({ user: { _id: user._id, name: user.name, email: user.email } }, { status: 201 })
  } catch (error) {
    if ((error as { code?: number }).code === 11000 || (error as Error).message === "Essa conta já existe") return apiError(new ApiError(409, "Essa conta já existe. Entre no modo sincronizado."))
    return apiError(error)
  }
}

import { NextResponse } from "next/server"
import { z } from "zod"
import getMongoClient from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { apiError, ApiError } from "@/lib/server-api"

export async function POST(request: Request) {
  try {
    const input = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }).safeParse(await request.json())
    if (!input.success) throw new ApiError(400, "Informe e-mail e senha válidos.")
    const db = (await getMongoClient()).db("family-finance")
    try {
      const result = await new User(db).authenticate(input.data.email, input.data.password)
      return NextResponse.json(result)
    } catch (error) {
      if ((error as Error).message === "Credenciais inválidas") throw new ApiError(401, "E-mail ou senha incorretos. Se você usava o modo local, cadastre sua conta no modo sincronizado.")
      throw error
    }
  } catch (error) { return apiError(error) }
}

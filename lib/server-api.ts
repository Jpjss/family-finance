import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { getTokenFromRequest, verifyToken } from "./auth"
import getMongoClient from "./mongodb"

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function authenticatedDb(request: Request) {
  let userId: ObjectId
  try {
    userId = new ObjectId(verifyToken(getTokenFromRequest(request) || "").userId)
  } catch {
    throw new ApiError(401, "Sua sessão expirou. Entre novamente no modo sincronizado.")
  }
  const db = (await getMongoClient()).db("family-finance")
  const user = await db.collection("users").findOne({ _id: userId }, { projection: { password: 0 } })
  if (!user) throw new ApiError(401, "Conta não encontrada. Entre novamente.")
  return { db, userId, user }
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status })
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  console.error("API failure:", error instanceof Error ? error.name : "UnknownError")
  return NextResponse.json({ error: "Não foi possível acessar o servidor. Confira a configuração e tente novamente." }, { status: 503 })
}

import { NextResponse } from "next/server"
export function POST() {
  return NextResponse.json({ error: "Use o login da sua conta." }, { status: 410 })
}

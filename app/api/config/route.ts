import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export function GET() {
  return NextResponse.json({ cloudEnabled: Boolean(process.env.MONGODB_URI && (process.env.AUTH_SECRET?.length || 0) >= 32) })
}

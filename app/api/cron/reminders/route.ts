import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import getMongoClient from "@/lib/mongodb"
import { runReminders } from "@/lib/reminder-worker"
import { notificationReadiness } from "@/lib/notification-settings"
import { apiError } from "@/lib/server-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const expected = Buffer.from(`Bearer ${secret || ""}`)
  const actual = Buffer.from(request.headers.get("authorization") || "")
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1"
  if (!dryRun && !notificationReadiness().enabled) return NextResponse.json({ enabled: false, message: "Envios desativados." })
  try {
    const db = (await getMongoClient()).db("family-finance")
    return NextResponse.json(await runReminders(db, { dryRun }))
  } catch (error) { return apiError(error) }
}

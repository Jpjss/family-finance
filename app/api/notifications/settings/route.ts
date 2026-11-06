import { NextResponse } from "next/server"
import { authenticatedDb, apiError, ApiError } from "@/lib/server-api"
import { defaultSettings, notificationReadiness, notificationSettingsSchema } from "@/lib/notification-settings"

export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  try {
    const { db, user, userId } = await authenticatedDb(request)
    const recent = await db.collection("notificationDeliveries").find({ userId }, {
      projection: { day: 1, channel: 1, status: 1, error: 1 },
    }).sort({ updatedAt: -1 }).limit(10).toArray()
    const lastRun = await db.collection("notificationRuns").findOne({}, { sort: { finishedAt: -1 }, projection: { finishedAt: 1, incomplete: 1 } })
    return NextResponse.json({ settings: user.notificationSettings || defaultSettings, email: user.email, readiness: notificationReadiness(), recent, lastRun })
  } catch (error) { return apiError(error) }
}
export async function PUT(request: Request) {
  try {
    const { db, userId } = await authenticatedDb(request)
    const parsed = notificationSettingsSchema.safeParse(await request.json())
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message)
    await db.collection("users").updateOne({ _id: userId }, { $set: { notificationSettings: parsed.data, notificationConsentUpdatedAt: new Date() } })
    return NextResponse.json({ settings: parsed.data })
  } catch (error) { return apiError(error) }
}

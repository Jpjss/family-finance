import type { Db, ObjectId } from "mongodb"
import { todayInSaoPaulo, reminderKind } from "./finance"
import { notificationReadiness, type NotificationSettings } from "./notification-settings"
import { DeliveryError, sendReminder, type ReminderChannel } from "./reminder-provider"
import type { TransactionDocument } from "./models/Transaction"

interface Delivery {
  _id: string; userId: ObjectId; transactionId: ObjectId; day: string; channel: ReminderChannel
  status: "sending" | "accepted" | "failed" | "uncertain" | "cancelled"
  updatedAt: Date; attempts: number; providerId?: string; error?: string
}

export async function runReminders(db: Db, { now = new Date(), dryRun = false, send = sendReminder } = {}) {
  const today = todayInSaoPaulo(now)
  const readiness = notificationReadiness()
  const result = { day: today, dryRun, eligible: 0, accepted: 0, failed: 0, uncertain: 0, skipped: 0, incomplete: false }
  const deliveries = db.collection<Delivery>("notificationDeliveries")
  const transactions = db.collection<TransactionDocument>("transactions")
  await deliveries.createIndex({ userId: 1, updatedAt: -1 })
  await transactions.createIndex({ type: 1, isPaid: 1, dueDate: 1 })
  // A process may die after submitting to a provider. Do not blindly resend such messages.
  if (!dryRun) await deliveries.updateMany({ status: "sending", updatedAt: { $lt: new Date(now.getTime() - 10 * 60000) } }, {
    $set: { status: "uncertain", error: "Execução interrompida; confira o provedor antes de reenviar.", updatedAt: now },
  })
  const future = new Date(`${today}T00:00:00Z`)
  future.setUTCDate(future.getUTCDate() + 2)
  const cursor = transactions.find({ type: "despesa", isPaid: { $ne: true }, dueDate: { $lte: future.toISOString().slice(0, 10), $type: "string" } }).sort({ dueDate: 1, _id: 1 })
  const deadline = Date.now() + 45000
  try {
    for await (const row of cursor) {
      if (Date.now() > deadline) { result.incomplete = true; break }
      if (!reminderKind(row.dueDate, row.isPaid, today)) continue
      for (const channel of ["email", "whatsapp"] as const) {
        if (Date.now() > deadline) { result.incomplete = true; break }
        const user = await db.collection("users").findOne({ _id: row.userId }, { projection: { email: 1, notificationSettings: 1 } })
        const settings = user?.notificationSettings as NotificationSettings | undefined
        if (!settings?.[channel === "email" ? "emailEnabled" : "whatsappEnabled"] || !readiness[channel]) continue
        const recipient = channel === "email" ? user?.email : settings.whatsappPhone
        if (typeof recipient !== "string" || !recipient) continue
        result.eligible++
        if (dryRun) continue
        const key = `${row._id}:${today}:${channel}`
        const claim = { _id: key, userId: row.userId, transactionId: row._id, day: today, channel, status: "sending" as const, updatedAt: new Date(), attempts: 1 }
        try { await deliveries.insertOne(claim) }
        catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error
          const retry = await deliveries.updateOne({ _id: key, status: "failed", attempts: { $lt: 3 }, updatedAt: { $lt: new Date(Date.now() - 10 * 60000) } }, {
            $set: { status: "sending", updatedAt: new Date() }, $inc: { attempts: 1 },
          })
          if (!retry.modifiedCount) { result.skipped++; continue }
        }
        // Recheck payment immediately before submitting, including on retries.
        const pending = await transactions.findOne({ _id: row._id, userId: row.userId, isPaid: { $ne: true } })
        if (!pending) {
          await deliveries.updateOne({ _id: key }, { $set: { status: "cancelled", updatedAt: new Date() } })
          result.skipped++; continue
        }
        try {
          const providerId = await send(channel, recipient, { ...row, dueDate: row.dueDate! }, today, key)
          await deliveries.updateOne({ _id: key }, { $set: { status: "accepted", providerId, updatedAt: new Date() } })
          result.accepted++
        } catch (error) {
          const uncertain = !(error instanceof DeliveryError) || error.uncertain
          const status = uncertain ? "uncertain" : "failed"
          await deliveries.updateOne({ _id: key }, { $set: { status, updatedAt: new Date(), error: error instanceof DeliveryError ? error.message : "Falha durante o envio; confira o provedor." } })
          result[status]++
        }
      }
    }
  } finally { await cursor.close() }
  if (!dryRun) await db.collection("notificationRuns").insertOne({ ...result, finishedAt: new Date() })
  return result
}

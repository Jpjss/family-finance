import { formatBRL, formatDateOnly, reminderKind } from "./finance"

export type ReminderChannel = "email" | "whatsapp"
export interface ReminderMessage {
  description: string; amount: number; dueDate: string; installmentNumber?: number; installmentCount?: number
}
export class DeliveryError extends Error {
  constructor(message: string, public uncertain: boolean) { super(message) }
}
export function reminderText(row: ReminderMessage, today: string) {
  const kind = reminderKind(row.dueDate, false, today)
  const status = kind === "upcoming" ? "vence em 2 dias" : kind === "due" ? "vence hoje" : "está vencida"
  const installment = (row.installmentCount || 1) > 1 ? ` (parcela ${row.installmentNumber}/${row.installmentCount})` : ""
  return { status, title: `${row.description}${installment}`, text: `${row.description}${installment}: ${formatBRL(row.amount)}, vencimento ${formatDateOnly(row.dueDate)} — ${status}. Marque como paga no Finanças Familiares para encerrar os avisos desta parcela.` }
}
export async function sendReminder(channel: ReminderChannel, recipient: string, row: ReminderMessage, today: string, key: string, fetcher: typeof fetch = fetch) {
  const message = reminderText(row, today)
  let response: Response
  try {
    if (channel === "email") {
      response = await fetcher("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ from: process.env.NOTIFICATION_FROM_EMAIL, to: [recipient], subject: `Lembrete: ${message.status} — Finanças Familiares`, text: message.text }),
      })
    } else {
      const sid = process.env.TWILIO_ACCOUNT_SID!
      response = await fetcher(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: "POST", signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          From: process.env.TWILIO_WHATSAPP_FROM!, To: `whatsapp:${recipient}`,
          ContentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID!,
          ContentVariables: JSON.stringify({ "1": message.title.replace(/\s+/g, " "), "2": formatBRL(row.amount), "3": formatDateOnly(row.dueDate), "4": message.status }),
        }),
      })
    }
  } catch { throw new DeliveryError("Resposta do provedor não confirmada.", true) }
  if (!response.ok) throw new DeliveryError(`Provedor retornou HTTP ${response.status}.`, response.status >= 500)
  try {
    const result = await response.json()
    const id = channel === "email" ? result.id : result.sid
    if (!id) throw new Error("Missing provider ID")
    return String(id)
  } catch { throw new DeliveryError("Aceite do provedor não confirmado.", true) }
}

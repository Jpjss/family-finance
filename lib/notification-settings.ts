import { z } from "zod"

export const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  whatsappPhone: z.string().trim().max(20).transform(value => value.replace(/[\s()-]/g, "")),
}).refine(value => !value.whatsappEnabled || /^\+[1-9]\d{7,14}$/.test(value.whatsappPhone), {
  message: "Informe o WhatsApp com código do país e DDD, por exemplo +5511999999999.",
})
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>
export const defaultSettings: NotificationSettings = { emailEnabled: false, whatsappEnabled: false, whatsappPhone: "" }

export function notificationReadiness() {
  return {
    enabled: process.env.REMINDERS_ENABLED === "true",
    email: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL),
    whatsapp: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM && process.env.TWILIO_WHATSAPP_CONTENT_SID),
    scheduler: Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32),
  }
}

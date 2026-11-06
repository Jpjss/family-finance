"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, currentUser, importLocalTransactions, localImportRows } from "@/lib/finance-client"
import { defaultSettings, type NotificationSettings as Settings } from "@/lib/notification-settings"

type Status = { settings: Settings; email: string; readiness: { enabled: boolean; email: boolean; whatsapp: boolean; scheduler: boolean }; recent: { _id: string; day: string; channel: string; status: string; error?: string }[]; lastRun?: { finishedAt: string; incomplete: boolean } }
export function NotificationSettings({ cloud, onImported }: { cloud: boolean; onImported: () => void }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [importCount, setImportCount] = useState(0)
  async function load() {
    try {
      const result = await api<Status>("/api/notifications/settings")
      setStatus(result); setSettings(result.settings)
    } catch (error) { setMessage((error as Error).message) }
  }
  useEffect(() => {
    if (!cloud) return
    load()
    if (!localStorage.getItem(`imported_${currentUser().id}`)) setImportCount(localImportRows().length)
  }, [cloud])
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("")
    try {
      const result = await api<{ settings: Settings }>("/api/notifications/settings", { method: "PUT", body: JSON.stringify(settings) })
      setSettings(result.settings); setMessage("Preferências salvas.")
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  async function migrate() {
    setBusy(true); setMessage("")
    try { await importLocalTransactions(); setImportCount(0); onImported(); setMessage("Gastos importados. A cópia local foi preservada.") }
    catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  const labels: Record<string, string> = { accepted: "Aceito pelo serviço", failed: "Falha no envio", uncertain: "Envio não confirmado", sending: "Em processamento", cancelled: "Cancelado" }
  return <Card className="mb-6"><CardHeader><CardTitle>Lembretes de vencimento</CardTitle><CardDescription>Dois dias antes, no vencimento e diariamente após vencer, até marcar a parcela como paga.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {!cloud ? <p className="text-sm text-amber-800">Você está no modo local. Os parcelamentos funcionam neste navegador. Para receber avisos com o aplicativo fechado, configure o servidor e entre ou cadastre-se no modo sincronizado na tela de login.</p> : <>
        {importCount > 0 && <div className="rounded-md border p-3 space-y-2"><p className="text-sm">Encontramos {importCount} gasto(s) da sua conta local neste navegador. Importe-os para acompanhar tudo no servidor.</p><Button disabled={busy} variant="outline" onClick={migrate}>Importar gastos locais</Button></div>}
        {status && <>
          <div className="text-sm text-slate-600 space-y-1">
            <p>E-mail: {status.readiness.email ? "configurado" : "aguardando configuração do serviço"} · WhatsApp: {status.readiness.whatsapp ? "configurado" : "aguardando configuração do serviço"}</p>
            <p>{status.readiness.enabled && status.readiness.scheduler ? "Envios habilitados no servidor. Horário previsto: 9h (Brasília)." : "Os envios automáticos ainda precisam ser ativados no servidor."}</p>
            <p>{status.lastRun ? `Última execução: ${new Date(status.lastRun.finishedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}${status.lastRun.incomplete ? " — há processamento pendente." : "."}` : "Nenhuma execução automática registrada ainda."}</p>
          </div>
          <form onSubmit={save} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={settings.emailEnabled} onChange={event => setSettings({ ...settings, emailEnabled: event.target.checked })} />Quero receber lembretes em {status.email}</label>
              <div className="space-y-2 max-w-md"><Label htmlFor="whatsapp-phone">Meu WhatsApp (país + DDD + número)</Label><Input id="whatsapp-phone" type="tel" placeholder="+5511999999999" value={settings.whatsappPhone} onChange={event => setSettings({ ...settings, whatsappPhone: event.target.value })} /></div>
              <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={settings.whatsappEnabled} onChange={event => setSettings({ ...settings, whatsappEnabled: event.target.checked })} />Autorizo receber lembretes diários de parcelas pendentes no meu WhatsApp.</label>
              <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar preferências"}</Button>
            </fieldset>
          </form>
          {status.recent.length > 0 && <details className="text-sm"><summary className="cursor-pointer">Últimos envios</summary><ul className="mt-2 space-y-1">{status.recent.map(row => <li key={row._id}>{row.day} · {row.channel} · {labels[row.status] || row.status}{row.error ? `: ${row.error}` : ""}</li>)}</ul><p className="mt-2 text-xs text-slate-500">O aceite pelo serviço não confirma a entrega ao destinatário.</p></details>}
        </>}
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={load}>Atualizar status</Button>
      </>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </CardContent>
  </Card>
}

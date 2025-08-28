import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import PWAInstaller from "@/components/pwa-installer"
import "./globals.css"

export const metadata: Metadata = {
  title: "Finanças Familiares",
  description: "Aplicativo pessoal para gerenciar finanças familiares",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#10b981",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finanças Familiares",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <PWAInstaller />
        {children}
      </body>
    </html>
  )
}

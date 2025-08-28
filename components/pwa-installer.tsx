"use client"

import { useEffect } from "react"

export default function PWAInstaller() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && "serviceWorker" in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[v1] Service Worker registered:", registration)
          })
          .catch((error) => {
            console.log("[v1] Service Worker registration failed:", error)
          })
      })
    }
  }, [])

  return null
}

const CACHE_NAME = "financas-familiares-v2"
const STATIC_FILES = ["/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES)).then(() => self.skipWaiting()))
})
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("financas-familiares-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url)
  // Never cache API responses or old application pages: payment status must reach the server.
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !STATIC_FILES.includes(url.pathname)) return
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)))
})

/* CAVE service worker: makes the app installable and start instantly.
 * It caches the app shell only. API calls are never cached, so data is always live. */
const CACHE = "cave-shell-v2"
const SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png"]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // photos, fonts: leave to the network/browser cache
  if (url.pathname.startsWith("/api/")) return // never cache data

  // Page loads: show the cached shell straight away (no blank screen while the network wakes up)
  // and refresh it in the background for next time. Offline, the cached shell is all there is.
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((hit) => {
        const network = fetch(req)
          .then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put("/", copy))
            return res
          })
          .catch(() => hit)
        return hit || network
      }),
    )
    return
  }

  // Built assets have hashed names, so cached copies never go stale.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/splash/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
    return
  }

  // Icons / manifest: serve cached, refresh in the background.
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => hit)
      return hit || network
    }),
  )
})

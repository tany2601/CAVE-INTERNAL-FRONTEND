/* CAVE service worker: makes the app installable and start instantly.
 * It caches the app shell only. API calls are never cached, so data is always live. */
// __BUILD_ID__ is replaced at build time, so each deploy ships a different worker file: browsers notice it,
// install it straight away (skipWaiting) and the activate step below removes every older cache.
const CACHE = "cave-shell-__BUILD_ID__"
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
  if (url.pathname === "/version.json" || url.pathname === "/sw.js") return // always straight from the network

  // Page loads: the network first, so an opened app is always the latest deploy. If the network is slow or
  // down (4 s), the cached shell opens instead, so the app still starts offline or on a weak signal.
  if (req.mode === "navigate") {
    event.respondWith(
      new Promise((resolve) => {
        const fallback = () => caches.match("/").then((hit) => resolve(hit || Response.error()))
        const timer = setTimeout(fallback, 4000)
        fetch(req)
          .then((res) => {
            clearTimeout(timer)
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put("/", copy))
            }
            resolve(res)
          })
          .catch(() => {
            clearTimeout(timer)
            fallback()
          })
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

/* STILL / FOCUS service worker.
 *
 * Scope: the app's own files only. It never touches cross-origin requests (YouTube, the background video,
 * etc.), never caches API/private responses (there are none), and only precaches the file list injected at
 * build time (scripts/sw-plugin.mjs). Offline = the cached app shell; online navigations always go to the
 * network first so updates are picked up.
 */
const VERSION = '__CACHE_VERSION__'
const CACHE = `still-focus-${VERSION}`
const PRECACHE = __PRECACHE__

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('still-focus-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

/** Safari requires media to be served with proper Range responses, which cache hits do not do by default. */
async function rangeResponse(request, cached) {
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '')
  if (!range) return cached
  const buf = await cached.arrayBuffer()
  const start = range[1] ? Number(range[1]) : 0
  const end = range[2] ? Math.min(Number(range[2]), buf.byteLength - 1) : buf.byteLength - 1
  if (start > end || start >= buf.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${buf.byteLength}` } })
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
    },
  })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return // third parties are never intercepted

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))))
    return
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (!cached) return fetch(request)
      return request.headers.has('range') ? rangeResponse(request, cached) : cached
    }),
  )
})

// Clicking a notification focuses the open app, or opens it. The target is always our own scope.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.startsWith(self.registration.scope))
      return existing ? existing.focus() : self.clients.openWindow(self.registration.scope)
    }),
  )
})

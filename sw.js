/* ============================================
   ARC Service Worker — v3.0.0
   Cache-first for assets, network-first for API
   ============================================ */

const CACHE_NAME = 'arc-cache-v3'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

const CACHE_STRATEGIES = {
  static: { name: CACHE_NAME, maxAge: 30 * 24 * 60 * 60 * 1000 },
  dynamic: { name: 'arc-dynamic-v2', maxAge: 24 * 60 * 60 * 1000 }
}

// ============================
// INSTALL
// ============================
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STRATEGIES.static.name)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ============================
// ACTIVATE
// ============================
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_STRATEGIES.static.name && k !== CACHE_STRATEGIES.dynamic.name)
            .map((k) => caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  )
})

// ============================
// FETCH
// ============================
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Always go network for non-GET requests
  if (request.method !== 'GET') return

  // Cache-first for static assets
  if (isStaticAsset(request)) {
    e.respondWith(cacheFirst(request))
    return
  }

  // Network-first for everything else (HTML nav, etc.)
  e.respondWith(networkFirst(request))
})

function isStaticAsset (request) {
  const pathname = new URL(request.url).pathname
  return STATIC_ASSETS.some((asset) => pathname.endsWith(asset) || pathname === asset) ||
    /\.(css|js|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|eot|ico)$/i.test(pathname)
}

async function cacheFirst (request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_STRATEGIES.dynamic.name)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

async function networkFirst (request) {
  try {
    const response = await fetch(request)

    if (response && response.status === 200) {
      // Cache HTML responses
      if (response.headers.get('Content-Type')?.includes('text/html')) {
        const cache = await caches.open(CACHE_STRATEGIES.dynamic.name)
        cache.put(request, response.clone())
      }
    }

    return response
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached

    // Return the cached index.html for any navigation request when offline
    if (request.mode === 'navigate') {
      const indexCache = await caches.match('/index.html')
      if (indexCache) return indexCache
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

// ============================
// MESSAGE HANDLING
// ============================
self.addEventListener('message', (e) => {
  const { data } = e

  if (data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => {
      self.clients.matchAll().then((clients) =>
        clients.forEach((client) => client.postMessage({ type: 'CACHE_CLEARED' }))
      )
    })
  }
})

// ============================
// VERSION
// ============================
const APP_VERSION = '3.0.0'
self.addEventListener('install', () => {
  self.clients.matchAll().then((clients) =>
    clients.forEach((client) => client.postMessage({ type: 'SW_VERSION', version: APP_VERSION }))
  )
})

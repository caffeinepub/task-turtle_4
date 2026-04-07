// Task Turtle Service Worker — v3
const CACHE_VERSION = 'tt-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_PAGE = '/offline.html';

// Assets to cache immediately on install (cache-first)
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ---- INSTALL ----
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(() => {
      // Force the waiting SW to become active immediately
      return self.skipWaiting();
    })
  );
});

// ---- ACTIVATE ----
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// ---- FETCH ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip YouTube API, external APIs — always network-first, no cache
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('youtu.be') ||
    url.hostname.includes('razorpay.com') ||
    url.hostname.includes('api.razorpay.com')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        // External API failed — return a meaningful JSON error response
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // ICP canister calls (api routes) — network-first
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('.ic0.app') ||
    url.hostname.includes('.icp0.io') ||
    url.pathname.startsWith('/api') ||
    request.headers.get('content-type')?.includes('application/cbor')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts, icons) — cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|otf|png|jpg|jpeg|gif|svg|ico|webp)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages) — network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the navigation response in dynamic cache
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          // Try from cache first
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fall back to offline page
          const offlinePage = await caches.match(OFFLINE_PAGE);
          return offlinePage || new Response('You are offline', { status: 503 });
        })
    );
    return;
  }

  // Default: stale-while-revalidate for everything else
  event.respondWith(staleWhileRevalidate(request));
});

// ---- STRATEGIES ----

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Resource unavailable offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);
  return cached || await fetchPromise || new Response('Resource unavailable', { status: 503 });
}

// ---- PUSH NOTIFICATIONS (base structure) ----
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification from Task Turtle',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Task Turtle', options)
    );
  } catch (err) {
    console.warn('[SW] Push event parse error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ---- MESSAGE HANDLER (for update flow) ----
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

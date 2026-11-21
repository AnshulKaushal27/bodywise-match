// Bodywise Match Service Worker — Offline Shell Cache & Resilience
const CACHE_NAME = "bodywise-match-v1";
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/hero-bg-desktop.webp",
  "/hero-bg-mobile.webp",
  "/hero-products.webp",
  "/icon-192.png",
  "/icon-512.png",
  "/about",
  "/privacy",
  "/safety",
  "/contact",
  "/terms",
  "/match",
  "/products",
  "/compare",
  "/help"
];

// Install: Cache critical shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Pre-caching warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for navigations & assets with offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip Next.js internal static assets, chunks, HMR, API requests, and external hosts
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/v1/") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting an HTML page, fallback to cached page or offline.html
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return cachedResponse || caches.match("/offline.html");
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

const CACHE_NAME = "hcww-ohs-report-v1.1.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./logo-holding.png",
  "./logo-safety.png",
  "./data-123.csv"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never interfere with uploads/submissions or other non-GET requests.
  if (request.method !== "GET") return;

  // Let external APIs stay network-first; if unavailable, return a cached response if one exists.
  const isExternalApi =
    url.hostname.includes("nominatim.openstreetmap.org") ||
    url.hostname.includes("cloud.hcww.com.eg") ||
    url.hostname.includes("script.google.com");

  if (isExternalApi) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match(request).then(cached => cached || Response.error()))
    );
    return;
  }

  // Cache-first for the local app and external static libraries/fonts.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

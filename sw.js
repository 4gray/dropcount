const CACHE_NAME = "dropcount-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./app.js",
  "./css/base.css",
  "./css/hero.css",
  "./css/dashboard.css",
  "./css/charts.css",
  "./css/assets.css",
  "./css/releases.css",
  "./css/dialog.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/config.js",
  "./js/data.js",
  "./js/github.js",
  "./js/notices.js",
  "./js/parsers.js",
  "./js/render.js",
  "./js/render-assets.js",
  "./js/render-dashboard.js",
  "./js/render-releases.js",
  "./js/sample-data.js",
  "./assets/branding/dropcount-mascot.webp",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-icon-192.png",
  "./assets/icons/maskable-icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});

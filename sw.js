// ==========================================================================
// SERVICE WORKER for Meal Tracker PWA
// Handles offline caching so the app works without internet after first load.
//
// Strategy: "Cache first, network fallback" for app assets (HTML, icons).
// CDN resources (React, Tailwind, Babel) are cached on first fetch and
// served from cache thereafter — perfect for an app that rarely changes.
// ==========================================================================

// Cache version — bump this when you update the app to force a refresh
const CACHE_VERSION = 'meal-tracker-v14.5';
';

// Files to pre-cache on install (the app shell)
const APP_SHELL = [
  './meal-tracker.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

// CDN resources we want to cache after first fetch
// (we don't pre-cache these because they're large, but once fetched they stick)
const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// --------------------------------------------------------------------------
// INSTALL: Pre-cache the app shell so it's available offline immediately
// --------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Activate immediately instead of waiting for all tabs to close
        return self.skipWaiting();
      })
  );
});

// --------------------------------------------------------------------------
// ACTIVATE: Clean up old caches from previous versions
// --------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all open tabs immediately
        return self.clients.claim();
      })
  );
});

// --------------------------------------------------------------------------
// FETCH: Serve from cache when available, fall back to network
// For CDN resources, cache the network response for future offline use
// --------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Check if this is a CDN resource we want to cache
  const isCDN = CDN_URLS.some((cdn) => event.request.url.startsWith(cdn));

  if (isCDN) {
    // CDN strategy: cache first, then network (and update cache)
    event.respondWith(
      caches.match(event.request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          // Not cached yet — fetch from network and cache for next time
          return fetch(event.request)
            .then((response) => {
              // Only cache successful responses
              if (!response || response.status !== 200) {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_VERSION)
                .then((cache) => cache.put(event.request, responseToCache));
              return response;
            });
        })
    );
    return;
  }

  // App shell strategy: cache first, network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => {
          // Return cached version, or fetch from network
          return cached || fetch(event.request)
            .then((response) => {
              // Cache new successful same-origin responses
              if (!response || response.status !== 200) {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_VERSION)
                .then((cache) => cache.put(event.request, responseToCache));
              return response;
            });
        })
        .catch(() => {
          // If both cache and network fail, show a basic offline message
          // (shouldn't happen since we pre-cache the app shell)
          return new Response('Offline — please check your connection.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
  }
});

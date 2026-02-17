const CACHE_VERSION = 'meal-tracker-v16';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './apple-icon-v1.png',
  './icon-192.png',
  './icon-512.png',
];

const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/@phosphor-icons/web',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const isCDN = CDN_URLS.some(url => event.request.url.startsWith(url));
        if (isCDN && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
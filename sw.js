const CACHE_NAME = 'roys-radio-fast-v3.1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', () => {
  // 直接交由瀏覽器原生高速連線處理，不進行任何快取阻塞
});

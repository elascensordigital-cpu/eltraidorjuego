
const CACHE_NAME = 'el-traidor-v1';
const BASE = self.registration.scope;
const CORE_FILES = ['./', './index.html', './manifest.json'];
const OPTIONAL_FILES = ['./imagen.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES);
    await Promise.all(OPTIONAL_FILES.map(async path => {
      try {
        await cache.add(path);
      } catch (error) {
        console.warn('Recurso opcional no disponible:', path);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('el-traidor-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const fallback = await cache.match(
          new URL('./index.html', BASE)
        );

        if (fallback) return fallback;
      }

      return Response.error();
    }
  })());
});

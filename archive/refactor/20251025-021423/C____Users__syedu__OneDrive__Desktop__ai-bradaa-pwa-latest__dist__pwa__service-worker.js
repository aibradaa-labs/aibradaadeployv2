const CACHE_NAME = 'ai-bradaa-v2';
const OFFLINE_URLS = [
  '/',
  '/app/index.html',
  '/pwa/manifest.json',
  '/data/laptops.json',
  '/icons/icon-32.png',
  '/icons/icon-64.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/ai-bradaa.svg'
];

// Install: precache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .catch(err => console.error('SW install failed:', err))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external API calls (Gemini)
  if (request.url.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache, then to index.html for SPA routing
        return caches.match(request)
          .then(match => match || caches.match('/app/index.html'));
      })
  );
});

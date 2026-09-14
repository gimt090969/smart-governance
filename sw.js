const CACHE_NAME = 'smart-gov-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/style.css',
  '/assets/css/public-map.css',
  '/assets/js/responsive.js',
  '/assets/js/pwa-init.js',
  '/assets/icons/icon-72.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
];

// Install Event - Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Handle requests
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass cache for non-GET requests (POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass cache for API calls, Supabase, Authentication, Realtime data
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/') || url.pathname.includes('/auth/')) {
    return;
  }

  // Bypass cache for Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine if it's an HTML page request
  const isHtmlRequest = request.headers.get('accept').includes('text/html');

  if (isHtmlRequest) {
    // Network First strategy for HTML files to always get the latest version
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If successful, cache a copy
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, fallback to offline.html
            return caches.match('/offline.html');
          });
        })
    );
  } else {
    // Cache First strategy for static assets (CSS, JS, Images)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Return from cache
        }
        
        // If not in cache, fetch from network
        return fetch(request).then((networkResponse) => {
          // Check if valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // Cache the new resource
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return networkResponse;
        }).catch((err) => {
          console.error('[Service Worker] Fetch failed:', err);
        });
      })
    );
  }
});

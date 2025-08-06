const CACHE_NAME = 'jiit-planner-cache-v2025-08-06_21-30-34';
const urlsToCache = [
    '/',
    // Add other assets you want to cache
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Failed to cache during install:', error);
            })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip caching entirely for API calls - be more explicit
    if (url.pathname.startsWith('/api/')) {
        console.log('SW: Bypassing cache for API call:', url.pathname);
        event.respondWith(
            fetch(event.request).catch((error) => {
                console.error('SW: API fetch failed:', error);
                throw error;
            })
        );
        return;
    }

    // Handle non-API requests with caching
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if available
                if (response) {
                    console.log('SW: Serving from cache:', url.pathname);
                    return response;
                }
                
                // Fetch from network and cache
                console.log('SW: Fetching from network:', url.pathname);
                return fetch(event.request).then(
                    (response) => {
                        // Only cache successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response before caching
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                console.log('SW: Cached:', url.pathname);
                            });
                        return response;
                    }
                ).catch((error) => {
                    console.error('SW: Network fetch failed:', error);
                    throw error;
                });
            })
    );
});

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icon.png',
            badge: '/badge.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

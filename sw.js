/* ==================== SERVICE WORKER - PWA OFFLINE SUPPORT ==================== */
/* Version: 1.0.0
/* Description: Offline functionality, caching, and background sync
/* ============================================================================== */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `real-estate-pwa-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    '/assets/agent-photo.jpg',
    '/offline.html'
];

// Assets to cache on first use
const DYNAMIC_CACHE = 'real-estate-dynamic-v1';

// API responses to cache
const API_CACHE = 'real-estate-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ==================== INSTALL EVENT ====================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installed successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Handle different request types
    if (request.method !== 'GET') {
        // Don't cache non-GET requests
        return;
    }
    
    // API requests - Network first, then cache
    if (url.pathname.includes('/api/') || url.pathname.includes('mls')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // HTML pages - Network first, fallback to cache
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirstWithOffline(request));
        return;
    }
    
    // Images - Cache first, fallback to network
    if (request.headers.get('accept').includes('image')) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // CSS, JS - Cache first, update in background
    if (request.url.match(/\.(css|js)$/)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }
    
    // Default - Network first
    event.respondWith(networkFirstStrategy(request));
});

// ==================== CACHING STRATEGIES ====================

// Network First - For dynamic content
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Clone and cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Offline', { status: 503 });
    }
}

// Network First with Offline Page
async function networkFirstWithOffline(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page
        const offlinePage = await caches.match(OFFLINE_PAGE);
        return offlinePage || new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Cache First - For static assets
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        return new Response('Image not available', { status: 404 });
    }
}

// Stale While Revalidate - For CSS/JS
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// ==================== BACKGROUND SYNC ====================
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-leads') {
        event.waitUntil(syncLeads());
    }
    
    if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
});

async function syncLeads() {
    try {
        // Get unsent leads from IndexedDB or send to server
        console.log('[Service Worker] Syncing leads...');
        
        // Implement actual sync logic here
        const leads = await getUnsentLeads();
        
        for (const lead of leads) {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lead)
            });
        }
        
        console.log('[Service Worker] Leads synced successfully');
    } catch (error) {
        console.error('[Service Worker] Lead sync failed:', error);
        throw error; // Retry sync
    }
}

async function syncFavorites() {
    try {
        console.log('[Service Worker] Syncing favorites...');
        // Implement favorites sync logic
    } catch (error) {
        console.error('[Service Worker] Favorites sync failed:', error);
    }
}

async function getUnsentLeads() {
    // Placeholder - implement IndexedDB retrieval
    return [];
}

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');
    
    const data = event.data ? event.data.json() : {};
    
    const title = data.title || 'New Property Alert';
    const options = {
        body: data.body || 'A new property matching your criteria is available!',
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        image: data.image || '/assets/notification-image.jpg',
        vibrate: [200, 100, 200],
        tag: data.tag || 'property-alert',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Property',
                icon: '/assets/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/action-dismiss.png'
            }
        ],
        data: {
            url: data.url || '/#search',
            propertyId: data.propertyId
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ==================== NOTIFICATION CLICK ====================
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        const url = event.notification.data.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Focus existing window if available
                    for (const client of clientList) {
                        if (client.url === url && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
    
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

// ==================== PERIODIC BACKGROUND SYNC ====================
self.addEventListener('periodicsync', (event) => {
    console.log('[Service Worker] Periodic sync:', event.tag);
    
    if (event.tag === 'update-properties') {
        event.waitUntil(updatePropertyCache());
    }
});

async function updatePropertyCache() {
    try {
        console.log('[Service Worker] Updating property cache...');
        
        const response = await fetch('/api/properties?updated=true');
        const data = await response.json();
        
        const cache = await caches.open(API_CACHE);
        await cache.put('/api/properties', new Response(JSON.stringify(data)));
        
        console.log('[Service Worker] Property cache updated');
    } catch (error) {
        console.error('[Service Worker] Property cache update failed:', error);
    }
}

// ==================== ERROR HANDLING ====================
self.addEventListener('error', (event) => {
    console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] Unhandled rejection:', event.reason);
});

// ==================== CONSOLE BRANDING ====================
console.log('%c[Service Worker] 🏆 10-Star Real Estate PWA Active', 
    'color: #d4af37; font-size: 16px; font-weight: bold;');
console.log(`%c[Service Worker] Version: ${CACHE_VERSION}`, 
    'color: #1a2332; font-size: 12px;');

// ==================== END OF SERVICE WORKER ====================

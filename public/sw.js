// Service Worker for AsteroidsX PWA
const CACHE_NAME = 'asteroidsx-v1.2.1'; // Increment this for updates
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/style.css',
  '/src/game/Game.js',
  '/src/game/AudioManager.js',
  '/src/game/GameSettings.js',
  '/src/game/GameStats.js',
  '/src/game/ShipCustomizer.js',
  '/src/entities/Player.js',
  '/src/entities/Asteroid.js',
  '/src/entities/Bullet.js',
  '/src/effects/ParticleSystem.js',
  '/src/effects/Background.js',
  '/src/utils/Vector2.js',
  '/src/utils/DeviceDetector.js',
  '/public/manifest.json',
  '/public/asteroid.svg',
  '/public/asteroid-icon.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for high scores (when online again)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync high scores or other data when back online
    const data = await getStoredData();
    if (data) {
      await syncDataToServer(data);
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

function getStoredData() {
  return new Promise((resolve) => {
    // Get stored high scores from IndexedDB
    const request = indexedDB.open('AsteroidsXDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['highscores'], 'readonly');
      const store = transaction.objectStore('highscores');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result);
      };
    };
    
    request.onerror = () => {
      resolve(null);
    };
  });
}

async function syncDataToServer(data) {
  // Placeholder for server sync functionality
  console.log('📊 Syncing data to server:', data);
  // In a real app, this would send data to your backend
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/public/manifest.json',
    badge: '/public/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Now',
        icon: '/public/manifest.json'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/public/manifest.json'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AsteroidsX', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎮 AsteroidsX Service Worker loaded');

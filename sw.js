// Versión dinámica basada en timestamp para forzar actualizaciones
const CACHE_VERSION = Date.now().toString();
const CACHE_NAME = `almacen-v${CACHE_VERSION}`;

// URLs que NO deben cachearse (siempre buscar en red)
const NO_CACHE_URLS = ["/api/", "/js/app.js", "/css/style.css"];

// URLs que pueden cachearse
const urlsToCache = [
  "/",
  "/index.html",
  "/login.html",
  "/manifest.json",
  "/favicon.ico",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("🔄 Service Worker instalando nueva versión:", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Cache abierto:", CACHE_NAME);
      return cache.addAll(urlsToCache);
    })
  );
  // Forzar activación inmediata
  self.skipWaiting();
});

// Fetch event - estrategia Network First para archivos críticos
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo manejar peticiones GET
  if (event.request.method !== "GET") {
    return;
  }

  // Para archivos de API y recursos críticos, usar Network First
  if (NO_CACHE_URLS.some((noCacheUrl) => url.pathname.includes(noCacheUrl))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la red funciona, devolver la respuesta
          if (response && response.status === 200) {
            return response;
          }
          // Si falla la red, intentar cache
          return caches.match(event.request);
        })
        .catch(() => {
          // Si todo falla, devolver cache si existe
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para otros archivos, usar Cache First con validación de red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Siempre intentar obtener la versión más reciente
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Si obtenemos una respuesta válida de la red
          if (networkResponse && networkResponse.status === 200) {
            // Actualizar cache en segundo plano
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
            return networkResponse;
          }
          return cachedResponse;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return cachedResponse;
        });

      // Si tenemos cache, devolverlo inmediatamente y actualizar en segundo plano
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no hay cache, esperar la respuesta de la red
      return fetchPromise;
    })
  );
});

// Activate event - limpiar caches antiguos inmediatamente
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activando nueva versión:", CACHE_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Eliminando cache antiguo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control inmediatamente de todas las páginas
        return self.clients.claim();
      })
  );
});

// Background sync for offline data
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log("Background sync triggered");
  return Promise.resolve();
}

// Push notifications (if needed in the future)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data
      ? event.data.text()
      : "Nueva notificación del sistema de almacén",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver detalles",
        icon: "/favicon.ico",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/favicon.ico",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Sistema de Almacén", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("🔄 Service Worker recibió mensaje para limpiar cache");
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("🗑️ Eliminando cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

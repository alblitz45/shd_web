const CACHE_NAME = 'avisos-escolares-v5';
const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './css/animate.css',
    './js/libs/jquery.js',
    './js/app.js',
    './img/favicon.ico',
    './img/icons/icon-72x72.png',
    './img/icons/icon-96x96.png',
    './img/icons/icon-128x128.png',
    './img/icons/icon-144x144.png',
    './img/icons/icon-152x152.png',
    './img/icons/icon-192x192.png',
    './img/icons/icon-384x384.png',
    './img/icons/icon-512x512.png',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    const cache = caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL));
    e.waitUntil(cache);
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    const activate = caches.keys().then((keys) => {
        return Promise.all(keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)));
    });
    e.waitUntil(activate);
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const respuesta = caches.match(e.request).then((cacheResp) => {
        if (cacheResp) {
            return cacheResp;
        }
        return fetch(e.request).then((netResp) => {
            if (e.request.method === 'GET' && netResp.ok) {
                const copia = netResp.clone();
                caches.open(CACHE_NAME).then((c) => c.put(e.request, copia));
            }
            return netResp;
        }).catch(() => {
            if (e.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
            return caches.match(e.request);
        });
    });
    e.respondWith(respuesta);
});

self.addEventListener('push', (e) => {
    let datos = { title: 'Avisos Escolares', body: 'Tienes un nuevo aviso' };

    if (e.data) {
        datos = e.data.json();
    }

    const opciones = {
        body: datos.body,
        icon: './img/icons/icon-192x192.png',
        badge: './img/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: { url: './' },
        actions: [
            { action: 'open', title: 'Ver aviso' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    e.waitUntil(self.registration.showNotification(datos.title, opciones));
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();

    if (e.action === 'close') return;

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('avisos-escolares') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});

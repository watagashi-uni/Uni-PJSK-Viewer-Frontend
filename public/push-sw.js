/* global clients */
// Updates are forced and do not wait for the user: workbox skips waiting and
// claims clients, then every open window reloads into the new build. Pages
// from this build onwards acknowledge the message and reload themselves;
// older pages never answer, so they are navigated directly.
const reloadMessage = 'PWA_RELOAD';
const reloadAckMessage = 'PWA_RELOAD_ACK';
const reloadAckTimeoutMs = 3000;
const pendingReloadAcks = new Map();

// Whether this worker replaces an older one is decided at install time but
// needed at activation; the browser may stop the worker in between, so the
// flag lives in Cache Storage rather than in memory. A first-ever install has
// no active worker and must not reload the page.
const updateStateCache = 'pwa-update-state-v1';
const replacingMarker = '/__pwa_replacing_previous_worker__';
// Left behind by the removed one-time lifecycle migration.
const obsoleteCaches = ['pwa-lifecycle-migration-v1'];

self.addEventListener('install', function (e) {
    if (!self.registration.active) {
        return;
    }
    e.waitUntil(caches.open(updateStateCache).then(function (cache) {
        return cache.put(replacingMarker, new Response('1'));
    }));
});

self.addEventListener('message', function (e) {
    if (e.data && e.data.type === reloadAckMessage && e.source && 'id' in e.source) {
        const acknowledge = pendingReloadAcks.get(e.source.id);
        if (acknowledge) acknowledge();
    }
});

async function reloadOpenPages() {
    const windowClients = await clients.matchAll({ type: 'window' });
    await Promise.all(windowClients.map(async function (client) {
        const acknowledged = new Promise(function (resolve) {
            pendingReloadAcks.set(client.id, function () { resolve(true); });
            setTimeout(function () { resolve(false); }, reloadAckTimeoutMs);
        });
        client.postMessage({ type: reloadMessage });
        const handled = await acknowledged;
        pendingReloadAcks.delete(client.id);
        if (!handled && 'navigate' in client) {
            await client.navigate(client.url).catch(function () {
                return null;
            });
        }
    }));
}

async function takeReplacingMarker() {
    const cache = await caches.open(updateStateCache);
    return cache.delete(replacingMarker);
}

self.addEventListener('activate', function (e) {
    e.waitUntil(Promise.all(obsoleteCaches.map(function (name) {
        return caches.delete(name);
    })));
    // Not inside waitUntil: a page navigated here would wait for activation.
    void takeReplacingMarker().then(function (replacing) {
        return replacing ? clients.claim().then(reloadOpenPages) : null;
    }).catch(function () {
        return null;
    });
});

self.addEventListener('push', function (e) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    let data = {};
    if (e.data) {
        try {
            data = e.data.json();
        } catch {
            data = { body: e.data.text() };
        }
    }

    const title = data.title || 'Uni PJSK Viewer';
    const options = {
        body: data.body || '您有一条新推送',
        icon: data.icon || '/pwa-icon.png',
        image: data.image,
        data: { url: data.url || '/' },
        vibrate: [100, 50, 100],
        badge: '/pwa-icon.png'
    };

    e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    const urlToOpen = new URL(e.notification.data.url || '/', self.location.origin).href;

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // 首先尝试找到一个已经打开的本站窗口
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.focus();
                    if ('navigate' in client) {
                        return client.navigate(urlToOpen);
                    }
                    return;
                }
            }
            // 如果没有打开的窗口，则新开一个
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

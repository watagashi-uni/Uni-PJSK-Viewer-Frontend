/* global clients */
// Permanent compatibility bridge for clients that can only load an older
// cached index.html. The migration runs once per browser profile, even if the
// user skips several releases; later updates use the forced reload below.
const lifecycleMigrationCache = 'pwa-lifecycle-migration-v1';
const lifecycleMigrationPending = '/__pwa_lifecycle_migration_pending__';
const lifecycleMigrationComplete = '/__pwa_lifecycle_migration_complete__';

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(lifecycleMigrationCache).then(async function (cache) {
            if (await cache.match(lifecycleMigrationComplete)) {
                return;
            }

            // Only migrated updates need to force-navigate existing windows.
            // A first-ever install has no active worker and should stay quiet.
            const migrationType = self.registration.active ? 'update' : 'initial';
            await cache.put(lifecycleMigrationPending, new Response(migrationType));
            await self.skipWaiting();
        })
    );
});

// Resolves true when the migration navigated the open windows itself.
let lifecycleMigrationNavigated = Promise.resolve(false);

self.addEventListener('activate', function (e) {
    lifecycleMigrationNavigated = caches.open(lifecycleMigrationCache).then(async function (cache) {
        if (await cache.match(lifecycleMigrationComplete)) {
            return false;
        }

        const pendingMigration = await cache.match(lifecycleMigrationPending);
        const migrationType = pendingMigration ? await pendingMigration.text() : 'update';

        // Persist completion before navigating so a reload can never repeat
        // the migration or enter a controller-change loop.
        await cache.put(lifecycleMigrationComplete, new Response('complete'));
        await cache.delete(lifecycleMigrationPending);
        await clients.claim();

        if (migrationType !== 'update') {
            return false;
        }

        const windowClients = await clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        await Promise.all(windowClients.map(function (client) {
            if (
                new URL(client.url).origin === self.location.origin &&
                'navigate' in client
            ) {
                return client.navigate(client.url).catch(function () {
                    return null;
                });
            }
            return null;
        }));
        return true;
    }).catch(function () {
        return false;
    });
    e.waitUntil(lifecycleMigrationNavigated);
});

// Updates are forced and do not wait for the user: workbox skips waiting and
// claims clients, then every open window reloads into the new build. Pages
// from this build onwards acknowledge the message and reload themselves;
// older pages never answer, so they are navigated directly.
const reloadMessage = 'PWA_RELOAD';
const reloadAckMessage = 'PWA_RELOAD_ACK';
const reloadAckTimeoutMs = 3000;
const pendingReloadAcks = new Map();
let replacingPreviousWorker = false;

self.addEventListener('install', function () {
    replacingPreviousWorker = Boolean(self.registration.active);
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

self.addEventListener('activate', function () {
    if (!replacingPreviousWorker) {
        return;
    }
    // Not inside waitUntil: a page navigated here would wait for activation.
    // The one-time migration above may already have navigated every window.
    void lifecycleMigrationNavigated.then(function (navigated) {
        return navigated ? null : clients.claim().then(reloadOpenPages);
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

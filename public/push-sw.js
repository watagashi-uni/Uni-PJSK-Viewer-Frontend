/* global clients */
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

/* Notificações do Pataí (carregado pelo service worker do app). */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Pataí', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Pataí';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
        await c.focus();
        if ('navigate' in c) return c.navigate(url);
        return;
      }
    }
    return self.clients.openWindow(url);
  })());
});

// Service worker do HamiCare: recebe os lembretes push e abre o app ao tocar.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'HamiCare', body: 'Hora de cuidar um pouquinho de você.' };
  try {
    data = { ...data, ...event.data.json() };
  } catch (_) {
    /* mensagem sem JSON: usa o texto padrão */
  }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'hamicare' }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      return open ? open.focus() : self.clients.openWindow('/');
    }),
  );
});

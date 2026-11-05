// Service worker do HamiCare: recebe os lembretes push e abre o app ao tocar.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'HamiCare', body: 'Hora de cuidar um pouquinho de você.', url: '/', tag: 'hamicare' };
  try {
    data = { ...data, ...event.data.json() };
  } catch (_) {
    /* mensagem sem JSON: usa o texto padrão */
  }
  // Cada tipo tem a sua etiqueta: um lembrete de água novo troca o anterior em vez de empilhar.
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: data.tag, data: { url: data.url } }));
});

// Tocar no lembrete abre o app na tela certa (água → Missões, Hami → Cuidar, pausa → Bem-estar...).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      if (open) return open.navigate ? open.navigate(url).then((c) => (c || open).focus()) : open.focus();
      return self.clients.openWindow(url);
    }),
  );
});

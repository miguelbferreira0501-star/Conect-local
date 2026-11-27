import type { CapacitorConfig } from '@capacitor/cli';

// App do iPhone (e, depois, Android) feito com Capacitor: o app web compilado (dist/) vai dentro do app,
// e conversa com o servidor do Lumbi pela internet (VITE_API_BASE, padrão hamicare.onrender.com).
const config: CapacitorConfig = {
  appId: 'com.hamicare.app',
  appName: 'Lumbi',
  webDir: 'dist',
  android: {
    backgroundColor: '#C8F299',
  },
  ios: {
    // O app já respeita o entalhe e a barra de baixo (viewport-fit=cover + env(safe-area-inset-*)).
    contentInset: 'never',
    backgroundColor: '#FFF4E2',
    scrollEnabled: true,
  },
  plugins: {
    // Pedidos ao servidor pelo lado nativo: o cookie da sessão funciona como no site (sem bloqueio de terceiros).
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
    LocalNotifications: { iconColor: '#FF6F91' },
    SplashScreen: { launchShowDuration: 900, backgroundColor: '#C8F299', showSpinner: false },
    // Android de ponta a ponta: a barra do relógio e a barra de gestos ficam transparentes, por cima do
    // cenário do app (que já respeita as bordas com env(safe-area-inset-*)). Ícones escuros, como no fundo claro.
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'LIGHT' },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

// App do iPhone (e, depois, Android) feito com Capacitor: o app web compilado (dist/) vai dentro do app,
// e conversa com o servidor do HamiCare pela internet (VITE_API_BASE, padrão hamicare.onrender.com).
const config: CapacitorConfig = {
  appId: 'com.hamicare.app',
  appName: 'HamiCare',
  webDir: 'dist',
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
    SplashScreen: { launchShowDuration: 900, backgroundColor: '#FFF4E2', showSpinner: false },
  },
};

export default config;

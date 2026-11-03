import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './live.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// App instalado (servido pelo servidor do HamiCare): service worker para os lembretes push.
// Na página de teste e no arquivo local isso não existe, e o app funciona do mesmo jeito.
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !(window as unknown as { claude?: unknown }).claude) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

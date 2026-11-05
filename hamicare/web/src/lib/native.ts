// App instalado pela loja (Capacitor, iPhone/Android) ou site/página de teste?
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};
export const nativePlatform = () => (isNativeApp() ? Capacitor.getPlatform() : 'web');

const ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/** Endereço público do HamiCare (links de convite, termos, servidor). */
export const SITE_URL = ENV.VITE_SITE_URL ?? 'https://hamicare.onrender.com';

/** No app da loja, o app vem dentro do celular e conversa com o servidor pela internet; no site, é o mesmo endereço. */
export const apiBase = () => (isNativeApp() ? (ENV.VITE_API_BASE ?? SITE_URL) : '');

/** Onde a assinatura paga vai chegar, do jeito que cada loja permite falar. */
export function storeWord(): string {
  const p = nativePlatform();
  return p === 'ios' ? 'pela App Store' : p === 'android' ? 'pela Google Play' : 'pela Google Play, pela App Store e no Pix';
}

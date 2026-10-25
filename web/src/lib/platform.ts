/**
 * Detecta se o app está rodando dentro do app da loja (Android TWA / iOS).
 * Dentro das lojas não oferecemos compra de planos (as lojas exigem o próprio sistema de pagamento);
 * a assinatura é feita pelo site.
 */
import { storage } from './storage';

export function isStoreApp(): boolean {
  try {
    if (document.referrer.startsWith('android-app://')) storage.set('cl_store_app', true);
    if ((window as unknown as { Capacitor?: unknown }).Capacitor) return true;
  } catch {
    /* ignorado */
  }
  return storage.get('cl_store_app', false);
}

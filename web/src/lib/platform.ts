/**
 * Detecta se o app está rodando dentro do app da loja (Android TWA / iOS).
 * Dentro das lojas não oferecemos compra de planos (as lojas exigem o próprio sistema de pagamento);
 * a assinatura é feita pelo site.
 *
 * A marca fica em sessionStorage (só nesta aba/janela): o app da Play Store usa o mesmo Chrome do
 * celular, e com localStorage a marca "vazava" para o navegador comum e escondia o pagamento lá também.
 */
const KEY = 'cl_store_app';

export function isStoreApp(): boolean {
  try {
    if ((window as unknown as { Capacitor?: unknown }).Capacitor) return true;
    if (document.referrer.startsWith('android-app://')) sessionStorage.setItem(KEY, '1');
    if (window.matchMedia?.('(display-mode: standalone)').matches && sessionStorage.getItem(KEY) === '1') return true;
    localStorage.removeItem(KEY); // limpa a marca antiga, que ficava para sempre
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

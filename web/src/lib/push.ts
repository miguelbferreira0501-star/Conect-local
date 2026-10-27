/** Notificações no celular: pede permissão, assina e manda o aparelho para o servidor. */
import { api } from './api';

export type PushState = 'unsupported' | 'denied' | 'off' | 'on';

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && import.meta.env.VITE_PREVIEW !== '1';

function b64ToBytes(b64: string) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (ch) => ch.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? navigator.serviceWorker.ready;
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission !== 'granted') return 'off';
  const reg = await registration();
  return (await reg?.pushManager.getSubscription()) ? 'on' : 'off';
}

export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
  const reg = await registration();
  const { publicKey } = await api.get<{ publicKey: string }>('/push/key');
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.post('/me/push', { endpoint: json.endpoint, keys: json.keys });
  return 'on';
}

export async function disablePush() {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.post('/me/push/remove', { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
}

/** Ao entrar na conta, reenvia o aparelho já autorizado (o servidor liga a notificação à conta certa). */
export async function syncPush() {
  if ((await pushState()) !== 'on') return;
  const sub = await (await registration()).pushManager.getSubscription();
  if (!sub) return;
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.post('/me/push', { endpoint: json.endpoint, keys: json.keys }).catch(() => {});
}

/** Ao sair da conta, o aparelho para de receber os avisos dela (a permissão do navegador continua). */
export async function unlinkPush() {
  if (!pushSupported()) return;
  const sub = await (await registration())?.pushManager.getSubscription();
  if (sub) await api.post('/me/push/remove', { endpoint: sub.endpoint }).catch(() => {});
}

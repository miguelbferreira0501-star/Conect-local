// Guardiões do Hami no app: mural, pedir ajuda e ser Guardião (pagamento único pelo site).
import { http } from './social/api';
import { isNativeApp } from './native';
import { grantPremium } from './store';
import type { GuardianPeriod, GuardianTier } from '../shared/guardian';

export interface GuardianWall {
  stats: { helped: number; waiting: number; guardians: number; seatsLeft: number };
  wall: { name: string; tier: GuardianTier; seats: number; months: number; message: string | null; paidAt: string }[];
  paymentsOn: boolean;
}
export interface GuardianRequest {
  status: 'esperando' | 'atendido';
  createdAt: string;
  grantedAt: string | null;
  months: number | null;
}
export interface GuardianMe {
  request: GuardianRequest | null;
  orders: { id: string; tier: GuardianTier; seats: number; months: number; amountCents: number; status: string; seatsLeft: number; createdAt: string }[];
  paymentsOn: boolean;
  testMode: boolean;
}

export const guardianWall = () => http<GuardianWall>('GET', '/guardiao/mural');
export const guardianMe = () => http<GuardianMe>('GET', '/guardiao/me');

export async function askHelp(reason?: string): Promise<GuardianRequest> {
  const r = await http<{ request: GuardianRequest; premiumUntil: string | null }>('POST', '/guardiao/pedir', { reason });
  if (r.premiumUntil) grantPremium(r.premiumUntil);
  return r.request;
}
export const cancelHelp = () => http('DELETE', '/guardiao/pedir');

export async function becomeGuardian(input: { tier: GuardianTier; period: GuardianPeriod; heroCents?: number; displayName?: string; message?: string }) {
  return http<{ orderId: string; checkoutUrl: string; provider: 'mercadopago' | 'teste' }>('POST', '/guardiao/pedidos', input);
}
export const payTest = (orderId: string) => http<{ ok: boolean; first: boolean }>('POST', `/guardiao/teste/${orderId}/pagar`);

const TWA_KEY = 'hamicare:twa';
/** Abriu pelo app Android da Google Play (Trusted Web Activity)? O navegador avisa no primeiro carregamento. */
export function markTwa() {
  try {
    if (document.referrer.startsWith('android-app://')) sessionStorage.setItem(TWA_KEY, '1');
  } catch {
    /* sem armazenamento */
  }
}
function isTwa() {
  try {
    return sessionStorage.getItem(TWA_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Comprar dentro dos apps das lojas exige o sistema de pagamento delas: ser Guardião fica só no site
 * (navegador). Nos apps, a pessoa vê o mural e pode pedir ajuda.
 */
export const canBuyHere = () => !isNativeApp() && !isTwa();

// Compra do HamiCare+ dentro do app do iPhone (StoreKit 2, pela App Store).
// A compra é confirmada no nosso servidor, que confere a assinatura da Apple antes de liberar o Plus.
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { nativePlatform } from './native';
import { http } from './social/api';
import { grantPremium } from './store';
import { IAP_PRODUCTS, type IapPlan } from '../shared/iap';

export type { IapPlan };
export const iapAvailable = () => nativePlatform() === 'ios';

export interface StorePrice {
  price: string;
}

/** Preços como a App Store mostra (na moeda e no formato da pessoa). */
export async function loadStorePrices(): Promise<Partial<Record<IapPlan, StorePrice>>> {
  if (!iapAvailable()) return {};
  const { products } = await NativePurchases.getProducts({ productIdentifiers: Object.values(IAP_PRODUCTS), productType: PURCHASE_TYPE.SUBS });
  const out: Partial<Record<IapPlan, StorePrice>> = {};
  for (const p of products) {
    if (p.identifier === IAP_PRODUCTS.mensal) out.mensal = { price: p.priceString };
    if (p.identifier === IAP_PRODUCTS.anual) out.anual = { price: p.priceString };
  }
  return out;
}

async function confirm(jws: string): Promise<string | null> {
  const r = await http<{ premiumUntil: string | null }>('POST', '/billing/apple', { jws });
  if (r.premiumUntil) grantPremium(r.premiumUntil);
  return r.premiumUntil;
}

/** Compra o plano. Devolve até quando vai o Plus, ou null se a pessoa desistiu. */
export async function buyPlan(plan: IapPlan, userId: string): Promise<string | null> {
  let tx;
  try {
    tx = await NativePurchases.purchaseProduct({ productIdentifier: IAP_PRODUCTS[plan], productType: PURCHASE_TYPE.SUBS, quantity: 1, appAccountToken: userId });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    if (msg.includes('cancel')) return null;
    throw new Error('A App Store não concluiu a compra. Tente de novo em instantes.');
  }
  if (!tx.jwsRepresentation) throw new Error('A compra foi feita, mas não veio a confirmação da Apple. Toque em "Restaurar compras".');
  return confirm(tx.jwsRepresentation);
}

/** Restaurar compras: reenvia ao servidor as assinaturas desta conta Apple. */
export async function restorePlans(): Promise<string | null> {
  if (!iapAvailable()) return null;
  await NativePurchases.restorePurchases().catch(() => {});
  const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS });
  let best: string | null = null;
  for (const t of purchases) {
    if (!t.jwsRepresentation) continue;
    const until = await confirm(t.jwsRepresentation).catch(() => null);
    if (until && (!best || until > best)) best = until;
  }
  return best;
}

/** Gerenciar ou cancelar a assinatura (tela da própria App Store). */
export const manageSubscription = () => NativePurchases.manageSubscriptions();

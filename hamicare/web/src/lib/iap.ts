// Compra do Lumbi+ dentro dos apps nativos: iPhone (StoreKit 2, pela App Store) e Android (Google Play Billing).
// A compra é confirmada no nosso servidor, que confere com a Apple ou com o Google antes de liberar o Plus.
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { nativePlatform } from './native';
import { http } from './social/api';
import { grantPremium } from './store';
import { IAP_PRODUCTS, type IapPlan } from '../shared/iap';

export type { IapPlan };
export const iapAvailable = () => nativePlatform() === 'ios' || nativePlatform() === 'android';
const android = () => nativePlatform() === 'android';
/** Qual loja cobra neste app (para os textos de renovação e cancelamento). */
export const iapStore = (): 'apple' | 'google' => (android() ? 'google' : 'apple');

export interface StorePrice {
  price: string;
}

/** Preços como a App Store mostra (na moeda e no formato da pessoa). */
export async function loadStorePrices(): Promise<Partial<Record<IapPlan, StorePrice>>> {
  if (!iapAvailable()) return {};
  const { products } = await NativePurchases.getProducts({ productIdentifiers: Object.values(IAP_PRODUCTS), productType: PURCHASE_TYPE.SUBS });
  const out: Partial<Record<IapPlan, StorePrice>> = {};
  for (const p of products) {
    // No Android, cada plano básico vem como um produto: identifier = id do plano (mensal/anual).
    const id = [p.identifier, (p as { planIdentifier?: string }).planIdentifier];
    if (id.includes(IAP_PRODUCTS.mensal) || (android() && id.includes('mensal'))) out.mensal = { price: p.priceString };
    if (id.includes(IAP_PRODUCTS.anual) || (android() && id.includes('anual'))) out.anual = { price: p.priceString };
  }
  return out;
}

async function confirm(jws: string): Promise<string | null> {
  const r = await http<{ premiumUntil: string | null }>('POST', '/billing/apple', { jws });
  if (r.premiumUntil) grantPremium(r.premiumUntil);
  return r.premiumUntil;
}

async function confirmGoogle(purchaseToken: string, productId: string): Promise<string | 'pendente' | null> {
  const r = await http<{ premiumUntil: string | null; pending?: boolean }>('POST', '/billing/google', { purchaseToken, productId });
  if (r.premiumUntil) grantPremium(r.premiumUntil);
  return r.pending ? 'pendente' : r.premiumUntil;
}

/** Compra o plano. Devolve até quando vai o Plus, 'pendente' (pagamento ainda não caiu) ou null se a pessoa desistiu. */
export async function buyPlan(plan: IapPlan, userId: string): Promise<string | null> {
  let tx;
  try {
    tx = await NativePurchases.purchaseProduct({
      productIdentifier: IAP_PRODUCTS[plan],
      productType: PURCHASE_TYPE.SUBS,
      quantity: 1,
      appAccountToken: userId,
      // Android: o plano básico cadastrado na Play Console (mensal / anual).
      ...(android() ? { planIdentifier: plan } : {}),
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase();
    if (msg.includes('cancel')) return null;
    throw new Error(android() ? 'O Google Play não concluiu a compra. Tente de novo em instantes.' : 'A App Store não concluiu a compra. Tente de novo em instantes.');
  }
  if (android()) {
    const token = (tx as { purchaseToken?: string }).purchaseToken;
    if (!token) throw new Error('A compra foi feita, mas não veio a confirmação do Google Play. Toque em "Restaurar compras".');
    return confirmGoogle(token, IAP_PRODUCTS[plan]);
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
  if (android()) {
    for (const t of purchases as { purchaseToken?: string; productIdentifier?: string }[]) {
      if (!t.purchaseToken) continue;
      const until = await confirmGoogle(t.purchaseToken, t.productIdentifier ?? '').catch(() => null);
      if (until && until !== 'pendente' && (!best || until > best)) best = until;
    }
    return best;
  }
  for (const t of purchases) {
    if (!t.jwsRepresentation) continue;
    const until = await confirm(t.jwsRepresentation).catch(() => null);
    if (until && (!best || until > best)) best = until;
  }
  return best;
}

/** Gerenciar ou cancelar a assinatura (tela da própria App Store). */
export const manageSubscription = () => NativePurchases.manageSubscriptions();

// Compra do Lumbi+ dentro do app Android da Google Play. O app Android é o site dentro de uma Trusted Web
// Activity; com o "Google Play Billing" ligado no pacote, o Chrome entrega a Digital Goods API (preços e
// compras já feitas) e o Payment Request API abre a folha de pagamento do Google Play. O purchase token
// vai para o nosso servidor, que confere no Google e libera o Plus.
import { http } from './social/api';
import { grantPremium } from './store';
import { IAP_IDS, IAP_PRODUCTS, type IapPlan } from '../shared/iap';

const PLAY = 'https://play.google.com/billing';

interface ItemDetails {
  itemId: string;
  price: { currency: string; value: string };
}
interface PurchaseDetails {
  itemId: string;
  purchaseToken: string;
}
interface DigitalGoodsService {
  getDetails(ids: string[]): Promise<ItemDetails[]>;
  listPurchases(): Promise<PurchaseDetails[]>;
}
type WithDG = Window & { getDigitalGoodsService?: (provider: string) => Promise<DigitalGoodsService> };

let service: Promise<DigitalGoodsService | null> | null = null;
/** O serviço de compras do Google Play, ou null fora do app Android. */
export function playService(): Promise<DigitalGoodsService | null> {
  if (service) return service;
  const w = window as WithDG;
  service = !w.getDigitalGoodsService || typeof PaymentRequest === 'undefined' ? Promise.resolve(null) : w.getDigitalGoodsService(PLAY).catch(() => null);
  return service;
}

/** Preços do jeito que a Google Play mostra (moeda e formato da pessoa). */
export async function loadPlayPrices(): Promise<Partial<Record<IapPlan, { price: string }>>> {
  const s = await playService();
  if (!s) return {};
  const items = await s.getDetails([...IAP_IDS]).catch(() => [] as ItemDetails[]);
  const fmt = (p: ItemDetails['price']) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency }).format(Number(p.value));
  const out: Partial<Record<IapPlan, { price: string }>> = {};
  for (const it of items) {
    if (it.itemId === IAP_PRODUCTS.mensal) out.mensal = { price: fmt(it.price) };
    if (it.itemId === IAP_PRODUCTS.anual) out.anual = { price: fmt(it.price) };
  }
  return out;
}

async function confirm(purchaseToken: string, productId: string): Promise<{ premiumUntil: string | null; pending: boolean }> {
  const r = await http<{ premiumUntil: string | null; pending?: boolean }>('POST', '/billing/google', { purchaseToken, productId });
  if (r.premiumUntil) grantPremium(r.premiumUntil);
  return { premiumUntil: r.premiumUntil, pending: !!r.pending };
}

/** Compra o plano. Devolve até quando vai o Plus, 'pendente' (pagamento ainda não caiu) ou null se a pessoa desistiu. */
export async function buyPlayPlan(plan: IapPlan): Promise<string | 'pendente' | null> {
  const productId = IAP_PRODUCTS[plan];
  const req = new PaymentRequest([{ supportedMethods: PLAY, data: { sku: productId } }], { total: { label: 'Lumbi+', amount: { currency: 'BRL', value: '0' } } });
  let res: PaymentResponse;
  try {
    res = await req.show();
  } catch (e) {
    const name = (e as DOMException)?.name;
    if (name === 'AbortError') return null;
    throw new Error('O Google Play não concluiu a compra. Tente de novo em instantes.');
  }
  const token = (res.details as { purchaseToken?: string; token?: string })?.purchaseToken ?? (res.details as { token?: string })?.token;
  if (!token) {
    await res.complete('fail').catch(() => {});
    throw new Error('A compra foi feita, mas não veio a confirmação do Google Play. Toque em "Restaurar compras".');
  }
  try {
    const r = await confirm(token, productId);
    await res.complete('success').catch(() => {});
    return r.pending ? 'pendente' : r.premiumUntil;
  } catch (e) {
    await res.complete('fail').catch(() => {});
    throw e;
  }
}

/** Restaurar compras: reenvia ao servidor as assinaturas desta conta Google. */
export async function restorePlayPlans(): Promise<string | null> {
  const s = await playService();
  if (!s) return null;
  const list = await s.listPurchases().catch(() => [] as PurchaseDetails[]);
  let best: string | null = null;
  for (const p of list) {
    if (!IAP_IDS.includes(p.itemId)) continue;
    const r = await confirm(p.purchaseToken, p.itemId).catch(() => null);
    if (r?.premiumUntil && (!best || r.premiumUntil > best)) best = r.premiumUntil;
  }
  return best;
}

/** Gerenciar ou cancelar a assinatura (página de assinaturas da própria Google Play). */
export const managePlaySubscription = (plan?: IapPlan) =>
  window.open(`https://play.google.com/store/account/subscriptions?package=com.hamicare.app${plan ? `&sku=${IAP_PRODUCTS[plan]}` : ''}`, '_blank');

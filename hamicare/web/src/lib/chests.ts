// Baús, Oficina e coleções: com conta, quem sorteia e confere é o servidor; sem conta, o aparelho.
import { http } from './social/api';
import { applyChestResult, applyCraftResult, chestOffer, getState, minor, openChestLocal, craftLocal, type ChestOutcome } from './store';
import { applyWallet, flushNow, gameSyncOn, type ServerWallet } from './gameSync';
import { gameCfg } from './game';
import { CHEST_ORDER, chestOdds, pityInfo, type ChestId, type Rarity } from '../shared/game';
import type { LedgerEntry } from '../shared/game';

export interface ChestView {
  id: ChestId;
  name: string;
  price: number;
  odds: Record<Rarity, number>;
  /** Baú revelado (menores de 18): o item que este baú vai dar. */
  offer: { itemId: string; rarity: Rarity } | null;
}
export interface ChestShop {
  chests: ChestView[];
  revealed: boolean;
  pity: { rareIn: number; legendaryIn: number; boosted: boolean };
}

/** Os baús de agora: preço, chances de verdade (com a proteção) e, para menores, o item revelado. */
export async function loadChestShop(): Promise<ChestShop> {
  if (gameSyncOn()) {
    try {
      await flushNow();
      const r = await http<ChestShop & { wallet: ServerWallet }>('GET', '/game/chests');
      applyWallet(r.wallet);
      return { chests: r.chests, revealed: r.revealed, pity: r.pity };
    } catch {
      /* sem conexão: mostra as chances do aparelho (abrir pede conexão) */
    }
  }
  return localShop();
}

export function localShop(): ChestShop {
  const s = getState();
  const cfg = gameCfg();
  const revealed = minor(s);
  return {
    revealed,
    pity: pityInfo(s.game.pity, cfg),
    chests: CHEST_ORDER.map((id) => ({ id, name: cfg.chests[id].name, price: cfg.chests[id].price, odds: chestOdds(id, s.game.pity, cfg), offer: revealed ? pick(chestOffer(id)) : null })),
  };
}
const pick = (o: { itemId: string; rarity: Rarity }) => ({ itemId: o.itemId, rarity: o.rarity });

export type OpenError = 'sem-sementes' | 'sem-bau' | 'rede';

export async function openChestNow(chest: ChestId, free = false): Promise<ChestOutcome | OpenError> {
  if (!gameSyncOn()) return openChestLocal(chest, free);
  try {
    await flushNow();
    const r = await http<{ result: ChestOutcome; wallet: ServerWallet }>('POST', '/game/chest/open', { chest, free });
    applyWallet(r.wallet);
    applyChestResult(r.result);
    return r.result;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'sem_sementes') return 'sem-sementes';
    if (code === 'sem_bau_gratis') return 'sem-bau';
    return 'rede';
  }
}

export type CraftError = 'invalido' | 'ja-tem' | 'sem-fragmentos' | 'rede';

export async function craftNow(itemId: string): Promise<'ok' | CraftError> {
  if (!gameSyncOn()) return craftLocal(itemId);
  try {
    await flushNow();
    const r = await http<{ wallet: ServerWallet }>('POST', '/game/craft', { itemId });
    applyWallet(r.wallet);
    applyCraftResult(itemId);
    return 'ok';
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'sem_fragmentos') return 'sem-fragmentos';
    if (code === 'ja_tem') return 'ja-tem';
    if (code === 'invalido') return 'invalido';
    return 'rede';
  }
}

/** Histórico da carteira: o do servidor com conta, o do aparelho sem conta. */
export async function loadLedger(): Promise<{ entries: LedgerEntry[]; fromServer: boolean }> {
  if (gameSyncOn()) {
    try {
      await flushNow();
      const r = await http<{ wallet: ServerWallet; ledger: LedgerEntry[] }>('GET', '/game/wallet');
      applyWallet(r.wallet);
      return { entries: r.ledger, fromServer: true };
    } catch {
      /* sem conexão: mostra o do aparelho */
    }
  }
  return { entries: getState().game.ledger, fromServer: false };
}

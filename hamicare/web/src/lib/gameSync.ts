// Com conta, cada ganho e gasto vai para o servidor, que confere e manda o saldo certo.
// Sem internet, os pedidos ficam guardados e saem quando a conexão voltar.
import { http } from './social/api';
import { applyServerWallet, getState, setGameHook, type GameOp } from './store';
import type { Pity } from '../shared/game';

interface ServerWallet {
  coins: number;
  xp: number;
  maxLevel: number;
  fragments: number;
  pity: Pity;
  pending: string[];
  imported: boolean;
}

const QKEY = 'hamicare:gameq';
let queue: GameOp[] = load();
let timer: number | undefined;
let running = false;
let active = false;

function load(): GameOp[] {
  try {
    return JSON.parse(localStorage.getItem(QKEY) ?? '[]');
  } catch {
    return [];
  }
}
function save() {
  try {
    localStorage.setItem(QKEY, JSON.stringify(queue.slice(-300)));
  } catch {
    /* sem armazenamento: segue só na memória */
  }
}

function apply(w: ServerWallet) {
  applyServerWallet({ coins: w.coins, xp: w.xp, fragments: w.fragments, pity: w.pity, maxLevel: w.maxLevel });
}

async function flush() {
  if (!active || running || !queue.length) return;
  running = true;
  const batch = queue.slice(0, 100);
  try {
    const r = await http<{ wallet: ServerWallet }>('POST', '/game/ops', { ops: batch });
    queue = queue.slice(batch.length);
    save();
    apply(r.wallet);
  } catch {
    // Sem conexão: tenta de novo daqui a pouco.
    window.clearTimeout(timer);
    timer = window.setTimeout(flush, 30_000);
  } finally {
    running = false;
  }
  if (queue.length) schedule();
}

function schedule() {
  window.clearTimeout(timer);
  timer = window.setTimeout(flush, 1200);
}

/** Liga a sincronização: traz o progresso do aparelho na primeira vez e passa a usar o saldo do servidor. */
export async function startGameSync() {
  active = true;
  setGameHook((op) => {
    queue.push(op);
    save();
    schedule();
  });
  try {
    let { wallet } = await http<{ wallet: ServerWallet }>('GET', '/game/wallet');
    if (!wallet.imported) {
      const s = getState();
      const items = Object.entries(s.inventory)
        .filter(([, n]) => n > 0)
        .map(([id]) => id);
      wallet = (await http<{ wallet: ServerWallet }>('POST', '/game/import', { coins: s.coins, xp: s.xp, items })).wallet;
    }
    if (queue.length) await flush();
    else apply(wallet);
  } catch {
    /* sem servidor agora: o app segue com o saldo do aparelho */
  }
}

export function stopGameSync() {
  active = false;
  setGameHook(null);
  window.clearTimeout(timer);
}

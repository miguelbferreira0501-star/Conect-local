// Economia do jogo no servidor: carteira, ganhos com limites, compras e baús.
// O servidor nunca confia no app para XP, sementes, itens, sorteios ou arenas:
// recalcula tudo com o motor do jogo (web/src/shared/game) e guarda no banco.
import { randomInt } from 'node:crypto';
import { Hono } from 'hono';
import type pg from 'pg';
import { z } from 'zod';
import { pool, withUser } from '../db';
import { AppError, invalid } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import {
  CHEST_ORDER, DEFAULT_GAME, FRIEND_LADDER, HAMMER_PRICE, addUsage, arenaItemsOf, canCraft, arenaOf, baseGrant, capGrant, chestOdds, chestPool, emptyPity, emptyUsage, isChest, levelOf, levelUps, openChest, pityInfo, rarityOf, xpAt,
  type ChestId, type DayUsage, type GameConfig, type Pity, type Rarity, type Source,
} from '../../../web/src/shared/game';
import { ITEMS, LOOKS, STYLES, itemById, stylePrice } from '../../../web/src/data/items';
import { FURS } from '../../../web/src/data/fur';
import { LIBRARY } from '../../../web/src/data/tasks';
import { PLACES } from '../../../web/src/data/world';
import { MOON_ITEMS, MOON_PRICE } from '../../../web/src/data/arenas';
import { ACHIEVEMENTS, QUESTS, periodStart } from '../../../web/src/logic/progress';

export const game = new Hono<AppEnv>();
game.use('*', requireAuth);

// ---------- Configuração (a última versão gravada pelo administrador, ou a padrão) ----------

let cached: { at: number; cfg: GameConfig } | null = null;
export async function gameConfig(): Promise<GameConfig> {
  if (cached && Date.now() - cached.at < 60_000) return cached.cfg;
  const row = (await pool.query('SELECT config FROM game_config ORDER BY version DESC LIMIT 1')).rows[0];
  const cfg = row ? ({ ...DEFAULT_GAME, ...row.config } as GameConfig) : DEFAULT_GAME;
  cached = { at: Date.now(), cfg };
  return cfg;
}
export const resetGameConfigCache = () => {
  cached = null;
};

const POOL = chestPool();
const rng = () => randomInt(0, 2 ** 32) / 2 ** 32;
const utcDay = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

// ---------- Configuração em uso (o app usa os mesmos números do servidor) ----------

game.get('/config', async (c) => c.json({ config: await gameConfig() }));

// ---------- Carteira ----------

interface WalletRow {
  coins: number;
  xp: number;
  max_level: number;
  fragments: number;
  pity: Pity;
  pending_chests: string[];
  imported_at: string | null;
}

async function lockWallet(db: pg.PoolClient, userId: string): Promise<WalletRow> {
  await db.query('INSERT INTO game_wallet (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
  return (await db.query('SELECT coins, xp, max_level, fragments, pity, pending_chests, imported_at FROM game_wallet WHERE user_id = $1 FOR UPDATE', [userId])).rows[0];
}

async function saveWallet(db: pg.PoolClient, userId: string, w: WalletRow) {
  await db.query(
    'UPDATE game_wallet SET coins = $2, xp = $3, max_level = $4, fragments = $5, pity = $6, pending_chests = $7, updated_at = now() WHERE user_id = $1',
    [userId, w.coins, w.xp, w.max_level, w.fragments, w.pity, w.pending_chests],
  );
}

function walletView(w: WalletRow, cfg: GameConfig) {
  const level = Math.max(levelOf(w.xp, cfg), w.max_level);
  return {
    coins: w.coins,
    xp: w.xp,
    level,
    maxLevel: w.max_level,
    arena: arenaOf(level, cfg).n,
    fragments: w.fragments,
    pity: w.pity,
    pending: w.pending_chests,
    imported: !!w.imported_at,
  };
}

async function ledgerInsert(db: pg.PoolClient, userId: string, e: { ref: string; label: string; coins: number; xp?: number; day?: string | null; routine?: boolean; bucket?: string | null }) {
  await db.query('INSERT INTO game_ledger (user_id, ref, label, coins, xp, day, routine, bucket) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
    userId, e.ref, e.label, e.coins, e.xp ?? 0, e.day ?? null, e.routine ?? false, e.bucket ?? null,
  ]);
}

game.get('/wallet', async (c) => {
  const userId = c.get('userId')!;
  const cfg = await gameConfig();
  return c.json(
    await withUser(userId, async (db) => {
      const w = await lockWallet(db, userId);
      const ledger = (await db.query('SELECT ref, label, coins, xp, active, (extract(epoch from created_at) * 1000)::bigint AS at FROM game_ledger WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 60', [userId])).rows;
      return { wallet: walletView(w, cfg), ledger };
    }),
  );
});

/**
 * Primeira vez com conta: traz o progresso que já estava no aparelho (uma vez só e com teto,
 * para ninguém inventar um saldo gigante).
 */
const IMPORT_MAX = { xp: 20_000, coins: 5_000, items: 500 };
game.post('/import', async (c) => {
  const userId = c.get('userId')!;
  const body = z.object({ coins: z.number().int().min(0), xp: z.number().int().min(0), items: z.array(z.string().max(80)).max(2000) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Dados inválidos.');
  const cfg = await gameConfig();
  return c.json(
    await withUser(userId, async (db) => {
      const w = await lockWallet(db, userId);
      if (w.imported_at) throw new AppError(409, 'ja_importado', 'O progresso deste aparelho já foi trazido para a conta.');
      const xp = Math.min(IMPORT_MAX.xp, body.data.xp);
      const coins = Math.min(IMPORT_MAX.coins, body.data.coins);
      const valid = [...new Set(body.data.items)].filter((id) => itemById(id) || (id.startsWith('fur:') && FURS.some((f) => `fur:${f.id}` === id))).slice(0, IMPORT_MAX.items);
      for (const id of valid) {
        await db.query("INSERT INTO game_inventory (user_id, item_id, qty, origin) VALUES ($1, $2, 1, 'aparelho') ON CONFLICT DO NOTHING", [userId, id]);
      }
      const next: WalletRow = { ...w, coins, xp, max_level: Math.max(w.max_level, levelOf(xp, cfg)) };
      await saveWallet(db, userId, next);
      await db.query('UPDATE game_wallet SET imported_at = now() WHERE user_id = $1', [userId]);
      await ledgerInsert(db, userId, { ref: 'importacao', label: 'Progresso trazido do aparelho', coins, xp });
      return { wallet: walletView({ ...next, imported_at: 'agora' }, cfg), items: valid.length };
    }),
  );
});

// ---------- Ganhos, devoluções e gastos ----------

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const cat = z.enum(['fitness', 'autocuidado', 'habitos', 'emocional']);
const sourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('tarefa'), id: z.string().min(1).max(60), energy: z.number().int().min(1).max(3), cat, date: day }),
  z.object({ kind: z.literal('cuidado'), care: z.enum(['carinho', 'brincar', 'escovar', 'banho', 'conversar', 'foto', 'comida', 'dormir']), date: day }),
  z.object({ kind: z.literal('diario'), date: day }),
  z.object({ kind: z.literal('pote'), date: day }),
  z.object({ kind: z.literal('humor'), date: day }),
  z.object({ kind: z.literal('bemestar'), tool: z.enum(['respirar', 'aterrar', 'meditar', 'relaxar', 'dormir', 'foco', 'sos']), date: day }),
  z.object({ kind: z.literal('desafio'), period: z.enum(['dia', 'semana', 'mes']), id: z.string().max(40), key: day }),
  z.object({ kind: z.literal('conquista'), id: z.string().max(40), coins: z.number().int() }),
  z.object({ kind: z.literal('aventura'), place: z.string().max(40), xp: z.number().int(), coins: z.number().int(), date: day, n: z.number().int().min(1).max(10) }),
  z.object({ kind: z.literal('presente'), coins: z.number().int(), date: day }),
  z.object({ kind: z.literal('temporada'), month: z.string().regex(/^\d{4}-\d{2}$/), xp: z.number().int(), coins: z.number().int() }),
  z.object({ kind: z.literal('evento'), id: z.string().max(60), coins: z.number().int() }),
  z.object({ kind: z.literal('colecao'), id: z.string().max(40) }),
  z.object({ kind: z.literal('turma'), id: z.string().uuid(), date: day }),
  z.object({ kind: z.literal('temporada-degrau'), month: z.string().regex(/^\d{4}-\d{2}$/), tier: z.number().int().min(0).max(50) }),
  z.object({ kind: z.literal('rapida'), id: z.enum(['emocao', 'reflexao', 'meta']), slot: z.number().int().min(0).max(2), coins: z.number().int(), date: day }),
  z.object({ kind: z.literal('amigo'), n: z.number().int().min(1).max(FRIEND_LADDER.length) }),
  z.object({ kind: z.literal('plus'), week: day }),
]);
const opSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('grant'), src: sourceSchema }),
  z.object({ op: z.literal('revoke'), ref: z.string().max(160) }),
  z.object({ op: z.literal('spend'), ref: z.string().max(160), label: z.string().max(120), coins: z.number().int(), itemId: z.string().max(80).optional() }),
]);

const nearToday = (d: string) => [utcDay(-1), utcDay(0), utcDay(1)].includes(d);

/** Confere e corrige a fonte do ganho com os dados do servidor. Devolve null se não vale. */
async function trusted(db: pg.PoolClient, userId: string, src: Source, cfg: GameConfig): Promise<Source | null> {
  if ('date' in src && !nearToday(src.date)) return null;
  switch (src.kind) {
    case 'tarefa': {
      const lib = LIBRARY.find((t) => t.id === src.id);
      return lib ? { ...src, energy: lib.energy, cat: lib.cat } : src;
    }
    case 'desafio': {
      const q = QUESTS.find((x) => x.id === src.id && x.period === src.period);
      if (!q) return null;
      const keys = [periodStart(src.period, utcDay(-1)), periodStart(src.period, utcDay(0)), periodStart(src.period, utcDay(1))];
      return keys.includes(src.key) ? src : null;
    }
    case 'conquista': {
      const a = ACHIEVEMENTS.find((x) => x.id === src.id);
      return a ? { ...src, coins: a.coins } : null;
    }
    case 'aventura':
      return PLACES.some((p) => p.id === src.place) ? src : null;
    case 'presente':
      return { ...src, coins: Math.min(8, Math.max(0, src.coins)) };
    case 'temporada':
      return src.month === utcDay(0).slice(0, 7) || src.month === utcDay(-1).slice(0, 7) ? { ...src, xp: 30, coins: 120 } : null;
    case 'evento': {
      const ev = (await db.query('SELECT e.reward_coins FROM event_claims x JOIN events e ON e.id = x.event_id WHERE x.user_id = $1 AND x.event_id::text = $2', [userId, src.id])).rows[0];
      return ev ? { ...src, coins: ev.reward_coins } : null;
    }
    case 'turma': {
      // Só paga se a pessoa está na turma e todos fizeram todas as missões naquele dia.
      const ok = (await db.query('SELECT app.in_team($1) AND app.team_day_complete($1, $2::date) AS ok', [src.id, src.date])).rows[0]?.ok;
      return ok ? src : null;
    }
    case 'temporada-degrau': {
      // Mês de agora (ou o anterior, na virada) e dias ativos contados pelo servidor.
      if (src.month !== utcDay(0).slice(0, 7) && src.month !== utcDay(-1).slice(0, 7)) return null;
      const t = cfg.season.tiers[src.tier];
      if (!t) return null;
      return (await activeDays(db, userId, src.month)) >= t.days ? src : null;
    }
    case 'colecao': {
      // Só paga a coleção se todas as peças estiverem no inventário do servidor.
      const col = cfg.collections.find((x) => x.id === src.id);
      if (!col) return null;
      const owned = await ownedSet(db, userId);
      return col.items.every((id) => owned.has(id)) ? src : null;
    }
    case 'rapida':
      // O texto da reflexão fica no aparelho: o servidor só limita o valor (até 12 na reflexão, 4 nas outras).
      return { ...src, coins: src.id === 'reflexao' ? Math.min(12, Math.max(4, src.coins)) : 4 };
    case 'amigo': {
      // Só paga o n-ésimo amigo quando a pessoa já tem n amizades aceitas.
      const n = (await db.query('SELECT app.friend_count($1) AS n', [userId])).rows[0]?.n ?? 0;
      return n >= src.n ? src : null;
    }
    case 'plus': {
      // Mesada do HamiCare+: só com Plus ativo, uma vez por semana (a semana de agora, com folga na virada).
      const weeks = [periodStart('semana', utcDay(-1)), periodStart('semana', utcDay(0)), periodStart('semana', utcDay(1))];
      if (!weeks.includes(src.week)) return null;
      return (await isPremium(db, userId)) ? src : null;
    }
    case 'nivel':
    case 'arena':
      return null; // só o servidor paga nível e arena
    default:
      return src;
  }
}

/** Dias do mês com pelo menos uma missão paga (e não desmarcada). */
async function activeDays(db: pg.PoolClient, userId: string, month: string): Promise<number> {
  const r = await db.query("SELECT count(DISTINCT day)::int AS n FROM game_ledger WHERE user_id = $1 AND active AND ref LIKE 'tarefa:%' AND to_char(day, 'YYYY-MM') = $2", [userId, month]);
  return r.rows[0]?.n ?? 0;
}

async function dayUsage(db: pg.PoolClient, userId: string, d: string): Promise<DayUsage> {
  const rows = (await db.query("SELECT ref, xp, coins, routine, bucket FROM game_ledger WHERE user_id = $1 AND day = $2 AND active", [userId, d])).rows;
  let u = emptyUsage();
  for (const r of rows) {
    u = addUsage(u, { ref: r.ref, label: '', xp: r.xp, coins: r.coins, routine: r.routine, bucket: r.bucket ?? undefined }, { xp: r.xp, coins: r.coins });
  }
  return u;
}

/** Paga nível e arena novos (só os nunca alcançados). */
async function payLevels(db: pg.PoolClient, userId: string, w: WalletRow, before: number, cfg: GameConfig): Promise<WalletRow> {
  const ups = levelUps(before, w.xp, cfg);
  let next = { ...w };
  for (const level of ups.levels) {
    if (level <= next.max_level) continue;
    const lg = baseGrant({ kind: 'nivel', level }, cfg);
    const ins = await db.query('INSERT INTO game_ledger (user_id, ref, label, coins) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [userId, lg.ref, lg.label, lg.coins]);
    if (ins.rowCount) next.coins += lg.coins;
    const arena = cfg.arenas.find((a) => a.level === level);
    if (arena) {
      const ag = baseGrant({ kind: 'arena', arena: arena.n }, cfg);
      const ai = await db.query('INSERT INTO game_ledger (user_id, ref, label, coins) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [userId, ag.ref, ag.label, ag.coins]);
      if (ai.rowCount) {
        next.coins += ag.coins;
        if (arena.reward.chest) next.pending_chests = [...next.pending_chests, arena.reward.chest];
        // Itens exclusivos da arena vão para o inventário.
        for (const id of arenaItemsOf(arena.n, arena.reward.items)) {
          await db.query("INSERT INTO game_inventory (user_id, item_id, qty, origin) VALUES ($1, $2, 1, 'arena') ON CONFLICT DO NOTHING", [userId, id]);
        }
      }
    }
    next.max_level = level;
  }
  return next;
}

async function applyGrant(db: pg.PoolClient, userId: string, w: WalletRow, raw: Source, cfg: GameConfig): Promise<{ w: WalletRow; ok: boolean; error?: string }> {
  const src = await trusted(db, userId, raw, cfg);
  if (!src) return { w, ok: false, error: 'invalido' };
  const g = baseGrant(src, cfg);
  const old = (await db.query('SELECT active FROM game_ledger WHERE user_id = $1 AND ref = $2', [userId, g.ref])).rows[0];
  if (old?.active) return { w, ok: true }; // já pago: não paga de novo
  const d = g.date ?? null;
  const paid = capGrant(g, d ? await dayUsage(db, userId, d) : emptyUsage(), cfg);
  if (old) {
    await db.query('UPDATE game_ledger SET active = true, xp = $3, coins = $4, created_at = now() WHERE user_id = $1 AND ref = $2', [userId, g.ref, paid.xp, paid.coins]);
  } else {
    const ins = await db.query(
      'INSERT INTO game_ledger (user_id, ref, label, coins, xp, day, routine, bucket) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
      [userId, g.ref, g.label, paid.coins, paid.xp, d, g.routine, g.bucket ?? null],
    );
    if (!ins.rowCount) return { w, ok: true };
  }
  const before = w.xp;
  let next = { ...w, coins: w.coins + paid.coins, xp: w.xp + paid.xp };
  // Degrau da temporada também pode dar fragmentos e um baú grátis.
  if (src.kind === 'temporada-degrau') {
    const t = cfg.season.tiers[src.tier];
    next = { ...next, fragments: next.fragments + (t.fragments ?? 0), pending_chests: t.chest ? [...next.pending_chests, t.chest] : next.pending_chests };
  }
  return { w: await payLevels(db, userId, next, before, cfg), ok: true };
}

/** Temporada do mês: dias ativos contados pelo servidor e degraus já pegos. */
game.get('/season', async (c) => {
  const userId = c.get('userId')!;
  const cfg = await gameConfig();
  const month = utcDay(0).slice(0, 7);
  return c.json(
    await withUser(userId, async (db) => {
      const days = await activeDays(db, userId, month);
      const claimed = (await db.query("SELECT ref FROM game_ledger WHERE user_id = $1 AND ref LIKE $2", [userId, `temporada:${month}:d%`])).rows.map((r) => Number(r.ref.split(':d')[1]));
      return { month, days, claimed, tiers: cfg.season.tiers };
    }),
  );
});

const REVOCABLE = /^(tarefa|cuidado|diario|pote|humor|bemestar):\d{4}-\d{2}-\d{2}/;

async function applyRevoke(db: pg.PoolClient, userId: string, w: WalletRow, ref: string, cfg: GameConfig) {
  if (!REVOCABLE.test(ref)) return { w, ok: false, error: 'invalido' };
  const row = (await db.query('UPDATE game_ledger SET active = false WHERE user_id = $1 AND ref = $2 AND active RETURNING coins, xp', [userId, ref])).rows[0];
  if (!row) return { w, ok: true };
  return { w: { ...w, coins: Math.max(0, w.coins - row.coins), xp: Math.max(xpAt(w.max_level, cfg), w.xp - row.xp) }, ok: true };
}

async function ownedSet(db: pg.PoolClient, userId: string): Promise<Set<string>> {
  return new Set((await db.query('SELECT item_id FROM game_inventory WHERE user_id = $1 AND qty > 0', [userId])).rows.map((r) => r.item_id));
}

async function addItem(db: pg.PoolClient, userId: string, itemId: string, origin: string) {
  await db.query(
    'INSERT INTO game_inventory (user_id, item_id, qty, origin) VALUES ($1, $2, 1, $3) ON CONFLICT (user_id, item_id) DO UPDATE SET qty = game_inventory.qty + 1',
    [userId, itemId, origin],
  );
}

/** Compras: o preço vem sempre do catálogo do servidor. */
async function applySpend(db: pg.PoolClient, userId: string, w: WalletRow, op: { ref: string; label: string; itemId?: string }, cfg: GameConfig, premium: boolean) {
  const [kind, id] = op.ref.split(':');
  const owned = await ownedSet(db, userId);
  const level = Math.max(levelOf(w.xp, cfg), w.max_level);
  let price = 0;
  const give: string[] = [];
  if (kind === 'loja' || kind === 'presente-amigo') {
    const item = itemById(id);
    if (!item || item.souvenir || item.chestOnly) return { w, ok: false, error: 'invalido' };
    if (kind === 'loja') {
      if (item.plus && !premium) return { w, ok: false, error: 'plus' };
      if ((item.level ?? 1) > level) return { w, ok: false, error: 'nivel' };
      if (item.kind !== 'comida' && owned.has(item.id)) return { w, ok: false, error: 'ja-tem' };
      give.push(item.id);
    }
    price = item.price;
  } else if (kind === 'look') {
    const look = LOOKS.find((l) => l.id === id);
    if (!look) return { w, ok: false, error: 'invalido' };
    const items = look.items.map((x) => itemById(x)!).filter(Boolean);
    if (items.some((i) => i.plus) && !premium) return { w, ok: false, error: 'plus' };
    const missing = items.filter((i) => !owned.has(i.id));
    price = Math.round(missing.reduce((n, i) => n + i.price, 0) * 0.8);
    give.push(...missing.map((i) => i.id));
  } else if (kind === 'estilo') {
    const style = STYLES.find((st) => st.id === id);
    if (!style) return { w, ok: false, error: 'invalido' };
    if (style.plus && !premium) return { w, ok: false, error: 'plus' };
    price = stylePrice(style, (x) => owned.has(x));
    give.push(...[style.wallpaper, style.floor, ...style.items.map((i) => i.itemId)].filter((x) => !owned.has(x)));
  } else if (kind === 'lua') {
    // Casa na Lua: preço fixo e os itens da casa lunar.
    if (MOON_ITEMS.every((x) => owned.has(x))) return { w, ok: false, error: 'ja-tem' };
    price = MOON_PRICE;
    give.push(...MOON_ITEMS.filter((x) => !owned.has(x)));
  } else if (kind === 'martelinho') {
    // Martelinho que conserta a ofensiva: preço fixo do catálogo do jogo.
    price = HAMMER_PRICE;
  } else if (kind === 'pelagem') {
    const fur = FURS.find((f) => f.id === id);
    if (!fur || !fur.price) return { w, ok: false, error: 'invalido' };
    if (owned.has(`fur:${id}`)) return { w, ok: false, error: 'ja-tem' };
    price = fur.price;
    give.push(`fur:${id}`);
  } else {
    return { w, ok: false, error: 'invalido' };
  }
  if (w.coins < price) return { w, ok: false, error: 'sem-sementes' };
  const ins = await db.query('INSERT INTO game_ledger (user_id, ref, label, coins) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [userId, op.ref, op.label.slice(0, 120), -price]);
  if (!ins.rowCount) return { w, ok: true }; // a mesma compra não cobra duas vezes
  for (const x of [...new Set(give)]) await addItem(db, userId, x, kind === 'loja' ? 'loja' : kind);
  return { w: { ...w, coins: w.coins - price }, ok: true };
}

async function isPremium(db: pg.PoolClient, userId: string) {
  return !!(await db.query('SELECT 1 FROM users WHERE id = $1 AND premium_until >= current_date', [userId])).rowCount;
}

game.post('/ops', async (c) => {
  const userId = c.get('userId')!;
  const body = z.object({ ops: z.array(z.unknown()).max(100) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Dados inválidos.');
  const cfg = await gameConfig();
  return c.json(
    await withUser(userId, async (db) => {
      let w = await lockWallet(db, userId);
      const premium = await isPremium(db, userId);
      const results: { ok: boolean; error?: string }[] = [];
      for (const raw of body.data.ops) {
        const parsed = opSchema.safeParse(raw);
        if (!parsed.success) {
          results.push({ ok: false, error: 'invalido' });
          continue;
        }
        const op = parsed.data;
        const r =
          op.op === 'grant' ? await applyGrant(db, userId, w, op.src as Source, cfg) : op.op === 'revoke' ? await applyRevoke(db, userId, w, op.ref, cfg) : await applySpend(db, userId, w, op, cfg, premium);
        w = r.w;
        results.push({ ok: r.ok, ...(r.error ? { error: r.error } : {}) });
      }
      await saveWallet(db, userId, w);
      return { wallet: walletView(w, cfg), results };
    }),
  );
});

// ---------- Baús ----------

async function isMinorUser(db: pg.PoolClient, userId: string) {
  return (await db.query('SELECT age_group FROM users WHERE id = $1', [userId])).rows[0]?.age_group !== '18mais';
}

/** Baú revelado (menores): o item já sorteado aparece antes da compra. */
async function offerFor(db: pg.PoolClient, userId: string, chest: ChestId, w: WalletRow, cfg: GameConfig) {
  const have = (await db.query('SELECT item_id, rarity, pity FROM game_chest_offers WHERE user_id = $1 AND chest = $2', [userId, chest])).rows[0];
  if (have) return have as { item_id: string; rarity: string; pity: Pity };
  const r = openChest({ chest, pity: w.pity, owned: await ownedSet(db, userId), pool: POOL, rng, cfg });
  await db.query('INSERT INTO game_chest_offers (user_id, chest, item_id, rarity, pity) VALUES ($1, $2, $3, $4, $5)', [userId, chest, r.itemId, r.rarity, r.pity]);
  return { item_id: r.itemId, rarity: r.rarity, pity: r.pity };
}

game.get('/chests', async (c) => {
  const userId = c.get('userId')!;
  const cfg = await gameConfig();
  return c.json(
    await withUser(userId, async (db) => {
      const w = await lockWallet(db, userId);
      const minor = await isMinorUser(db, userId);
      const chests = [];
      for (const id of CHEST_ORDER) {
        const offer = minor ? await offerFor(db, userId, id, w, cfg) : null;
        chests.push({ id, name: cfg.chests[id].name, price: cfg.chests[id].price, odds: chestOdds(id, w.pity, cfg), offer: offer ? { itemId: offer.item_id, rarity: offer.rarity } : null });
      }
      return { chests, revealed: minor, pity: pityInfo(w.pity, cfg), wallet: walletView(w, cfg) };
    }),
  );
});

game.post('/chest/open', async (c) => {
  const userId = c.get('userId')!;
  const body = z.object({ chest: z.string(), free: z.boolean().optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success || !isChest(body.data.chest)) throw invalid('Baú inválido.');
  const chest = body.data.chest;
  const cfg = await gameConfig();
  return c.json(
    await withUser(userId, async (db) => {
      const w = await lockWallet(db, userId);
      const price = cfg.chests[chest].price;
      let pending = w.pending_chests;
      if (body.data.free) {
        const i = pending.indexOf(chest);
        if (i < 0) throw new AppError(409, 'sem_bau_gratis', 'Não há baú grátis desse tipo para abrir.');
        pending = [...pending.slice(0, i), ...pending.slice(i + 1)];
      } else if (w.coins < price) {
        throw new AppError(409, 'sem_sementes', 'Sementes insuficientes para este baú.');
      }
      const minor = await isMinorUser(db, userId);
      const owned = await ownedSet(db, userId);
      let result: { rarity: string; itemId: string; pity: Pity };
      if (minor) {
        const offer = await offerFor(db, userId, chest, w, cfg);
        await db.query('DELETE FROM game_chest_offers WHERE user_id = $1 AND chest = $2', [userId, chest]);
        result = { rarity: offer.rarity, itemId: offer.item_id, pity: offer.pity };
      } else {
        const r = openChest({ chest, pity: w.pity, owned, pool: POOL, rng, cfg });
        result = { rarity: r.rarity, itemId: r.itemId, pity: r.pity };
      }
      const duplicate = owned.has(result.itemId);
      const item = itemById(result.itemId)!;
      const fragments = duplicate ? cfg.rarities[(cfg.rarities[result.rarity as Rarity] ? result.rarity : rarityOf(item)) as Rarity].fragments : 0;
      if (!duplicate) await addItem(db, userId, result.itemId, 'bau');
      const open = (
        await db.query('INSERT INTO game_chest_opens (user_id, chest, rarity, item_id, duplicate, fragments, revealed, free) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', [
          userId, chest, result.rarity, result.itemId, duplicate, fragments, minor, !!body.data.free,
        ])
      ).rows[0];
      if (!body.data.free) await ledgerInsert(db, userId, { ref: `bau:${open.id}`, label: cfg.chests[chest].name, coins: -price });
      const next: WalletRow = { ...w, coins: body.data.free ? w.coins : w.coins - price, fragments: w.fragments + fragments, pity: result.pity, pending_chests: pending };
      await saveWallet(db, userId, next);
      return {
        result: { chest, rarity: result.rarity, itemId: result.itemId, duplicate, fragments, revealed: minor },
        wallet: walletView(next, cfg),
      };
    }),
  );
});

// ---------- Oficina ----------

/** Troca fragmentos por um item que sai de baú e que a pessoa ainda não tem. */
game.post('/craft', async (c) => {
  const userId = c.get('userId')!;
  const body = z.object({ itemId: z.string().max(80) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw invalid('Item inválido.');
  const cfg = await gameConfig();
  return c.json(
    await withUser(userId, async (db) => {
      const w = await lockWallet(db, userId);
      const check = canCraft(body.data.itemId, { pool: POOL, owned: await ownedSet(db, userId), fragments: w.fragments, cfg });
      if (!check.ok) {
        const code = check.error === 'sem-fragmentos' ? 'sem_fragmentos' : check.error === 'ja-tem' ? 'ja_tem' : 'invalido';
        throw new AppError(409, code, check.error === 'sem-fragmentos' ? 'Fragmentos insuficientes.' : check.error === 'ja-tem' ? 'Você já tem este item.' : 'Este item não sai na Oficina.');
      }
      await addItem(db, userId, body.data.itemId, 'oficina');
      const next: WalletRow = { ...w, fragments: w.fragments - check.cost };
      await saveWallet(db, userId, next);
      return { itemId: body.data.itemId, cost: check.cost, wallet: walletView(next, cfg) };
    }),
  );
});

/** Itens que a conta tem no servidor (para o inventário do app). */
game.get('/inventory', async (c) => {
  const userId = c.get('userId')!;
  return c.json(
    await withUser(userId, async (db) => ({
      items: (await db.query('SELECT item_id AS "itemId", qty, origin, (extract(epoch from acquired_at) * 1000)::bigint AS at FROM game_inventory WHERE user_id = $1 ORDER BY acquired_at DESC', [userId])).rows,
    })),
  );
});

export const ITEM_IDS = new Set(ITEMS.map((i) => i.id));
export { emptyPity };

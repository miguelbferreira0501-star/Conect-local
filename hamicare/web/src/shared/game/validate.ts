// Confere uma configuração do jogo antes de salvar (painel de administração e servidor).
// Devolve a lista de problemas em português; lista vazia = pode salvar.
import { CHEST_ORDER, RARITY_ORDER, type GameConfig } from './config';
import type { PoolItem } from './chests';

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const between = (x: unknown, min: number, max: number) => num(x) && x >= min && x <= max;

export function validateGameConfig(cfg: GameConfig, pool: PoolItem[], itemExists: (id: string) => boolean): string[] {
  const e: string[] = [];
  const add = (cond: boolean, msg: string) => !cond && e.push(msg);

  // Níveis e XP
  add(Array.isArray(cfg.levels?.first) && cfg.levels.first.length >= 1 && cfg.levels.first.length <= 60, 'Níveis: informe de 1 a 60 valores de XP.');
  cfg.levels?.first?.forEach((x, i) => add(between(x, 10, 100000), `Níveis: o XP do nível ${i + 1} para o ${i + 2} precisa ficar entre 10 e 100.000.`));
  add(between(cfg.levels?.growth, 1, 2), 'Níveis: o crescimento depois da lista precisa ficar entre 1 e 2.');
  add(between(cfg.levelUp?.base, 0, 1000) && between(cfg.levelUp?.perLevel, 0, 200), 'Prêmio de nível: base de 0 a 1.000 e por nível de 0 a 200.');
  for (const k of ['xp', 'coins'] as const) {
    const v = cfg.task?.[k];
    add(Array.isArray(v) && v.length === 3 && v.every((x) => between(x, 0, 200)), `Missões: ${k === 'xp' ? 'XP' : 'sementes'} leve, normal e puxada (3 números de 0 a 200).`);
  }
  add(between(cfg.caps?.day?.xp, 10, 2000) && between(cfg.caps?.day?.coins, 5, 2000), 'Limite do dia: XP de 10 a 2.000 e sementes de 5 a 2.000.');
  add(between(cfg.caps?.tasks, 1, 50), 'Limite do dia: de 1 a 50 missões contando.');
  for (const [cat, v] of Object.entries(cfg.caps?.category ?? {})) add(between(v, 5, 2000), `Limite da categoria ${cat}: de 5 a 2.000 XP.`);
  add(between(cfg.achievementXp, 0, 1000), 'Conquistas: XP de 0 a 1.000.');

  // Arenas
  const arenas = cfg.arenas ?? [];
  add(arenas.length >= 1 && arenas.length <= 40, 'Arenas: de 1 a 40.');
  add(arenas[0]?.level === 1 && arenas[0]?.n === 1, 'Arenas: a primeira é a número 1 e abre no nível 1.');
  arenas.forEach((a, i) => {
    add(a.n === i + 1, `Arena ${i + 1}: os números precisam seguir 1, 2, 3…`);
    add(typeof a.name === 'string' && a.name.trim().length >= 2 && a.name.length <= 40, `Arena ${a.n}: nome de 2 a 40 letras.`);
    add(typeof a.id === 'string' && /^[a-z0-9-]{2,30}$/.test(a.id), `Arena ${a.n}: código inválido.`);
    if (i > 0) add(num(a.level) && a.level > arenas[i - 1].level, `Arena ${a.n}: precisa abrir num nível maior que a anterior.`);
    add(between(a.reward?.coins, 0, 5000), `Arena ${a.n}: prêmio de 0 a 5.000 sementes.`);
    add(!a.reward?.chest || CHEST_ORDER.includes(a.reward.chest), `Arena ${a.n}: baú inválido.`);
    for (const id of a.reward?.items ?? []) add(itemExists(id), `Arena ${a.n}: o item "${id}" não existe.`);
  });
  add(new Set(arenas.map((a) => a.id)).size === arenas.length, 'Arenas: códigos repetidos.');

  // Baús
  for (const c of CHEST_ORDER) {
    const ch = cfg.chests?.[c];
    if (!ch) {
      e.push(`Baú ${c}: faltando.`);
      continue;
    }
    add(between(ch.price, 1, 100000), `${ch.name}: preço de 1 a 100.000 sementes.`);
    add(RARITY_ORDER.every((r) => between(ch.odds?.[r], 0, 100)), `${ch.name}: cada chance de 0 a 100.`);
    const sum = RARITY_ORDER.reduce((n, r) => n + (num(ch.odds?.[r]) ? ch.odds[r] : 0), 0);
    add(Math.abs(sum - 100) < 0.01, `${ch.name}: as chances somam ${Math.round(sum * 10) / 10}%, precisam somar 100%.`);
    // Raridade com chance precisa ter itens no baú.
    for (const r of RARITY_ORDER) if (ch.odds?.[r] > 0) add(pool.some((p) => p.rarity === r), `${ch.name}: tem chance de ${r}, mas nenhum item dessa raridade sai em baú.`);
  }

  // Raridades
  for (const r of RARITY_ORDER) {
    const x = cfg.rarities?.[r];
    add(!!x && between(x.fragments, 1, 10000) && between(x.craft, 1, 100000), `Raridade ${r}: fragmentos de 1 a 10.000 e Oficina de 1 a 100.000.`);
    if (x) add(x.craft > x.fragments, `Raridade ${r}: fabricar precisa custar mais do que um repetido rende.`);
  }

  // Proteção contra azar
  const p = cfg.pity;
  add(between(p?.rareAfter, 2, 100), 'Proteção: raro garantido entre 2 e 100 baús.');
  add(between(p?.softFrom, 0, 100) && num(p?.rareAfter) && p.softFrom < p.rareAfter, 'Proteção: a chance começa a subir antes da garantia.');
  add(between(p?.softStep, 0, 50), 'Proteção: aumento por baú de 0 a 50 pontos.');
  add(between(p?.legendaryAfter, 2, 1000) && num(p?.rareAfter) && p.legendaryAfter >= p.rareAfter, 'Proteção: lendário garantido depois (ou junto) da garantia de raro.');

  // Coleções
  const cols = cfg.collections ?? [];
  add(new Set(cols.map((c) => c.id)).size === cols.length, 'Coleções: códigos repetidos.');
  const inPool = new Set(pool.map((x) => x.id));
  for (const c of cols) {
    add(typeof c.name === 'string' && c.name.trim().length >= 2 && c.name.length <= 40, `Coleção ${c.id}: nome de 2 a 40 letras.`);
    add(Array.isArray(c.items) && c.items.length >= 2 && c.items.length <= 20, `Coleção ${c.name}: de 2 a 20 peças.`);
    for (const id of c.items ?? []) add(inPool.has(id), `Coleção ${c.name}: "${id}" não existe ou não sai em baú.`);
    add(between(c.reward?.coins, 0, 5000) && between(c.reward?.xp, 0, 1000), `Coleção ${c.name}: prêmio de 0 a 5.000 sementes e 0 a 1.000 XP.`);
  }

  // Temporada
  const tiers = cfg.season?.tiers ?? [];
  add(tiers.length >= 1 && tiers.length <= 20, 'Temporada: de 1 a 20 degraus.');
  tiers.forEach((t, i) => {
    add(between(t.days, 1, 28), `Temporada, degrau ${i + 1}: de 1 a 28 dias ativos (todo mês tem pelo menos 28).`);
    if (i > 0) add(num(t.days) && t.days > tiers[i - 1].days, `Temporada, degrau ${i + 1}: precisa de mais dias que o anterior.`);
    add((t.coins == null || between(t.coins, 0, 2000)) && (t.xp == null || between(t.xp, 0, 1000)) && (t.fragments == null || between(t.fragments, 0, 2000)), `Temporada, degrau ${i + 1}: prêmio fora do limite.`);
    add(!t.chest || CHEST_ORDER.includes(t.chest), `Temporada, degrau ${i + 1}: baú inválido.`);
    add(!!(t.coins || t.xp || t.fragments || t.chest), `Temporada, degrau ${i + 1}: precisa dar algum prêmio.`);
  });

  return e;
}

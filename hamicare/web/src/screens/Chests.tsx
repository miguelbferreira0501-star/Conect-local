// Baús: a vitrine com as chances de verdade, a proteção contra azar, os baús grátis das arenas
// e a abertura animada (cada raridade com seu brilho). Menores de 18 veem o item antes de comprar.
import { useEffect, useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { Chest } from '../components/Chest';
import { ItemIcon } from '../components/ItemIcon';
import { Glyph } from '../components/art';
import { Seed } from '../components/ui';
import { itemById } from '../data/items';
import { gameCfg } from '../lib/game';
import { loadChestShop, openChestNow, type ChestShop, type ChestView, type OpenError } from '../lib/chests';
import { useApp, type ChestOutcome } from '../lib/store';
import { prefersReducedMotion } from '../lib/util';
import { RARITY_ORDER, type ChestId, type Rarity } from '../shared/game';

export const rarityLabel = (r: Rarity) => gameCfg().rarities[r].label;
export const rarityColor = (r: Rarity) => gameCfg().rarities[r].color;

export function RarityChip({ r }: { r: Rarity }) {
  return (
    <span className="rarity-chip" style={{ ['--rc' as string]: rarityColor(r) }}>
      {rarityLabel(r)}
    </span>
  );
}

/** Fragmentos: o que sobra dos itens repetidos (servem na Oficina). */
export function Fragments({ n }: { n: number }) {
  return (
    <span className="chip chip-plain tabular-nums" aria-label={`${n} fragmentos`}>
      <Glyph e="💎" size={16} /> {n}
    </span>
  );
}

function OddsBar({ odds }: { odds: Record<Rarity, number> }) {
  return (
    <div className="odds-bar" aria-hidden="true">
      {RARITY_ORDER.filter((r) => odds[r] > 0).map((r) => (
        <span key={r} style={{ width: `${odds[r]}%`, background: rarityColor(r) }} />
      ))}
    </div>
  );
}

export function ChestShopView() {
  const s = useApp();
  const [shop, setShop] = useState<ChestShop | null>(null);
  const [opening, setOpening] = useState<{ chest: ChestId; free: boolean } | null>(null);
  const [oddsOpen, setOddsOpen] = useState<ChestId | null>(null);
  const cfg = gameCfg();
  const pity = s.game.pity;

  useEffect(() => {
    let live = true;
    loadChestShop().then((x) => live && setShop(x));
    return () => {
      live = false;
    };
  }, [pity.semRaro, pity.semLendario, s.game.pendingChests.length, s.profile.ageGroup]);

  const pending = s.game.pendingChests;
  const counts = pending.reduce<Partial<Record<ChestId, number>>>((a, c) => ((a[c] = (a[c] ?? 0) + 1), a), {});

  return (
    <div className="grid gap-4">
      <section className="chest-hero" aria-label="Baús">
        <div className="flex items-center gap-3">
          <Chest kind="ouro" size={74} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[22px] font-bold leading-tight">Baús do Hami</h2>
            <p className="text-[14px] font-semibold leading-snug opacity-90">Abra com as sementes que você ganha se cuidando. Cada baú traz um item para vestir ou decorar.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-gold tabular-nums">
            <Seed /> {s.coins}
          </span>
          <Fragments n={s.game.fragments} />
          {shop && !shop.revealed && (
            <span className="chip chip-plain">
              <ShieldCheck size={15} /> Raro garantido em até {shop.pity.rareIn}
            </span>
          )}
        </div>
      </section>

      {pending.length > 0 && (
        <section className="card grid gap-2 p-4 free-chests" aria-label="Baús grátis">
          <h3 className="font-display text-[18px] font-bold">Presentes das arenas</h3>
          {(Object.keys(counts) as ChestId[]).map((c) => (
            <div key={c} className="flex items-center gap-3">
              <Chest kind={c} size={48} />
              <span className="min-w-0 flex-1 font-bold">
                {cfg.chests[c].name}
                {counts[c]! > 1 && <span className="text-muted"> ×{counts[c]}</span>}
              </span>
              <button className="btn btn-primary btn-sm shrink-0" onClick={() => setOpening({ chest: c, free: true })}>
                Abrir grátis
              </button>
            </div>
          ))}
        </section>
      )}

      {shop?.revealed && (
        <p className="rounded-2xl bg-surface2 p-3 text-[14px] font-semibold">
          <Glyph e="🔍" size={18} className="gi" /> Aqui você já vê o item de cada baú antes de comprar. Nada é sorteado na hora da compra.
        </p>
      )}

      <ul className="grid gap-3">
        {(shop?.chests ?? []).map((c) => (
          <ChestCard key={c.id} c={c} coins={s.coins} oddsOpen={oddsOpen === c.id} onOdds={() => setOddsOpen(oddsOpen === c.id ? null : c.id)} onOpen={() => setOpening({ chest: c.id, free: false })} />
        ))}
      </ul>
      {!shop && <p className="text-center text-muted">Carregando os baús…</p>}

      <p className="text-[13px] leading-snug text-muted">
        Baús abrem só com sementes ganhas no app, nunca com dinheiro. Os itens são enfeites: não mudam missões, saúde nem a sua evolução. As chances mostradas já contam a proteção contra azar: depois de alguns baús sem item raro, a chance de raro sobe, e o {cfg.pity.rareAfter}º seguido garante raro ou melhor. Item repetido vira fragmentos para a Oficina.
      </p>

      {opening && <ChestOpening chest={opening.chest} free={opening.free} onClose={() => setOpening(null)} />}
    </div>
  );
}

function ChestCard({ c, coins, oddsOpen, onOdds, onOpen }: { c: ChestView; coins: number; oddsOpen: boolean; onOdds: () => void; onOpen: () => void }) {
  const short = c.price - coins;
  const offer = c.offer ? itemById(c.offer.itemId) : null;
  return (
    <li className={`card chest-card chest-${c.id} grid gap-3 p-4`}>
      <div className="flex items-center gap-3">
        <Chest kind={c.id} size={72} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] font-bold leading-tight">{c.name}</p>
          <p className="mt-0.5 flex items-center gap-1 font-black tabular-nums">
            <Seed size={16} /> {c.price}
          </p>
        </div>
      </div>
      {offer && c.offer ? (
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-2.5">
          <ItemIcon item={offer} size={30} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-muted">Dentro deste baú</p>
            <p className="truncate font-bold">{offer.name}</p>
          </div>
          <RarityChip r={c.offer.rarity} />
        </div>
      ) : (
        <>
          <OddsBar odds={c.odds} />
          <button className="flex items-center gap-1 justify-self-start text-[14px] font-bold text-accent" onClick={onOdds} aria-expanded={oddsOpen}>
            Ver chances <ChevronDown size={16} className={oddsOpen ? 'rotate-180' : ''} />
          </button>
          {oddsOpen && (
            <ul className="grid gap-1">
              {RARITY_ORDER.map((r) => (
                <li key={r} className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="h-3 w-3 rounded-full" style={{ background: rarityColor(r) }} /> {rarityLabel(r)}
                  </span>
                  <span className="font-black tabular-nums">{c.odds[r].toLocaleString('pt-BR')}%</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <button className="btn btn-primary" disabled={short > 0} onClick={onOpen}>
        {short > 0 ? `Faltam ${short} sementes` : c.offer ? `Comprar por ${c.price}` : `Abrir por ${c.price}`}
      </button>
    </li>
  );
}

const ERRORS: Record<OpenError, string> = {
  'sem-sementes': 'Faltam sementes para este baú.',
  'sem-bau': 'Este baú grátis já foi aberto.',
  rede: 'Sem conexão agora. Nada foi cobrado. Tente de novo daqui a pouco.',
};

type Phase = 'shake' | 'open' | 'item' | 'erro';

/** Abertura do baú: ele treme, a tampa abre com a luz da raridade e o item aparece. */
export function ChestOpening({ chest, free, onClose }: { chest: ChestId; free: boolean; onClose: () => void }) {
  const s = useApp();
  const [phase, setPhase] = useState<Phase>('shake');
  const [result, setResult] = useState<ChestOutcome | null>(null);
  const [error, setError] = useState<OpenError | null>(null);
  const reduce = prefersReducedMotion();

  useEffect(() => {
    let live = true;
    const wait = new Promise((r) => setTimeout(r, reduce ? 0 : 1200));
    Promise.all([openChestNow(chest, free), wait]).then(([r]) => {
      if (!live) return;
      if (typeof r === 'string') {
        setError(r);
        setPhase('erro');
      } else {
        setResult(r);
        setPhase('open');
      }
    });
    return () => {
      live = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'open' || !result) return;
    const big = result.rarity === 'epico' || result.rarity === 'lendario';
    const t = setTimeout(() => setPhase('item'), reduce ? 0 : big ? 1700 : 1000);
    return () => clearTimeout(t);
  }, [phase, result, reduce]);

  const item = result ? itemById(result.itemId) : null;
  const rc = result ? rarityColor(result.rarity) : '#FFD25A';
  const big = result && (result.rarity === 'epico' || result.rarity === 'lendario');

  return (
    <div className={`chest-open is-${phase} ${big ? 'is-big' : ''} rar-${result?.rarity ?? 'x'}`} role="dialog" aria-modal="true" aria-label={`Abrindo ${gameCfg().chests[chest].name}`} style={{ ['--rc' as string]: rc }}>
      <div className="chest-open-rays" aria-hidden="true" />
      {phase !== 'item' && phase !== 'erro' && result && (
        <button className="lvl-skip" onClick={() => setPhase('item')}>
          Pular
        </button>
      )}
      <div className="relative grid w-full max-w-[380px] justify-items-center gap-4 text-center">
        {phase !== 'item' && (
          <div className="chest-stage">
            <Chest kind={chest} size={170} open={phase === 'open'} />
            {phase === 'open' && <div className="chest-burst" aria-hidden="true" />}
          </div>
        )}
        {phase === 'shake' && <p className="font-display text-[22px] font-bold text-white">Abrindo…</p>}
        {phase === 'open' && result && <p className="chest-rarity-word">{rarityLabel(result.rarity)}{big ? '!' : ''}</p>}
        {phase === 'item' && result && item && (
          <div className="chest-prize">
            <div className="chest-prize-icon">
              <ItemIcon item={item} size={86} fur={s.pet.fur} />
            </div>
            <RarityChip r={result.rarity} />
            <h2 className="font-display text-[26px] font-bold leading-tight text-[#2b2240]">{item.name}</h2>
            {result.duplicate ? (
              <p className="text-[15px] font-semibold text-[#4b4560]">
                Você já tinha este. Virou <b>+{result.fragments} fragmentos</b> <Glyph e="💎" size={16} /> para a Oficina.
              </p>
            ) : (
              <p className="text-[15px] font-semibold text-[#4b4560]">Novo na sua coleção! Está no Armário, em Itens.</p>
            )}
            <button className="btn btn-primary mt-1 w-full" onClick={onClose}>
              Que lindo!
            </button>
          </div>
        )}
        {phase === 'erro' && (
          <div className="chest-prize">
            <p className="font-display text-[20px] font-bold text-[#2b2240]">{error ? ERRORS[error] : 'Não deu certo.'}</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

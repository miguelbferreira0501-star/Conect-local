// Visitas com reação (na arena do amigo), quem visitou a sua casa e o ranking só entre amigos.
// O ranking é opcional, só tem coisas boas (constância, missões, conquistas, coleções, arenas)
// e nunca mostra peso. Quem sai do ranking também deixa de ver o dos outros.
import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { ArenaScene } from '../../components/ArenaScene';
import { Hamster } from '../../components/Hamster';
import { Room } from '../../components/Room';
import { Glyph } from '../../components/art';
import { Empty, toast } from '../../components/ui';
import { periodOf } from '../../data/lines';
import { gameCfg } from '../../lib/game';
import { useApp } from '../../lib/store';
import { REACTIONS, type ReactionId } from '../../shared/moderation';
import type { Profile, RankRow, RankStats, SocialApi, Visit } from '../../lib/social/types';
import { Avatar } from './Post';

const reactionOf = (id: ReactionId) => REACTIONS.find((r) => r.id === id) ?? REACTIONS[0];

/** A casa do amigo: a arena onde o Hami dele mora, o lado de dentro e um carinho para deixar. */
export function VisitView({ p, api, canReact }: { p: Profile; api: SocialApi; canReact: boolean }) {
  const [inside, setInside] = useState(false);
  const [sent, setSent] = useState<ReactionId | null>(null);
  // 13 = casa na Lua
  const arena = p.arena === 13 ? { id: 'lua', name: 'Lua' } : gameCfg().arenas.find((a) => a.n === (p.arena ?? 1)) ?? gameCfg().arenas[0];
  const pet = <Hamster fur={p.pet.fur} phase={p.pet.phase} outfit={p.pet.outfit} size={inside ? 120 : 110} neutral label={p.pet.name} />;

  async function react(id: ReactionId) {
    try {
      const r = await api.visit(p.id, id);
      setSent(id);
      toast(r === 'ok' ? `Você deixou ${reactionOf(id).label.toLowerCase()} na casa de ${p.name}!` : 'Você já deixou um carinho hoje. Volte amanhã!');
    } catch {
      toast('Não deu certo agora.');
    }
  }

  return (
    <div className="grid gap-3">
      {inside ? (
        <Room house={p.house} period={periodOf()} height={260}>
          {pet}
        </Room>
      ) : (
        <ArenaScene arena={arena.id} height={260}>
          {pet}
        </ArenaScene>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-[14px] text-muted">
          <b className="text-ink">{p.pet.name}</b> mora {p.arena === 13 ? 'na' : 'em'} {arena.name}
        </p>
        <button className="btn btn-soft btn-sm shrink-0" onClick={() => setInside(!inside)}>
          <Eye size={15} /> {inside ? 'Ver lá fora' : 'Ver dentro'}
        </button>
      </div>
      {canReact && (
        <section className="card grid gap-2 p-3" aria-label="Deixar um carinho">
          <p className="text-[14px] font-bold">Deixe um carinho na visita</p>
          <div className="flex flex-wrap gap-2">
            {REACTIONS.map((r) => (
              <button key={r.id} className={`chip ${sent === r.id ? 'chip-accent' : 'chip-plain'}`} onClick={() => react(r.id)} aria-pressed={sent === r.id}>
                <Glyph e={r.emoji} size={18} /> {r.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const ago = (at: number) => {
  const m = Math.round((Date.now() - at) / 60_000);
  if (m < 60) return m <= 1 ? 'agora' : `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
};

/** Quem passou pela sua casa e o carinho que deixou. */
export function VisitsCard({ api, onOpenProfile }: { api: SocialApi; onOpenProfile: (id: string) => void }) {
  const [list, setList] = useState<Visit[] | null>(null);
  useEffect(() => {
    let live = true;
    api
      .visits()
      .then((v) => live && setList(v))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, [api]);
  if (!list?.length) return null;
  return (
    <section className="card grid gap-2 p-4" aria-label="Quem visitou sua casa">
      <h2 className="font-display text-[18px] font-bold">Quem visitou sua casa</h2>
      <ul className="grid gap-2">
        {list.slice(0, 6).map((v, i) => (
          <li key={`${v.userId}-${v.at}-${i}`}>
            <button className="flex w-full items-center gap-3 text-left" onClick={() => onOpenProfile(v.userId)}>
              <Avatar pet={v.pet} id={v.userId} size={38} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{v.name}</span>
                <span className="block text-[12px] text-muted">deixou {reactionOf(v.reaction).label.toLowerCase()} · {ago(v.at)}</span>
              </span>
              <Glyph e={reactionOf(v.reaction).emoji} size={26} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Cat = keyof RankStats;
const CATS: { id: Cat; label: string; unit: (n: number) => string; hint: string }[] = [
  { id: 'dias', label: 'Constância', unit: (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`, hint: 'Dias com pelo menos uma missão nos últimos 30 dias.' },
  { id: 'missoes', label: 'Missões', unit: (n) => `${n}`, hint: 'Missões feitas nos últimos 7 dias.' },
  { id: 'conquistas', label: 'Conquistas', unit: (n) => `${n}`, hint: 'Conquistas desbloqueadas.' },
  { id: 'colecoes', label: 'Coleções', unit: (n) => `${n}`, hint: 'Coleções completas no Álbum.' },
  { id: 'arenas', label: 'Arenas', unit: (n) => `${n}`, hint: 'Arenas abertas.' },
];

/** Ranking só entre amigos, com categorias que celebram constância (nunca peso). */
export function RankingTab({ api, onOpenProfile }: { api: SocialApi; onOpenProfile: (id: string) => void }) {
  const s = useApp();
  const [cat, setCat] = useState<Cat>('dias');
  const [data, setData] = useState<{ rows: RankRow[]; optedOut: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    api
      .ranking()
      .then((d) => live && setData(d))
      .catch(() => live && setData({ rows: [], optedOut: false }));
    return () => {
      live = false;
    };
  }, [api, s.privacy.ranking]);

  if (!data) return <p className="text-center text-muted">Carregando…</p>;
  if (data.optedOut || s.privacy.ranking === false) {
    return <Empty>Você saiu do ranking. Para voltar, ligue "Aparecer no ranking dos amigos" em Ajustes › Privacidade.</Empty>;
  }
  const c = CATS.find((x) => x.id === cat)!;
  const rows = [...data.rows].sort((a, b) => b[cat] - a[cat] || a.name.localeCompare(b.name));
  // Mesma pontuação, mesma posição.
  let place = 0;
  let last = -1;
  const placed = rows.map((r, i) => {
    if (r[cat] !== last) (place = i + 1), (last = r[cat]);
    return { ...r, place };
  });
  return (
    <div className="grid gap-3">
      <div className="tabs-scroll" role="group" aria-label="Categoria do ranking">
        {CATS.map((x) => (
          <button key={x.id} className={`chip ${cat === x.id ? 'chip-accent' : 'chip-plain'}`} aria-pressed={cat === x.id} onClick={() => setCat(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-muted">{c.hint}</p>
      {rows.length <= 1 ? (
        <Empty>Quando seus amigos entrarem, o ranking aparece aqui. Só amigos veem.</Empty>
      ) : (
        <ol className="grid gap-2">
          {placed.map((r) => (
            <li key={r.userId}>
              <button className={`card rank-row flex w-full items-center gap-3 p-3 text-left ${r.me ? 'is-me' : ''}`} onClick={() => !r.me && onOpenProfile(r.userId)}>
                <span className={`rank-place place-${Math.min(r.place, 4)}`}>{r.place}</span>
                <Avatar pet={r.pet} id={r.userId} size={40} />
                <span className="min-w-0 flex-1 truncate font-bold">{r.me ? 'Você' : r.name}</span>
                <span className="font-black tabular-nums">{c.unit(r[cat])}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="text-[12.5px] text-muted">Só entre amigos e sem peso, calorias ou humor. Dá para sair do ranking em Ajustes › Privacidade.</p>
    </div>
  );
}

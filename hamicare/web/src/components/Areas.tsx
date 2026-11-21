// Áreas da vida em cartões coloridos com o Hami (como no começo do app), no Início e numa página própria.
// Cada área abre "Como você quer…?" com hábitos prontos para adicionar ou tirar, e "Criar a minha".
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, Plus as PlusIcon, X } from 'lucide-react';
import { Hamster } from './Hamster';
import { Glyph } from './art';
import { toast } from './ui';
import { LIFE_AREAS, LIFE_ORDER, libById, type LifeArea } from '../data/tasks';
import { addLibraryTask, deleteTask, setLifeAreas, useApp } from '../lib/store';
import { TaskSheet } from '../screens/Activities';
import type { Outfit, PetMood } from '../types';

const NONE: Outfit = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };
/** Como o Hami aparece em cada cartão (humor e uma pecinha que combina com a área). */
const LOOK: Record<LifeArea, { mood: PetMood; outfit?: Partial<Outfit> }> = {
  calma: { mood: 'calmo' },
  sono: { mood: 'sono', outfit: { roupa: 'pijama-nuvem-azul' } },
  movimento: { mood: 'animado', outfit: { roupa: 'regata' } },
  agua: { mood: 'feliz' },
  estudo: { mood: 'feliz', outfit: { oculos: 'redondos' } },
  casa: { mood: 'animado', outfit: { roupa: 'avental' } },
  carinho: { mood: 'risada' },
  alegria: { mood: 'animado' },
  saude: { mood: 'feliz' },
};

/** O Hami da área com o objeto dela ao lado. */
export function AreaArt({ area, fur, size = 96 }: { area: LifeArea; fur: string; size?: number }) {
  const L = LIFE_AREAS[area];
  const look = LOOK[area];
  return (
    <span className="ar-art icon-still" aria-hidden="true">
      <Hamster fur={fur} size={size} idle={false} growth={1} mood={look.mood} outfit={{ ...NONE, ...look.outfit }} label="" />
      <span className="ar-prop">
        <Glyph e={L.prop} size={Math.round(size * 0.38)} />
      </span>
    </span>
  );
}

/** Áreas que a pessoa escolheu (a antiga "Saúde" vale como Movimento e Hidratação). */
export function chosenAreas(list: LifeArea[] | undefined): LifeArea[] {
  const out = new Set<LifeArea>();
  for (const a of list ?? []) {
    if (a === 'saude') {
      out.add('movimento');
      out.add('agua');
    } else out.add(a);
  }
  return LIFE_ORDER.filter((a) => out.has(a));
}

/** Quantos hábitos da área a pessoa já tem. */
function countIn(area: LifeArea, ids: Set<string>) {
  return LIFE_AREAS[area].tasks.filter((id) => ids.has(id)).length;
}

/** Fileira de cartões no Início: as áreas escolhidas primeiro, depois as outras. */
export function AreaRow() {
  const s = useApp();
  const [open, setOpen] = useState<LifeArea | 'todas' | null>(null);
  const mine = chosenAreas(s.profile.lifeAreas);
  const order = [...mine, ...LIFE_ORDER.filter((a) => !mine.includes(a))];
  const ids = new Set(s.tasks.map((t) => t.id));
  return (
    <section className="ar-row" aria-label="Áreas da sua vida">
      <div className="ar-row-head">
        <h3>Áreas da sua vida</h3>
        <button onClick={() => setOpen('todas')}>
          Ver todas <ChevronRight size={16} />
        </button>
      </div>
      <div className="ar-scroll">
        {order.map((a) => {
          const L = LIFE_AREAS[a];
          const n = countIn(a, ids);
          const on = mine.includes(a);
          return (
            <button key={a} className={`ar-mini ${on ? 'is-on' : ''}`} style={{ ['--tone' as string]: L.tone }} onClick={() => setOpen(a)}>
              <AreaArt area={a} fur={s.pet.fur} size={78} />
              <b>{L.label}</b>
              <small>{on ? `${n} ${n === 1 ? 'hábito' : 'hábitos'}` : 'Começar'}</small>
            </button>
          );
        })}
      </div>
      <AreasPage open={open} onClose={() => setOpen(null)} />
    </section>
  );
}

/** Página das áreas: a grade de cartões e, ao tocar, a lista "Como você quer…?". */
export function AreasPage({ open, onClose }: { open: LifeArea | 'todas' | null; onClose: () => void }) {
  const s = useApp();
  const [picked, setPicked] = useState<LifeArea | null>(null);
  const [create, setCreate] = useState(false);
  if (!open) return null;
  const area = picked ?? (open === 'todas' ? null : open);
  const mine = chosenAreas(s.profile.lifeAreas);
  const ids = new Set(s.tasks.map((t) => t.id));
  const close = () => {
    setPicked(null);
    onClose();
  };
  const back = () => (open === 'todas' && picked ? setPicked(null) : close());

  const toggle = (a: LifeArea, id: string) => {
    const lib = libById(id);
    if (!lib) return;
    if (ids.has(id)) {
      deleteTask(id);
      toast(`${lib.title}: tirado`);
      return;
    }
    addLibraryTask(id);
    if (!mine.includes(a)) setLifeAreas([...(s.profile.lifeAreas ?? []), a]);
    toast(`${lib.title}: adicionado`);
  };

  return createPortal(
    <div className="arp" role="dialog" aria-modal="true" aria-label={area ? LIFE_AREAS[area].label : 'Áreas da sua vida'}>
      {area ? (
        <div className="arp-area" style={{ ['--tone' as string]: LIFE_AREAS[area].tone }}>
          <div className="arp-hero">
            <button className="arp-ico" onClick={back} aria-label="Voltar">
              {open === 'todas' ? <ChevronLeft size={22} /> : <X size={22} />}
            </button>
            <AreaArt area={area} fur={s.pet.fur} size={150} />
          </div>
          <div className="arp-body">
            <h2>{LIFE_AREAS[area].ask}</h2>
            <p className="arp-sub">Escolha os hábitos que combinam com você. Dá para tirar quando quiser.</p>
            <div className="arp-list">
              {LIFE_AREAS[area].tasks.map((id) => {
                const lib = libById(id);
                if (!lib) return null;
                const has = ids.has(id);
                return (
                  <button key={id} className={`arp-item ${has ? 'is-on' : ''}`} onClick={() => toggle(area, id)} aria-pressed={has}>
                    <Glyph e={lib.emoji} size={36} />
                    <span>{lib.title}</span>
                    <i aria-hidden="true">{has ? <Check size={18} strokeWidth={3.5} /> : <PlusIcon size={18} strokeWidth={3.5} />}</i>
                  </button>
                );
              })}
            </div>
            <button className="arp-own" onClick={() => setCreate(true)}>
              <PlusIcon size={18} strokeWidth={3} /> Criar a minha
            </button>
          </div>
        </div>
      ) : (
        <div className="arp-all">
          <div className="arp-top">
            <button className="arp-ico" onClick={close} aria-label="Fechar">
              <X size={22} />
            </button>
            <h2>Áreas da sua vida</h2>
          </div>
          <p className="arp-sub">Toque numa área para ver ideias de hábitos. O {s.pet.name} cresce com cada cuidado.</p>
          <div className="arp-grid">
            {LIFE_ORDER.map((a) => {
              const L = LIFE_AREAS[a];
              const on = mine.includes(a);
              const n = countIn(a, ids);
              return (
                <button key={a} className={`arp-card ${on ? 'is-on' : ''}`} style={{ ['--tone' as string]: L.tone }} onClick={() => setPicked(a)}>
                  <span className="arp-card-name">{L.label}</span>
                  <AreaArt area={a} fur={s.pet.fur} size={100} />
                  <small>{on ? `${n} ${n === 1 ? 'hábito' : 'hábitos'}` : L.desc}</small>
                  {on && (
                    <span className="arp-check" aria-label="Área escolhida">
                      <Check size={14} strokeWidth={3.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <TaskSheet task={create ? 'new' : null} onClose={() => setCreate(false)} />
    </div>,
    document.body,
  );
}

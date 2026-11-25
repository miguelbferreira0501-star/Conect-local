// Áreas da vida em cartões coloridos com o Lumbi (como no começo do app), no Início e numa página própria.
// Cada área abre "Como você quer…?" com hábitos prontos para adicionar ou tirar, e "Criar a minha".
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, Plus as PlusIcon, X } from 'lucide-react';
import { Glyph } from './art';
import calma from '../assets/areas/calma.webp';
import nutricao from '../assets/areas/nutricao.webp';
import produtividade from '../assets/areas/produtividade.webp';
import movimento from '../assets/areas/movimento.webp';
import amorProprio from '../assets/areas/amor-proprio.webp';
import sono from '../assets/areas/sono.webp';
import gratidao from '../assets/areas/gratidao.webp';
import higiene from '../assets/areas/higiene.webp';
import { toast } from './ui';
import { LIFE_AREAS, LIFE_ORDER, libById, type LifeArea } from '../data/tasks';
import { addLibraryTask, deleteTask, setLifeAreas, useApp } from '../lib/store';
import { TaskSheet } from '../screens/Activities';

/** Ilustração de cada área (cartão com o nome já desenhado). */
const ART: Partial<Record<LifeArea, string>> = { calma, agua: nutricao, estudo: produtividade, movimento, carinho: amorProprio, sono, alegria: gratidao, higiene };

/** O cartão ilustrado da área. */
export function AreaArt({ area, className = '' }: { area: LifeArea; className?: string }) {
  const src = ART[area];
  return src ? <img className={`ar-img ${className}`} src={src} alt={LIFE_AREAS[area].label} draggable={false} /> : <span className={`ar-img ar-img-none ${className}`}>{LIFE_AREAS[area].label}</span>;
}

/** Áreas que a pessoa escolheu (as antigas: "Saúde" vale como Movimento e Nutrição; "Casa" como Higiene). */
export function chosenAreas(list: LifeArea[] | undefined): LifeArea[] {
  const out = new Set<LifeArea>();
  for (const a of list ?? []) {
    if (a === 'saude') {
      out.add('movimento');
      out.add('agua');
    } else if (a === 'casa') out.add('higiene');
    else out.add(a);
  }
  return LIFE_ORDER.filter((a) => out.has(a));
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
            <AreaArt area={area} className="arp-hero-img" />
          </div>
          <div className="arp-body">
            <h2>{LIFE_AREAS[area].ask}</h2>
            <p className="arp-sub">Escolha os hábitos que combinam com você. Dá para tirar quando quiser.</p>
            {area === 'agua' && <p className="arp-note">As refeições ficam no Cardápio de hoje (Início, em “Mais para hoje”).</p>}
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
              return (
                <button key={a} className={`arp-card ${on ? 'is-on' : ''}`} style={{ ['--tone' as string]: L.tone }} onClick={() => setPicked(a)} aria-label={L.label}>
                  <AreaArt area={a} />
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

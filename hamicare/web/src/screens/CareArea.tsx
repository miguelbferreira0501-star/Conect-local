// Aba Cuidar: o cantinho do Hami, com o que ele precisa agora, as barrinhas e todos os cuidados.
import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { LivePet } from '../components/LivePet';
import { CompanionBuddy } from './Companions';
import { ITEMS, itemById } from '../data/items';
import { play } from '../lib/sound';
import { Room } from '../components/Room';
import { Coins } from '../components/ui';
import { periodOf } from '../data/lines';
import { placeById } from '../data/world';
import { care, dayOf, feed, todayKey, useApp } from '../lib/store';
import { CareLayer, type CareMode } from './Care';
import { useNow } from './Home';
import type { CareId, PetMood, Photo } from '../types';
import { Glyph } from '../components/art';

type StatKey = 'felicidade' | 'energia' | 'saciedade' | 'limpeza';

const STAT_COLOR: Record<StatKey, string> = { felicidade: '#FF6F91', energia: '#5B9BF0', saciedade: '#F6A623', limpeza: '#4FC3A1' };

const STATS: { key: StatKey; label: string; emoji: string; tone: 'accent' | 'sky' | 'gold' | 'leaf' }[] = [
  { key: 'felicidade', label: 'Felicidade', emoji: '💗', tone: 'accent' },
  { key: 'energia', label: 'Energia', emoji: '⚡', tone: 'sky' },
  { key: 'saciedade', label: 'Barriguinha', emoji: '🥕', tone: 'gold' },
  { key: 'limpeza', label: 'Limpeza', emoji: '🫧', tone: 'leaf' },
];

interface CareDef {
  id: Exclude<CareMode, null>;
  care: CareId;
  emoji: string;
  label: string;
  desc: string;
  tone: string;
}

const CARES: CareDef[] = [
  { id: 'comida', care: 'comida', emoji: '🥕', label: 'Comida', desc: 'Lanchinho e cozinha', tone: '#FFE2B8' },
  { id: 'banho', care: 'banho', emoji: '🛁', label: 'Banho', desc: 'Espuma, toalha e secador', tone: '#CDEBFF' },
  { id: 'brincar', care: 'brincar', emoji: '🎾', label: 'Brincar', desc: 'Dois joguinhos', tone: '#D9F5C8' },
  { id: 'carinho', care: 'carinho', emoji: '🤲', label: 'Carinho', desc: 'Cafuné e cócegas', tone: '#FFD3DF' },
  { id: 'escovar', care: 'escovar', emoji: '🪮', label: 'Escovar', desc: 'Desfazer os nozinhos', tone: '#E9DDFF' },
  { id: 'dormir', care: 'dormir', emoji: '🌙', label: 'Dormir', desc: 'Recupera a energia', tone: '#D6DBFF' },
  { id: 'conversar', care: 'conversar', emoji: '💬', label: 'Conversar', desc: 'Um papo rapidinho', tone: '#FFF1B8' },
  { id: 'foto', care: 'foto', emoji: '📸', label: 'Foto', desc: 'Guardar o momento', tone: '#FFD9C9' },
];

/** O que o Hami mais precisa agora (a barrinha mais baixa, se estiver baixa). */
function needOf(stats: Record<StatKey, number>, sleeping: boolean): { text: string; care: CareDef | null; mood: PetMood } {
  if (sleeping) return { text: 'Zzz… estou dormindo e recuperando a energia. Me acorda quando quiser.', care: CARES.find((c) => c.id === 'dormir')!, mood: 'dormindo' };
  const order: [StatKey, number, string, Exclude<CareMode, null>, PetMood][] = [
    ['saciedade', 40, 'Tô com fominha… me dá um lanchinho?', 'comida', 'boca'],
    ['energia', 25, 'Que sono… me põe pra dormir?', 'dormir', 'sono'],
    ['limpeza', 40, 'Tô precisando de um banho!', 'banho', 'surpreso'],
    ['felicidade', 50, 'Brinca comigo um pouquinho?', 'brincar', 'calmo'],
  ];
  const low = order.filter(([k, min]) => stats[k] < min).sort((a, b) => stats[a[0]] - stats[b[0]])[0];
  if (!low) return { text: 'Tô bem cuidado! Obrigado por cuidar de mim!', care: null, mood: 'feliz' };
  return { text: low[2], care: CARES.find((c) => c.id === low[3])!, mood: low[4] };
}

export function CareArea({ onShare }: { onShare: (p: Photo) => void }) {
  const s = useApp();
  const now = useNow(30_000);
  const [mode, setMode] = useState<CareMode>(null);
  const [tray, setTray] = useState<'cuidar' | 'comer'>('cuidar');
  const [eating, setEating] = useState<PetMood | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const petBox = useRef<HTMLDivElement>(null);
  const day = dayOf(s, todayKey());
  const adv = s.adventure;
  const place = adv ? placeById(adv.placeId) : null;
  const advLeft = adv ? Math.max(0, Math.ceil((adv.endsAt - now) / 60_000)) : 0;
  const need = needOf(s.pet.stats, s.pet.sleeping);
  const sleeping = s.pet.sleeping;
  const blocked = (c: CareDef) => !!adv || (sleeping && c.id !== 'dormir' && c.id !== 'conversar');
  const foods = ITEMS.filter((i) => i.kind === 'comida' && (s.inventory[i.id] ?? 0) > 0);
  const [say, setSay] = useState<string | null>(null);

  function talk(text: string) {
    setSay(text);
    window.setTimeout(() => setSay((cur) => (cur === text ? null : cur)), 2600);
  }

  /** Dar comida: arrastando até o Hami (ou tocando na comidinha). */
  function eat(id: string) {
    if (sleeping) return talk('Zzz… depois eu como.');
    if (s.pet.stats.saciedade >= 98) {
      play('iii');
      return talk('Tô cheinho! Depois eu como mais.');
    }
    const item = itemById(id);
    if (!item || !feed(id)) return;
    setEating('comendo');
    play(/suco|água|agua|leite|chá|cha|vitamina/i.test(item.name) ? 'gole' : 'nhac');
    talk('Nham nham!');
    window.setTimeout(() => {
      setEating('animado');
      play('iii');
      window.setTimeout(() => setEating(null), 900);
    }, 1100);
  }

  const overPet = (x: number, y: number) => {
    const r = petBox.current?.getBoundingClientRect();
    return !!r && x > r.left - 30 && x < r.right + 30 && y > r.top - 30 && y < r.bottom + 30;
  };

  return (
    <div className="care-page">
      <section className="care-scene scene-bleed" aria-label={`Casa do ${s.pet.name}`}>
        <Room house={s.house} period={periodOf()} height={470}>
          {adv ? (
            <div className="mb-10 grid justify-items-center gap-1 rounded-3xl bg-surface/95 px-4 py-3 text-center">
              <Glyph e={place?.emoji} size={40} />
              <p className="font-display text-[17px] font-bold leading-tight">
                {s.pet.name} foi para {place?.name}
              </p>
              <p className="text-[13px] text-muted">{advLeft > 0 ? `Volta em ~${advLeft} min.` : 'Já voltou! Veja no Mundo o que ele trouxe.'}</p>
            </div>
          ) : (
            <div ref={petBox} className="relative">
              <LivePet
                size={230}
                mood={eating ?? (drag?.moved ? 'boca' : need.mood)}
                say={say ?? (need.care ? need.text : null)}
                onTap={() => {
                  if (sleeping) return;
                  care('carinho');
                }}
              />
              <CompanionBuddy hamster={230} />
            </div>
          )}
        </Room>
        <div className="care-hud" aria-label="Como o Hami está">
          {STATS.map((st) => {
            const v = Math.round(s.pet.stats[st.key]);
            return (
              <span key={st.key} className={`care-stat ${v < 35 ? 'is-low' : ''}`} title={st.label} aria-label={`${st.label}: ${v}%`}>
                <span className="care-stat-ring" style={{ ['--v' as string]: `${v}%`, ['--c' as string]: STAT_COLOR[st.key] }}>
                  <Glyph e={st.emoji} size={20} />
                </span>
                <b>{v}</b>
              </span>
            );
          })}
          <span className="care-coins">
            <Coins value={s.coins} />
          </span>
        </div>
      </section>

      <section className="care-tray" aria-label="Cuidados">
        <div className="care-tray-tabs" role="tablist">
          <button role="tab" aria-selected={tray === 'cuidar'} className={tray === 'cuidar' ? 'is-on' : ''} onClick={() => setTray('cuidar')}>
            Cuidados
          </button>
          <button role="tab" aria-selected={tray === 'comer'} className={tray === 'comer' ? 'is-on' : ''} onClick={() => setTray('comer')}>
            Comidinhas {foods.length ? `(${foods.reduce((n, f) => n + (s.inventory[f.id] ?? 0), 0)})` : ''}
          </button>
        </div>
        {tray === 'cuidar' ? (
          <div className="care-grid">
            {CARES.map((c) => {
              const done = day.care.includes(c.care);
              const label = c.id === 'dormir' && sleeping ? 'Acordar' : c.label;
              const emoji = c.id === 'dormir' && sleeping ? '☀️' : c.emoji;
              const urgent = need.care?.id === c.id;
              return (
                <button key={c.id} className={`care-cell ${urgent ? 'is-urgent' : ''}`} disabled={blocked(c)} onClick={() => (c.id === 'comida' && foods.length ? setTray('comer') : setMode(c.id))} aria-label={`${label}: ${c.desc}`}>
                  <Glyph e={emoji} size={40} />
                  <span>{label}</span>
                  {done && (
                    <span className="care-cell-done" aria-label="Feito hoje">
                      <Check size={12} strokeWidth={3.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : foods.length ? (
          <>
            <div className="care-grid">
              {foods.map((f) => (
                <button
                  key={f.id}
                  className="care-cell is-food"
                  style={{ touchAction: 'none', opacity: drag?.id === f.id && drag.moved ? 0.4 : 1 }}
                  aria-label={`Dar ${f.name} (${s.inventory[f.id]})`}
                  disabled={!!adv}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDrag({ id: f.id, x: e.clientX, y: e.clientY, moved: false });
                  }}
                  onPointerMove={(e) => {
                    if (!drag) return;
                    const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8;
                    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
                  }}
                  onPointerUp={(e) => {
                    const d = drag;
                    setDrag(null);
                    if (!d) return;
                    if (!d.moved || overPet(e.clientX, e.clientY)) eat(f.id);
                  }}
                  onPointerCancel={() => setDrag(null)}
                >
                  <span className="care-cell-count">x{s.inventory[f.id]}</span>
                  <Glyph e={f.emoji} size={40} />
                  <span className="care-cell-gain">
                    <Glyph e="💗" size={14} /> +{f.food?.felicidade ?? 1}
                  </span>
                </button>
              ))}
            </div>
            <p className="care-tray-hint">Arraste até o {s.pet.name} ou toque para dar</p>
          </>
        ) : (
          <p className="care-tray-hint">Acabaram as comidinhas. Tem mais na Cozinha da Loja (aba Mundo) e no presente do dia.</p>
        )}
        <p className="care-tray-note">Cuidar do {s.pet.name} deixa ele feliz e rende sementes. O peso dele muda só com as suas missões saudáveis.</p>
      </section>
      {drag?.moved && (
        <span className="food-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Glyph e={itemById(drag.id)?.emoji} size={52} />
        </span>
      )}

      <CareLayer mode={mode} onClose={() => setMode(null)} onShare={onShare} />
    </div>
  );
}

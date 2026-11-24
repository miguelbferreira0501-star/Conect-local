// Aba Cuidar: o cantinho do Hami, com o que ele precisa agora, as barrinhas e todos os cuidados.
import { useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { LivePet } from '../components/LivePet';
import { CompanionBuddy } from './Companions';
import { ITEMS, itemById } from '../data/items';
import { play } from '../lib/sound';
import { Room } from '../components/Room';
import { Sheet } from '../components/ui';
import { periodOf } from '../data/lines';
import { placeById } from '../data/world';
import { care, dayOf, feed, todayKey, useApp } from '../lib/store';
import { CareLayer, type CareMode } from './Care';
import { useNow } from './Home';
import type { CareId, PetMood, Photo } from '../types';
import { Glyph } from '../components/art';
import { useFurniturePlay } from '../components/FurniturePlay';
import { openUi } from '../lib/bus';

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

/** Cuidados agrupados no painel (no lugar da grade de oito botões). */
const GROUPS: [string, Exclude<CareMode, null>[]][] = [
  ['Corpo', ['comida', 'banho', 'escovar']],
  ['Diversão e carinho', ['brincar', 'carinho', 'conversar']],
  ['Descanso e memórias', ['dormir', 'foto']],
];

const CARES: CareDef[] = [
  { id: 'comida', care: 'comida', emoji: '🥕', label: 'Comida', desc: 'Lanchinho e cozinha', tone: '#FFE2B8' },
  { id: 'banho', care: 'banho', emoji: '🛁', label: 'Banho', desc: 'Espuma, toalha e secador', tone: '#CDEBFF' },
  { id: 'brincar', care: 'brincar', emoji: '🎾', label: 'Brincar', desc: 'Parque com 9 jogos', tone: '#D9F5C8' },
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
  const [panel, setPanel] = useState(false);
  const furniture = useFurniturePlay(!!s.adventure);
  const [food, setFood] = useState(false);
  const [eating, setEating] = useState<PetMood | null>(null);
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
  const foodCount = foods.reduce((n, f) => n + (s.inventory[f.id] ?? 0), 0);
  const doneCount = CARES.filter((c) => day.care.includes(c.care)).length;
  const open = (c: CareDef) => (c.id === 'comida' && foods.length ? setFood(true) : setMode(c.id));

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


  return (
    <div className="care-page">
      <section className="care-scene scene-bleed" aria-label={`Casa do ${s.pet.name}`}>
        <Room house={s.house} period={periodOf()} height={470} onUse={furniture.useItem} usage={furniture.usage}>
          {furniture.use ? null : adv ? (
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
                mood={eating ?? need.mood}
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
        {furniture.line && (
          <p className="care-use-say" aria-live="polite">
            {furniture.line}
          </p>
        )}
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
        </div>
      </section>

      <section className="care-dock" aria-label="Cuidados">
        {need.care && !blocked(need.care) && (
          <button className="care-need" onClick={() => open(need.care!)}>
            <Glyph e={need.care.emoji} size={30} />
            <span className="min-w-0 flex-1">
              <small>O {s.pet.name} precisa de</small>
              <b>{need.care.label}</b>
            </span>
            <span className="care-need-go">Fazer agora</span>
          </button>
        )}
        <div className="care-dock-row">
          <button className="care-main" onClick={() => setPanel(true)} disabled={!!adv}>
            <Glyph e="🧶" size={34} />
            <span>
              Cuidar do {s.pet.name}
              <small>
                {doneCount}/{CARES.length} cuidados hoje
              </small>
            </span>
          </button>
          <button className="care-side" onClick={() => setFood(true)} disabled={!!adv} aria-label={`Comidinhas: ${foodCount}`}>
            <Glyph e="🍓" size={30} />
            <span>{foodCount}</span>
          </button>
        </div>
        <button className="care-inter" onClick={() => openUi('interacoes')} disabled={!!adv}>
          <span className="care-inter-ico" aria-hidden="true">
            <Glyph e="🎾" size={30} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            Interações
            <small>Carinho, petiscos e corações</small>
          </span>
          <span className="care-inter-n" aria-label={`${s.pet.hearts ?? 0} corações`}>
            ♥ {s.pet.hearts ?? 0}
          </span>
        </button>
        <p className="care-tray-note">Cuidar do {s.pet.name} deixa ele feliz e rende sementes. O peso dele muda só com as suas missões saudáveis.</p>
      </section>

      <Sheet open={panel} onClose={() => setPanel(false)} title={`Cuidar do ${s.pet.name}`}>
        <div className="care-groups">
          {GROUPS.map(([title, ids]) => (
            <section key={title}>
              <h3>{title}</h3>
              <div className="care-list">
                {ids.map((id) => {
                  const c = CARES.find((x) => x.id === id)!;
                  const done = day.care.includes(c.care);
                  const label = c.id === 'dormir' && sleeping ? 'Acordar' : c.label;
                  return (
                    <button key={c.id} className={`care-item ${need.care?.id === c.id ? 'is-urgent' : ''}`} style={{ ['--tone' as string]: c.tone }} disabled={blocked(c)} onClick={() => (setPanel(false), open(c))}>
                      <span className="care-item-ico">
                        <Glyph e={c.id === 'dormir' && sleeping ? '☀️' : c.emoji} size={34} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <b>{label}</b>
                        <small>{c.desc}</small>
                      </span>
                      {done ? (
                        <span className="care-item-done" aria-label="Feito hoje">
                          <Check size={14} strokeWidth={3.5} />
                        </span>
                      ) : (
                        <ChevronRight size={18} className="opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Sheet>

      <Sheet open={food} onClose={() => setFood(false)} title="Comidinhas">
        {foods.length ? (
          <>
            <div className="care-grid">
              {foods.map((f) => (
                <button key={f.id} className="care-cell is-food" aria-label={`Dar ${f.name} (${s.inventory[f.id]})`} onClick={() => (setFood(false), eat(f.id))}>
                  <span className="care-cell-count">x{s.inventory[f.id]}</span>
                  <Glyph e={f.emoji} size={40} />
                  <span className="care-cell-gain">
                    <Glyph e="💗" size={14} /> +{f.food?.felicidade ?? 1}
                  </span>
                </button>
              ))}
            </div>
            <p className="care-tray-hint !text-muted">Toque para dar ao {s.pet.name}.</p>
          </>
        ) : (
          <p className="text-[15px] text-muted">Acabaram as comidinhas. Tem mais na Cozinha da Loja (aba Mundo) e no presente do dia.</p>
        )}
      </Sheet>

      <CareLayer mode={mode} onClose={() => setMode(null)} onShare={onShare} />
    </div>
  );
}

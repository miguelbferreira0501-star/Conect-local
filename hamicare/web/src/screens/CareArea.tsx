// Aba Cuidar: o cantinho do Hami, com o que ele precisa agora, as barrinhas e todos os cuidados.
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Bar, Coins } from '../components/ui';
import { periodOf } from '../data/lines';
import { placeById } from '../data/world';
import { dayOf, todayKey, useApp } from '../lib/store';
import { CareLayer, type CareMode } from './Care';
import { useNow } from './Home';
import type { CareId, PetMood, Photo } from '../types';

type StatKey = 'felicidade' | 'energia' | 'saciedade' | 'limpeza';

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
  if (!low) return { text: 'Tô bem cuidado! Obrigado por cuidar de mim 💛', care: null, mood: 'feliz' };
  return { text: low[2], care: CARES.find((c) => c.id === low[3])!, mood: low[4] };
}

export function CareArea({ onShare }: { onShare: (p: Photo) => void }) {
  const s = useApp();
  const now = useNow(30_000);
  const [mode, setMode] = useState<CareMode>(null);
  const day = dayOf(s, todayKey());
  const adv = s.adventure;
  const place = adv ? placeById(adv.placeId) : null;
  const advLeft = adv ? Math.max(0, Math.ceil((adv.endsAt - now) / 60_000)) : 0;
  const need = needOf(s.pet.stats, s.pet.sleeping);
  const doneCount = CARES.filter((c) => day.care.includes(c.care)).length;
  const sleeping = s.pet.sleeping;
  const blocked = (c: CareDef) => !!adv || (sleeping && c.id !== 'dormir' && c.id !== 'conversar');

  return (
    <div className="grid gap-4">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Cantinho do {s.pet.name}</p>
          <h1 className="font-display text-[30px] font-bold leading-tight">Cuidar</h1>
        </div>
        <Coins value={s.coins} />
      </header>

      <section className="card overflow-hidden p-0" aria-label={`Casa do ${s.pet.name}`}>
        <Room house={s.house} period={periodOf()} height={230}>
          {adv ? (
            <div className="mb-6 grid justify-items-center gap-1 rounded-3xl bg-surface/95 px-4 py-3 text-center">
              <span className="text-[30px]">{place?.emoji}</span>
              <p className="font-display text-[17px] font-bold leading-tight">
                {s.pet.name} foi para {place?.name}
              </p>
              <p className="text-[13px] text-muted">{advLeft > 0 ? `Volta em ~${advLeft} min.` : 'Já voltou! Veja no Mundo o que ele trouxe.'}</p>
            </div>
          ) : (
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={need.mood} size={150} label={s.pet.name} />
          )}
        </Room>
        {!adv && (
          <div className="flex items-center gap-3 p-4">
            <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">
              <span className="font-display font-bold text-accent">{s.pet.name}: </span>
              {need.text}
            </p>
            {need.care && (
              <button className="btn btn-primary btn-sm shrink-0" onClick={() => setMode(need.care!.id)}>
                {need.care.emoji} {sleeping ? 'Acordar' : need.care.label}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="card grid grid-cols-2 gap-x-4 gap-y-3 p-4" aria-label="Como o Hami está">
        {STATS.map((st) => (
          <div key={st.key} className="grid min-w-0 gap-1">
            <span className="flex items-center justify-between gap-1 text-[13px] font-extrabold">
              <span className="truncate">
                {st.emoji} {st.label}
              </span>
              <span className="tabular-nums text-muted">{Math.round(s.pet.stats[st.key])}%</span>
            </span>
            <Bar value={s.pet.stats[st.key]} tone={st.tone} label={st.label} />
          </div>
        ))}
      </section>

      <section className="grid gap-3" aria-label="Cuidados">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="section-label">Cuidados de hoje</h2>
          <span className="chip chip-plain">
            {doneCount}/{CARES.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CARES.map((c) => {
            const done = day.care.includes(c.care);
            const label = c.id === 'dormir' && sleeping ? 'Acordar' : c.label;
            const emoji = c.id === 'dormir' && sleeping ? '☀️' : c.emoji;
            return (
              <button key={c.id} className="care-tile" disabled={blocked(c)} onClick={() => setMode(c.id)} aria-label={`${label}: ${c.desc}`}>
                <span className="care-tile-ico" style={{ background: c.tone }} aria-hidden="true">
                  {emoji}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate font-display text-[18px] font-bold leading-tight">{label}</span>
                  <span className="block text-[12.5px] font-semibold leading-tight text-muted">{c.desc}</span>
                </span>
                {done && (
                  <span className="care-tile-done" aria-label="Feito hoje">
                    <Check size={14} strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="px-1 text-[13px] text-muted">Cuidar do {s.pet.name} deixa ele feliz e rende sementes. O peso dele muda só com as suas missões saudáveis.</p>
      </section>

      <CareLayer mode={mode} onClose={() => setMode(null)} onShare={onShare} />
    </div>
  );
}

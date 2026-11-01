import { useEffect, useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { toast } from '../components/ui';
import { BATTERIES, MOODS } from '../data/lines';
import { addJarNote, careDays, dayOf, setMood, setNote, todayKey, useApp, type JarNote, type Mood } from '../lib/store';
import { dayKey, daysAgo, formatDay, hashStr, WEEKDAYS } from '../lib/util';

export function Journal() {
  const s = useApp();
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => daysAgo(6 - i)), []);
  const day = dayOf(s, selected);
  const isToday = selected === today;

  return (
    <div className="grid gap-4">
      <header>
        <p className="eyebrow">{careDays(s)} {careDays(s) === 1 ? 'dia' : 'dias'} cuidando de você</p>
        <h1 className="font-display text-[30px] font-bold leading-tight">Diário</h1>
      </header>

      <section className="card grid gap-4 p-4" aria-label="Sua semana">
        <div className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const k = dayKey(d);
            const log = dayOf(s, k);
            const mood = MOODS.find((m) => m.value === log.mood);
            return (
              <button key={k} className="week-day" aria-pressed={selected === k} onClick={() => setSelected(k)} aria-label={formatDay(k)}>
                <span className="text-[12px] font-extrabold uppercase text-muted">{WEEKDAYS[d.getDay()]}</span>
                <span className="grid h-9 w-9 place-items-center text-[24px] leading-none">
                  {mood ? mood.emoji : <span className="h-2.5 w-2.5 rounded-full bg-line" />}
                </span>
                <span className="text-[12px] font-bold tabular-nums text-muted">{log.done.length || ''}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 border-t border-line pt-4">
          <p className="font-display text-[19px] font-bold capitalize leading-tight">{isToday ? 'Hoje' : formatDay(selected)}</p>
          <div className="flex justify-between gap-1">
            {MOODS.map((m) => (
              <button
                key={m.value}
                className="mood-opt"
                aria-pressed={day.mood === m.value}
                aria-label={m.label}
                onClick={() => setMood(m.value as Mood, selected)}
              >
                <span className="text-[28px] leading-none">{m.emoji}</span>
              </button>
            ))}
          </div>
          <p className="text-[14px] text-muted">
            {day.mood ? MOODS[day.mood - 1].label : 'Sem humor marcado'}
            {day.battery ? ` · bateria ${BATTERIES[day.battery - 1].label.toLowerCase()}` : ''}
            {` · ${day.done.length} ${day.done.length === 1 ? 'cuidado' : 'cuidados'}`}
          </p>
          <NoteBox key={selected} dayKeyValue={selected} initial={day.note ?? ''} />
        </div>
      </section>

      <Jar notes={s.jar} />
    </div>
  );
}

function NoteBox({ dayKeyValue, initial }: { dayKeyValue: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    if (saved) return;
    const t = setTimeout(() => {
      setNote(text, dayKeyValue);
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [text, saved, dayKeyValue]);
  return (
    <label className="grid gap-1.5" htmlFor={`note-${dayKeyValue}`}>
      <span className="flex items-baseline justify-between text-[14px] font-extrabold">
        Quer contar algo sobre o dia?
        <span className="text-[12px] font-bold text-muted">{saved ? 'Guardado' : 'Guardando…'}</span>
      </span>
      <textarea
        id={`note-${dayKeyValue}`}
        className="field min-h-[96px] resize-none"
        value={text}
        placeholder="Só você vê isso. Fica guardado no seu celular."
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
      />
    </label>
  );
}

const PAPER = ['#FFD660', '#FF9AB0', '#93CCF5', '#93D6A9', '#B39AE6', '#FFB38A'];

function Jar({ notes }: { notes: JarNote[] }) {
  const [text, setText] = useState('');
  const [drawn, setDrawn] = useState<JarNote | null>(null);
  const shown = notes.slice(-28);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const res = addJarNote(text);
    setText('');
    toast(res ? `No pote! +${res.reward} sementinhas` : 'Guardado no pote');
  }

  function draw() {
    if (!notes.length) return;
    const pool = notes.length > 1 && drawn ? notes.filter((n) => n.id !== drawn.id) : notes;
    setDrawn(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <section className="card grid gap-4 p-4" aria-label="Pote de coisas boas">
      <div className="flex items-start gap-4">
        <svg viewBox="0 0 100 120" width="92" height="110" className="shrink-0 text-muted" role="img" aria-label={`Pote com ${notes.length} bilhetes`}>
          <rect x="28" y="6" width="44" height="12" rx="4" fill="var(--gold)" />
          <path d="M24 22 H76 C84 22 88 30 88 40 V100 C88 110 80 116 70 116 H30 C20 116 12 110 12 100 V40 C12 30 16 22 24 22 Z" fill="var(--surface-2)" stroke="currentColor" strokeWidth="3" opacity="0.9" />
          {shown.map((n, i) => {
            const h = hashStr(n.id);
            const col = i % 4;
            const row = Math.floor(i / 4);
            const x = 20 + col * 16 + (h % 6);
            const y = 104 - row * 11 - (h % 4);
            return <rect key={n.id} x={x} y={y} width="13" height="8" rx="2" fill={PAPER[h % PAPER.length]} transform={`rotate(${(h % 30) - 15} ${x + 6} ${y + 4})`} />;
          })}
        </svg>
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-bold leading-tight">Pote de coisas boas</h2>
          <p className="text-[15px] text-muted">
            Guarde uma coisa boa por dia, mesmo pequenininha. No dia ruim, tire um bilhete e lembre.
          </p>
          <p className="mt-1 text-[14px] font-extrabold tabular-nums">{notes.length} {notes.length === 1 ? 'bilhete' : 'bilhetes'}</p>
        </div>
      </div>

      <form className="flex gap-2" onSubmit={save}>
        <label className="sr-only" htmlFor="jar-text">
          Uma coisa boa de hoje
        </label>
        <input id="jar-text" className="field min-w-0 flex-1" value={text} maxLength={140} placeholder="Ex.: o café de hoje tava bom" onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary shrink-0 px-4" type="submit" disabled={!text.trim()}>
          Guardar
        </button>
      </form>

      {notes.length > 0 && (
        <div className="grid gap-2">
          <button className="btn btn-soft" onClick={draw}>
            <Shuffle size={18} /> Tirar um bilhete
          </button>
          {drawn && (
            <figure className="paper-note" key={drawn.id} style={{ background: PAPER[hashStr(drawn.id) % PAPER.length] }}>
              <blockquote className="font-display text-[20px] font-semibold leading-snug">{drawn.text}</blockquote>
              <figcaption className="mt-1 text-[13px] font-bold opacity-70">{formatDay(drawn.date)}</figcaption>
            </figure>
          )}
        </div>
      )}
    </section>
  );
}

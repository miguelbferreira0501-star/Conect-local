import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Copy, Lock, Phone, Shuffle, Trash2, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { LineChart, toast } from '../components/ui';
import { AFFIRMATIONS, EMOTIONS, MOODS, REFLECTIONS } from '../data/lines';
import { BODY_SCAN, BREATHS, MEDITATION_CUES, QUIZZES, SLEEP_ROUTINE } from '../data/wellbeing';
import { addJar, addJournal, dayOf, deleteJar, deleteJournal, isPremium, logEvent, setEmotions, setMood, todayKey, useApp } from '../lib/store';
import { addDays, copyText, formatDay, hashStr } from '../lib/util';
import type { Mood } from '../types';

type Tool = 'respirar' | 'meditar' | 'foco' | 'relaxar' | 'sono' | 'afirmacoes' | 'aterrar' | 'pote' | 'quiz' | null;

const TOOLS: { id: Exclude<Tool, null>; emoji: string; title: string; desc: string }[] = [
  { id: 'respirar', emoji: '🌬️', title: 'Respirar', desc: '3 ritmos guiados pelo Hami' },
  { id: 'aterrar', emoji: '🖐️', title: '5-4-3-2-1', desc: 'Para crise de ansiedade' },
  { id: 'meditar', emoji: '🧘', title: 'Meditação', desc: '3, 5 ou 10 minutos' },
  { id: 'foco', emoji: '⏳', title: 'Foco', desc: 'Pomodoro com o Hami' },
  { id: 'relaxar', emoji: '🛀', title: 'Relaxar', desc: 'Escaneamento do corpo' },
  { id: 'sono', emoji: '🌙', title: 'Para dormir', desc: 'Rotina de desacelerar' },
  { id: 'afirmacoes', emoji: '💐', title: 'Afirmações', desc: 'Frases para guardar' },
  { id: 'pote', emoji: '🫙', title: 'Pote de coisas boas', desc: 'Momentos felizes' },
  { id: 'quiz', emoji: '🧩', title: 'Quizzes', desc: 'Conhecer o seu jeito' },
];

export function Wellbeing() {
  const s = useApp();
  const today = todayKey();
  const day = dayOf(s, today);
  const [tool, setTool] = useState<Tool>(null);
  const range = isPremium(s) ? 180 : 30;
  const moodPoints = Array.from({ length: range }, (_, i) => addDays(today, -(range - 1 - i)))
    .filter((k) => s.days[k]?.mood)
    .map((k) => ({ label: formatDay(k, { day: 'numeric', month: 'short' }), value: s.days[k].mood! }));

  return (
    <div className="grid gap-4">
      <header>
        <p className="eyebrow">Só você vê o que escreve aqui</p>
        <h1 className="font-display text-[30px] font-bold leading-tight">Bem-estar</h1>
      </header>

      <section className="card grid gap-3 p-4" aria-label="Humor de hoje">
        <h2 className="font-display text-[20px] font-bold">Como você está agora?</h2>
        <div className="flex justify-between gap-1">
          {MOODS.map((m) => (
            <button key={m.value} className="mood-opt" aria-pressed={day.mood === m.value} aria-label={m.label} onClick={() => setMood(m.value as Mood)}>
              <span className="text-[28px] leading-none">{m.emoji}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map((e) => {
            const on = day.emotions?.includes(e);
            return (
              <button key={e} className={`chip ${on ? 'chip-accent' : 'chip-plain'}`} aria-pressed={!!on} onClick={() => setEmotions(on ? (day.emotions ?? []).filter((x) => x !== e) : [...(day.emotions ?? []), e])}>
                {e}
              </button>
            );
          })}
        </div>
        <LineChart points={moodPoints} label="Seu humor" min={1} max={5} tone="var(--accent)" />
        <p className="text-[12px] text-muted">1 = muito difícil · 5 = muito bem. Últimos {range} dias.</p>
      </section>

      <Journal />

      <section className="grid gap-2" aria-label="Ferramentas">
        <h2 className="font-display text-[21px] font-bold">Ferramentas</h2>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map((t) => (
            <button key={t.id} className="tile !justify-items-start !p-3 text-left" onClick={() => setTool(t.id)}>
              <span className="text-[28px] leading-none">{t.emoji}</span>
              <span className="font-display text-[17px] font-bold leading-tight">{t.title}</span>
              <span className="text-[12px] text-muted">{t.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <SosCard />

      {tool === 'respirar' && <Breath onClose={() => setTool(null)} />}
      {tool === 'aterrar' && <Grounding onClose={() => setTool(null)} />}
      {tool === 'meditar' && <Meditate onClose={() => setTool(null)} />}
      {tool === 'foco' && <Focus onClose={() => setTool(null)} />}
      {tool === 'relaxar' && <Steps title="Relaxar" items={BODY_SCAN.map((b) => ({ t: b.part, d: b.text }))} onClose={() => setTool(null)} />}
      {tool === 'sono' && <SleepRoutine onClose={() => setTool(null)} onBreath={() => setTool('respirar')} />}
      {tool === 'afirmacoes' && <Affirmations onClose={() => setTool(null)} />}
      {tool === 'pote' && <Jar onClose={() => setTool(null)} />}
      {tool === 'quiz' && <Quiz onClose={() => setTool(null)} />}
    </div>
  );
}

function Journal() {
  const s = useApp();
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState(() => REFLECTIONS[hashStr(todayKey()) % REFLECTIONS.length]);
  const [usePrompt, setUsePrompt] = useState(true);
  const recent = [...s.journal].reverse().slice(0, 6);
  return (
    <section className="card grid gap-3 p-4" aria-label="Diário">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold">Diário</h2>
        <span className="chip chip-plain">
          <Lock size={13} /> Privado
        </span>
      </div>
      {usePrompt && (
        <div className="flex items-start gap-2 rounded-2xl bg-accent-soft p-3">
          <p className="min-w-0 flex-1 text-[15px] font-semibold">{prompt}</p>
          <button className="icon-btn !h-8 !w-8" aria-label="Outra reflexão" onClick={() => setPrompt(REFLECTIONS[(REFLECTIONS.indexOf(prompt) + 1) % REFLECTIONS.length])}>
            <Shuffle size={15} />
          </button>
        </div>
      )}
      <label className="sr-only" htmlFor="journal-text">
        Escreva no diário
      </label>
      <textarea id="journal-text" className="field min-h-[110px] resize-none" placeholder="Escreva do seu jeito. Ninguém mais vê." value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => setUsePrompt(!usePrompt)}>
          {usePrompt ? 'Escrever livre' : 'Usar reflexão guiada'}
        </button>
        <button
          className="btn btn-primary btn-sm flex-1"
          disabled={!text.trim()}
          onClick={() => {
            addJournal(text, usePrompt ? prompt : undefined);
            setText('');
            toast('Guardado no diário');
          }}
        >
          Guardar
        </button>
      </div>
      {recent.length > 0 && (
        <ul className="grid gap-2">
          {recent.map((j) => (
            <li key={j.id} className="rounded-2xl bg-surface2 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-muted">{formatDay(j.date, { day: 'numeric', month: 'long' })}</p>
                  {j.prompt && <p className="text-[13px] italic text-muted">{j.prompt}</p>}
                  <p className="whitespace-pre-wrap text-[15px]">{j.text}</p>
                </div>
                <button className="icon-btn !h-8 !w-8" aria-label="Apagar texto" onClick={() => deleteJournal(j.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SosCard() {
  return (
    <section className="card grid gap-3 p-4" aria-label="Ajuda agora">
      <div>
        <h2 className="font-display text-[20px] font-bold leading-tight">Precisa de ajuda agora?</h2>
        <p className="text-[15px] text-muted">Se você está pensando em se machucar ou não está conseguindo sozinho, fale com alguém. Você merece apoio.</p>
      </div>
      <HelpLine name="CVV: apoio emocional, grátis, 24h" number="188" />
      <HelpLine name="SAMU: emergência médica" number="192" />
      <p className="text-[14px] text-muted">
        Também dá pra conversar por chat no site{' '}
        <a className="font-bold text-accent underline underline-offset-4" href="https://cvv.org.br" target="_blank" rel="noreferrer">
          cvv.org.br
        </a>
        . O HamiCare ajuda no dia a dia, mas não substitui terapia nem atendimento médico.
      </p>
    </section>
  );
}

function HelpLine({ name, number }: { name: string; number: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-muted">{name}</p>
        <p className="select-all font-display text-[26px] font-bold leading-none tabular-nums">{number}</p>
      </div>
      <a className="icon-btn" href={`tel:${number}`} aria-label={`Ligar para ${number}`}>
        <Phone size={18} />
      </a>
      <button className="icon-btn" aria-label={`Copiar ${number}`} onClick={async () => toast((await copyText(number)) ? 'Número copiado' : `O número é ${number}`)}>
        <Copy size={18} />
      </button>
    </div>
  );
}

function Screen({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mx-auto grid max-w-[440px] gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] font-bold">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PetBig({ mood = 'calmo', size = 200 }: { mood?: 'calmo' | 'feliz' | 'animado' | 'dormindo'; size?: number }) {
  const s = useApp();
  return <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={mood} size={size} idle={false} label={s.pet.name} />;
}

function Breath({ onClose }: { onClose: () => void }) {
  const [pat, setPat] = useState(BREATHS[0]);
  const [step, setStep] = useState(-1);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (step < 0 || finished) return;
    timer.current = window.setTimeout(() => {
      if (step + 1 >= pat.cycles * pat.phases.length) {
        setFinished(true);
        logEvent('respirar');
      } else setStep(step + 1);
    }, pat.phases[step % pat.phases.length].ms);
  }, [step, finished, pat]);
  const phase = step >= 0 && !finished ? pat.phases[step % pat.phases.length] : null;
  return (
    <Screen title="Respirar" onClose={onClose}>
      {step < 0 && (
        <div className="grid gap-2">
          {BREATHS.map((b) => (
            <button key={b.id} className="opt" aria-pressed={pat.id === b.id} onClick={() => setPat(b)}>
              <span className="min-w-0">
                <span className="block">{b.name}</span>
                <span className="block text-[13px] font-semibold text-muted">{b.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="grid justify-items-center gap-4 text-center">
        <div className="breath-pet" style={{ transform: `scale(${phase ? phase.scale : 1})`, transitionDuration: `${phase ? phase.ms : 600}ms` }}>
          <PetBig mood={finished ? 'feliz' : 'calmo'} />
        </div>
        <div className="grid min-h-[80px] gap-1" aria-live="polite">
          <p className="font-display text-[26px] font-bold leading-tight">{finished ? 'Pronto. Como você tá agora?' : phase ? phase.label : `Siga o tamanho do Hami`}</p>
          {phase && <p className="tabular-nums text-muted">Respiração {Math.floor(step / pat.phases.length) + 1} de {pat.cycles}</p>}
        </div>
        {(step < 0 || finished) && (
          <button className="btn btn-primary w-full" onClick={() => (setFinished(false), setStep(0))}>
            {finished ? 'De novo' : 'Começar'}
          </button>
        )}
      </div>
    </Screen>
  );
}

const SENSES = [
  { n: 5, text: 'coisas que você consegue ver agora' },
  { n: 4, text: 'coisas que você pode tocar' },
  { n: 3, text: 'sons que você está ouvindo' },
  { n: 2, text: 'cheiros que você sente (ou de que gosta)' },
  { n: 1, text: 'gosto na boca, ou uma comida que você ama' },
];

function Grounding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const sense = SENSES[Math.min(i, SENSES.length - 1)];
  if (i >= SENSES.length) {
    return (
      <Screen title="5-4-3-2-1" onClose={onClose}>
        <div className="grid justify-items-center gap-4 text-center">
          <PetBig mood="feliz" size={170} />
          <p className="font-display text-[26px] font-bold leading-tight">Você tá aqui, agora. Isso já ajuda.</p>
          <button className="btn btn-primary w-full" onClick={onClose}>
            Voltar
          </button>
        </div>
      </Screen>
    );
  }
  return (
    <Screen title="5-4-3-2-1" onClose={onClose}>
      <div className="grid justify-items-center gap-5 text-center">
        <p className="font-display text-[96px] font-extrabold leading-none text-accent tabular-nums">{sense.n}</p>
        <p className="font-display text-[26px] font-bold leading-tight">{sense.text}</p>
        <p className="text-muted">Toque numa bolinha a cada coisa que você encontrar.</p>
        <div className="flex gap-3">
          {Array.from({ length: sense.n }, (_, k) => (
            <button key={k} className="sense-dot" aria-pressed={k < count} aria-label={`Item ${k + 1}`} onClick={() => setCount(Math.max(count, k + 1))} />
          ))}
        </div>
        <button className="btn btn-primary w-full" onClick={() => (setI(i + 1), setCount(0))}>
          {count >= sense.n ? 'Próximo' : 'Pular'}
        </button>
      </div>
    </Screen>
  );
}

function useCountdown(totalSec: number | null, onEnd: () => void) {
  const [left, setLeft] = useState(totalSec ?? 0);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (totalSec === null) return;
    setLeft(totalSec);
    const started = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, totalSec - Math.floor((Date.now() - started) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        end.current();
      }
    }, 500);
    return () => clearInterval(id);
  }, [totalSec]);
  return left;
}

const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

function Meditate({ onClose }: { onClose: () => void }) {
  const [mins, setMins] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const left = useCountdown(mins ? mins * 60 : null, () => (setDone(true), logEvent('respirar')));
  const cue = mins ? MEDITATION_CUES[Math.min(MEDITATION_CUES.length - 1, Math.floor(((mins * 60 - left) / (mins * 60)) * MEDITATION_CUES.length))] : '';
  return (
    <Screen title="Meditação" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        <PetBig mood={done ? 'feliz' : 'calmo'} size={180} />
        {!mins ? (
          <>
            <p className="text-[16px]">Escolha quanto tempo. O Hami medita junto com você.</p>
            <div className="grid w-full grid-cols-3 gap-2">
              {[3, 5, 10].map((m) => (
                <button key={m} className="btn btn-soft" onClick={() => setMins(m)}>
                  {m} min
                </button>
              ))}
            </div>
          </>
        ) : done ? (
          <>
            <p className="font-display text-[24px] font-bold">Que bom que você se deu esse tempo.</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </>
        ) : (
          <>
            <p className="font-display text-[44px] font-bold tabular-nums">{mmss(left)}</p>
            <p className="min-h-[56px] text-[18px] font-semibold" aria-live="polite">
              {cue}
            </p>
          </>
        )}
      </div>
    </Screen>
  );
}

function Focus({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'pronto' | 'foco' | 'pausa' | 'fim'>('pronto');
  const left = useCountdown(phase === 'foco' ? 25 * 60 : phase === 'pausa' ? 5 * 60 : null, () => setPhase((p) => (p === 'foco' ? 'pausa' : 'fim')));
  return (
    <Screen title="Foco" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        <PetBig mood={phase === 'pausa' ? 'feliz' : phase === 'fim' ? 'animado' : 'calmo'} size={170} />
        {phase === 'pronto' && (
          <>
            <p className="text-[16px]">25 minutos de foco e 5 de pausa. Deixe o celular de lado: o Hami cuida do tempo.</p>
            <button className="btn btn-primary w-full" onClick={() => setPhase('foco')}>
              Começar foco
            </button>
          </>
        )}
        {(phase === 'foco' || phase === 'pausa') && (
          <>
            <p className="eyebrow">{phase === 'foco' ? 'Foco' : 'Pausa: estica as pernas'}</p>
            <p className="font-display text-[52px] font-bold tabular-nums">{mmss(left)}</p>
            <button className="btn btn-ghost w-full" onClick={() => setPhase('fim')}>
              Encerrar
            </button>
          </>
        )}
        {phase === 'fim' && (
          <>
            <p className="font-display text-[24px] font-bold">Bloco concluído. Orgulho!</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </>
        )}
      </div>
    </Screen>
  );
}

function Steps({ title, items, onClose }: { title: string; items: { t: string; d: string }[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const end = i >= items.length;
  return (
    <Screen title={title} onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        <PetBig mood={end ? 'feliz' : 'calmo'} size={170} />
        {end ? (
          <>
            <p className="font-display text-[24px] font-bold">Corpo mais leve. Fica um pouquinho aqui.</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">
              {i + 1} de {items.length} · {items[i].t}
            </p>
            <p className="min-h-[80px] font-display text-[24px] font-bold leading-snug">{items[i].d}</p>
            <button className="btn btn-primary w-full" onClick={() => setI(i + 1)}>
              Próximo
            </button>
          </>
        )}
      </div>
    </Screen>
  );
}

function SleepRoutine({ onClose, onBreath }: { onClose: () => void; onBreath: () => void }) {
  const [done, setDone] = useState<string[]>([]);
  return (
    <Screen title="Para dormir" onClose={onClose}>
      <div className="grid gap-3">
        <div className="flex justify-center">
          <PetBig mood="dormindo" size={150} />
        </div>
        {SLEEP_ROUTINE.map((r) => (
          <button key={r.id} className="opt" aria-pressed={done.includes(r.id)} onClick={() => setDone(done.includes(r.id) ? done.filter((x) => x !== r.id) : [...done, r.id])}>
            <span className="text-[22px]">{r.emoji}</span> {r.text}
          </button>
        ))}
        <button className="btn btn-primary" onClick={onBreath}>
          🌙 Respiração para dormir
        </button>
      </div>
    </Screen>
  );
}

function Affirmations({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(() => hashStr(todayKey()) % AFFIRMATIONS.length);
  return (
    <Screen title="Afirmações" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        <PetBig mood="feliz" size={150} />
        <p className="min-h-[110px] font-display text-[28px] font-bold leading-snug">“{AFFIRMATIONS[i]}”</p>
        <div className="flex w-full gap-2">
          <button className="btn btn-soft flex-1" onClick={() => setI((i + 1) % AFFIRMATIONS.length)}>
            Outra
          </button>
          <button className="btn btn-primary flex-1" onClick={() => (addJar(AFFIRMATIONS[i]), toast('Guardada no pote'))}>
            Guardar no pote
          </button>
        </div>
      </div>
    </Screen>
  );
}

const PAPER = ['#FFD660', '#FF9AB0', '#93CCF5', '#93D6A9', '#B39AE6', '#FFB38A'];

function Jar({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [text, setText] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const note = s.jar.find((n) => n.id === drawn);
  return (
    <Screen title="Pote de coisas boas" onClose={onClose}>
      <p className="text-[15px] text-muted">Guarde uma coisa boa por dia, mesmo pequenininha. No dia ruim, tire um bilhete e lembre.</p>
      <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), text.trim() && (addJar(text), setText(''), toast('No pote!')))}>
        <label className="sr-only" htmlFor="jar-text">
          Uma coisa boa
        </label>
        <input id="jar-text" className="field min-w-0 flex-1" maxLength={140} placeholder="Ex.: o café de hoje tava bom" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary shrink-0" type="submit" disabled={!text.trim()}>
          Guardar
        </button>
      </form>
      <p className="font-display text-[20px] font-bold tabular-nums">{s.jar.length} bilhetes no pote</p>
      {s.jar.length > 0 && (
        <button className="btn btn-soft" onClick={() => setDrawn(s.jar[Math.floor(Math.random() * s.jar.length)].id)}>
          <Shuffle size={18} /> Tirar um bilhete
        </button>
      )}
      {note && (
        <figure className="paper-note" key={note.id} style={{ background: PAPER[hashStr(note.id) % PAPER.length] }}>
          <blockquote className="font-display text-[20px] font-semibold leading-snug">{note.text}</blockquote>
          <figcaption className="mt-1 flex items-center justify-between text-[13px] font-bold opacity-70">
            {formatDay(note.date)}
            <button className="underline" onClick={() => (deleteJar(note.id), setDrawn(null))}>
              apagar
            </button>
          </figcaption>
        </figure>
      )}
    </Screen>
  );
}

function Quiz({ onClose }: { onClose: () => void }) {
  const [quiz, setQuiz] = useState<(typeof QUIZZES)[number] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  if (!quiz) {
    return (
      <Screen title="Quizzes" onClose={onClose}>
        <p className="text-[14px] text-muted">Para se conhecer melhor. Não são testes de saúde e não dão diagnóstico.</p>
        {QUIZZES.map((q) => (
          <button key={q.id} className="opt" onClick={() => (setQuiz(q), setAnswers([]))}>
            <span className="min-w-0 flex-1">{q.title}</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        ))}
      </Screen>
    );
  }
  const qi = answers.length;
  const done = qi >= quiz.questions.length;
  const top = done ? Object.entries(answers.reduce<Record<string, number>>((m, a) => ((m[a] = (m[a] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0][0] : null;
  return (
    <Screen title={quiz.title} onClose={onClose}>
      {done && top ? (
        <div className="grid justify-items-center gap-4 text-center">
          <PetBig mood="animado" size={150} />
          <p className="font-display text-[22px] font-bold leading-snug">{quiz.results[top]}</p>
          <button className="btn btn-primary w-full" onClick={() => setQuiz(null)}>
            Ver outros quizzes
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="eyebrow">
            Pergunta {qi + 1} de {quiz.questions.length}
          </p>
          <p className="bubble-pet text-[18px]">{quiz.questions[qi].q}</p>
          {quiz.questions[qi].a.map(([label, key]) => (
            <button key={label} className="opt" onClick={() => setAnswers([...answers, key])}>
              {label}
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

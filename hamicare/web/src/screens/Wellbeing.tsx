import { play } from '../lib/sound';
import { MoodSlider } from '../components/MoodSlider';
import { PlusCard } from '../components/PlusCard';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Copy, Lock, Phone, Shuffle, Trash2, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { LineChart, toast } from '../components/ui';
import { AFFIRMATIONS, EMOTIONS, REFLECTIONS } from '../data/lines';
import { BODY_SCAN, BREATHS, MEDITATION_CUES, QUIZZES, SLEEP_ROUTINE } from '../data/wellbeing';
import { addJar, addJournal, dayOf, deleteJar, deleteJournal, getState, isPremium, logEvent, setEmotions, setMood, todayKey, todayTasks, toggleTask, useApp } from '../lib/store';
import { addDays, copyText, formatDay, hashStr, prefersReducedMotion } from '../lib/util';
import type { PetMood } from '../types';
import { Glyph } from '../components/art';

type Tool = 'sos' | 'respirar' | 'meditar' | 'foco' | 'relaxar' | 'sono' | 'afirmacoes' | 'aterrar' | 'pote' | 'quiz' | null;

/** Abrir uma ferramenta vindo de outra aba (ex.: o SOS do cantinho da calma, no Início). */
let requested: Tool = null;
export function requestTool(t: Exclude<Tool, null>) {
  requested = t;
}

const TOOLS: { id: Exclude<Tool, null>; emoji: string; title: string; desc: string; tint: string }[] = [
  { id: 'respirar', emoji: '🌬️', title: 'Respirar', desc: '3 ritmos guiados pelo Hami', tint: '#CFE8FF' },
  { id: 'aterrar', emoji: '🖐️', title: '5-4-3-2-1', desc: 'Para crise de ansiedade', tint: '#FFE2C4' },
  { id: 'meditar', emoji: '🧘', title: 'Meditação', desc: '3, 5 ou 10 minutos', tint: '#E3D7FF' },
  { id: 'foco', emoji: '🍅', title: 'Foco', desc: 'Pomodoro com o Hami', tint: '#FFD6CC' },
  { id: 'relaxar', emoji: '🛀', title: 'Relaxar', desc: 'A luz passa pelo corpo', tint: '#E9DDFF' },
  { id: 'sono', emoji: '🌙', title: 'Para dormir', desc: 'Acenda as estrelas', tint: '#D6DBFF' },
  { id: 'afirmacoes', emoji: '💐', title: 'Afirmações', desc: 'Frases para guardar', tint: '#FFD6E2' },
  { id: 'pote', emoji: '🫙', title: 'Pote de coisas boas', desc: 'Momentos felizes', tint: '#DFF5D2' },
  { id: 'quiz', emoji: '🧩', title: 'Quizzes', desc: 'Conhecer o seu jeito', tint: '#FFF1B8' },
];

export function Wellbeing({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  const today = todayKey();
  const day = dayOf(s, today);
  const [tool, setTool] = useState<Tool>(() => {
    const t = requested;
    requested = null;
    return t;
  });
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

      <button className="sos-btn" onClick={() => setTool('sos')}>
        <Glyph e="🫶" size={34} />
        <span className="min-w-0 text-left">
          <span className="block text-[18px] font-extrabold leading-tight">A ansiedade apertou?</span>
          <span className="block text-[13px] font-semibold opacity-85">SOS com o Hami: respirar, voltar para o agora e pedir ajuda se precisar</span>
        </span>
        <ChevronRight size={20} className="ml-auto shrink-0" />
      </button>

      <section className="card grid gap-3 p-4" aria-label="Humor de hoje">
        <h2 className="font-display text-[20px] font-bold">Como você está agora?</h2>
        <MoodSlider value={day.mood} onCommit={(m) => setMood(m)} />
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

      <PlusCard onOpen={onPlus} title="Seu humor em 6 meses" text="Com o Plus, os gráficos de humor e de bem-estar mostram 6 meses, não só 30 dias." />

      <Journal />

      <section className="grid gap-2" aria-label="Ferramentas">
        <h2 className="font-display text-[21px] font-bold">Ferramentas</h2>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map((t) => (
            <button key={t.id} className="tool-tile" onClick={() => setTool(t.id)}>
              <span className="tool-tile-ico" style={{ background: t.tint }} aria-hidden="true">
                <Glyph e={t.emoji} size={44} />
              </span>
              <span className="font-display text-[17px] font-bold leading-tight">{t.title}</span>
              <span className="text-[12px] font-semibold leading-tight text-muted">{t.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <SosCard />

      {tool === 'sos' && <Sos onClose={() => setTool(null)} />}
      {tool === 'respirar' && <Breath onClose={() => setTool(null)} />}
      {tool === 'aterrar' && <Grounding onClose={() => setTool(null)} />}
      {tool === 'meditar' && <Meditate onClose={() => setTool(null)} />}
      {tool === 'foco' && <Focus onClose={() => setTool(null)} />}
      {tool === 'relaxar' && <BodyScan onClose={() => setTool(null)} />}
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

// ---------- Ferramentas: cada uma com cenário próprio e o Hami reagindo ----------

type Theme = 'ceu' | 'noite' | 'aurora' | 'foco' | 'jardim' | 'rosa' | 'lavanda';

/** Cenário animado de fundo (nuvens, estrelas, pétalas, corações…). */
function Ambient({ theme }: { theme: Theme }) {
  const n = (i: number, m: number, k = 37) => (i * k) % m;
  return (
    <div className="ambient" aria-hidden="true">
      {(theme === 'noite' || theme === 'aurora') && (
        <>
          {Array.from({ length: 22 }, (_, i) => (
            <span key={i} className="amb-star" style={{ left: `${n(i, 100)}%`, top: `${n(i, 60, 23)}%`, animationDelay: `${(i % 7) * 0.4}s`, width: i % 4 ? 3 : 5, height: i % 4 ? 3 : 5 }} />
          ))}
          <span className="amb-moon" />
          <span className="amb-shooting" />
        </>
      )}
      {theme === 'aurora' && (
        <>
          <span className="amb-aurora amb-aurora-1" />
          <span className="amb-aurora amb-aurora-2" />
        </>
      )}
      {theme === 'ceu' && (
        <>
          <span className="amb-cloud" style={{ top: '9%', animationDuration: '46s' }} />
          <span className="amb-cloud" style={{ top: '26%', animationDuration: '62s', animationDelay: '-30s', transform: 'scale(0.7)' }} />
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="amb-bubble" style={{ left: `${n(i, 100, 29)}%`, animationDelay: `${i * 1.1}s`, width: 10 + (i % 3) * 8, height: 10 + (i % 3) * 8 }} />
          ))}
        </>
      )}
      {theme === 'jardim' &&
        Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="amb-petal" style={{ left: `${n(i, 100, 31)}%`, animationDelay: `${i * 0.9}s`, background: i % 3 ? '#FFC2D4' : '#FFFFFF' }} />
        ))}
      {theme === 'rosa' &&
        Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="amb-heart" style={{ left: `${n(i, 100, 41)}%`, animationDelay: `${i * 1.2}s`, fontSize: 14 + (i % 3) * 8 }}>
            <Glyph e="💗" size={16 + (i % 3) * 9} />
          </span>
        ))}
      {theme === 'lavanda' &&
        Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="amb-bubble amb-bubble-lilac" style={{ left: `${n(i, 100, 33)}%`, animationDelay: `${i * 1.3}s`, width: 12 + (i % 3) * 10, height: 12 + (i % 3) * 10 }} />
        ))}
      {theme === 'foco' && (
        <>
          <span className="amb-sun" />
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="amb-dust" style={{ left: `${n(i, 100, 27)}%`, top: `${n(i, 90, 19)}%`, animationDelay: `${i * 0.7}s` }} />
          ))}
        </>
      )}
    </div>
  );
}

function ToolScreen({ title, sub, theme, onClose, children }: { title: string; sub?: string; theme: Theme; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={`fullscreen tool-screen tool-${theme}`} role="dialog" aria-modal="true" aria-label={title}>
      <Ambient theme={theme} />
      <div className="relative z-[1] mx-auto grid max-w-[440px] gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="tool-title">{title}</h2>
            {sub && <p className="tool-sub">{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Sair">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PetBig({ mood = 'calmo', size = 200, oculos, className }: { mood?: PetMood; size?: number; oculos?: string; className?: string }) {
  const s = useApp();
  const outfit = oculos && !s.pet.outfit.oculos ? { ...s.pet.outfit, oculos } : s.pet.outfit;
  return (
    <div className={className} style={{ transformOrigin: '50% 100%' }}>
      <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={outfit} mood={mood} size={size} idle={false} label={s.pet.name} />
    </div>
  );
}

/** Pequena explosão de emojis (comemoração). */
function Burst({ emoji, k }: { emoji: string; k: number }) {
  if (!k) return null;
  return (
    <div className="burst" key={k} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ ['--a' as string]: `${i * 45}deg` }}>
          <Glyph e={emoji} size={26} />
        </span>
      ))}
    </div>
  );
}

function hop(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return;
  el.animate(
    [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.1,0.9)', offset: 0.15 }, { transform: 'translateY(-26px) scale(0.95,1.06)', offset: 0.45 }, { transform: 'translateY(0) scale(1.06,0.94)', offset: 0.8 }, { transform: 'translateY(0) scale(1,1)' }],
    { duration: 600, easing: 'cubic-bezier(0.23,1,0.32,1)' },
  );
}

// ---------- Respirar ----------

type BreathKind = 'in' | 'hold' | 'out' | 'wait';
const kindOf = (label: string): BreathKind => (/^puxa/i.test(label) ? 'in' : /^segura/i.test(label) ? 'hold' : /^solta/i.test(label) ? 'out' : 'wait');
const BREATH_LOOK: Record<BreathKind, { word: string; color: string; ring: number; mood: PetMood }> = {
  in: { word: 'Inspire', color: '#6FB7FF', ring: 1.3, mood: 'comendo' },
  hold: { word: 'Segure', color: '#B48CFF', ring: 1.3, mood: 'calmo' },
  out: { word: 'Solte', color: '#5FD3A2', ring: 0.9, mood: 'calmo' },
  wait: { word: 'Espere', color: '#FFC75F', ring: 0.9, mood: 'feliz' },
};

function Breath({ onClose, auto, next }: { onClose: () => void; auto?: boolean; next?: { label: string; go: () => void } }) {
  const [pat, setPat] = useState(BREATHS[0]);
  const [step, setStep] = useState(auto ? 0 : -1);
  const [finished, setFinished] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [felt, setFelt] = useState<string | null>(null);
  const started = useRef(0);
  const timer = useRef<number>();
  const pet = useRef<HTMLDivElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (step < 0 || finished) return;
    started.current = Date.now();
    timer.current = window.setTimeout(() => {
      if (step + 1 >= pat.cycles * pat.phases.length) {
        setFinished(true);
        logEvent('respirar');
        hop(pet.current);
      } else setStep(step + 1);
    }, pat.phases[step % pat.phases.length].ms);
  }, [step, finished, pat]);
  useEffect(() => {
    if (step < 0 || finished) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [step, finished]);

  const phase = step >= 0 && !finished ? pat.phases[step % pat.phases.length] : null;
  const kind = phase ? kindOf(phase.label) : null;
  // Som bem baixinho que sobe ao puxar o ar e desce ao soltar.
  useEffect(() => {
    if (!phase) return;
    if (kind === 'in') play('inspira', { ms: phase.ms });
    else if (kind === 'out') play('expira', { ms: phase.ms });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (finished) play('bomdia');
  }, [finished]);
  const lk = kind ? BREATH_LOOK[kind] : null;
  const secLeft = phase ? Math.max(1, Math.ceil((started.current + phase.ms - now) / 1000)) : 0;
  const cycle = Math.floor(Math.max(0, step) / pat.phases.length);
  const smooth = kind === 'in' || kind === 'out';
  const theme: Theme = pat.id === 'sono' ? 'noite' : 'ceu';

  return (
    <ToolScreen title="Respirar" sub={phase ? `Respiração ${cycle + 1} de ${pat.cycles}` : 'Respire junto com o Hami'} theme={theme} onClose={onClose}>
      {step < 0 && (
        <div className="grid gap-2">
          {BREATHS.map((b) => (
            <button key={b.id} className="opt" aria-pressed={pat.id === b.id} onClick={() => setPat(b)}>
              <span className="tool-ico" style={{ background: b.id === 'sono' ? '#D6DBFF' : b.id === 'caixa' ? '#E6DBFF' : '#CFE8FF' }} aria-hidden="true">
                <Glyph e={b.id === 'sono' ? '🌙' : b.id === 'caixa' ? '🟪' : '🌬️'} size={30} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block">{b.name}</span>
                <span className="block text-[13px] font-semibold text-muted">{b.desc}</span>
              </span>
              <span className="rhythm">{b.phases.map((p) => Math.round(p.ms / 1000)).join(' · ')}</span>
            </button>
          ))}
        </div>
      )}
      <div className="breath-stage">
        <span className="breath-ring" style={{ transform: `scale(${lk ? lk.ring : 1})`, transitionDuration: `${phase && smooth ? phase.ms : 500}ms`, borderColor: lk?.color ?? 'rgba(255,255,255,0.7)', boxShadow: `0 0 60px ${lk?.color ?? 'transparent'}` }} />
        <span className="breath-ring breath-ring-2" style={{ transform: `scale(${lk ? lk.ring * 1.12 : 1.1})`, transitionDuration: `${phase && smooth ? phase.ms + 300 : 500}ms`, borderColor: lk?.color ?? 'rgba(255,255,255,0.4)' }} />
        <div className="breath-pet" style={{ transform: `scale(${phase ? phase.scale : 1})`, transitionDuration: `${phase && smooth ? phase.ms : 500}ms` }}>
          <div ref={pet}>
            <PetBig mood={finished ? 'animado' : lk?.mood ?? 'feliz'} size={180} />
          </div>
        </div>
        {kind === 'out' && (
          <div className="breath-wind" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ animationDelay: `${i * 0.5}s` }} />
            ))}
          </div>
        )}
        {kind === 'hold' && <span className="breath-sparkle" aria-hidden="true"><Glyph e="✨" size={34} /></span>}
        {finished && <Burst emoji="💙" k={1} />}
      </div>
      <div className="grid justify-items-center gap-2 text-center" aria-live="polite">
        {phase && lk ? (
          <>
            <span className="breath-word" style={{ background: lk.color }}>
              {lk.word} <b className="tabular-nums">{secLeft}</b>
            </span>
            <p className="tool-text font-display text-[24px] font-bold leading-tight">{phase.label}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: pat.cycles }, (_, i) => (
                <span key={i} className={`cycle-dot ${i < cycle ? 'is-done' : i === cycle ? 'is-now' : ''}`} />
              ))}
            </div>
          </>
        ) : finished ? (
          <>
            <p className="tool-text font-display text-[26px] font-bold leading-tight">Pronto. Como você tá agora?</p>
            {felt ? (
              <p className="tool-text text-[16px] font-semibold">{felt}</p>
            ) : (
              <div className="grid w-full grid-cols-3 gap-2">
                {[
                  ['😌', 'Melhor', 'Que bom! Seu corpo agradece.'],
                  ['🙂', 'Igual', 'Tudo bem. Às vezes leva mais de uma vez.'],
                  ['😣', 'Ainda tenso', 'Tá tudo bem. Que tal mais uma rodada, bem devagar?'],
                ].map(([e, l, msg]) => (
                  <button key={l} className="opt flex-col !items-center !gap-0.5 !px-2 !py-2 text-[13px]" onClick={() => setFelt(msg)}>
                    <Glyph e={e} size={32} />
                    {l}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="tool-text font-display text-[22px] font-bold">O Hami enche as bochechas quando você puxa o ar</p>
        )}
      </div>
      {finished && next && (
        <button className="btn btn-primary w-full" onClick={next.go}>
          {next.label}
        </button>
      )}
      {(step < 0 || finished) && (
        <button className={`btn w-full ${finished && next ? 'btn-ghost' : 'btn-primary'}`} onClick={() => (setFinished(false), setFelt(null), setStep(0))}>
          {finished ? 'De novo' : 'Começar'}
        </button>
      )}
    </ToolScreen>
  );
}

// ---------- SOS da ansiedade: respirar → 5-4-3-2-1 → como está agora → ajuda ----------

function Sos({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [felt, setFelt] = useState<'melhor' | 'ainda' | null>(null);
  const [marked, setMarked] = useState<string[]>([]);

  // Conta como missão feita (se a pessoa tiver "Respirar" ou "5-4-3-2-1" no dia).
  function markMissions() {
    const day = dayOf(getState(), todayKey());
    const ids = todayTasks(getState()).filter((t) => ['respirar', 'aterrar'].includes(t.id) && !(t.id in day.done)).map((t) => t.id);
    ids.forEach((id) => toggleTask(id));
    setMarked(ids);
  }

  if (stage === 1) return <Breath auto onClose={onClose} next={{ label: 'Próximo: 5-4-3-2-1', go: () => setStage(2) }} />;
  if (stage === 2) return <Grounding onClose={onClose} next={{ label: 'Último passo', go: () => (markMissions(), setStage(3)) }} />;
  if (stage === 3) {
    return (
      <ToolScreen title="SOS com o Hami" sub="Passo 3 de 3" theme="lavanda" onClose={onClose}>
        <div className="grid justify-items-center gap-3 text-center">
          <PetBig mood={felt === 'melhor' ? 'animado' : 'calmo'} size={160} className={felt === 'melhor' ? 'hop-loop' : ''} />
          {!felt ? (
            <>
              <p className="tool-text font-display text-[24px] font-bold leading-tight">E agora, como você está?</p>
              <div className="grid w-full grid-cols-2 gap-2">
                <button className="opt flex-col !items-center !gap-1 !py-3" onClick={() => setFelt('melhor')}>
                  <Glyph e="😌" size={36} /> Mais calmo
                </button>
                <button className="opt flex-col !items-center !gap-1 !py-3" onClick={() => setFelt('ainda')}>
                  <Glyph e="😣" size={36} /> Ainda ansioso
                </button>
              </div>
            </>
          ) : felt === 'melhor' ? (
            <>
              <p className="tool-text font-display text-[24px] font-bold leading-tight">Que bom. Você atravessou isso.</p>
              <p className="tool-text text-[15px] opacity-90">Fique um pouquinho aqui antes de voltar. Se der, beba um copo d'água devagar.</p>
            </>
          ) : (
            <div className="grid w-full gap-2 text-left">
              <p className="tool-text text-center font-display text-[22px] font-bold leading-tight">Tudo bem. Às vezes leva mais tempo.</p>
              <ul className="grid gap-1.5 rounded-3xl bg-white/85 p-4 text-[14.5px] font-semibold text-ink">
                <li>• Lave o rosto com água fria ou segure algo gelado.</li>
                <li>• Mande uma mensagem para alguém de confiança.</li>
                <li>• Fique num lugar seguro e repita a respiração.</li>
              </ul>
              <HelpLine name="CVV: conversar com alguém agora, grátis, 24h" number="188" />
              <HelpLine name="SAMU: emergência médica" number="192" />
              <button className="btn btn-primary w-full" onClick={() => (setFelt(null), setStage(1))}>
                Respirar de novo
              </button>
            </div>
          )}
          {marked.length > 0 && <p className="tool-text text-[13px] font-bold opacity-80">Missão feita: {marked.length === 2 ? 'Respirar e 5-4-3-2-1' : marked[0] === 'respirar' ? 'Respirar com o Hami' : '5-4-3-2-1'}</p>}
          <button className={`btn w-full ${felt === 'ainda' ? 'btn-ghost' : 'btn-primary'}`} onClick={onClose}>
            Voltar
          </button>
        </div>
      </ToolScreen>
    );
  }
  return (
    <ToolScreen title="SOS com o Hami" sub="3 passos, uns 3 minutos" theme="lavanda" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        <PetBig mood="calmo" size={170} />
        <p className="tool-text font-display text-[24px] font-bold leading-tight">Ei{s.profile.name ? `, ${s.profile.name}` : ''}. Eu tô aqui com você.</p>
        <p className="tool-text text-[16px] opacity-90">O que você está sentindo é forte, mas passa. Vamos juntos: primeiro respirar, depois voltar para o agora.</p>
        <ol className="grid w-full gap-1.5 text-left">
          {[
            ['🌬️', 'Respirar devagar com o Hami'],
            ['🖐️', '5-4-3-2-1: voltar para o agora'],
            ['🫶', 'Ver como você está e pedir ajuda se precisar'],
          ].map(([e, t], k) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 text-[15px] font-bold text-ink">
              <Glyph e={e} size={28} /> {k + 1}. {t}
            </li>
          ))}
        </ol>
        <button className="btn btn-primary w-full" onClick={() => setStage(1)}>
          Começar
        </button>
        <p className="tool-text text-[13px] opacity-80">Em perigo agora? Ligue 192 (SAMU). Para conversar com alguém, 188 (CVV).</p>
      </div>
    </ToolScreen>
  );
}

// ---------- 5-4-3-2-1 ----------

const SENSES: { n: number; text: string; emoji: string; verb: string; mood: PetMood; color: string }[] = [
  { n: 5, text: 'coisas que você consegue ver agora', emoji: '👀', verb: 'Olhe ao redor', mood: 'surpreso', color: '#6FB7FF' },
  { n: 4, text: 'coisas que você pode tocar', emoji: '🖐️', verb: 'Toque em algo', mood: 'feliz', color: '#FF9A4D' },
  { n: 3, text: 'sons que você está ouvindo', emoji: '👂', verb: 'Escute', mood: 'calmo', color: '#A57CF0' },
  { n: 2, text: 'cheiros que você sente (ou de que gosta)', emoji: '👃', verb: 'Sinta o cheiro', mood: 'boca', color: '#FF6F91' },
  { n: 1, text: 'gosto na boca, ou uma comida que você ama', emoji: '👅', verb: 'Sinta o gosto', mood: 'comendo', color: '#5FBF77' },
];

function Grounding({ onClose, next }: { onClose: () => void; next?: { label: string; go: () => void } }) {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const [pop, setPop] = useState(0);
  const pet = useRef<HTMLDivElement>(null);
  const done = i >= SENSES.length;
  const sense = SENSES[Math.min(i, SENSES.length - 1)];
  const full = count >= sense.n;
  return (
    <ToolScreen title="5-4-3-2-1" sub="Volte para o agora, um sentido de cada vez" theme="jardim" onClose={onClose}>
      <div className="sense-steps">
        {SENSES.map((x, k) => (
          <span key={x.n} className={k < i ? 'is-done' : k === i && !done ? 'is-now' : ''} style={{ ['--c' as string]: x.color }}>
            {k < i || done ? '✓' : x.n}
          </span>
        ))}
      </div>
      {done ? (
        <div className="grid justify-items-center gap-4 text-center">
          <div className="relative">
            <PetBig mood="animado" size={190} className="hop-loop" />
            <Burst emoji="🌼" k={1} />
          </div>
          <p className="tool-text font-display text-[26px] font-bold leading-tight">Você tá aqui, agora. Isso já ajuda muito.</p>
          <button className="btn btn-primary w-full" onClick={next ? next.go : onClose}>
            {next ? next.label : 'Voltar'}
          </button>
        </div>
      ) : (
        <div className="grid justify-items-center gap-4 text-center">
          <div className="sense-stage">
            <span className="sense-num" style={{ background: sense.color }}>
              {sense.n}
            </span>
            <div ref={pet} className="relative">
              <PetBig mood={full ? 'animado' : sense.mood} size={170} />
              <span className="sense-emoji" key={i}>
                <Glyph e={sense.emoji} size={52} />
              </span>
            </div>
            {pop > 0 && (
              <span className="sense-pop" key={pop}>
                +1
              </span>
            )}
          </div>
          <p className="tool-text font-display text-[24px] font-bold leading-tight">
            {sense.verb}: {sense.n} {sense.text}
          </p>
          <p className="tool-text text-[14px] opacity-80">Toque numa bolinha a cada coisa que você encontrar.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from({ length: sense.n }, (_, k) => (
              <button
                key={k}
                className="sense-ball"
                aria-pressed={k < count}
                style={{ ['--c' as string]: sense.color }}
                aria-label={`Item ${k + 1}`}
                onClick={() => {
                  if (k < count) return;
                  setCount(k + 1);
                  setPop(Date.now());
                  hop(pet.current);
                }}
              >
                {k < count ? <Glyph e={sense.emoji} size={26} /> : ''}
              </button>
            ))}
          </div>
          <button className="btn btn-primary w-full" onClick={() => (setI(i + 1), setCount(0))}>
            {full ? 'Próximo' : 'Pular'}
          </button>
        </div>
      )}
    </ToolScreen>
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

/** Anel de progresso em volta do Hami. */
function Ring({ progress, color, size = 260, children }: { progress: number; color: string; size?: number; children: React.ReactNode }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 600ms linear' }} />
      </svg>
      {children}
    </div>
  );
}

// ---------- Meditação ----------

function Meditate({ onClose }: { onClose: () => void }) {
  const [mins, setMins] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const left = useCountdown(mins ? mins * 60 : null, () => (setDone(true), logEvent('respirar')));
  const total = mins ? mins * 60 : 1;
  const cueIdx = mins ? Math.min(MEDITATION_CUES.length - 1, Math.floor(((total - left) / total) * MEDITATION_CUES.length)) : 0;
  return (
    <ToolScreen title="Meditação" sub={mins && !done ? 'O Hami medita junto com você' : 'Um tempinho só seu'} theme="aurora" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        {!mins ? (
          <>
            <PetBig mood="calmo" size={180} className="levitate" />
            <p className="tool-text text-[16px]">Escolha quanto tempo. Feche os olhos se quiser: o Hami avisa quando acabar.</p>
            <div className="grid w-full grid-cols-3 gap-2">
              {[
                [3, '🌱', 'Rapidinho'],
                [5, '🌿', 'Tranquilo'],
                [10, '🌳', 'Profundo'],
              ].map(([m, e, l]) => (
                <button key={m} className="opt flex-col !items-center !gap-0.5 !px-2 !py-3" onClick={() => setMins(m as number)}>
                  <Glyph e={e as string} size={34} />
                  <span className="font-display text-[20px] font-bold">{m} min</span>
                  <span className="text-[12px] font-semibold text-muted">{l}</span>
                </button>
              ))}
            </div>
          </>
        ) : done ? (
          <>
            <div className="relative">
              <PetBig mood="animado" size={190} className="hop-loop" />
              <Burst emoji="⭐" k={1} />
            </div>
            <p className="tool-text font-display text-[26px] font-bold">Que bom que você se deu esse tempo.</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </>
        ) : (
          <>
            <Ring progress={(total - left) / total} color="#B9A6FF">
              <div className="aura-glow" />
              <PetBig mood="calmo" size={170} className="levitate" />
            </Ring>
            <p className="tool-text font-display text-[40px] font-bold tabular-nums">{mmss(left)}</p>
            <p className="cue tool-text min-h-[56px] text-[19px] font-semibold" key={cueIdx} aria-live="polite">
              {MEDITATION_CUES[cueIdx]}
            </p>
          </>
        )}
      </div>
    </ToolScreen>
  );
}

// ---------- Foco ----------

function Focus({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'pronto' | 'foco' | 'pausa' | 'fim'>('pronto');
  const total = phase === 'foco' ? 25 * 60 : phase === 'pausa' ? 5 * 60 : null;
  const left = useCountdown(total, () => setPhase((p) => (p === 'foco' ? 'pausa' : 'fim')));
  return (
    <ToolScreen title="Foco" sub={phase === 'foco' ? 'Celular de lado. O Hami cuida do tempo.' : phase === 'pausa' ? 'Pausa: estica as pernas!' : 'Pomodoro com o Hami'} theme="foco" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        {phase === 'pronto' && (
          <>
            <div className="relative">
              <PetBig mood="feliz" size={180} oculos="redondos" />
              <span className="focus-book" aria-hidden="true">
                <Glyph e="📖" size={44} />
              </span>
            </div>
            <p className="tool-text text-[16px]">25 minutos de foco e 5 de pausa. O Hami estuda junto (de óculos e tudo).</p>
            <button className="btn btn-primary w-full" onClick={() => setPhase('foco')}>
              Começar foco
            </button>
          </>
        )}
        {(phase === 'foco' || phase === 'pausa') && total && (
          <>
            <Ring progress={(total - left) / total} color={phase === 'foco' ? '#FF6A3D' : '#5FBF77'}>
              <div className="relative">
                <PetBig mood={phase === 'foco' ? 'calmo' : 'animado'} size={160} oculos={phase === 'foco' ? 'redondos' : undefined} className={phase === 'foco' ? 'reading' : 'stretch-loop'} />
                {phase === 'foco' && (
                  <span className="focus-book" aria-hidden="true">
                    <Glyph e="📖" size={44} />
                  </span>
                )}
              </div>
            </Ring>
            <p className="eyebrow !text-current"><Glyph e={phase === 'foco' ? '🍅' : '🌿'} size={18} className="gi" /> {phase === 'foco' ? 'Foco' : 'Pausa'}</p>
            <p className="tool-text font-display text-[52px] font-bold leading-none tabular-nums">{mmss(left)}</p>
            <button className="btn btn-ghost w-full" onClick={() => setPhase('fim')}>
              Encerrar
            </button>
          </>
        )}
        {phase === 'fim' && (
          <>
            <div className="relative">
              <PetBig mood="animado" size={180} className="hop-loop" />
              <Burst emoji="🍅" k={1} />
            </div>
            <p className="tool-text font-display text-[26px] font-bold">Bloco concluído. Orgulho!</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </>
        )}
      </div>
    </ToolScreen>
  );
}

// ---------- Relaxar (a luz desce pelo corpo do Hami) ----------

const SCAN_Y: Record<string, number> = { Pés: 90, Pernas: 80, Barriga: 66, Mãos: 70, Ombros: 50, Rosto: 40, 'Corpo todo': 62 };

function BodyScan({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const end = i >= BODY_SCAN.length;
  const part = BODY_SCAN[Math.min(i, BODY_SCAN.length - 1)];
  const all = part.part === 'Corpo todo';
  return (
    <ToolScreen title="Relaxar" sub={end ? 'Corpo mais leve' : `${i + 1} de ${BODY_SCAN.length} · ${part.part}`} theme="lavanda" onClose={onClose}>
      <div className="grid justify-items-center gap-4 text-center">
        <div className="scan-stage">
          <PetBig mood={end ? 'feliz' : 'calmo'} size={220} />
          {!end && <span className={`scan-band ${all ? 'scan-all' : ''}`} style={{ top: `${SCAN_Y[part.part] ?? 60}%` }} />}
          {end && <Burst emoji="💜" k={1} />}
        </div>
        {end ? (
          <>
            <p className="tool-text font-display text-[26px] font-bold">Fica mais um pouquinho aqui, bem soltinho.</p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Voltar
            </button>
          </>
        ) : (
          <>
            <span className="chip chip-plain">{part.part}</span>
            <p className="tool-text min-h-[80px] font-display text-[24px] font-bold leading-snug">{part.text}</p>
            <div className="flex gap-1.5">
              {BODY_SCAN.map((_, k) => (
                <span key={k} className={`cycle-dot ${k < i ? 'is-done' : k === i ? 'is-now' : ''}`} />
              ))}
            </div>
            <button className="btn btn-primary w-full" onClick={() => setI(i + 1)}>
              Próximo
            </button>
          </>
        )}
      </div>
    </ToolScreen>
  );
}

// ---------- Para dormir (cada passo acende uma estrela) ----------

function SleepRoutine({ onClose, onBreath }: { onClose: () => void; onBreath: () => void }) {
  const [done, setDone] = useState<string[]>([]);
  const all = done.length === SLEEP_ROUTINE.length;
  return (
    <ToolScreen title="Para dormir" sub={all ? 'Prontinho pra dormir' : `${done.length} de ${SLEEP_ROUTINE.length} estrelas acesas`} theme="noite" onClose={onClose}>
      <div className="sleep-sky" aria-hidden="true">
        {SLEEP_ROUTINE.map((r, k) => (
          <span key={r.id} className={`sleep-star ${done.includes(r.id) ? 'is-on' : ''}`} style={{ left: `${10 + k * 16}%`, top: `${k % 2 ? 14 : 44}%` }}>
            ★
          </span>
        ))}
      </div>
      <div className="relative flex justify-center">
        <PetBig mood="dormindo" size={170} className="sleep-breathe" />
        <span className="blanket blanket-on !w-[150px] !h-[64px]" aria-hidden="true" />
        <span className="zzz-rise" aria-hidden="true">
          <span>z</span>
          <span>z</span>
          <span>Z</span>
        </span>
      </div>
      <div className="grid gap-2">
        {SLEEP_ROUTINE.map((r) => (
          <button key={r.id} className="opt" aria-pressed={done.includes(r.id)} onClick={() => setDone(done.includes(r.id) ? done.filter((x) => x !== r.id) : [...done, r.id])}>
            <span className="tool-ico" style={{ background: done.includes(r.id) ? '#FFF1A8' : 'var(--soft-btn)' }} aria-hidden="true">
              <Glyph e={done.includes(r.id) ? '⭐' : r.emoji} size={30} />
            </span>
            <span className="min-w-0 flex-1">{r.text}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={onBreath}>
        <Glyph e="🌙" size={22} /> Respiração para dormir
      </button>
    </ToolScreen>
  );
}

// ---------- Afirmações ----------

function Affirmations({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(() => hashStr(todayKey()) % AFFIRMATIONS.length);
  const [burst, setBurst] = useState(0);
  const pet = useRef<HTMLDivElement>(null);
  return (
    <ToolScreen title="Afirmações" sub="Leia em voz alta, se tiver coragem 💛" theme="rosa" onClose={onClose}>
      <div className="grid justify-items-center gap-3 text-center">
        <div ref={pet} className="relative">
          <PetBig mood="animado" size={150} />
          <Burst emoji="💖" k={burst} />
        </div>
        <figure className="affirm-card" key={i}>
          <span className="affirm-quote" aria-hidden="true">
            “
          </span>
          <p className="font-display text-[27px] font-bold leading-snug">{AFFIRMATIONS[i]}</p>
        </figure>
        <div className="flex w-full gap-2">
          <button className="btn btn-soft flex-1" onClick={() => (setI((i + 1) % AFFIRMATIONS.length), hop(pet.current))}>
            Outra
          </button>
          <button className="btn btn-primary flex-1" onClick={() => (addJar(AFFIRMATIONS[i]), setBurst(Date.now()), toast('Guardada no pote'))}>
            Guardar no pote
          </button>
        </div>
      </div>
    </ToolScreen>
  );
}

// ---------- Pote de coisas boas (o pote enche de bilhetinhos) ----------

const PAPER = ['#FFD660', '#FF9AB0', '#93CCF5', '#93D6A9', '#B39AE6', '#FFB38A'];

function JarArt({ count, dropKey }: { count: number; dropKey: number }) {
  const n = Math.min(count, 36);
  return (
    <svg viewBox="0 0 200 220" width="190" height="209" aria-hidden="true">
      <rect x="62" y="12" width="76" height="20" rx="6" fill="#B07A52" />
      <rect x="58" y="28" width="84" height="10" rx="5" fill="#8A5A3B" />
      <path d="M50 44 Q48 38 58 38 L142 38 Q152 38 150 44 L158 190 Q160 208 140 208 L60 208 Q40 208 42 190 Z" fill="#E6F4FF" fillOpacity="0.55" stroke="#BFDDF2" strokeWidth="4" />
      {Array.from({ length: n }, (_, k) => {
        const row = Math.floor(k / 6);
        const col = k % 6;
        const x = 62 + col * 15 + (row % 2) * 7;
        const y = 192 - row * 15;
        const last = k === n - 1 && dropKey > 0;
        return (
          <g key={k} className={last ? 'jar-drop' : undefined} style={last ? { transformOrigin: `${x}px ${y}px` } : undefined}>
            <rect x={x - 7} y={y - 6} width="14" height="11" rx="3" fill={PAPER[k % PAPER.length]} transform={`rotate(${((k * 37) % 50) - 25} ${x} ${y})`} />
          </g>
        );
      })}
      <path d="M62 60 Q58 120 64 180" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function Jar({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [text, setText] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState(0);
  const [mood, setMoodPet] = useState<PetMood>('feliz');
  const note = s.jar.find((n) => n.id === drawn);
  return (
    <ToolScreen title="Pote de coisas boas" sub={`${s.jar.length} ${s.jar.length === 1 ? 'bilhete' : 'bilhetes'} guardados`} theme="jardim" onClose={onClose}>
      <div className="flex items-end justify-center gap-2">
        <PetBig mood={mood} size={120} />
        <JarArt count={s.jar.length} dropKey={dropKey} />
      </div>
      <p className="tool-text text-center text-[15px]">Guarde uma coisa boa por dia, mesmo pequenininha. No dia ruim, tire um bilhete e lembre.</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addJar(text);
          setText('');
          setDropKey(Date.now());
          setMoodPet('animado');
          setTimeout(() => setMoodPet('feliz'), 1200);
          toast('No pote!');
        }}
      >
        <label className="sr-only" htmlFor="jar-text">
          Uma coisa boa
        </label>
        <input id="jar-text" className="field min-w-0 flex-1" maxLength={140} placeholder="Ex.: o café de hoje tava bom" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary shrink-0" type="submit" disabled={!text.trim()}>
          Guardar
        </button>
      </form>
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
    </ToolScreen>
  );
}

// ---------- Quizzes ----------

function Quiz({ onClose }: { onClose: () => void }) {
  const [quiz, setQuiz] = useState<(typeof QUIZZES)[number] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const pet = useRef<HTMLDivElement>(null);
  if (!quiz) {
    return (
      <ToolScreen title="Quizzes" sub="Para se conhecer melhor" theme="lavanda" onClose={onClose}>
        <div className="flex justify-center">
          <PetBig mood="surpreso" size={140} />
        </div>
        <p className="tool-text text-[14px]">Não são testes de saúde e não dão diagnóstico. São só para pensar com carinho.</p>
        {QUIZZES.map((q, k) => (
          <button key={q.id} className="opt" onClick={() => (setQuiz(q), setAnswers([]))}>
            <span className="tool-ico" style={{ background: ['#FFE39A', '#CFE8FF', '#FFD6E2', '#DFF5D2'][k % 4] }} aria-hidden="true">
              <Glyph e={['🧩', '💭', '🌙', '🌻'][k % 4]} size={30} />
            </span>
            <span className="min-w-0 flex-1">{q.title}</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        ))}
      </ToolScreen>
    );
  }
  const qi = answers.length;
  const done = qi >= quiz.questions.length;
  const top = done ? Object.entries(answers.reduce<Record<string, number>>((m, a) => ((m[a] = (m[a] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0][0] : null;
  return (
    <ToolScreen title={quiz.title} sub={done ? 'Seu resultado' : `Pergunta ${qi + 1} de ${quiz.questions.length}`} theme="lavanda" onClose={onClose}>
      <div className="quiz-bar">
        {quiz.questions.map((_, k) => (
          <span key={k} className={k < qi ? 'is-done' : k === qi ? 'is-now' : ''} />
        ))}
      </div>
      {done && top ? (
        <div className="grid justify-items-center gap-4 text-center">
          <div className="relative">
            <PetBig mood="animado" size={160} className="hop-loop" />
            <Burst emoji="✨" k={1} />
          </div>
          <div className="affirm-card">
            <p className="font-display text-[22px] font-bold leading-snug">{quiz.results[top]}</p>
          </div>
          <button className="btn btn-primary w-full" onClick={() => setQuiz(null)}>
            Ver outros quizzes
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-end gap-2">
            <div ref={pet} className="relative shrink-0">
              <PetBig mood="surpreso" size={96} />
              <span className="think" aria-hidden="true">
                ?
              </span>
            </div>
            <p className="bubble-pet min-w-0 flex-1 text-[18px]" key={qi}>
              {quiz.questions[qi].q}
            </p>
          </div>
          {quiz.questions[qi].a.map(([label, key]) => (
            <button key={label} className="opt" onClick={() => (setAnswers([...answers, key]), hop(pet.current))}>
              {label}
            </button>
          ))}
        </div>
      )}
    </ToolScreen>
  );
}

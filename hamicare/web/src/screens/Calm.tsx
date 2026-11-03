import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Copy, Phone, Wind, Hand, X } from 'lucide-react';
import { Pet } from '../components/Pet';
import { toast } from '../components/ui';
import { AFFIRMATIONS } from '../data/lines';
import { completeIfListed, stageOf, useApp } from '../lib/store';
import { copyText, hashStr } from '../lib/util';

export function Calm() {
  const s = useApp();
  const [mode, setMode] = useState<'none' | 'breath' | 'ground'>('none');
  const affirmation = AFFIRMATIONS[hashStr(new Date().toDateString()) % AFFIRMATIONS.length];

  return (
    <div className="grid gap-4">
      <header>
        <p className="eyebrow">Pra quando apertar</p>
        <h1 className="font-display text-[30px] font-bold leading-tight">Calma</h1>
      </header>

      <blockquote className="card p-5">
        <p className="font-display text-[22px] font-semibold leading-snug">“{affirmation}”</p>
        <p className="mt-1 text-[14px] text-muted">Frase do dia de {s.petName}</p>
      </blockquote>

      <button className="calm-opt" onClick={() => setMode('breath')}>
        <span className="calm-icon bg-leaf-soft text-leaf">
          <Wind size={26} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-display text-[20px] font-bold leading-tight">Respirar com {s.petName}</span>
          <span className="block text-[14px] text-muted">1 minuto. Puxa quando ele enche, solta quando ele murcha.</span>
        </span>
        <ChevronRight className="shrink-0 text-muted" size={22} />
      </button>

      <button className="calm-opt" onClick={() => setMode('ground')}>
        <span className="calm-icon bg-accent-soft text-accent">
          <Hand size={26} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-display text-[20px] font-bold leading-tight">Voltar pro agora (5-4-3-2-1)</span>
          <span className="block text-[14px] text-muted">Pra crise de ansiedade: usa os cinco sentidos pra acalmar a cabeça.</span>
        </span>
        <ChevronRight className="shrink-0 text-muted" size={22} />
      </button>

      <SosCard />

      {mode === 'breath' && <Breath onClose={() => setMode('none')} />}
      {mode === 'ground' && <Grounding onClose={() => setMode('none')} />}
    </div>
  );
}

function SosCard() {
  return (
    <section className="card grid gap-3 p-5" aria-label="Ajuda agora">
      <div>
        <h2 className="font-display text-[20px] font-bold leading-tight">Precisa de ajuda agora?</h2>
        <p className="text-[15px] text-muted">
          Se você está pensando em se machucar ou não está conseguindo sozinho, fale com alguém. Você merece apoio.
        </p>
      </div>
      <div className="grid gap-2">
        <HelpLine name="CVV: apoio emocional, grátis, 24h" number="188" />
        <HelpLine name="SAMU: emergência médica" number="192" />
      </div>
      <p className="text-[14px] text-muted">
        Também dá pra conversar por chat no site{' '}
        <a className="font-bold text-accent underline underline-offset-4" href="https://cvv.org.br" target="_blank" rel="noreferrer">
          cvv.org.br
        </a>
        . O Xodó ajuda no dia a dia, mas não substitui terapia nem atendimento médico.
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
      <button
        className="icon-btn"
        aria-label={`Copiar ${number}`}
        onClick={async () => toast((await copyText(number)) ? 'Número copiado' : `O número é ${number}`)}
      >
        <Copy size={18} />
      </button>
    </div>
  );
}

const PHASES = [
  { label: 'Puxa o ar pelo nariz…', ms: 4000, scale: 1.22 },
  { label: 'Segura um pouquinho…', ms: 2000, scale: 1.22 },
  { label: 'Solta devagar pela boca…', ms: 6000, scale: 1 },
];
const CYCLES = 5;

function Breath({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [step, setStep] = useState(-1); // -1 = pronto pra começar
  const [finished, setFinished] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (step < 0 || finished) return;
    const phase = PHASES[step % PHASES.length];
    timer.current = window.setTimeout(() => {
      if (step + 1 >= CYCLES * PHASES.length) {
        setFinished(true);
        const res = completeIfListed('respirar');
        if (res) toast(`Cuidado feito: +${res.reward} sementinhas`);
      } else setStep(step + 1);
    }, phase.ms);
  }, [step, finished]);

  const phase = step >= 0 && !finished ? PHASES[step % PHASES.length] : null;
  const cycle = Math.min(CYCLES, Math.floor(Math.max(step, 0) / PHASES.length) + 1);

  return (
    <div className="calm-screen" role="dialog" aria-modal="true" aria-label="Respirar">
      <button className="icon-btn absolute right-4 top-4" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} onClick={onClose} aria-label="Sair">
        <X size={20} />
      </button>
      <div className="grid justify-items-center gap-6 text-center">
        <div
          className="breath-pet"
          style={{
            transform: `scale(${phase ? phase.scale : 1})`,
            transitionDuration: `${phase ? phase.ms : 600}ms`,
          }}
        >
          <Pet color={s.petColor} stage={stageOf(s.xp)} mood={finished ? 'feliz' : 'calmo'} hat={s.hat} acc={s.acc} size={200} idle={false} />
        </div>
        <div className="grid min-h-[96px] gap-2" aria-live="polite">
          {finished ? (
            <>
              <p className="font-display text-[26px] font-bold leading-tight">Pronto. Como você tá agora?</p>
              <p className="text-muted">Pode repetir quantas vezes quiser.</p>
            </>
          ) : phase ? (
            <>
              <p className="font-display text-[26px] font-bold leading-tight">{phase.label}</p>
              <p className="tabular-nums text-muted">
                Respiração {cycle} de {CYCLES}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-[26px] font-bold leading-tight">Vamos respirar juntos?</p>
              <p className="text-muted">Siga o tamanho de {s.petName}. São 5 respirações.</p>
            </>
          )}
        </div>
        {(step < 0 || finished) && (
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => {
                setFinished(false);
                setStep(0);
              }}
            >
              {finished ? 'De novo' : 'Começar'}
            </button>
            {finished && (
              <button className="btn btn-ghost" onClick={onClose}>
                Voltar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
  const s = useApp();
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const done = i >= SENSES.length;
  const sense = SENSES[Math.min(i, SENSES.length - 1)];

  return (
    <div className="calm-screen" role="dialog" aria-modal="true" aria-label="5-4-3-2-1">
      <button className="icon-btn absolute right-4 top-4" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} onClick={onClose} aria-label="Sair">
        <X size={20} />
      </button>
      {done ? (
        <div className="grid justify-items-center gap-4 text-center">
          <Pet color={s.petColor} stage={stageOf(s.xp)} mood="feliz" hat={s.hat} acc={s.acc} size={170} />
          <p className="font-display text-[26px] font-bold leading-tight">Você tá aqui, agora. Isso já ajuda.</p>
          <button className="btn btn-primary" onClick={onClose}>
            Voltar
          </button>
        </div>
      ) : (
        <div className="grid w-full max-w-[400px] justify-items-center gap-6 text-center">
          <p className="font-display text-[96px] font-extrabold leading-none text-accent tabular-nums">{sense.n}</p>
          <p className="font-display text-[26px] font-bold leading-tight">{sense.text}</p>
          <p className="text-muted">Toque numa bolinha a cada coisa que você encontrar.</p>
          <div className="flex gap-3">
            {Array.from({ length: sense.n }, (_, k) => (
              <button
                key={k}
                className="sense-dot"
                aria-pressed={k < count}
                aria-label={`Item ${k + 1}`}
                onClick={() => setCount(Math.max(count, k + 1))}
              />
            ))}
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              setI(i + 1);
              setCount(0);
            }}
          >
            {count >= sense.n ? 'Próximo' : 'Pular'}
          </button>
        </div>
      )}
    </div>
  );
}

// Missões rápidas: três missõezinhas que renovam a cada 8 horas (como no Finch, mas do nosso jeito):
// nomear a emoção de agora, escrever uma reflexão (mais longa vale mais) e completar uma meta.
import { useEffect, useState } from 'react';
import { Glyph } from './art';
import { Seed, Sheet, toast } from './ui';
import { play } from '../lib/sound';
import { EMOTIONS, REFLECTIONS } from '../data/lines';
import { claimQuickMeta, quickDone, quickEmotion, quickMetaReady, quickReflection, quickResetIn, useApp } from '../lib/store';
import { reflectionCoins, type QuickId } from '../shared/game';

const QUICK: { id: QuickId; emoji: string; title: string; sub: string }[] = [
  { id: 'emocao', emoji: '🫶', title: 'Nomeie sua emoção', sub: 'Como você está agora?' },
  { id: 'reflexao', emoji: '📝', title: 'Escreva uma reflexão', sub: 'Mais longa vale mais sementes' },
  { id: 'meta', emoji: '🎯', title: 'Complete uma meta', sub: 'Qualquer missão de hoje' },
];

function useResetText() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const total = Math.ceil(quickResetIn(new Date(now)) / 60_000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

export function QuickQuests({ onMeta }: { onMeta?: () => void }) {
  const s = useApp();
  const reset = useResetText();
  const [open, setOpen] = useState<QuickId | null>(null);
  const done = QUICK.filter((q) => quickDone(s, q.id)).length;
  return (
    <section className="quick-card" aria-label="Missões rápidas">
      <div className="flex items-center justify-between gap-2">
        <h2 className="quick-title">
          Missões rápidas <span className="quick-count">{done}/3</span>
        </h2>
        <span className="quick-reset">renovam em {reset}</span>
      </div>
      <ul className="quick-list">
        {QUICK.map((q) => {
          const ok = quickDone(s, q.id);
          const ready = q.id === 'meta' && quickMetaReady(s);
          return (
            <li key={q.id}>
              <button
                className={`quick-item ${ok ? 'is-done' : ready ? 'is-ready' : ''}`}
                disabled={ok}
                data-sound={ready ? 'none' : undefined}
                onClick={() => {
                  if (q.id !== 'meta') return setOpen(q.id);
                  if (!ready) return onMeta?.();
                  const got = claimQuickMeta();
                  play('semente');
                  toast(`Meta do turno feita · +${got} sementes`);
                }}
                aria-label={`${q.title}${ok ? ', feita' : ready ? ', pronta para pegar' : ''}`}
              >
                <span className="quick-ico" aria-hidden="true">
                  <Glyph e={q.emoji} size={34} />
                </span>
                <span className="quick-name">{q.title}</span>
                <span className="quick-sub">{ok ? 'Feita ✓' : ready ? 'Toque para pegar' : q.sub}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <EmotionSheet open={open === 'emocao'} onClose={() => setOpen(null)} />
      <ReflectionSheet open={open === 'reflexao'} onClose={() => setOpen(null)} />
    </section>
  );
}

function EmotionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <Sheet open={open} onClose={onClose} title="Nomeie sua emoção">
      <div className="grid gap-4 pb-2">
        <p className="text-[14px] text-muted">Dar nome ao que sente já ajuda a sentir um pouco melhor. Pode escolher mais de uma.</p>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => {
            const on = picked.includes(e);
            return (
              <button key={e} className={`chip ${on ? 'chip-accent' : 'chip-plain'}`} aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== e) : [...picked, e])}>
                {e}
              </button>
            );
          })}
        </div>
        <button
          className="btn btn-primary"
          disabled={!picked.length}
          data-sound="none"
          onClick={() => {
            const coins = quickEmotion(picked);
            play('tarefa');
            toast(coins ? `Emoção registrada · +${coins} sementes` : 'Emoção registrada');
            setPicked([]);
            onClose();
          }}
        >
          Pronto
        </button>
      </div>
    </Sheet>
  );
}

function ReflectionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState(() => REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)]);
  const [text, setText] = useState('');
  const coins = reflectionCoins(text.trim().length);
  const next = text.trim().length < 150 ? 150 : text.trim().length < 400 ? 400 : null;
  return (
    <Sheet open={open} onClose={onClose} title="Escreva uma reflexão">
      <div className="grid gap-3 pb-2">
        <div className="flex items-start gap-2 rounded-2xl bg-surface-2 p-3">
          <p className="flex-1 text-[15px] font-bold leading-snug">{prompt}</p>
          <button className="chip chip-plain" onClick={() => setPrompt(REFLECTIONS[(REFLECTIONS.indexOf(prompt) + 1) % REFLECTIONS.length])}>
            Outra
          </button>
        </div>
        <textarea className="field min-h-[140px]" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Escreva do seu jeito. Fica só no seu diário." aria-label="Sua reflexão" />
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-muted">
          Vale <Seed size={12} /> {coins}
          {next && <span>· com {next} letras vale {reflectionCoins(next)}</span>}
          <span className="ml-auto">{text.trim().length} letras</span>
        </p>
        <button
          className="btn btn-primary"
          disabled={text.trim().length < 10}
          data-sound="none"
          onClick={() => {
            const got = quickReflection(text, prompt);
            play('tarefa');
            toast(got ? `Reflexão guardada no diário · +${got} sementes` : 'Reflexão guardada no diário');
            setText('');
            onClose();
          }}
        >
          Guardar no diário
        </button>
      </div>
    </Sheet>
  );
}

// Água de hoje: copinhos que enchem com um toque, a meta que a pessoa escolhe e o lembrete de beber água.
import { useState } from 'react';
import { Bell, Minus, Plus, Settings2 } from 'lucide-react';
import { Sheet, toast } from './ui';
import { play } from '../lib/sound';
import { addWater, dayOf, getState, setWaterGoal, todayKey, updateSettings, useApp, waterGoalOf } from '../lib/store';
import { askPermission, permission } from '../lib/notify';
import { syncPush } from '../lib/account';

const PLANS: { id: 'pouco' | 'normal' | 'muito'; label: string; sub: string }[] = [
  { id: 'pouco', label: '2 vezes', sub: '11h e 16h' },
  { id: 'normal', label: '4 vezes', sub: 'a cada 3 horas' },
  { id: 'muito', label: '6 vezes', sub: 'a cada 2 horas' },
];

function Cup({ full, onClick, label }: { full: boolean; onClick: () => void; label: string }) {
  return (
    <button className={`cup ${full ? 'is-full' : ''}`} onClick={onClick} aria-label={label} data-sound="none">
      <svg viewBox="0 0 30 36" aria-hidden="true">
        <path d="M4 4 H26 L23 32 Q22.6 34 20.6 34 H9.4 Q7.4 34 7 32 Z" fill="#EAF6FF" stroke="#9DCBEF" strokeWidth="2" strokeLinejoin="round" />
        <path className="cup-water" d="M6 13 Q10 11 15 13 T24.4 13 L22.6 31.4 Q22.3 32.4 21 32.4 H9 Q7.7 32.4 7.4 31.4 Z" fill="#5BB4F2" />
        <path d="M9 7 L10.5 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    </button>
  );
}

export function WaterCard() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const cups = dayOf(s, todayKey()).water ?? 0;
  const goal = waterGoalOf(s);
  const notif = s.settings.notif;
  const reminding = notif.enabled && notif.kinds.agua;
  const drink = (d: 1 | -1) => {
    const r = addWater(d);
    if (d > 0) play(r.hitGoal ? 'conquista' : 'gole');
    if (r.hitGoal) toast(`Meta de água batida! ${goal} copos hoje 💧`);
  };
  return (
    <section className="water-card" aria-label="Água de hoje">
      <div className="water-head">
        <div>
          <p className="water-title">Água de hoje</p>
          <p className="water-sub">
            <b>{cups}</b> de {goal} copos {cups >= goal ? '· meta batida!' : ''}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button className="water-btn" onClick={() => drink(-1)} disabled={!cups} aria-label="Tirar um copo">
            <Minus size={16} />
          </button>
          <button className="water-btn is-main" onClick={() => drink(1)} aria-label="Bebi um copo" data-sound="none">
            <Plus size={18} />
          </button>
          <button className="water-btn" onClick={() => setOpen(true)} aria-label="Meta e lembretes de água">
            <Settings2 size={16} />
          </button>
        </div>
      </div>
      <div className="water-cups">
        {Array.from({ length: Math.max(goal, cups) }, (_, i) => (
          <Cup key={i} full={i < cups} label={i < cups ? `Copo ${i + 1} bebido` : `Beber o copo ${i + 1}`} onClick={() => drink(i < cups ? -1 : 1)} />
        ))}
      </div>
      <div className="water-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (cups / goal) * 100)}%` }} />
      </div>
      {reminding && (
        <p className="water-remind">
          <Bell size={13} /> Lembrete de água ligado
        </p>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Sua meta de água">
        <div className="grid gap-4 pb-2">
          <p className="text-[14px] text-muted">Escolha quantos copos (de uns 250 ml) você quer beber por dia. Dá para mudar quando quiser.</p>
          <div className="flex items-center justify-center gap-4">
            <button className="water-btn" onClick={() => setWaterGoal(goal - 1)} aria-label="Menos um copo na meta">
              <Minus size={18} />
            </button>
            <p className="text-center">
              <b className="font-display text-[40px] leading-none">{goal}</b>
              <span className="block text-[13px] font-bold text-muted">copos por dia · {(goal * 0.25).toLocaleString('pt-BR')} litros</span>
            </p>
            <button className="water-btn" onClick={() => setWaterGoal(goal + 1)} aria-label="Mais um copo na meta">
              <Plus size={18} />
            </button>
          </div>
          <div className="grid gap-2">
            <p className="section-label">Lembrar de beber água</p>
            <button
              className={`chip justify-center ${!reminding ? 'chip-accent' : 'chip-plain'}`}
              onClick={() => updateSettings({ notif: { ...getState().settings.notif, kinds: { ...getState().settings.notif.kinds, agua: false } } })}
            >
              Sem lembrete
            </button>
            {PLANS.map((p) => (
              <button
                key={p.id}
                className={`chip justify-between ${reminding && notif.water === p.id ? 'chip-accent' : 'chip-plain'}`}
                onClick={async () => {
                  if (permission() === 'default') await askPermission();
                  const n = getState().settings.notif;
                  updateSettings({ notif: { ...n, enabled: true, water: p.id, kinds: { ...n.kinds, agua: true } } });
                  syncPush(getState());
                  toast(`Vou te lembrar ${p.label} por dia 💧`);
                }}
              >
                <b>{p.label}</b> <span className="opacity-75">{p.sub}</span>
              </button>
            ))}
            <p className="text-[12px] text-muted">Nunca de madrugada. Com conta, chegam mesmo com o app fechado.</p>
          </div>
        </div>
      </Sheet>
    </section>
  );
}

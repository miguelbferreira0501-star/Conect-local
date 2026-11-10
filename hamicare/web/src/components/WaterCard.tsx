// Água de hoje em litros: uma garrafinha que enche, botões de copo (250 ml) e garrafa (500 ml),
// a meta diária em litros que a pessoa escolhe e o lembrete de beber água.
import { useState } from 'react';
import { Bell, Minus, Plus, Settings2 } from 'lucide-react';
import { Sheet, toast } from './ui';
import { play } from '../lib/sound';
import { addWater, dayOf, getState, litersText, setWaterGoal, todayKey, updateSettings, useApp, waterGoalOf } from '../lib/store';
import { askPermission, permission } from '../lib/notify';
import { syncPush } from '../lib/account';

const PLANS: { id: 'pouco' | 'normal' | 'muito'; label: string; sub: string }[] = [
  { id: 'pouco', label: '2 vezes', sub: '11h e 16h' },
  { id: 'normal', label: '4 vezes', sub: 'a cada 3 horas' },
  { id: 'muito', label: '6 vezes', sub: 'a cada 2 horas' },
];

/** Garrafa com a água subindo até a porcentagem da meta. */
function Bottle({ pct }: { pct: number }) {
  const h = 62 * Math.min(1, pct);
  return (
    <svg viewBox="0 0 54 90" className="water-bottle" aria-hidden="true">
      <defs>
        <clipPath id="wb-in">
          <path d="M19 14 H35 V22 Q46 28 46 40 V78 Q46 86 38 86 H16 Q8 86 8 78 V40 Q8 28 19 22 Z" />
        </clipPath>
      </defs>
      <rect x="18" y="3" width="18" height="10" rx="3" fill="#3EA0EF" />
      <path d="M19 14 H35 V22 Q46 28 46 40 V78 Q46 86 38 86 H16 Q8 86 8 78 V40 Q8 28 19 22 Z" fill="#EAF6FF" />
      <g clipPath="url(#wb-in)">
        <g className="water-level" style={{ transform: `translateY(${62 - h}px)` }}>
          <path className="water-wave" d="M-30 24 Q-22.5 20 -15 24 T0 24 T15 24 T30 24 T45 24 T60 24 T75 24 T90 24 V120 H-30 Z" fill="#5BB4F2" />
        </g>
        <path d="M14 34 V76" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </g>
      <path d="M19 14 H35 V22 Q46 28 46 40 V78 Q46 86 38 86 H16 Q8 86 8 78 V40 Q8 28 19 22 Z" fill="none" stroke="#9DCBEF" strokeWidth="2.5" strokeLinejoin="round" />
      {[0.25, 0.5, 0.75].map((t) => (
        <path key={t} d={`M38 ${86 - 62 * t} H44`} stroke="#9DCBEF" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function WaterCard() {
  const s = useApp();
  const [open, setOpen] = useState(false);
  const cups = dayOf(s, todayKey()).water ?? 0;
  const goal = waterGoalOf(s);
  const notif = s.settings.notif;
  const reminding = notif.enabled && notif.kinds.agua;
  const drink = (d: number) => {
    const r = addWater(d);
    if (d > 0) play(r.hitGoal ? 'conquista' : 'gole');
    if (r.hitGoal) toast(`Meta de água batida! ${litersText(goal)} hoje 💧`);
  };
  const pct = cups / goal;
  return (
    <section className="water-card" aria-label="Água de hoje">
      <div className="water-main">
        <Bottle pct={pct} />
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="water-head">
            <div>
              <p className="water-title">Água de hoje</p>
              <p className="water-sub">
                <b>{litersText(cups)}</b> de {litersText(goal)} {cups >= goal ? '· meta batida!' : ''}
              </p>
            </div>
            <button className="water-btn" onClick={() => setOpen(true)} aria-label="Meta e lembretes de água">
              <Settings2 size={16} />
            </button>
          </div>
          <div className="water-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, pct * 100)}%` }} />
          </div>
          <div className="water-add">
            <button className="water-pill" onClick={() => drink(1)} data-sound="none" aria-label="Bebi um copo de 250 ml">
              <Plus size={15} /> 250 ml
            </button>
            <button className="water-pill is-main" onClick={() => drink(2)} data-sound="none" aria-label="Bebi uma garrafinha de 500 ml">
              <Plus size={15} /> 500 ml
            </button>
            <button className="water-btn" onClick={() => drink(-1)} disabled={!cups} aria-label="Tirar 250 ml">
              <Minus size={16} />
            </button>
          </div>
        </div>
      </div>
      {reminding && (
        <p className="water-remind">
          <Bell size={13} /> Lembrete de água ligado
        </p>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Sua meta de água">
        <div className="grid gap-4 pb-2">
          <p className="text-[14px] text-muted">Quantos litros você quer beber por dia? Dá para mudar quando quiser.</p>
          <div className="flex items-center justify-center gap-4">
            <button className="water-btn" onClick={() => setWaterGoal(goal - 1)} disabled={goal <= 4} aria-label="Diminuir a meta em 250 ml">
              <Minus size={18} />
            </button>
            <p className="text-center">
              <b className="font-display text-[40px] leading-none">{litersText(goal)}</b>
              <span className="block text-[13px] font-bold text-muted">por dia</span>
            </p>
            <button className="water-btn" onClick={() => setWaterGoal(goal + 1)} disabled={goal >= 16} aria-label="Aumentar a meta em 250 ml">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[6, 8, 10, 12].map((g) => (
              <button key={g} className={`chip ${goal === g ? 'chip-accent' : 'chip-plain'}`} onClick={() => setWaterGoal(g)}>
                {litersText(g)}
              </button>
            ))}
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

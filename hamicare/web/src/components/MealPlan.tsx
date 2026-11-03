// Cardápio de hoje: o que a pessoa vai comer, com quantidade e calorias editáveis.
// Fica só no aparelho e no backup privado (nunca no perfil, no feed ou nos grupos).
import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { Sheet, toast } from './ui';
import { FOOD_PRESETS, MEALS, type MealId } from '../data/foods';
import { mealTotals, tooLittle } from '../logic/meals';
import { addMeal, copyYesterdayMeals, dayOf, minor, removeMeal, removeMyFood, setMealRef, todayKey, updateMeal, useApp } from '../lib/store';
import { addDays, fmtNum } from '../lib/util';
import type { State } from '../types';

function mealNow(d = new Date()): MealId {
  const h = d.getHours();
  return h < 10 ? 'cafe' : h < 15 ? 'almoco' : h < 18 ? 'lanche' : h < 22 ? 'jantar' : 'ceia';
}

export function MealCard({ s }: { s: State }) {
  const [open, setOpen] = useState(false);
  if (minor(s)) return null;
  const today = todayKey();
  const meals = dayOf(s, today).meals ?? [];
  const t = mealTotals(meals);
  const ref = s.mealRef ?? null;
  const hasYesterday = (dayOf(s, addDays(today, -1)).meals ?? []).length > 0;
  return (
    <section className="grid gap-3" aria-label="Cardápio de hoje">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="section-label">Cardápio de hoje</h2>
        <button className="chip chip-plain" onClick={() => setOpen(true)}>
          <Pencil size={14} /> Editar
        </button>
      </div>
      <div className="card grid gap-3 p-4">
        {meals.length ? (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="font-display text-[28px] font-bold leading-none tabular-nums">
                  {fmtNum(t.planned, 0)} <span className="text-[15px]">kcal</span>
                </p>
                <p className="text-[13px] font-bold text-muted">
                  planejadas · {fmtNum(t.eaten, 0)} kcal já comidas
                </p>
              </div>
              {ref && <span className="chip chip-plain">Referência {fmtNum(ref, 0)}</span>}
            </div>
            {ref && (
              <div className="meal-track" role="progressbar" aria-label="Calorias de hoje" aria-valuemin={0} aria-valuemax={ref} aria-valuenow={t.eaten}>
                <div className="meal-fill meal-planned" style={{ width: `${Math.min(100, (t.planned / ref) * 100)}%` }} />
                <div className="meal-fill meal-eaten" style={{ width: `${Math.min(100, (t.eaten / ref) * 100)}%` }} />
              </div>
            )}
            <div className="grid gap-2.5">
              {MEALS.map((m) => {
                const list = meals.filter((x) => x.meal === m.id);
                if (!list.length) return null;
                return (
                  <div key={m.id} className="grid gap-1">
                    <p className="flex items-center justify-between text-[13px] font-extrabold text-muted">
                      <span>
                        {m.emoji} {m.label}
                      </span>
                      <span className="tabular-nums">{fmtNum(list.reduce((n, x) => n + x.kcal, 0), 0)} kcal</span>
                    </p>
                    {list.map((x) => (
                      <button key={x.id} className="meal-row" data-eaten={x.eaten} onClick={() => updateMeal(x.id, { eaten: !x.eaten })} aria-pressed={x.eaten} aria-label={`${x.eaten ? 'Desmarcar' : 'Marcar como comido'}: ${x.name}`}>
                        <span className="meal-check" aria-hidden="true">
                          <Check size={14} strokeWidth={3.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[15px] font-bold leading-tight">{x.name}</span>
                          {x.qty && <span className="block truncate text-[12px] font-semibold text-muted">{x.qty}</span>}
                        </span>
                        <span className="text-[14px] font-extrabold tabular-nums">{fmtNum(x.kcal, 0)} kcal</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            {s.journey.dir === 'ganhar' && ref && t.eaten > ref && (
              <p className="rounded-2xl bg-leaf-soft p-3 text-[13px] font-bold">
                💪 +{fmtNum(Math.min(700, t.eaten - ref), 0)} kcal acima da referência hoje: o {s.pet.name} cresce junto com você.
              </p>
            )}
            {tooLittle(t.planned, t.items) && <p className="rounded-2xl bg-gold-soft p-3 text-[13px] font-semibold">Seu cardápio de hoje está bem pequeninho. Comer pouco demais cansa o corpo e atrapalha a jornada. Se puder, inclua mais uma refeição.</p>}
          </>
        ) : (
          <div className="grid justify-items-center gap-2 py-1 text-center">
            <span className="text-[36px]" aria-hidden="true">
              🍽️
            </span>
            <p className="text-[15px] font-semibold">Monte o que você vai comer hoje e veja as calorias de cada alimento.</p>
            <button className="btn btn-primary w-full" onClick={() => setOpen(true)}>
              <Plus size={18} /> Montar meu cardápio
            </button>
            {hasYesterday && (
              <button className="btn btn-ghost btn-sm w-full" onClick={() => toast(`${copyYesterdayMeals()} alimentos copiados de ontem`)}>
                Repetir o cardápio de ontem
              </button>
            )}
          </div>
        )}
      </div>
      <MealSheet open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function MealSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const meals = dayOf(s, todayKey()).meals ?? [];
  const t = mealTotals(meals);
  const [meal, setMeal] = useState<MealId>(mealNow());
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [kcal, setKcal] = useState('');
  const [refText, setRefText] = useState(s.mealRef ? String(s.mealRef) : '');
  useEffect(() => {
    if (open) setMeal(mealNow());
  }, [open]);
  const q = name.trim().toLowerCase();
  const mine = (s.myFoods ?? []).map((f) => ({ ...f, emoji: '⭐', mine: true }));
  // Sem busca: os alimentos que combinam com a refeição escolhida. Com busca: todos.
  const presets = FOOD_PRESETS.filter((f) => (q ? f.name.toLowerCase().includes(q) : f.for.includes(meal))).map((f) => ({ ...f, mine: false }));
  const suggestions = [...mine.filter((f) => !q || f.name.toLowerCase().includes(q)), ...presets].slice(0, 18);
  const mealLabel = MEALS.find((m) => m.id === meal)!.label;

  function add() {
    if (!name.trim() || kcal === '') return;
    addMeal({ meal, name, qty, kcal: Number(kcal.replace(',', '.')) || 0 });
    toast(`${name.trim()} no ${mealLabel.toLowerCase()}`);
    setName('');
    setQty('');
    setKcal('');
  }

  return (
    <Sheet open={open} onClose={onClose} title="Cardápio de hoje">
      <div className="grid gap-4 pt-1">
        <section className="grid gap-2" aria-label="Adicionar alimento">
          <p className="text-[14px] font-extrabold">Adicionar alimento</p>
          <div className="tabs-scroll">
            {MEALS.map((m) => (
              <button key={m.id} className={`chip ${meal === m.id ? 'chip-accent' : 'chip-plain'}`} onClick={() => setMeal(m.id)} aria-pressed={meal === m.id}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <form className="grid gap-2" onSubmit={(e) => (e.preventDefault(), add())}>
            <label className="sr-only" htmlFor="meal-name">
              Alimento
            </label>
            <input id="meal-name" className="field" maxLength={40} placeholder="Alimento (ex.: arroz, frango…)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
              <label className="sr-only" htmlFor="meal-qty">
                Quantidade
              </label>
              <input id="meal-qty" className="field" maxLength={30} placeholder="Quantidade (ex.: 1 prato)" value={qty} onChange={(e) => setQty(e.target.value)} />
              <label className="sr-only" htmlFor="meal-kcal">
                Calorias
              </label>
              <input id="meal-kcal" className="field" inputMode="numeric" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/[^\d]/g, '').slice(0, 4))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={!name.trim() || kcal === ''}>
              <Plus size={18} /> Adicionar no {mealLabel.toLowerCase()}
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((f) => (
              <span key={`${f.mine ? 'm' : 'p'}-${f.name}`} className="chip chip-plain !whitespace-normal !pr-1.5">
                <button type="button" className="text-left" onClick={() => (setName(f.name), setQty(f.qty), setKcal(String(f.kcal)))}>
                  {f.emoji} {f.name} · {f.kcal}
                </button>
                {f.mine && (
                  <button type="button" className="ml-1 text-muted" aria-label={`Tirar ${f.name} dos meus alimentos`} onClick={() => removeMyFood(f.name)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            ))}
          </div>
          <p className="text-[12px] text-muted">Toque numa sugestão e ajuste a quantidade e as calorias do seu jeito. Os valores são aproximados, por porção caseira. ⭐ são alimentos que você criou.</p>
        </section>

        {meals.length > 0 && (
          <section className="grid gap-3" aria-label="O que você vai comer">
            <p className="flex items-center justify-between text-[14px] font-extrabold">
              <span>O que você vai comer</span>
              <span className="tabular-nums">{fmtNum(t.planned, 0)} kcal</span>
            </p>
            {MEALS.map((m) => {
              const list = meals.filter((x) => x.meal === m.id);
              if (!list.length) return null;
              return (
                <div key={m.id} className="grid gap-1.5">
                  <p className="text-[13px] font-extrabold text-muted">
                    {m.emoji} {m.label}
                  </p>
                  {list.map((x) => (
                    <div key={x.id} className="meal-edit">
                      <div className="grid min-w-0 flex-1 gap-1">
                        <input className="field !min-h-[38px] !py-1.5 font-bold" aria-label="Alimento" value={x.name} maxLength={40} onChange={(e) => updateMeal(x.id, { name: e.target.value })} />
                        <input className="field !min-h-[34px] !py-1 text-[14px]" aria-label="Quantidade" placeholder="Quantidade" value={x.qty} maxLength={30} onChange={(e) => updateMeal(x.id, { qty: e.target.value })} />
                      </div>
                      <label className="grid w-[86px] shrink-0 gap-0.5 text-center text-[11px] font-extrabold text-muted">
                        <input className="field !min-h-[38px] !px-2 !py-1.5 text-center font-extrabold" inputMode="numeric" aria-label={`Calorias de ${x.name}`} value={String(x.kcal)} onChange={(e) => updateMeal(x.id, { kcal: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} />
                        kcal
                      </label>
                      <button className="icon-btn !h-9 !w-9" aria-label={`Tirar ${x.name}`} onClick={() => removeMeal(x.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </section>
        )}

        <section className="grid gap-2 rounded-2xl bg-surface2 p-3" aria-label="Referência do dia">
          <p className="text-[14px] font-extrabold">Referência de calorias por dia (opcional)</p>
          <div className="flex gap-2">
            <input className="field min-w-0 flex-1" inputMode="numeric" placeholder="Ex.: 1.800" value={refText} onChange={(e) => setRefText(e.target.value.replace(/[^\d]/g, '').slice(0, 4))} aria-label="Referência diária em kcal" />
            <button
              className="btn btn-soft shrink-0"
              onClick={() => {
                const r = setMealRef(refText ? Number(refText) : null);
                toast(r.ok ? (refText ? 'Referência salva' : 'Referência removida') : r.reason);
              }}
            >
              Salvar
            </button>
          </div>
          <p className="text-[12px] text-muted">Use a referência que um nutricionista passou para você. O HamiCare não faz recomendação médica.</p>
        </section>

        <button className="btn btn-ghost" onClick={() => toast(copyYesterdayMeals() ? 'Cardápio de ontem copiado' : 'Ontem não teve cardápio')}>
          Repetir o cardápio de ontem
        </button>
      </div>
    </Sheet>
  );
}

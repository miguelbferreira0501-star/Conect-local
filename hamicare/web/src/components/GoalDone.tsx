// "Uhuu! Meta do dia batida!": aparece uma vez quando a pessoa chega na meta de missões que escolheu.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { play } from '../lib/sound';
import { dayGoalOf, dayOf, todayKey, todayTasks, useApp, watchState } from '../lib/store';
import type { State } from '../types';

const doneToday = (s: State) => {
  const k = todayKey();
  const day = dayOf(s, k);
  const tasks = todayTasks(s, k);
  return { done: tasks.filter((t) => t.id in day.done).length, goal: dayGoalOf(s, tasks.length) };
};

export function GoalDone() {
  const s = useApp();
  const [show, setShow] = useState(false);
  useEffect(
    () =>
      watchState((now, prev) => {
        const a = doneToday(prev);
        const b = doneToday(now);
        if (b.goal > 0 && a.done < b.goal && b.done >= b.goal) {
          window.setTimeout(() => {
            setShow(true);
            play('festa');
          }, 900);
        }
      }),
    [],
  );
  if (!show) return null;
  const { goal } = doneToday(s);
  return createPortal(
    <div className="goal-done" role="dialog" aria-modal="true" aria-label="Meta do dia batida" onClick={() => setShow(false)}>
      <div className="streak-rays lvl-rays" aria-hidden="true" />
      <div className="goal-done-card">
        <div className="goal-done-pet">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={{ ...s.pet.outfit, oculos: 'sol' }} mood="risada" size={190} growth={1} />
        </div>
        <p className="goal-done-title">Uhuu! Meta do dia batida!</p>
        <p className="goal-done-text">
          {goal} {goal === 1 ? 'missão' : 'missões'} hoje. O {s.pet.name} está orgulhoso de você!
        </p>
        <button className="btn welcome-btn w-full">Continuar</button>
      </div>
    </div>,
    document.body,
  );
}

// Uma missão do dia com o botão de concluir "fofo" e o selo de calorias.
import { useRef } from 'react';
import { Check, Pencil } from 'lucide-react';
import { KcalChip } from './Journey';
import { Seed } from './ui';
import { prefersReducedMotion } from '../lib/util';
import { burstConfetti } from '../lib/confetti';
import type { Direction, Task } from '../types';
import { Glyph } from './art';

export function TaskRow({ task, done, kcal, dir, sub, onToggle, onEdit }: {
  task: Task;
  done: boolean;
  kcal: number;
  dir: Direction;
  sub?: string;
  onToggle: (el: HTMLElement) => void;
  onEdit?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <li className="task" data-done={done}>
      <span className="task-emoji" aria-hidden="true">
        <Glyph e={task.emoji} size={40} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="task-title block text-[15.5px] font-bold leading-snug">{task.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-muted">
          <span className="inline-flex items-center gap-1">
            <Seed size={11} /> {task.reward}
          </span>
          {sub && <span>· {sub}</span>}
          <KcalChip kcal={kcal} dir={dir} small />
        </span>
      </span>
      {onEdit && (
        <button className="icon-btn !h-9 !w-9" onClick={onEdit} aria-label={`Editar: ${task.title}`}>
          <Pencil size={15} />
        </button>
      )}
      <button
        ref={ref}
        className="check3d"
        aria-pressed={done}
        aria-label={done ? `Desfazer: ${task.title}` : `Concluir: ${task.title}`}
        onClick={() => {
          if (!done && ref.current && !prefersReducedMotion()) {
            ref.current.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(0.23,1,0.32,1)' });
          }
          // Confete a cada missão concluída.
          if (!done) burstConfetti(ref.current);
          onToggle(ref.current!);
        }}
      >
        <Check size={22} strokeWidth={3.4} />
      </button>
    </li>
  );
}

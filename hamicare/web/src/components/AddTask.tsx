// Adicionar tarefa rapidinho: escrever uma nova ou tocar numa sugestão das áreas (como "Recomendado para você").
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Glyph } from './art';
import { toast } from './ui';
import { LIBRARY, LIFE_AREAS, LIFE_ORDER, libById, type LifeArea } from '../data/tasks';
import { addLibraryTask, addTask, useApp } from '../lib/store';
import { play } from '../lib/sound';

export function AddTaskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<LifeArea>('calma');
  if (!open) return null;
  const have = new Set(s.tasks.map((t) => t.id));
  const ideas = LIFE_AREAS[area].tasks.map((id) => libById(id)).filter((t): t is (typeof LIBRARY)[number] => !!t && !have.has(t.id));

  const create = () => {
    const t = title.trim();
    if (!t) return;
    addTask({ title: t, emoji: '⭐', cat: 'autocuidado', freq: { kind: 'diaria' }, energy: 2 });
    play('tarefa');
    toast('Tarefa nova para hoje!');
    setTitle('');
    onClose();
  };

  return createPortal(
    <div className="addt" role="dialog" aria-modal="true" aria-label="Adicionar tarefa">
      <div className="addt-panel">
        <button className="addt-x" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>
        <form
          className="addt-form"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <input className="addt-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Escreva uma tarefa nova" maxLength={60} aria-label="Tarefa nova" />
          {title.trim() && (
            <button className="addt-ok" type="submit">
              Adicionar
            </button>
          )}
        </form>
        <p className="addt-label">Sugestões para você</p>
        <div className="addt-chips" role="tablist">
          {LIFE_ORDER.map((a) => (
            <button key={a} role="tab" aria-selected={area === a} className={area === a ? 'is-on' : ''} onClick={() => setArea(a)}>
              {LIFE_AREAS[a].label}
            </button>
          ))}
        </div>
        <div className="addt-list">
          {ideas.map((t) => (
            <button
              key={t.id}
              className="addt-item"
              onClick={() => {
                addLibraryTask(t.id);
                play('tarefa');
                toast(`${t.title}: adicionada para hoje`);
              }}
            >
              <span className="addt-ico">
                <Glyph e={t.emoji} size={30} />
              </span>
              <span className="min-w-0 flex-1">
                <b>{t.title}</b>
                <small>{LIFE_AREAS[area].label}</small>
              </span>
              <Plus size={20} strokeWidth={3} />
            </button>
          ))}
          {!ideas.length && <p className="addt-empty">Você já tem todas as sugestões desta área. Escreva uma tarefa sua lá em cima!</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

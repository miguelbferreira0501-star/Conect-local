// Viagem para a Lua: o Hami sobe de foguete, a Terra fica pequenininha lá embaixo e ele pousa na casa lunar.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { play } from '../lib/sound';
import { useApp } from '../lib/store';

export function MoonTrip({ open, onDone }: { open: boolean; onDone: () => void }) {
  const s = useApp();
  useEffect(() => {
    if (!open) return;
    play('enviar');
    const t1 = window.setTimeout(() => play('magia'), 2600);
    const t2 = window.setTimeout(onDone, 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return createPortal(
    <div className="moon-go" role="dialog" aria-modal="true" aria-label={`${s.pet.name} viajando para a Lua`} onClick={onDone}>
      <div className="moon-stars" aria-hidden="true" />
      <div className="moon-earth" aria-hidden="true" />
      <div className="moon-moon" aria-hidden="true" />
      <div className="moon-rocket" aria-hidden="true">
        <svg viewBox="0 0 120 200" className="moon-rocket-body">
          <path d="M60 6 C92 34 98 92 92 150 H28 C22 92 28 34 60 6Z" fill="#FFFFFF" />
          <path d="M60 6 C76 22 84 46 88 70 H32 C36 46 44 22 60 6Z" fill="#F0525F" />
          <path d="M28 120 L6 168 L30 160Z M92 120 L114 168 L90 160Z" fill="#F0525F" />
          <rect x="34" y="150" width="52" height="12" rx="4" fill="#8A90A0" />
          <circle cx="60" cy="104" r="26" fill="#BFE8FF" stroke="#8A90A0" strokeWidth="5" />
        </svg>
        <span className="moon-pet">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={{ ...s.pet.outfit, chapeu: null }} mood="animado" size={70} idle={false} growth={1} />
        </span>
        <span className="moon-flame" />
      </div>
      <div className="moon-text">
        <p>Rumo à</p>
        <b>Casa na Lua</b>
        <small>Toque para continuar</small>
      </div>
    </div>,
    document.body,
  );
}

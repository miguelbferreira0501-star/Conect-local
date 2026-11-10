// Animação de viagem: o Hami sai dirigindo um carrinho vermelho pela estrada até o lugar do passeio.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { play } from '../lib/sound';
import { useApp } from '../lib/store';

export function TripDepart({ place, onDone }: { place: { name: string; colors: [string, string] } | null; onDone: () => void }) {
  const s = useApp();
  useEffect(() => {
    if (!place) return;
    play('enviar');
    const t1 = window.setTimeout(() => play('pulo'), 900);
    const t2 = window.setTimeout(onDone, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [place]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!place) return null;
  return createPortal(
    <div className="trip-go" role="dialog" aria-modal="true" aria-label={`${s.pet.name} partindo para ${place.name}`} onClick={onDone} style={{ ['--to' as string]: place.colors[1] }}>
      <div className="trip-go-sky" />
      <div className="trip-go-sun" />
      <div className="trip-go-clouds" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ top: `${10 + i * 9}%`, animationDelay: `${-i * 1.7}s`, scale: `${0.7 + (i % 2) * 0.4}` }} />
        ))}
      </div>
      <div className="trip-go-hills" aria-hidden="true" />
      <div className="trip-go-trees" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${-i * 0.55}s` }} />
        ))}
      </div>
      <div className="trip-go-road" aria-hidden="true">
        <span className="trip-go-lines" />
      </div>
      <div className="trip-go-car" aria-hidden="true">
        <div className="trip-go-bounce">
          <span className="trip-go-pet">
            <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood="animado" size={120} idle={false} growth={1} />
          </span>
          <svg viewBox="0 0 220 110" className="trip-go-body">
            <path d="M18 70 Q20 44 52 40 L80 18 Q90 10 104 10 H150 Q166 10 176 26 L190 44 Q206 48 208 70 L210 84 H14 Z" fill="#F0525F" />
            <path d="M88 24 Q94 18 104 18 H128 V44 H72 Z" fill="#BFE8FF" opacity="0.55" />
            <path d="M136 18 H150 Q160 18 168 30 L176 44 H136 Z" fill="#BFE8FF" />
            <rect x="14" y="74" width="196" height="12" rx="6" fill="#C93A4A" />
            <rect x="196" y="56" width="12" height="8" rx="3" fill="#FFE07A" />
            <rect x="16" y="58" width="8" height="8" rx="2" fill="#FFB3B3" />
            <path d="M60 46 H120" stroke="#FFFFFF" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
            {[54, 168].map((x) => (
              <g key={x} className="trip-go-wheel" style={{ transformOrigin: `${x}px 86px` }}>
                <circle cx={x} cy="86" r="18" fill="#3A3440" />
                <circle cx={x} cy="86" r="8" fill="#C9CED8" />
                <path d={`M${x - 8} 86 H${x + 8} M${x} 78 V94`} stroke="#8A90A0" strokeWidth="2" />
              </g>
            ))}
          </svg>
        </div>
        <span className="trip-go-puff" />
        <span className="trip-go-puff" style={{ animationDelay: '0.3s' }} />
      </div>
      <div className="trip-go-text">
        <p>Partindo para</p>
        <b>{place.name}</b>
        <small>Toque para continuar</small>
      </div>
    </div>,
    document.body,
  );
}

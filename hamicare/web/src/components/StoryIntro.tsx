// Abertura em história (antes das perguntas): numa tarde de chuva você encontra um hamster sozinho,
// leva ele para casa e seca o pelo dele com uma toalha (de verdade, arrastando o dedo). Só depois
// vêm o nome e as perguntas. "Fazer, não mostrar": o primeiro cuidado é seu.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hamster } from './Hamster';
import { play } from '../lib/sound';
import { prefersReducedMotion } from '../lib/util';
import type { PetMood } from '../types';

type Scene = 'chuva' | 'contato' | 'casa' | 'secar' | 'feliz';
const NO_OUTFIT = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };

/** Frases que aparecem uma de cada vez. */
function useLines(lines: string[], gap = 1900) {
  const [n, setN] = useState(prefersReducedMotion() ? lines.length : 0);
  useEffect(() => {
    if (n >= lines.length) return;
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 700 : gap);
    return () => clearTimeout(t);
  }, [n, lines.length, gap]);
  return { shown: lines.slice(0, n), all: n >= lines.length };
}

function Rain({ strength }: { strength: number }) {
  if (prefersReducedMotion() || strength <= 0) return null;
  return (
    <div className="st-rain" style={{ opacity: strength }} aria-hidden="true">
      {Array.from({ length: 46 }, (_, i) => (
        <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${((i * 53) % 100) / 100}s`, animationDuration: `${0.55 + ((i * 17) % 40) / 100}s` }} />
      ))}
    </div>
  );
}

export function StoryIntro({ fur, onDone }: { fur: string; onDone: () => void }) {
  const [scene, setScene] = useState<Scene>('chuva');
  const [mood, setMood] = useState<PetMood>('calmo');
  const [hearts, setHearts] = useState<number[]>([]);
  const [dry, setDry] = useState(0);
  const [towel, setTowel] = useState<{ x: number; y: number } | null>(null);
  const pet = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const wet = scene === 'chuva' || scene === 'contato' || (scene === 'secar' && dry < 1) || scene === 'casa';
  const cozy = scene === 'casa' || scene === 'secar' || scene === 'feliz';
  const shiver = wet && dry < 0.7;

  const intro = useLines(['Em uma tarde chuvosa, você encontrou um pequeno hamster sozinho…', 'Ele estava cansado, assustado e precisava de um lugar seguro.']);
  const happy = useLines(scene === 'feliz' ? ['Obrigado por me ajudar!', 'Agora podemos começar nossa jornada juntos.'] : [], 1500);

  function hop() {
    if (prefersReducedMotion()) return;
    pet.current?.animate(
      [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.08,0.92)', offset: 0.2 }, { transform: 'translateY(-22px) scale(0.96,1.05)', offset: 0.5 }, { transform: 'translateY(0) scale(1,1)' }],
      { duration: 620, easing: 'cubic-bezier(0.23,1,0.32,1)' },
    );
  }
  function touch() {
    if (scene === 'secar') return;
    play('coracao');
    hop();
    setMood('feliz');
    const id = Date.now();
    setHearts((h) => [...h.slice(-4), id]);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1200);
    setTimeout(() => setMood(scene === 'feliz' ? 'animado' : 'calmo'), 1300);
  }

  // Secar: cada movimento da toalha em cima do Hami tira um pouco da água.
  function rub(e: React.PointerEvent) {
    const p = { x: e.clientX, y: e.clientY };
    setTowel(p);
    const r = pet.current?.getBoundingClientRect();
    const prev = last.current;
    last.current = p;
    if (!r || !prev) return;
    const inside = p.x > r.left - 10 && p.x < r.right + 10 && p.y > r.top - 10 && p.y < r.bottom + 10;
    if (!inside) return;
    const d = Math.hypot(p.x - prev.x, p.y - prev.y);
    setDry((v) => {
      const nv = Math.min(1, v + d / 700);
      if (Math.floor(nv * 6) > Math.floor(v * 6)) play('toalha');
      return nv;
    });
  }
  useEffect(() => {
    if (scene !== 'secar' || dry < 1) return;
    play('sacudir');
    setTowel(null);
    hop();
    setMood('animado');
    const t = setTimeout(() => (play('iii'), setScene('feliz')), 900);
    return () => clearTimeout(t);
  }, [dry, scene]);

  const go = (s: Scene) => {
    play('pulo');
    setScene(s);
    setMood(s === 'feliz' ? 'animado' : 'calmo');
  };
  // Começa magrinho e vai ficando mais fofinho conforme é cuidado (sem mudança brusca).
  const grams = scene === 'feliz' ? 128 : scene === 'secar' ? 104 + dry * 22 : 100;
  const size = scene === 'chuva' ? 150 : scene === 'contato' ? 205 : 215;
  const drops = Math.round((1 - dry) * 10);

  return createPortal(
    <div className={`hstory st-${scene} ${cozy ? 'is-cozy' : ''}`} role="dialog" aria-modal="true" aria-label="Como tudo começou">
      <div className="st-sky" />
      <div className="st-warm" />
      <svg className="st-trees" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 200 V120 Q30 60 60 110 Q80 40 120 100 Q150 70 170 120 V200Z" fill="#4E6A78" opacity="0.55" />
        <path d="M230 200 V110 Q260 50 290 100 Q320 30 360 95 Q385 70 400 100 V200Z" fill="#4E6A78" opacity="0.55" />
      </svg>
      <div className="st-room" aria-hidden="true">
        <span className="st-window" />
        <span className="st-lamp" />
        <span className="st-rug" />
      </div>
      <div className="st-ground">
        <span className="st-puddle" style={{ left: '12%' }} />
        <span className="st-puddle" style={{ left: '64%', width: 120 }} />
      </div>
      <Rain strength={scene === 'chuva' ? 1 : scene === 'contato' ? 0.6 : 0} />

      <div className="st-stage">
        <div ref={pet} className={`st-pet ${shiver ? 'is-shiver' : ''}`} onClick={touch} role="button" tabIndex={0} aria-label="Fazer carinho no hamster" onKeyDown={(e) => e.key === 'Enter' && touch()}>
          <Hamster fur={fur} grams={grams} mood={mood} size={size} wet={wet && dry < 0.95} shine={scene === 'feliz'} idle={scene === 'feliz'} outfit={NO_OUTFIT} growth={0.85} label="" />
          {scene === 'secar' &&
            Array.from({ length: drops }, (_, i) => (
              <span key={i} className="st-drop" style={{ left: `${18 + ((i * 29) % 64)}%`, top: `${20 + ((i * 41) % 60)}%`, animationDelay: `${(i % 5) * 0.2}s` }} aria-hidden="true" />
            ))}
          {hearts.map((h, i) => (
            <span key={h} className="st-heart" style={{ left: `${40 + i * 6}%` }} aria-hidden="true">
              ♥
            </span>
          ))}
        </div>
      </div>

      <div className="st-text" aria-live="polite">
        {scene === 'chuva' && intro.shown.map((l) => <p key={l}>{l}</p>)}
        {scene === 'contato' && (
          <>
            <p>Talvez ele só precise de alguém que cuide dele.</p>
            <small>Toque nele com carinho</small>
          </>
        )}
        {scene === 'casa' && <p>Você decidiu dar a ele um lugar seguro para recomeçar.</p>}
        {scene === 'secar' && (
          <>
            <p>Ele ainda está molhadinho. Esfregue a toalha nele para secar.</p>
            <span className="st-meter" role="progressbar" aria-label="Secando" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(dry * 100)}>
              <span style={{ width: `${dry * 100}%` }} />
            </span>
          </>
        )}
        {scene === 'feliz' && happy.shown.map((l) => <p key={l}>{l}</p>)}
      </div>

      <div className="st-actions">
        {scene === 'chuva' && intro.all && (
          <button className="st-btn" onClick={() => go('contato')}>
            Conhecer sua história
          </button>
        )}
        {scene === 'contato' && (
          <button className="st-btn" onClick={() => go('casa')}>
            Levar para casa
          </button>
        )}
        {scene === 'casa' && (
          <button className="st-btn" onClick={() => go('secar')}>
            Pegar uma toalha
          </button>
        )}
        {scene === 'secar' && (
          <button className="st-skip" onClick={() => setDry(1)}>
            Secar de uma vez
          </button>
        )}
        {scene === 'feliz' && happy.all && (
          <button className="st-btn" onClick={() => (play('pulo'), onDone())}>
            Vamos juntos!
          </button>
        )}
        {scene === 'chuva' && (
          <button className="st-skip" onClick={onDone}>
            Pular história
          </button>
        )}
      </div>

      {scene === 'secar' && (
        <div
          className="st-towel-zone"
          onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), (last.current = { x: e.clientX, y: e.clientY }), setTowel({ x: e.clientX, y: e.clientY }))}
          onPointerMove={(e) => (e.buttons || e.pointerType === 'touch') && rub(e)}
          onPointerUp={() => (last.current = null)}
          aria-label="Área para esfregar a toalha"
        >
          <span className={`st-towel ${towel ? 'is-held' : ''}`} style={towel ? { left: towel.x, top: towel.y } : undefined} aria-hidden="true">
            <svg viewBox="0 0 90 70" width="96" height="74">
              <path d="M8 14 Q45 2 82 14 L78 60 Q45 70 12 60 Z" fill="#FFB3CB" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
              <path d="M14 26 Q45 16 76 26 M16 44 Q45 34 74 44" stroke="#fff" strokeWidth="4" fill="none" strokeDasharray="2 7" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}

// Área de Interações: abre com uma cortina, mostra o cachorrinho na varanda (vista da cidade, árvore, piso de
// madeira e cortinas leves) e a pessoa brinca com ele: tocar faz ele rolar, pular, acenar ou dar festa, com
// corações voando para o contador; arrastar um petisco da bandeja até ele faz ele comer (olhinhos de coração).
// Se ele já estiver no meio de uma brincadeira, ele avisa num balãozinho. Aqui ele tira a roupinha por um tempo.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPE } from 'react';
import { ChevronLeft, Info, Store } from 'lucide-react';
import { Hamster, type DogPose as Pose } from './Hamster';
import { DogPose } from './DogPose';
import { Glyph } from './art';
import { Sheet, toast } from './ui';
import { ITEMS, itemById } from '../data/items';
import { addHearts, care, feed, heartsOf, HEART_TAP_CAP, todayKey, useApp } from '../lib/store';
import { play } from '../lib/sound';
import { isNativeApp, nativePlatform } from '../lib/native';
import { prefersReducedMotion } from '../lib/util';
import type { PetMood } from '../types';

type Act = { pose?: Pose; mood: PetMood; ms: number; walk?: number; sit?: boolean };
const TRICKS: Act[] = [
  { pose: 'rolar', mood: 'risada', ms: 2600 },
  { pose: 'pular', mood: 'animado', ms: 1700 },
  { pose: 'festa', mood: 'risada', ms: 1500 },
  { pose: 'tchau', mood: 'feliz', ms: 1700 },
  { mood: 'amor', ms: 1600 },
];
const E = { chapeu: null, oculos: null, roupa: null, acessorio: null, efeito: null };
let hid = 0;

export function Interactions({ open, onClose, onStore }: { open: boolean; onClose: () => void; onStore?: () => void }) {
  const [mounted, setMounted] = useState(open);
  const [curtain, setCurtain] = useState<'closed' | 'opening' | 'gone' | 'closing'>('closed');
  useEffect(() => {
    if (!open) return;
    setMounted(true);
    setCurtain('closed');
    play('abrir');
    const a = window.setTimeout(() => setCurtain('opening'), 420);
    const b = window.setTimeout(() => setCurtain('gone'), 1500);
    return () => (clearTimeout(a), clearTimeout(b));
  }, [open]);
  if (!open || !mounted) return null;
  const close = () => {
    setCurtain('closing');
    play('fechar');
    window.setTimeout(() => (setMounted(false), onClose()), 560);
  };
  return (
    <div className="ia-root" role="dialog" aria-modal="true" aria-label="Interações">
      <Playground onBack={close} onStore={onStore ? () => (onClose(), onStore()) : undefined} />
      {curtain !== 'gone' && <Curtain state={curtain} />}
    </div>
  );
}

/** A cortina da entrada (e da saída): fecha no meio e abre para os lados. */
function Curtain({ state }: { state: 'closed' | 'opening' | 'closing' }) {
  return (
    <div className={`ia-curtain is-${state}`} aria-hidden="true">
      <div className="ia-curtain-rod" />
      {(['l', 'r'] as const).map((s) => (
        <svg key={s} className={`ia-curtain-panel is-${s}`} viewBox="0 0 120 220" preserveAspectRatio="none">
          <path d="M0 0 H120 V196 Q112 206 100 198 Q90 208 80 198 Q70 208 60 198 Q50 208 40 198 Q30 208 20 198 Q10 208 0 198 Z" fill="#FFF4E2" />
          {[14, 34, 54, 74, 94].map((x) => (
            <path key={x} d={`M${x} 4 V196`} stroke="#F1DDBF" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
          ))}
          <path d="M0 186 Q10 196 20 188 Q30 196 40 188 Q50 196 60 188 Q70 196 80 188 Q90 196 100 188 Q110 196 120 186" stroke="#F4C9A0" strokeWidth="5" fill="none" />
        </svg>
      ))}
    </div>
  );
}

function Playground({ onBack, onStore }: { onBack: () => void; onStore?: () => void }) {
  const s = useApp();
  const name = s.pet.name;
  const [act, setAct] = useState<(Act & { id: number }) | null>(null);
  const [say, setSay] = useState<{ text: string; id: number } | null>(null);
  const [x, setX] = useState(50);
  const [walk, setWalk] = useState<{ dir: 1 | -1; id: number } | null>(null);
  const [sitting, setSitting] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; tx: number; ty: number; d: number }[]>([]);
  const [bump, setBump] = useState(0);
  const [help, setHelp] = useState(false);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [fly, setFly] = useState<{ id: string; from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const dogRef = useRef<HTMLButtonElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const lastTrick = useRef(-1);
  const busyUntil = useRef(0);
  const reduce = useRef(prefersReducedMotion());
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const asleep = s.pet.sleeping;
  const foods = ITEMS.filter((i) => i.kind === 'comida' && (s.inventory[i.id] ?? 0) > 0);
  const busy = () => performance.now() < busyUntil.current || !!walk;

  const talk = (text: string) => {
    const id = ++hid;
    setSay({ text, id });
    later(() => setSay((cur) => (cur?.id === id ? null : cur)), 2600);
  };

  /** Corações saindo dele e voando até o contador. */
  function burst(n: number) {
    const d = dogRef.current?.getBoundingClientRect();
    const c = counterRef.current?.getBoundingClientRect();
    if (!d || !c) return;
    const items = Array.from({ length: Math.min(8, Math.max(3, n * 2)) }, (_, i) => {
      const x0 = d.left + d.width * (0.3 + Math.random() * 0.4);
      const y0 = d.top + d.height * (0.15 + Math.random() * 0.25);
      return { id: ++hid, x: x0, y: y0, tx: c.left + c.width * 0.22 - x0, ty: c.top + c.height / 2 - y0, d: i * 90 };
    });
    setHearts((h) => [...h, ...items]);
    items.forEach((it) => later(() => setHearts((h) => h.filter((y) => y.id !== it.id)), 1500 + it.d));
    later(() => setBump((b) => b + 1), 1050);
  }

  function run(a: Act) {
    const id = ++hid;
    setSitting(false);
    setAct({ ...a, id });
    busyUntil.current = performance.now() + a.ms;
    later(() => setAct((cur) => (cur?.id === id ? null : cur)), a.ms);
  }

  function tapDog() {
    if (asleep) {
      play('ronco');
      return talk(`Zzz… ${name} está dormindo. Depois a gente brinca~`);
    }
    if (busy()) {
      play('iii');
      return talk(act?.pose === 'comer' || act?.mood === 'comendo' ? 'Au~ Estou comendo agora, só um segundinho~' : 'Au~ Estou brincando agora, só um segundinho~');
    }
    let i = Math.floor(Math.random() * TRICKS.length);
    if (i === lastTrick.current) i = (i + 1) % TRICKS.length;
    lastTrick.current = i;
    run(TRICKS[i]);
    play('squeak');
    care('carinho');
    const got = addHearts(1, 'toque');
    if (got) later(() => burst(1), 250);
    else if (Math.random() < 0.35) later(() => talk(`Hoje já ganhei ${HEART_TAP_CAP} corações de carinho! Os petiscos ainda valem~`), 400);
  }

  function eat(id: string) {
    const item = itemById(id);
    if (!item) return;
    if (asleep) return talk(`Zzz… ${name} está dormindo. Depois eu como~`);
    if (busy()) return talk('Au~ Estou brincando agora, só um segundinho~');
    if (s.pet.stats.saciedade >= 98) {
      play('iii');
      return talk('Au~ Tô cheinho! Depois eu como mais~');
    }
    if (!feed(id)) return;
    setSitting(false);
    run({ pose: 'comer', mood: 'comendo', ms: 1500 });
    play(/suco|água|agua|leite|chá|cha|vitamina/i.test(item.name) ? 'gole' : 'nhac');
    later(() => {
      run({ mood: 'amor', ms: 1500 });
      play('coracao');
      const n = addHearts(heartsOf(id), 'petisco');
      burst(n);
    }, 1500);
  }

  // Sozinho, de vez em quando ele anda um pouquinho, senta ou olha em volta.
  useEffect(() => {
    if (asleep || reduce.current) return;
    const tick = window.setInterval(() => {
      if (busy() || drag || fly) return;
      const r = Math.random();
      if (r < 0.45) {
        const to = Math.max(26, Math.min(74, x + (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 16)));
        const dir: 1 | -1 = to > x ? 1 : -1;
        const id = ++hid;
        setSitting(false);
        setWalk({ dir, id });
        setX(to);
        later(() => setWalk((cur) => (cur?.id === id ? null : cur)), 1900);
      } else if (r < 0.7) {
        setSitting((v) => !v);
      }
    }, 6500);
    return () => clearInterval(tick);
  }, [asleep, x, drag, fly]); // eslint-disable-line react-hooks/exhaustive-deps

  // arrastar o petisco
  const near = (cx: number, cy: number) => {
    const d = dogRef.current?.getBoundingClientRect();
    return !!d && cx > d.left - 30 && cx < d.right + 30 && cy > d.top - 30 && cy < d.bottom + 30;
  };
  const tileEvents = (id: string) => ({
    onPointerDown: (e: RPE<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setSitting(false);
      setDrag({ id, x: e.clientX, y: e.clientY, moved: false });
    },
    onPointerMove: (e: RPE<HTMLButtonElement>) => {
      if (!drag) return;
      const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8;
      setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
    },
    onPointerUp: (e: RPE<HTMLButtonElement>) => {
      if (!drag) return;
      const d = drag;
      setDrag(null);
      if (!d.moved) {
        // toque: o petisco voa sozinho até ele
        const r = e.currentTarget.getBoundingClientRect();
        const t = dogRef.current?.getBoundingClientRect();
        if (!t) return;
        setFly({ id, from: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, to: { x: t.left + t.width / 2, y: t.top + t.height * 0.42 } });
        play('jogar');
        later(() => (setFly(null), eat(id)), 520);
        return;
      }
      if (near(e.clientX, e.clientY)) eat(id);
    },
    onPointerCancel: () => setDrag(null),
  });

  const widget = () =>
    toast(
      !isNativeApp()
        ? `O widget funciona no app instalado pela loja: o ${name} fica na tela do seu celular.`
        : nativePlatform() === 'ios'
          ? 'Segure a tela inicial, toque em + e procure por HamiCare.'
          : 'Segure a tela inicial, toque em Widgets e escolha HamiCare.',
    );

  const heartsTotal = s.pet.hearts ?? 0;
  const tapsToday = s.pet.heartsDay?.date === todayKey() ? s.pet.heartsDay.n : 0;
  const pose = act?.pose;
  const mood: PetMood = asleep ? 'dormindo' : (act?.mood ?? (drag?.moved ? 'boca' : 'feliz'));
  const showWalk = !!walk && !act && !asleep;
  const showSit = sitting && !act && !walk && !asleep;
  const dogW = 'min(56vw, 250px)';

  return (
    <div className="ia-play">
      <Balcony />
      <header className="ia-top">
        <button className="ia-back" onClick={onBack} aria-label="Voltar">
          <ChevronLeft size={22} strokeWidth={2.6} />
        </button>
        <button className="ia-help" onClick={() => setHelp(true)}>
          <Info size={17} strokeWidth={2.4} /> Como jogar
        </button>
        <div className="ia-right">
          <div ref={counterRef} key={bump} className={`ia-count ${bump ? 'is-bump' : ''}`} aria-label={`${heartsTotal} corações`}>
            <HeartIcon size={26} />
            <b>{heartsTotal}</b>
          </div>
          <button className="ia-widget" onClick={widget} aria-label="Widget">
            <span className="ia-widget-pet">
              <Hamster fur={s.pet.fur} outfit={E} mood="feliz" size={40} idle={false} growth={1} label="" />
            </span>
            <small>Widget</small>
          </button>
        </div>
      </header>

      {say && (
        <p key={say.id} className="ia-say" aria-live="polite">
          {say.text}
        </p>
      )}

      <div className="ia-floor">
        <button
          ref={dogRef}
          className={`ia-dog ${walk ? 'is-walking' : ''}`}
          style={{ left: `${x}%`, width: dogW } as CSSProperties}
          onClick={tapDog}
          aria-label={`Fazer carinho no ${name}`}
          data-sound="none"
        >
          {asleep ? (
            <DogPose kind="dorme" fur={s.pet.fur} outfit={E} width={250} label="" />
          ) : showWalk ? (
            <span className="ia-walk" style={{ transform: walk!.dir > 0 ? 'scaleX(-1)' : undefined }}>
              <DogPose kind="anda" fur={s.pet.fur} outfit={E} width={190} label="" />
            </span>
          ) : showSit ? (
            <DogPose kind="senta" fur={s.pet.fur} outfit={E} width={230} label="" />
          ) : (
            <Hamster key={act?.id ?? 'idle'} fur={s.pet.fur} outfit={E} mood={mood} pose={pose} size={250} growth={1} label="" />
          )}
        </button>
      </div>

      <div className="ia-note">
        <p>Nesta página, o {name} tira a roupinha por um tempo~</p>
        {onStore && (
          <button className="ia-shop" onClick={onStore} aria-label="Comprar petiscos na Loja">
            <Store size={20} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="ia-tray" aria-label="Petiscos">
        {foods.length ? (
          foods.map((f) => (
            <button key={f.id} className="ia-food" style={{ touchAction: 'none', opacity: drag?.id === f.id && drag.moved ? 0.35 : fly?.id === f.id ? 0.35 : 1 }} aria-label={`Dar ${f.name}`} {...tileEvents(f.id)}>
              <span className="ia-food-n">x{s.inventory[f.id]}</span>
              <Glyph e={f.emoji} size={40} />
              <span className="ia-food-h">
                <HeartIcon size={14} /> +{heartsOf(f.id)}
              </span>
            </button>
          ))
        ) : (
          <button className="ia-food is-empty" onClick={onStore} disabled={!onStore}>
            <Store size={26} strokeWidth={2.2} />
            <span>Petiscos na Loja</span>
          </button>
        )}
      </div>

      {drag?.moved && (
        <span className="ia-ghost" style={{ left: drag.x, top: drag.y }}>
          <Glyph e={itemById(drag.id)?.emoji} size={48} />
        </span>
      )}
      {fly && (
        <span className="ia-ghost is-fly" style={{ left: fly.from.x, top: fly.from.y, ['--fx' as string]: `${fly.to.x - fly.from.x}px`, ['--fy' as string]: `${fly.to.y - fly.from.y}px` }}>
          <Glyph e={itemById(fly.id)?.emoji} size={44} />
        </span>
      )}
      {hearts.map((h) => (
        <span key={h.id} className="ia-heart" style={{ left: h.x, top: h.y, animationDelay: `${h.d}ms`, ['--tx' as string]: `${h.tx}px`, ['--ty' as string]: `${h.ty}px` }}>
          <HeartIcon size={28} />
        </span>
      ))}

      <Sheet open={help} onClose={() => setHelp(false)} title="Como jogar">
        <ul className="ia-howto">
          <li>
            <b>Toque no {name}</b> para fazer carinho: ele rola no chão, pula, acena ou faz festa. Cada carinho vale 1 coração (até {HEART_TAP_CAP} por dia; hoje: {tapsToday}).
          </li>
          <li>
            <b>Arraste um petisco</b> da bandeja até ele (ou só toque no petisco). Cada petisco vale os corações que aparecem nele.
          </li>
          <li>Se ele estiver brincando ou comendo, ele avisa: é só esperar um segundinho.</li>
          <li>Os corações mostram o quanto vocês são amigos. Petiscos novos ficam na Loja.</li>
        </ul>
      </Sheet>
    </div>
  );
}

function HeartIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 22" width={size} height={(size * 22) / 24} aria-hidden="true">
      <path d="M12 21C4 15 0 11 0 6.5A6 6 0 0 1 12 4a6 6 0 0 1 12 2.5C24 11 20 15 12 21Z" fill="#FF7A45" />
      <path d="M12 18.2C6 13.6 3 10.6 3 7.2A3.6 3.6 0 0 1 12 6.4a3.6 3.6 0 0 1 9 .8c0 3.4-3 6.4-9 11Z" fill="#FF5A2E" />
      <ellipse cx="7" cy="7.4" rx="2.2" ry="1.5" fill="#FFFFFF" opacity="0.55" transform="rotate(-30 7 7.4)" />
    </svg>
  );
}

/** A varanda: céu, cidade com morros ao longe, sol, árvore, mureta, piso de madeira e cortinas leves. */
function Balcony() {
  const planks = Array.from({ length: 11 }, (_, i) => i);
  return (
    <svg className="ia-scene" viewBox="0 0 400 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ia-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4CC0F1" />
          <stop offset="1" stopColor="#A8E4FB" />
        </linearGradient>
        <linearGradient id="ia-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0A86F" />
          <stop offset="1" stopColor="#E39457" />
        </linearGradient>
        <linearGradient id="ia-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="400" height="760" fill="url(#ia-sky)" />
      {/* nuvenzinhas */}
      <g fill="#FFFFFF" opacity="0.85">
        <path d="M40 150 q8 -16 26 -10 q10 -14 28 -4 q16 -2 16 12 q0 10 -12 10 h-50 q-12 0 -8 -8 Z" />
        <path d="M250 110 q6 -12 20 -8 q8 -10 22 -3 q12 -1 12 9 q0 8 -9 8 h-38 q-10 0 -7 -6 Z" />
      </g>
      {/* sol */}
      <g transform="translate(316 268)">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M0 -40 L5 -30 L-5 -30 Z" fill="#FFC93D" transform={`rotate(${i * 30})`} />
        ))}
        <circle r="26" fill="#FFD449" />
      </g>
      {/* morros ao longe (com o bondinho) */}
      <path d="M-10 440 L-10 380 Q20 300 62 296 Q104 300 122 372 L136 400 Q150 344 172 340 Q194 344 204 400 L230 440 Z" fill="#83C9A9" />
      <path d="M62 296 Q104 300 122 372" fill="none" stroke="#9FD7BC" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <path d="M66 300 L170 342" stroke="#5E7A87" strokeWidth="1.2" />
      <rect x="112" y="314" width="9" height="7" rx="2" fill="#F05A5A" />
      {/* prédios */}
      <g>
        <rect x="150" y="372" width="38" height="70" fill="#E6F5FB" />
        <rect x="190" y="350" width="30" height="92" fill="#D2ECF7" />
        <rect x="222" y="384" width="54" height="58" fill="#F6C9AE" />
        <path d="M218 384 L249 362 L280 384 Z" fill="#E98E6F" />
        <rect x="278" y="364" width="34" height="78" fill="#EAF7FC" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1].map((c) => <rect key={`${r}${c}`} x={156 + c * 14} y={380 + r * 15} width="8" height="9" fill="#9FD3EC" opacity="0.8" />),
        )}
        {[0, 1, 2, 3, 4].map((r) => <rect key={r} x="198" y={360 + r * 15} width="14" height="8" fill="#9FD3EC" opacity="0.75" />)}
        {[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={230 + c * 15} y={396 + r * 18} width="9" height="11" fill="#FFF3E6" />))}
      </g>
      {/* árvore */}
      <g>
        <path d="M352 470 C350 420 344 380 330 350 L340 346 C356 376 366 420 368 470 Z" fill="#8A5A3C" />
        <path d="M346 380 C362 366 380 364 396 368" stroke="#8A5A3C" strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="330" cy="318" r="56" fill="#3E9B7C" />
        <circle cx="384" cy="300" r="52" fill="#348A6D" />
        <circle cx="300" cy="350" r="34" fill="#46A585" />
        <path d="M300 300 q14 8 26 0 M340 280 q14 8 26 0 M318 336 q12 7 24 0" stroke="#5FBF9C" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
      {/* mureta e vidro */}
      <rect x="0" y="432" width="400" height="16" fill="#F9D9C6" />
      <rect x="0" y="446" width="400" height="66" fill="#EFAE8E" />
      <rect x="0" y="446" width="400" height="8" fill="#E19C7B" opacity="0.6" />
      <rect x="0" y="396" width="400" height="38" fill="url(#ia-glass)" />
      <path d="M0 396 H400" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
      {/* piso de madeira em perspectiva */}
      <rect x="0" y="510" width="400" height="250" fill="url(#ia-floor)" />
      {planks.map((i) => {
        const t = i / (planks.length - 1);
        const xTop = 40 + t * 320;
        const xBot = -160 + t * 720;
        return <path key={i} d={`M${xTop} 510 L${xBot} 760`} stroke="#D98A50" strokeWidth="2.2" />;
      })}
      {[548, 600, 668].map((y, i) => (
        <path key={y} d={`M0 ${y} H400`} stroke="#DC8E55" strokeWidth={1.6 + i * 0.4} opacity="0.6" />
      ))}
      {/* bolinha de tênis e cordinha */}
      <g transform="translate(58 566)">
        <ellipse cx="0" cy="22" rx="22" ry="5" fill="#000" opacity="0.1" />
        <circle r="21" fill="#D6F04F" />
        <path d="M-15 -14 Q0 0 -15 14 M15 -14 Q0 0 15 14" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      </g>
      <g transform="translate(338 602) rotate(-14)">
        <rect x="-26" y="-5" width="52" height="10" rx="5" fill="#F07C7C" />
        <rect x="-26" y="-5" width="52" height="10" rx="5" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="-30" cy="0" r="9" fill="#6AB7F0" />
        <circle cx="30" cy="0" r="9" fill="#6AB7F0" />
      </g>
      {/* cortinas leves dos lados */}
      <g fill="#FFFFFF">
        <path d="M0 0 H86 C70 120 60 260 74 400 C82 470 64 540 46 600 L0 600 Z" opacity="0.42" />
        <path d="M400 0 H314 C330 120 340 260 326 400 C318 470 336 540 354 600 L400 600 Z" opacity="0.42" />
        <path d="M0 0 H40 C34 160 30 360 24 600 L0 600 Z" opacity="0.35" />
        <path d="M400 0 H360 C366 160 370 360 376 600 L400 600 Z" opacity="0.35" />
      </g>
    </svg>
  );
}

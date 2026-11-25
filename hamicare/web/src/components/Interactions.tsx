// Área de Interações: o cachorrinho no quintal dele (grama, cerca branca, casinha com o nome dele, árvore com
// balanço, flores e borboletas). Tocar faz ele rolar, pular, acenar ou dar festa, com corações voando para o
// contador; arrastar um petisco da cesta até ele faz ele comer (olhinhos de coração). Se ele já estiver no meio de
// uma brincadeira, ele avisa num balãozinho. De vez em quando ele anda pelo quintal ou senta.
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

type Act = {
  pose?: Pose;
  mood: PetMood;
  ms: number;
  walk?: number;
  sit?: boolean;
};
const TRICKS: Act[] = [
  { pose: 'rolar', mood: 'risada', ms: 2900 },
  { pose: 'pular', mood: 'animado', ms: 1700 },
  { pose: 'festa', mood: 'risada', ms: 1500 },
  { pose: 'tchau', mood: 'feliz', ms: 1700 },
  { mood: 'amor', ms: 1600 },
  { mood: 'feliz', ms: 2600, sit: true },
];
let hid = 0;

export function Interactions({ open, onClose, onStore }: { open: boolean; onClose: () => void; onStore?: () => void }) {
  useEffect(() => {
    if (open) play('abrir');
  }, [open]);
  if (!open) return null;
  const close = () => {
    play('fechar');
    onClose();
  };
  return (
    <div className="ia-root" role="dialog" aria-modal="true" aria-label="Interações">
      <Playground onBack={close} onStore={onStore ? () => (onClose(), onStore()) : undefined} />
    </div>
  );
}

function Playground({ onBack, onStore }: { onBack: () => void; onStore?: () => void }) {
  const s = useApp();
  const name = s.pet.name;
  const [act, setAct] = useState<(Act & { id: number }) | null>(null);
  const [say, setSay] = useState<{ text: string; id: number } | null>(null);
  const [x, setX] = useState(50);
  const xRef = useRef(50);
  xRef.current = x;
  const [walk, setWalk] = useState<{ dir: 1 | -1; id: number } | null>(null);
  const [sitting, setSitting] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; tx: number; ty: number; d: number }[]>([]);
  const [bump, setBump] = useState(0);
  const [help, setHelp] = useState(false);
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [fly, setFly] = useState<{
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  // graveto: parado no chão (x %, y % de baixo), na mão da pessoa, voando ou na boca dele
  const [stick, setStick] = useState<{
    x: number;
    y: number;
    mode: 'chao' | 'boca';
  }>({ x: 17, y: 5, mode: 'chao' });
  const [stickDrag, setStickDrag] = useState<{ x: number; y: number } | null>(null);
  const [stickFly, setStickFly] = useState<{
    from: { x: number; y: number };
    dx: number;
    dy: number;
    id: number;
  } | null>(null);
  const [runMs, setRunMs] = useState(0);
  const [pick, setPick] = useState(false);
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  const fetching = useRef(false);
  const floorRef = useRef<HTMLDivElement>(null);
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
  const busy = () => performance.now() < busyUntil.current || !!walk || fetching.current;

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
      return {
        id: ++hid,
        x: x0,
        y: y0,
        tx: c.left + c.width * 0.22 - x0,
        ty: c.top + c.height / 2 - y0,
        d: i * 90,
      };
    });
    setHearts((h) => [...h, ...items]);
    items.forEach((it) => later(() => setHearts((h) => h.filter((y) => y.id !== it.id)), 1500 + it.d));
    later(() => setBump((b) => b + 1), 1050);
  }

  function run(a: Act) {
    const id = ++hid;
    setSitting(false);
    setAct({ ...a, id });
    if (a.sit) play('pulo');
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
      return talk(
        fetching.current
          ? 'Au~ Tô buscando o graveto, já volto~'
          : act?.pose === 'comer' || act?.mood === 'comendo'
            ? 'Au~ Estou comendo agora, só um segundinho~'
            : 'Au~ Estou brincando agora, só um segundinho~',
      );
    }
    let i = Math.floor(Math.random() * TRICKS.length);
    if (i === lastTrick.current) i = (i + 1) % TRICKS.length;
    lastTrick.current = i;
    run(TRICKS[i]);
    play('latido');
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

  // ---------- buscar o graveto ----------
  /** Ele corre até um ponto (x em %) e chama `then` quando chega. */
  function runTo(to: number, then: () => void) {
    const from = xRef.current;
    const dir: 1 | -1 = to > from ? 1 : -1;
    const ms = Math.max(500, Math.abs(to - from) * 22);
    const id = ++hid;
    setSitting(false);
    setRunMs(ms);
    setWalk({ dir, id });
    setX(to);
    later(() => then(), ms);
  }
  function fetchStick(tx: number) {
    if (asleep) return talk(`Zzz… ${name} está dormindo. Depois eu busco~`);
    if (performance.now() < busyUntil.current || fetching.current) return talk('Au~ Estou brincando agora, só um segundinho~');
    fetching.current = true;
    play('latido');
    talk('Au! Vou buscar!');
    later(
      () =>
        runTo(tx, () => {
          // pega com a boca
          play('pega');
          setPick(true);
          setStick((st) => ({ ...st, mode: 'boca' }));
          later(
            () => (
              setPick(false),
              runTo(50, () => {
                setWalk(null);
                setRunMs(0);
                setStick({ x: 67, y: 3, mode: 'chao' });
                fetching.current = false;
                run({ mood: 'amor', ms: 1500 });
                play('coracao');
                care('brincar');
                const got = addHearts(1, 'toque');
                if (got) burst(1);
                talk('Trouxe! Joga de novo?');
              })
            ),
            420,
          );
        }),
      350,
    );
  }
  const stickEvents = {
    onPointerDown: (e: RPE<HTMLButtonElement>) => {
      if (fetching.current || stick.mode !== 'chao') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      samples.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
      setStickDrag({ x: e.clientX, y: e.clientY });
    },
    onPointerMove: (e: RPE<HTMLButtonElement>) => {
      if (!stickDrag) return;
      samples.current = [...samples.current.slice(-5), { x: e.clientX, y: e.clientY, t: performance.now() }];
      setStickDrag({ x: e.clientX, y: e.clientY });
    },
    onPointerUp: (e: RPE<HTMLButtonElement>) => {
      if (!stickDrag) return;
      setStickDrag(null);
      const f = floorRef.current?.getBoundingClientRect();
      if (!f) return;
      const a = samples.current[0];
      const dt = Math.max(16, performance.now() - a.t);
      const vx = (e.clientX - a.x) / dt;
      const vy = (e.clientY - a.y) / dt;
      const moved = Math.hypot(e.clientX - a.x, e.clientY - a.y) > 12;
      if (!moved) return talk('Arraste o graveto e solte para jogar!');
      // onde ele cai: segue a direção do arremesso (mais forte = mais longe), sempre dentro do quintal
      const landX = Math.max(8, Math.min(92, ((e.clientX - f.left + vx * 420) / f.width) * 100));
      const landY = Math.max(2, Math.min(7, 100 - ((e.clientY - f.top + vy * 120) / f.height) * 100));
      const to = {
        x: f.left + (landX / 100) * f.width,
        y: f.top + f.height * (1 - landY / 100),
      };
      const id = ++hid;
      play('jogar');
      setStick({ x: landX, y: landY, mode: 'chao' });
      setStickFly({
        from: { x: e.clientX, y: e.clientY },
        dx: to.x - e.clientX,
        dy: to.y - e.clientY,
        id,
      });
      later(() => {
        setStickFly((cur) => (cur?.id === id ? null : cur));
        play('quica');
        fetchStick(landX);
      }, 700);
    },
    onPointerCancel: () => setStickDrag(null),
  };

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
        setFly({
          id,
          from: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
          to: { x: t.left + t.width / 2, y: t.top + t.height * 0.42 },
        });
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
          ? 'Segure a tela inicial, toque em + e procure por Lumbi.'
          : 'Segure a tela inicial, toque em Widgets e escolha Lumbi.',
    );

  const heartsTotal = s.pet.hearts ?? 0;
  const tapsToday = s.pet.heartsDay?.date === todayKey() ? s.pet.heartsDay.n : 0;
  const pose = act?.pose;
  const mood: PetMood = asleep ? 'dormindo' : (act?.mood ?? (drag?.moved ? 'boca' : 'feliz'));
  const showWalk = !!walk && !act && !asleep;
  const showSit = ((sitting && !act) || !!act?.sit) && !walk && !asleep;
  const dogW = 'min(54vw, 240px)';

  return (
    <div className="ia-play">
      <Backyard name={name} />
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
              <Hamster fur={s.pet.fur} outfit={s.pet.outfit} mood="feliz" size={40} idle={false} growth={1} label="" />
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

      <div className="ia-floor" ref={floorRef}>
        {stick.mode === 'chao' && !stickFly && (
          <button
            className={`ia-stick ${stickDrag ? 'is-held' : ''}`}
            style={{
              left: `${stick.x}%`,
              bottom: `${stick.y}%`,
              touchAction: 'none',
            }}
            aria-label="Graveto: arraste e solte para jogar"
            data-sound="none"
            {...stickEvents}
          >
            <StickArt />
          </button>
        )}
        <button
          ref={dogRef}
          className={`ia-dog ${walk ? 'is-walking' : ''}`}
          style={
            {
              left: `${x}%`,
              width: dogW,
              ...(runMs ? { transition: `left ${runMs}ms linear` } : {}),
            } as CSSProperties
          }
          onClick={tapDog}
          aria-label={`Fazer carinho no ${name}`}
          data-sound="none"
        >
          {asleep ? (
            <DogPose kind="dorme" fur={s.pet.fur} outfit={s.pet.outfit} width={250} label="" />
          ) : showWalk ? (
            <span className={`ia-walk ${pick ? 'is-pick' : ''}`}>
              <DogPose kind="anda" fur={s.pet.fur} outfit={s.pet.outfit} width={190} label="" flip={walk!.dir > 0} carry={stick.mode === 'boca'} fast={!!runMs} still={pick} />
            </span>
          ) : showSit ? (
            <DogPose kind="senta" fur={s.pet.fur} outfit={s.pet.outfit} width={230} label="" />
          ) : (
            <Hamster key={act?.id ?? 'idle'} fur={s.pet.fur} outfit={s.pet.outfit} mood={mood} pose={pose} size={250} growth={1} label="" />
          )}
        </button>
      </div>

      <div className="ia-tray" aria-label="Cesta de petiscos">
        <div className="ia-tray-head">
          <span>Cesta de petiscos</span>
          {onStore && (
            <button className="ia-shop" onClick={onStore}>
              <Store size={15} strokeWidth={2.6} /> Loja
            </button>
          )}
        </div>
        <div className="ia-tray-row">
          {foods.length ? (
            foods.map((f) => (
              <button
                key={f.id}
                className="ia-food"
                style={{
                  touchAction: 'none',
                  opacity: drag?.id === f.id && drag.moved ? 0.35 : fly?.id === f.id ? 0.35 : 1,
                }}
                aria-label={`Dar ${f.name}`}
                {...tileEvents(f.id)}
              >
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
      </div>

      {drag?.moved && (
        <span className="ia-ghost" style={{ left: drag.x, top: drag.y }}>
          <Glyph e={itemById(drag.id)?.emoji} size={48} />
        </span>
      )}
      {fly && (
        <span
          className="ia-ghost is-fly"
          style={{
            left: fly.from.x,
            top: fly.from.y,
            ['--fx' as string]: `${fly.to.x - fly.from.x}px`,
            ['--fy' as string]: `${fly.to.y - fly.from.y}px`,
          }}
        >
          <Glyph e={itemById(fly.id)?.emoji} size={44} />
        </span>
      )}
      {stickDrag && (
        <span className="ia-ghost" style={{ left: stickDrag.x, top: stickDrag.y }}>
          <StickArt />
        </span>
      )}
      {stickFly && (
        <span
          key={stickFly.id}
          className="ia-ghost is-throw"
          style={{
            left: stickFly.from.x,
            top: stickFly.from.y,
            ['--fx' as string]: `${stickFly.dx}px`,
            ['--fy' as string]: `${stickFly.dy}px`,
          }}
        >
          <StickArt />
        </span>
      )}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="ia-heart"
          style={{
            left: h.x,
            top: h.y,
            animationDelay: `${h.d}ms`,
            ['--tx' as string]: `${h.tx}px`,
            ['--ty' as string]: `${h.ty}px`,
          }}
        >
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
          <li>
            <b>Arraste o graveto</b> e solte com um movimento para jogar: ele corre, pega com a boca e traz de volta.
          </li>
          <li>Se ele estiver brincando ou comendo, ele avisa: é só esperar um segundinho.</li>
          <li>Os corações mostram o quanto vocês são amigos. Petiscos novos ficam na Loja.</li>
        </ul>
      </Sheet>
    </div>
  );
}

/** O graveto (com uma folhinha). */
export function StickArt({ w = 70 }: { w?: number }) {
  return (
    <svg viewBox="0 0 70 24" width={w} height={(w * 24) / 70} aria-hidden="true">
      <path d="M4 15 C18 12 34 13 50 9 C56 8 62 7 66 6" stroke="#8B5A35" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M4 15 C18 12 34 13 50 9" stroke="#A9713F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M38 12 L46 20" stroke="#8B5A35" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 9 C52 2 60 1 62 4 C58 8 54 9 50 9 Z" fill="#7CC765" />
    </svg>
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

/** O quintal: céu, morrinhos, árvore com balanço, cerca branca, casinha com o nome dele, grama, flores e borboletas. */
function Backyard({ name }: { name: string }) {
  const tufts = [
    [40, 560],
    [118, 600],
    [300, 584],
    [360, 640],
    [70, 690],
    [214, 548],
    [262, 700],
    [150, 728],
  ];
  return (
    <svg className="ia-scene" viewBox="0 0 400 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="yd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9FDBFF" />
          <stop offset="1" stopColor="#E8F7FF" />
        </linearGradient>
        <linearGradient id="yd-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A7DC7E" />
          <stop offset="1" stopColor="#86C866" />
        </linearGradient>
        <radialGradient id="yd-sun">
          <stop offset="0.55" stopColor="#FFE58A" />
          <stop offset="1" stopColor="#FFE58A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="760" fill="url(#yd-sky)" />
      <circle cx="84" cy="150" r="64" fill="url(#yd-sun)" />
      <circle cx="84" cy="150" r="30" fill="#FFD95A" />
      <g fill="#FFFFFF">
        <g className="yd-cloud">
          <ellipse cx="270" cy="120" rx="44" ry="17" />
          <ellipse cx="248" cy="108" rx="20" ry="16" />
          <ellipse cx="284" cy="102" rx="24" ry="20" />
        </g>
        <g className="yd-cloud is-slow">
          <ellipse cx="170" cy="200" rx="30" ry="11" />
          <ellipse cx="182" cy="191" rx="16" ry="12" />
        </g>
      </g>
      {/* morrinhos */}
      <path d="M-20 420 Q60 330 150 380 Q230 320 320 372 Q370 344 420 360 L420 470 L-20 470 Z" fill="#C3E7A9" />
      <path d="M-20 450 Q90 384 200 430 Q300 392 420 420 L420 480 L-20 480 Z" fill="#B0DD92" />
      {/* árvore com balanço */}
      <g>
        <path d="M42 470 C44 420 48 380 40 330 L58 330 C64 380 62 420 64 470 Z" fill="#9A6A48" />
        <path d="M52 352 C78 334 108 330 128 336" stroke="#9A6A48" strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="282" r="62" fill="#5DB37E" />
        <circle cx="96" cy="300" r="48" fill="#6BC08A" />
        <circle cx="6" cy="320" r="40" fill="#52A773" />
        <circle cx="70" cy="250" r="36" fill="#7CCB97" />
        {[
          [30, 260],
          [70, 300],
          [100, 280],
          [12, 300],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="#FF8FA3" />
        ))}
        <g className="yd-swing">
          <path d="M108 338 V420 M132 338 V420" stroke="#C9A27A" strokeWidth="2.6" />
          <rect x="100" y="418" width="40" height="8" rx="4" fill="#E97A5C" />
        </g>
      </g>
      {/* cerca branca */}
      <g>
        <rect x="0" y="438" width="400" height="9" fill="#F2EFEA" />
        <rect x="0" y="470" width="400" height="9" fill="#F2EFEA" />
        {Array.from({ length: 15 }, (_, i) => {
          const x = i * 28 - 4;
          return <path key={i} d={`M${x} 498 V430 L${x + 9} 418 L${x + 18} 430 V498 Z`} fill="#FFFFFF" stroke="#E4DED6" strokeWidth="1.5" />;
        })}
      </g>
      {/* casinha com o nome dele */}
      <g transform="translate(300 392)">
        <ellipse cx="44" cy="118" rx="62" ry="10" fill="#000" opacity="0.08" />
        <rect x="-6" y="40" width="100" height="78" rx="6" fill="#F6B56B" />
        <path d="M-18 46 L44 -8 L106 46 Z" fill="#E4574F" />
        <path d="M-18 46 L44 -8 L106 46" stroke="#C9423C" strokeWidth="6" strokeLinejoin="round" fill="none" />
        <path d="M22 118 V82 a22 22 0 0 1 44 0 V118 Z" fill="#7A4A2C" />
        <rect x="18" y="50" width="52" height="16" rx="5" fill="#FFF4E0" />
        <text x="44" y="62" textAnchor="middle" fontSize={name.length > 7 ? 8 : 10} fontWeight="900" fill="#9A5A2F">
          {name.slice(0, 12)}
        </text>
      </g>
      {/* grama */}
      <rect x="0" y="496" width="400" height="264" fill="url(#yd-grass)" />
      <path d="M0 496 Q100 506 200 498 Q300 490 400 500" stroke="#97D06F" strokeWidth="6" fill="none" />
      {tufts.map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} l4 -10 l3 9 l4 -12 l3 13`} stroke="#6EB451" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {/* caminho de pedrinhas */}
      {[
        [330, 530, 16],
        [302, 560, 18],
        [282, 598, 20],
        [270, 642, 22],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.45} fill="#E9E3D6" />
      ))}
      {/* flores */}
      {[
        [24, 520, '#FF8FA3'],
        [52, 528, '#FFD34D'],
        [370, 520, '#B79CF2'],
        [20, 640, '#FFFFFF'],
        [380, 700, '#FF8FA3'],
        [196, 520, '#FFD34D'],
      ].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 0 V12" stroke="#5FA548" strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-5" rx="3.2" ry="5" fill={c as string} transform={`rotate(${a})`} />
          ))}
          <circle r="2.6" fill="#FFB547" />
        </g>
      ))}
      {/* tigela de água e brinquedos */}
      <g transform="translate(66 610)">
        <ellipse cx="0" cy="10" rx="28" ry="7" fill="#000" opacity="0.08" />
        <path d="M-24 -2 Q-22 12 0 12 Q22 12 24 -2 Z" fill="#5B9BF0" />
        <ellipse cx="0" cy="-2" rx="24" ry="6" fill="#BFE6FF" />
        <text x="0" y="9" textAnchor="middle" fontSize="7" fontWeight="900" fill="#FFFFFF">
          ÁGUA
        </text>
      </g>
      <g transform="translate(340 690) rotate(-18)">
        <path d="M-20 -4 h40 a6 6 0 1 1 0 8 h-40 a6 6 0 1 1 0 -8 Z" fill="#FFF6E6" stroke="#E8D8BD" strokeWidth="2" />
        <circle cx="-24" cy="-5" r="6" fill="#FFF6E6" stroke="#E8D8BD" strokeWidth="2" />
        <circle cx="-24" cy="5" r="6" fill="#FFF6E6" stroke="#E8D8BD" strokeWidth="2" />
        <circle cx="24" cy="-5" r="6" fill="#FFF6E6" stroke="#E8D8BD" strokeWidth="2" />
        <circle cx="24" cy="5" r="6" fill="#FFF6E6" stroke="#E8D8BD" strokeWidth="2" />
      </g>
      <g transform="translate(118 702)">
        <circle r="15" fill="#FF7A6B" />
        <path d="M-15 0 H15 M0 -15 V15" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
      </g>
      {/* borboletas */}
      {[
        [150, 300, 0],
        [250, 250, 1.4],
      ].map(([x, y, d], i) => (
        <g key={i} className="yd-fly" style={{ animationDelay: `${d}s` }} transform={`translate(${x} ${y})`}>
          <ellipse cx="-5" cy="-2" rx="6" ry="8" fill={i ? '#FFB3C7' : '#B9A3F0'} className="yd-wing" />
          <ellipse cx="5" cy="-2" rx="6" ry="8" fill={i ? '#FFB3C7' : '#B9A3F0'} className="yd-wing is-r" />
          <rect x="-1" y="-7" width="2" height="12" rx="1" fill="#5A4A6A" />
        </g>
      ))}
    </svg>
  );
}

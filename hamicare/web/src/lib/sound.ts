// Efeitos sonoros do HamiCare. Todos são criados na hora com Web Audio: nenhum arquivo para baixar,
// funcionam sem internet e na página de teste. Respeitam a opção "Sons" dos Ajustes.
//
// play('tarefa')                 → toca um som uma vez
// startLoop('chuveiro')          → som contínuo (devolve a função que para)
// useSoundLoop('secador', ativo) → o mesmo, ligado enquanto `ativo` for verdade
import { useEffect } from 'react';

export type SoundId =
  // Interface
  | 'toque' | 'aba' | 'abrir' | 'fechar' | 'ligar' | 'desligar' | 'erro' | 'aviso' | 'enviar'
  // Sementes, missões e comemorações
  | 'semente' | 'compra' | 'tarefa' | 'desfazer' | 'nivel' | 'conquista' | 'ofensiva' | 'bomdia' | 'festa' | 'magia' | 'pronto'
  // Baús
  | 'bau-treme' | 'bau-abre'
  // Banho
  | 'shampoo' | 'espuma' | 'bolha' | 'toalha' | 'sacudir'
  // Hami
  | 'nhac' | 'gole' | 'escova' | 'brilho' | 'iii' | 'risada' | 'ronrom' | 'coracao' | 'pulo' | 'bocejo' | 'ronco' | 'espreguicar'
  // Brincadeiras
  | 'pega' | 'jogar' | 'quica' | 'tique' | 'fim-jogo'
  // Quarto e casa
  | 'interruptor' | 'cortina' | 'coberta' | 'cancao' | 'foto' | 'cozinhar' | 'vestir' | 'colocar'
  // Calma
  | 'inspira' | 'expira';

export type LoopId = 'chuveiro' | 'secador';

export interface PlayOpts {
  /** Nota/altura (por exemplo, combo da chuva de sementes ou estrofe da canção). */
  step?: number;
  /** Raridade do item do baú. */
  rarity?: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';
  /** Duração (respiração guiada). */
  ms?: number;
}

// ---------- Motor ----------

type Ctx = BaseAudioContext;
let live: AudioContext | null = null;
let ac: Ctx | null = null;
let out: AudioNode | null = null;
let verb: AudioNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let isOn: () => boolean = () => true;
let volume: () => number = () => 1;
let masterGain: GainNode | null = null;
/** Último som "de verdade" (não o toque de botão): serve para o toque não sobrar por cima. */
let lastRich = 0;
const lastAt: Partial<Record<SoundId, number>> = {};
let voices = 0;

/** Liga o motor ao estado do app (ligado/desligado e volume). */
export function configureSound(opts: { enabled: () => boolean; volume: () => number }) {
  isOn = opts.enabled;
  volume = opts.volume;
}

const MASTER = 0.85;

function build(c: Ctx, dest: AudioNode) {
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 10;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.2;
  comp.connect(dest);
  const master = c.createGain();
  master.gain.value = MASTER * volume();
  master.connect(comp);
  const conv = c.createConvolver();
  conv.buffer = impulse(c, 1.8, 3);
  const send = c.createGain();
  send.gain.value = 1;
  send.connect(conv);
  conv.connect(master);
  noiseBuf = whiteNoise(c, 2);
  ac = c;
  out = master;
  verb = send;
  masterGain = master;
}

function context(): Ctx | null {
  if (ac) return ac;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    live = new AC({ latencyHint: 'interactive' });
  } catch {
    return null;
  }
  build(live, live.destination);
  return ac;
}

/** Destrava o áudio no primeiro toque (celulares só deixam tocar depois de um gesto). */
export function unlockSound() {
  if (!isOn()) return;
  const c = context();
  if (live && c === live && live.state !== 'running') live.resume().catch(() => {});
}

function whiteNoise(c: Ctx, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Eco de sala bem curtinho (deixa os sininhos mais bonitos). */
function impulse(c: Ctx, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

/** Momento fixo para gerar a amostra; no app, sempre "agora". */
let fixedTime: number | null = null;
const now = () => fixedTime ?? ac!.currentTime;

function route(node: AudioNode, wet = 0, pan = 0) {
  const c = ac!;
  let last: AudioNode = node;
  if (pan && 'createStereoPanner' in c) {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    last = p;
  }
  last.connect(out!);
  if (wet > 0) {
    const s = c.createGain();
    s.gain.value = wet;
    last.connect(s);
    s.connect(verb!);
  }
}

function env(g: GainNode, t0: number, v: number, a: number, d: number) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
}

interface Tone {
  f: number;
  to?: number;
  slide?: number;
  type?: OscillatorType;
  t?: number;
  d: number;
  v: number;
  a?: number;
  wet?: number;
  pan?: number;
  vib?: number;
}
function tone(o: Tone) {
  const c = ac!;
  const t0 = now() + (o.t ?? 0);
  const osc = c.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.slide ?? o.d));
  if (o.vib) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 7;
    depth.gain.value = o.vib;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + o.d + 0.05);
  }
  const g = c.createGain();
  env(g, t0, o.v, o.a ?? 0.004, o.d);
  osc.connect(g);
  route(g, o.wet, o.pan);
  osc.start(t0);
  osc.stop(t0 + o.d + 0.05);
  voices++;
  osc.onended = () => voices--;
}

interface Noise {
  f: number;
  to?: number;
  q?: number;
  type?: BiquadFilterType;
  t?: number;
  d: number;
  v: number;
  a?: number;
  wet?: number;
  pan?: number;
}
function noise(o: Noise) {
  const c = ac!;
  const t0 = now() + (o.t ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const flt = c.createBiquadFilter();
  flt.type = o.type ?? 'bandpass';
  flt.frequency.setValueAtTime(o.f, t0);
  if (o.to) flt.frequency.exponentialRampToValueAtTime(o.to, t0 + o.d);
  flt.Q.value = o.q ?? 1;
  const g = c.createGain();
  env(g, t0, o.v, o.a ?? 0.004, o.d);
  src.connect(flt);
  flt.connect(g);
  route(g, o.wet, o.pan);
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + o.d + 0.05);
  voices++;
  src.onended = () => voices--;
}

/** Sininho: nota principal com harmônicos de metal, um pouco de eco. */
function bell(f: number, t = 0, v = 0.12, d = 0.5, wet = 0.3, pan = 0) {
  tone({ f, t, v, d, a: 0.006, wet, pan });
  tone({ f: f * 2.76, t, v: v * 0.2, d: d * 0.45, a: 0.005, wet, pan });
  // Harmônico bem agudo só nas notas mais graves (nas agudas ele vira chiado no alto-falante do celular).
  if (f * 5.4 < 9000) tone({ f: f * 5.4, t, v: v * 0.05, d: d * 0.2, a: 0.004, wet, pan });
}

/** Brilhinhos aleatórios bem agudos. */
function sparkles(n: number, from: number, span: number, v = 0.03) {
  for (let i = 0; i < n; i++) tone({ f: 2600 + Math.random() * 3400, t: from + Math.random() * span, d: 0.09 + Math.random() * 0.08, v, wet: 0.5, pan: Math.random() * 1.2 - 0.6 });
}

const N = (semis: number) => 440 * 2 ** (semis / 12); // 0 = Lá 4
const C5 = N(3), D5 = N(5), E5 = N(7), G5 = N(10), A5 = N(12), B5 = N(14), C6 = N(15), D6 = N(17), E6 = N(19), G6 = N(22), A6 = N(24), C7 = N(27);
const PENTA = [C6, D6, E6, G6, A6, C7, N(29), N(31)];
const jitter = (x: number, amt = 0.04) => x * (1 + (Math.random() * 2 - 1) * amt);

// ---------- Os sons ----------

const SOUNDS: Record<SoundId, (o: PlayOpts) => void> = {
  // Interface
  toque: () => {
    const r = jitter(1);
    tone({ f: 1150 * r, to: 560 * r, slide: 0.05, d: 0.07, v: 0.14 });
    tone({ f: 2300 * r, d: 0.018, v: 0.02, type: 'triangle' });
  },
  aba: () => {
    tone({ f: 680, to: 1040, slide: 0.06, d: 0.09, v: 0.12 });
    tone({ f: 1560, t: 0.045, d: 0.12, v: 0.03, wet: 0.15 });
  },
  abrir: () => {
    noise({ f: 450, to: 2400, q: 0.8, d: 0.24, v: 0.09, a: 0.08 });
    tone({ f: 380, to: 640, d: 0.18, v: 0.04, a: 0.03 });
  },
  fechar: () => {
    noise({ f: 2000, to: 420, q: 0.8, d: 0.2, v: 0.08, a: 0.03 });
    tone({ f: 600, to: 360, d: 0.15, v: 0.035 });
  },
  ligar: () => {
    tone({ f: E5, d: 0.08, v: 0.11 });
    tone({ f: A5, t: 0.06, d: 0.13, v: 0.11, wet: 0.1 });
  },
  desligar: () => {
    tone({ f: A5, d: 0.08, v: 0.1 });
    tone({ f: E5, t: 0.06, d: 0.13, v: 0.1 });
  },
  erro: () => {
    tone({ f: 330, d: 0.13, v: 0.1, type: 'triangle' });
    tone({ f: 247, t: 0.13, d: 0.2, v: 0.1, type: 'triangle' });
  },
  aviso: () => bell(E6, 0, 0.045, 0.3, 0.25),
  enviar: () => {
    noise({ f: 600, to: 3200, q: 0.9, d: 0.26, v: 0.05, a: 0.05 });
    bell(E6, 0.16, 0.08, 0.45);
  },

  // Sementes, missões e comemorações
  semente: () => {
    bell(B5, 0, 0.11, 0.16, 0.2);
    bell(E6, 0.07, 0.13, 0.5, 0.25);
  },
  compra: () => {
    noise({ f: 5000, type: 'highpass', d: 0.05, v: 0.06 });
    tone({ f: 180, to: 120, d: 0.08, v: 0.1 });
    bell(G6, 0.05, 0.09, 0.3);
    bell(C7, 0.11, 0.09, 0.55, 0.35);
  },
  tarefa: () => {
    tone({ f: 420, to: 820, d: 0.12, v: 0.05 });
    bell(C6, 0, 0.12, 0.3);
    bell(E6, 0.07, 0.12, 0.35);
    bell(G6, 0.14, 0.13, 0.7, 0.35);
    sparkles(3, 0.18, 0.2);
  },
  desfazer: () => {
    tone({ f: G5, d: 0.12, v: 0.07 });
    tone({ f: D5, t: 0.08, d: 0.18, v: 0.07 });
  },
  nivel: () => {
    noise({ f: 300, to: 4000, q: 0.7, d: 0.42, v: 0.04, a: 0.2 });
    [C5, E5, G5, C6].forEach((f, i) => {
      tone({ f, t: i * 0.1, d: 0.2, v: 0.1, type: 'triangle', wet: 0.2 });
      tone({ f: f * 2, t: i * 0.1, d: 0.12, v: 0.03, wet: 0.2 });
    });
    tone({ f: 110, to: 55, t: 0.42, d: 0.45, v: 0.22 });
    [C5, E5, G5, C6].forEach((f) => tone({ f, t: 0.42, d: 1.4, v: 0.055, a: 0.03, type: 'triangle', wet: 0.4, vib: 3 }));
    bell(C7, 0.42, 0.07, 1.2, 0.5);
    sparkles(10, 0.5, 0.9);
  },
  conquista: () => {
    [G5, C6, E6, G6].forEach((f, i) => bell(f, i * 0.06, 0.1, i === 3 ? 0.9 : 0.35, 0.35));
    sparkles(6, 0.25, 0.5);
  },
  ofensiva: () => {
    noise({ f: 200, to: 3200, type: 'lowpass', q: 0.5, d: 0.5, v: 0.12, a: 0.12 });
    tone({ f: 90, to: 50, t: 0.3, d: 0.35, v: 0.18 });
    bell(E6, 0.3, 0.11, 0.4);
    bell(G6, 0.38, 0.11, 0.8, 0.4);
    sparkles(5, 0.45, 0.4);
  },
  bomdia: () => {
    bell(C6, 0, 0.07, 0.6, 0.45);
    bell(G6, 0.13, 0.07, 0.6, 0.45);
    bell(E6, 0.26, 0.08, 1.1, 0.5);
  },
  festa: () => {
    noise({ f: 1800, q: 0.6, d: 0.09, v: 0.14 });
    tone({ f: 260, to: 120, d: 0.08, v: 0.12 });
    sparkles(12, 0.06, 0.8, 0.028);
  },
  magia: () => {
    [C6, D6, E6, G6, A6, C7].forEach((f, i) => bell(f, i * 0.05, 0.05, 0.4, 0.5, (i - 2.5) / 5));
    noise({ f: 3000, to: 8000, type: 'highpass', d: 0.6, v: 0.025, a: 0.3, wet: 0.4 });
  },
  pronto: () => {
    [G5, C6, E6].forEach((f, i) => tone({ f, t: i * 0.09, d: 0.16, v: 0.09, type: 'triangle', wet: 0.2 }));
    bell(G6, 0.27, 0.12, 0.9, 0.4);
    sparkles(6, 0.3, 0.5);
  },

  // Baús
  'bau-treme': () => {
    tone({ f: jitter(170, 0.08), to: 110, d: 0.09, v: 0.18 });
    noise({ f: 900, q: 3, d: 0.06, v: 0.07 });
  },
  'bau-abre': ({ rarity = 'comum' }) => {
    noise({ f: 400, to: 6000, q: 0.6, d: 0.38, v: 0.09, a: 0.05 });
    tone({ f: 120, to: 60, d: 0.3, v: 0.2 });
    bell(C6, 0.12, 0.1, 0.6);
    bell(E6, 0.18, 0.1, 0.7);
    if (rarity !== 'comum') bell(G6, 0.24, 0.11, 0.9, 0.4);
    if (rarity === 'epico' || rarity === 'lendario') {
      [C7, N(31), N(34)].forEach((f, i) => bell(f, 0.34 + i * 0.07, 0.07, 1, 0.5));
      sparkles(10, 0.35, 1);
    }
    if (rarity === 'lendario') {
      [C5, E5, G5, C6].forEach((f) => tone({ f, t: 0.55, d: 1.6, v: 0.05, a: 0.05, type: 'triangle', wet: 0.5, vib: 3 }));
      sparkles(12, 0.8, 1.2);
    }
  },

  // Banho
  shampoo: () => {
    tone({ f: 420, to: 140, d: 0.16, v: 0.18 });
    noise({ f: 1200, to: 300, q: 2, d: 0.12, v: 0.09 });
  },
  espuma: () => {
    noise({ f: 1800 + Math.random() * 1400, q: 4, d: 0.07, v: 0.09, pan: Math.random() - 0.5 });
    tone({ f: 1500 + Math.random() * 1000, to: 2600, d: 0.03, v: 0.03 });
  },
  bolha: () => tone({ f: jitter(1050, 0.2), to: 1900, d: 0.045, v: 0.13, pan: Math.random() - 0.5 }),
  toalha: () => noise({ f: jitter(800, 0.25), q: 0.7, d: 0.12, v: 0.16, a: 0.035 }),
  sacudir: () => {
    noise({ f: 1500, type: 'highpass', d: 0.25, v: 0.04, a: 0.02 });
    for (let i = 0; i < 6; i++) tone({ f: 1200 + Math.random() * 1000, to: 800, t: Math.random() * 0.35, d: 0.05, v: 0.05, pan: Math.random() * 1.4 - 0.7 });
  },

  // Hami
  nhac: () => {
    for (let i = 0; i < 4; i++) {
      noise({ f: 2200, type: 'highpass', q: 0.5, t: i * 0.16, d: 0.045, v: 0.12 });
      noise({ f: 700, q: 1.5, t: i * 0.16 + 0.01, d: 0.06, v: 0.08 });
    }
  },
  gole: () => {
    tone({ f: 260, to: 160, d: 0.1, v: 0.14 });
    tone({ f: 300, to: 190, t: 0.16, d: 0.1, v: 0.12 });
  },
  escova: () => noise({ f: 2600, type: 'highpass', q: 0.6, d: 0.09, v: 0.09, a: 0.02, pan: Math.random() * 0.6 - 0.3 }),
  brilho: () => [2093, 2637, 3136, 4186].forEach((f, i) => bell(f, i * 0.04, 0.045, 0.3, 0.45)),
  iii: () => {
    tone({ f: 1500, to: 2100, d: 0.09, v: 0.06, vib: 30 });
    tone({ f: 1700, to: 2350, t: 0.11, d: 0.09, v: 0.06, vib: 30 });
  },
  risada: () => [2100, 1950, 1800, 1700].forEach((f, i) => tone({ f: jitter(f), to: f * 0.85, t: i * 0.075, d: 0.06, v: 0.055 })),
  ronrom: () => {
    const c = ac!;
    const t0 = now();
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 210;
    const trem = c.createOscillator();
    trem.frequency.value = 18;
    const depth = c.createGain();
    depth.gain.value = 0.03;
    const g = c.createGain();
    env(g, t0, 0.05, 0.08, 0.55);
    trem.connect(depth);
    depth.connect(g.gain);
    osc.connect(g);
    route(g, 0.15);
    osc.start(t0);
    trem.start(t0);
    osc.stop(t0 + 0.6);
    trem.stop(t0 + 0.6);
  },
  coracao: () => bell(PENTA[Math.floor(Math.random() * 6)], 0, 0.06, 0.25, 0.3, Math.random() * 0.6 - 0.3),
  pulo: () => {
    tone({ f: 200, to: 560, slide: 0.12, d: 0.18, v: 0.11 });
    tone({ f: 400, to: 1100, slide: 0.12, d: 0.12, v: 0.03, type: 'triangle' });
  },
  bocejo: () => tone({ f: 640, to: 300, d: 0.75, v: 0.05, a: 0.15, vib: 5, type: 'triangle' }),
  ronco: () => noise({ f: 320, type: 'lowpass', d: 0.7, v: 0.09, a: 0.35 }),
  espreguicar: () => {
    tone({ f: 300, to: 720, d: 0.5, v: 0.05, a: 0.1, vib: 4, type: 'triangle' });
    bell(G6, 0.45, 0.06, 0.5);
  },

  // Brincadeiras
  pega: ({ step = 0 }) => {
    bell(PENTA[Math.min(step, PENTA.length - 1)], 0, 0.09, 0.22, 0.25);
    tone({ f: 600, to: 900, d: 0.05, v: 0.04 });
  },
  jogar: () => noise({ f: 700, to: 2600, q: 0.9, d: 0.22, v: 0.11, a: 0.05 }),
  quica: () => {
    tone({ f: 150, to: 70, d: 0.13, v: 0.22 });
    noise({ f: 400, type: 'lowpass', d: 0.05, v: 0.1 });
  },
  tique: () => tone({ f: 1000, d: 0.035, v: 0.06 }),
  'fim-jogo': () => {
    tone({ f: 260, to: 120, d: 0.08, v: 0.1 });
    noise({ f: 1800, q: 0.6, d: 0.08, v: 0.1 });
    [G5, C6, E6].forEach((f, i) => tone({ f, t: 0.05 + i * 0.09, d: 0.16, v: 0.09, type: 'triangle', wet: 0.2 }));
    bell(G6, 0.32, 0.12, 0.9, 0.4);
    sparkles(10, 0.35, 0.7);
  },

  // Quarto e casa
  interruptor: () => {
    noise({ f: 2500, type: 'highpass', d: 0.015, v: 0.16 });
    tone({ f: 1800, d: 0.02, v: 0.05 });
  },
  cortina: () => noise({ f: 1200, to: 600, q: 0.6, d: 0.55, v: 0.11, a: 0.12 }),
  coberta: () => noise({ f: 700, type: 'lowpass', d: 0.4, v: 0.15, a: 0.08 }),
  cancao: ({ step = 0 }) => {
    const songs = [
      [E5, D5, C5],
      [G5, E5, C5],
      [C5, N(-2), C5],
    ];
    songs[step % 3].forEach((f, i) => tone({ f, t: i * 0.32, d: i === 2 ? 1.1 : 0.55, v: 0.07, a: 0.04, vib: 3, wet: 0.5 }));
  },
  foto: () => {
    noise({ f: 2500, type: 'highpass', d: 0.03, v: 0.2 });
    tone({ f: 120, d: 0.05, v: 0.1 });
    noise({ f: 2000, type: 'highpass', t: 0.08, d: 0.05, v: 0.14 });
  },
  cozinhar: () => {
    noise({ f: 3500, type: 'highpass', d: 0.6, v: 0.05, a: 0.05 });
    bell(C7, 0.5, 0.1, 0.6, 0.35);
  },
  vestir: () => {
    noise({ f: 1500, to: 3200, q: 0.8, d: 0.16, v: 0.07, a: 0.03 });
    bell(G6, 0.1, 0.07, 0.35, 0.35);
  },
  colocar: () => {
    tone({ f: 300, to: 200, d: 0.07, v: 0.14 });
    noise({ f: 1000, q: 5, d: 0.04, v: 0.06 });
  },

  // Calma (bem baixinho)
  inspira: ({ ms = 4000 }) => {
    const d = Math.min(8, ms / 1000);
    [C5, E5, G5].forEach((f) => tone({ f: f / 2, to: (f / 2) * 1.06, d, v: 0.03, a: d * 0.45, wet: 0.5 }));
  },
  expira: ({ ms = 4000 }) => {
    const d = Math.min(8, ms / 1000);
    [C5, E5, G5].forEach((f) => tone({ f: (f / 2) * 1.06, to: f / 2, d, v: 0.025, a: 0.4, wet: 0.5 }));
  },
};

export const SOUND_IDS = Object.keys(SOUNDS) as SoundId[];

/** Intervalo mínimo entre repetições (sons de arrastar o dedo não viram chiado). */
const GAP: Partial<Record<SoundId, number>> = { toque: 40, espuma: 75, toalha: 95, escova: 110, coracao: 120, bolha: 60, 'bau-treme': 120, ronco: 1700, tique: 300, semente: 120, sacudir: 400, iii: 250, risada: 300, quica: 150 };
const QUIET: SoundId[] = ['toque', 'aba', 'aviso'];

function allowed(id: SoundId) {
  if (!isOn() || volume() <= 0) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  const t = performance.now();
  if (t - (lastAt[id] ?? -1e9) < (GAP[id] ?? 30)) return false;
  if (voices > 70) return false;
  lastAt[id] = t;
  if (!QUIET.includes(id)) lastRich = t;
  return true;
}

function render(id: SoundId, o: PlayOpts) {
  if (masterGain) masterGain.gain.value = MASTER * volume();
  // Testes no navegador podem ligar um registro dos sons tocados.
  (globalThis as { __soundLog?: string[] }).__soundLog?.push(id);
  try {
    SOUNDS[id](o);
  } catch {
    /* som é enfeite: nunca derruba o app */
  }
}

/** Toca um efeito. Nunca lança erro. */
export function play(id: SoundId, o: PlayOpts = {}) {
  if (!allowed(id)) return;
  const c = context();
  if (!c) return;
  if (live && c === live && live.state !== 'running') {
    // Primeiro som depois de destravar: espera o áudio acordar (se demorar, deixa pra lá).
    const asked = performance.now();
    live
      .resume()
      .then(() => performance.now() - asked < 400 && render(id, o))
      .catch(() => {});
    return;
  }
  render(id, o);
}

/** Toca só se nenhum outro som tocou há pouco (avisos que acompanham uma ação já sonora). */
export function playSoft(id: SoundId, quietMs = 350) {
  if (performance.now() - lastRich < quietMs) return;
  play(id);
}

// ---------- Sons contínuos ----------

export function startLoop(id: LoopId): () => void {
  if (!isOn() || volume() <= 0) return () => {};
  const c = context();
  if (!c) return () => {};
  if (live && live.state !== 'running') live.resume().catch(() => {});
  lastRich = performance.now();
  (globalThis as { __soundLog?: string[] }).__soundLog?.push(`loop:${id}`);
  const t0 = now();
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  route(g, 0.08);
  const nodes: AudioScheduledSourceNode[] = [];
  const src = (b: AudioBuffer) => {
    const s = c.createBufferSource();
    s.buffer = b;
    s.loop = true;
    s.start(t0, Math.random());
    nodes.push(s);
    return s;
  };
  const filter = (type: BiquadFilterType, f: number, q = 0.7) => {
    const x = c.createBiquadFilter();
    x.type = type;
    x.frequency.value = f;
    x.Q.value = q;
    return x;
  };
  let drops: ReturnType<typeof setInterval> | undefined;
  let motor: OscillatorNode | null = null;

  if (id === 'chuveiro') {
    // Água: chiado agudo + corpo mais grave + gotinhas soltas.
    const hi = src(noiseBuf!);
    const hp = filter('highpass', 900);
    const bp = filter('bandpass', 2800, 0.5);
    const hiG = c.createGain();
    hiG.gain.value = 1;
    hi.connect(hp);
    hp.connect(bp);
    bp.connect(hiG);
    hiG.connect(g);
    const lo = src(noiseBuf!);
    const lp = filter('lowpass', 700);
    const loG = c.createGain();
    loG.gain.value = 0.35;
    lo.connect(lp);
    lp.connect(loG);
    loG.connect(g);
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.3;
    const depth = c.createGain();
    depth.gain.value = 0.18;
    lfo.connect(depth);
    depth.connect(hiG.gain);
    lfo.start(t0);
    nodes.push(lfo);
    g.gain.exponentialRampToValueAtTime(0.1, t0 + 0.15);
    drops = setInterval(() => {
      if (ac === c && Math.random() < 0.7) tone({ f: 1400 + Math.random() * 2200, to: 900, d: 0.04, v: 0.02, pan: Math.random() - 0.5 });
    }, 110);
  } else {
    // Secador: motor que acelera + vento.
    motor = c.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(70, t0);
    motor.frequency.exponentialRampToValueAtTime(150, t0 + 0.5);
    const mlp = filter('lowpass', 520);
    const mG = c.createGain();
    mG.gain.value = 0.22;
    motor.connect(mlp);
    mlp.connect(mG);
    mG.connect(g);
    motor.start(t0);
    nodes.push(motor);
    const air = src(noiseBuf!);
    const abp = filter('bandpass', 1300, 0.5);
    const aG = c.createGain();
    aG.gain.value = 1;
    air.connect(abp);
    abp.connect(aG);
    aG.connect(g);
    const wob = c.createOscillator();
    wob.frequency.value = 6;
    const wd = c.createGain();
    wd.gain.value = 180;
    wob.connect(wd);
    wd.connect(abp.frequency);
    wob.start(t0);
    nodes.push(wob);
    const hiss = src(noiseBuf!);
    const hhp = filter('highpass', 5200);
    const hG = c.createGain();
    hG.gain.value = 0.25;
    hiss.connect(hhp);
    hhp.connect(hG);
    hG.connect(g);
    g.gain.exponentialRampToValueAtTime(0.11, t0 + 0.25);
  }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (drops) clearInterval(drops);
    const t = now();
    const fade = id === 'secador' ? 0.45 : 0.2;
    // Some a partir do volume em que estiver (sem pulo: alguns navegadores não informam o valor atual).
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(0.0001, t, fade / 4);
    if (motor) motor.frequency.exponentialRampToValueAtTime(45, t + fade);
    nodes.forEach((n) => n.stop(t + fade + 0.05));
  };
}

// ---------- Toque em botões (em todo o app) ----------

const CLICKABLE = 'button, a[href], [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=menuitem], [role=option], summary, input[type=checkbox], input[type=radio], select';

/** Escolhe o som de um clique: data-sound no elemento manda; abas, chaves e o resto têm o seu. */
export function soundForClick(el: Element): SoundId | null {
  const ds = el.closest('[data-sound]')?.getAttribute('data-sound');
  if (ds === 'none') return null;
  if (ds && ds in SOUNDS) return ds as SoundId;
  // Pelo texto do botão: mandar algo para alguém e o "Fiz!" das missões da turma.
  const label = (el.getAttribute('aria-label') || el.textContent || '').trim().toLowerCase();
  if (/^(enviar|publicar|mandar|pedir amizade|convidar|compartilhar)/.test(label)) return 'enviar';
  if (/^fiz!?$/.test(label)) return el.getAttribute('aria-pressed') === 'true' ? 'desfazer' : 'tarefa';
  if (el.getAttribute('role') === 'tab' || el.classList.contains('tab') || el.classList.contains('chip')) return 'aba';
  const input = el as HTMLInputElement;
  if (input.tagName === 'INPUT' && (input.type === 'checkbox' || input.type === 'radio')) return input.checked ? 'ligar' : 'desligar';
  if (el.getAttribute('role') === 'switch') return el.getAttribute('aria-checked') === 'true' ? 'desligar' : 'ligar';
  return 'toque';
}

let installed = false;
/** Liga os toques de botão e destrava o áudio no primeiro gesto. Chame uma vez ao abrir o app. */
export function installSound() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  try {
    // iPhone: os sons do app se misturam com a música da pessoa e respeitam a chave do silencioso.
    const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (s) s.type = 'ambient';
  } catch {
    /* navegador sem esse recurso */
  }
  const unlock = () => unlockSound();
  // iPhone só aceita destravar no fim do toque; os outros já no começo.
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true });
  window.addEventListener(
    'click',
    (e) => {
      unlock();
      const el = (e.target as Element | null)?.closest?.(CLICKABLE);
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      const id = soundForClick(el);
      if (!id) return;
      if (id !== 'toque' && id !== 'aba') return play(id);
      // O toque espera um instante: se o botão já tocou (ou acabou de tocar) um som próprio, ele não toca por cima.
      const at = performance.now();
      setTimeout(() => lastRich < at - 150 && play(id), 0);
    },
    { capture: true },
  );
  document.addEventListener('visibilitychange', () => {
    if (!live) return;
    if (document.hidden) live.suspend().catch(() => {});
    else if (isOn()) live.resume().catch(() => {});
  });
}

/** Para testes e para gerar a amostra de áudio: usa outro contexto (por exemplo, OfflineAudioContext). */
export function useContextForRendering(c: Ctx, dest: AudioNode = c.destination) {
  build(c, dest);
  live = null;
}

/** Toca direto (sem limites de repetição) num momento fixo: usado ao gerar a amostra. */
export function renderAt(time: number, id: SoundId, o: PlayOpts = {}) {
  fixedTime = time;
  try {
    render(id, o);
  } finally {
    fixedTime = null;
  }
}

/** Som contínuo num trecho fixo: usado ao gerar a amostra. */
export function renderLoopAt(time: number, id: LoopId, seconds: number) {
  fixedTime = time;
  let stop: () => void = () => {};
  try {
    stop = startLoop(id);
  } finally {
    fixedTime = time + seconds;
    stop();
    fixedTime = null;
  }
}

/** Som contínuo enquanto `active` for verdade (para quando a tela fecha). */
export function useSoundLoop(id: LoopId, active: boolean) {
  useEffect(() => {
    if (!active) return;
    return startLoop(id);
  }, [id, active]);
}

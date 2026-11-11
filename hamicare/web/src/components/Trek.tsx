// Viagem do dia (estilo Finch): o Hami anda de lado carregando uma trouxinha, com o cenário da arena
// onde mora (ou da Lua) passando atrás. Barra de progresso até o "?" e presente na volta.
import { useEffect, useState, type ReactNode } from 'react';
import { Zap } from 'lucide-react';
import { furById } from '../data/fur';
import { itemById } from '../data/items';
import { MOON_N } from '../data/arenas';
import { gameCfg } from '../lib/game';
import { finishTrek, homeArenaOf, startTrek, trekMissing, trekReady, useApp, TREK, type TrekResult } from '../lib/store';
import { costumeOf, garmentColor } from './Wear';
import { shade } from './Furniture';
import { Glyph } from './art';
import { Modal, Seed } from './ui';
import type { Outfit, State } from '../types';

// ---------- Hami de lado, andando com a trouxinha ----------

export function WalkingHami({ fur: furId, outfit, size = 170, still = false }: { fur: string; outfit?: Outfit; size?: number; still?: boolean }) {
  const fur = furById(furId);
  const line = shade(fur.shade, 0.15);
  const costume = costumeOf(outfit?.roupa);
  const cloth = costume ? costume.c1 : garmentColor(outfit?.roupa);
  const bodyC = cloth ?? fur.body;
  const bodyL = cloth ? shade(cloth, 0.22) : line;
  return (
    <svg viewBox="0 0 220 200" width={size} height={(size * 200) / 220} className={`wk ${still ? 'is-still' : ''}`} role="img" aria-label="Hami andando com a trouxinha">
      <ellipse cx="112" cy="190" rx="54" ry="7" fill="#000" opacity="0.16" />
      {/* perninha de trás */}
      <g className="wk-leg wk-leg-b">
        <ellipse cx="96" cy="180" rx="15" ry="9" fill={shade(fur.belly, 0.1)} stroke={line} strokeWidth="2.2" />
      </g>
      <g className="wk-bob">
        {/* rabinho */}
        <circle cx="54" cy="150" r="9" fill={fur.body} stroke={line} strokeWidth="2.2" />
        {/* trouxinha nas costas */}
        <g className="wk-sack">
          <path d="M30 108 C24 82 46 62 70 66 C92 70 100 92 92 112 C86 128 66 136 48 130 C38 126 32 118 30 108 Z" fill="#D9534F" stroke="#A93B38" strokeWidth="2.4" />
          <path d="M44 84 C50 76 62 72 72 76" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M84 70 C90 62 100 62 104 70 C100 78 90 78 84 70 Z" fill="#C8433F" stroke="#A93B38" strokeWidth="2" />
          <circle cx="58" cy="108" r="5" fill="#FFFFFF" opacity="0.25" />
          <circle cx="74" cy="98" r="3.5" fill="#FFFFFF" opacity="0.25" />
        </g>
        {/* orelha de trás */}
        <circle cx="150" cy="40" r="14" fill={fur.body} stroke={line} strokeWidth="2.4" />
        {/* corpo */}
        <ellipse cx="108" cy="136" rx="50" ry="48" fill={bodyC} stroke={bodyL} strokeWidth="2.6" />
        {!cloth && <ellipse cx="132" cy="150" rx="24" ry="28" fill={fur.belly} />}
        {cloth && <path d="M78 104 C96 96 124 96 146 108" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="5" strokeLinecap="round" fill="none" />}
        {/* cabeça grande virada para a frente do caminho */}
        <path d="M82 84 C80 52 108 32 138 34 C170 36 190 60 188 90 C186 116 164 132 134 130 C104 128 84 112 82 84 Z" fill={fur.body} stroke={line} strokeWidth="2.6" />
        {/* topetinho */}
        <path d="M124 36 C126 26 133 25 135 33 C138 25 146 26 146 36" fill={fur.body} stroke={line} strokeWidth="2.2" strokeLinejoin="round" />
        {/* orelha da frente */}
        <circle cx="112" cy="44" r="16" fill={fur.body} stroke={line} strokeWidth="2.4" />
        <circle cx="113" cy="45" r="9.5" fill={fur.ear} />
        {/* focinho claro */}
        <path d="M134 96 C136 82 152 76 168 80 C182 84 190 96 186 108 C182 122 164 130 148 126 C138 122 132 110 134 96 Z" fill={fur.belly} />
        {/* olho */}
        <ellipse cx="150" cy="82" rx="9" ry="10.5" fill="#3A2016" />
        <circle cx="153" cy="78" r="3.6" fill="#FFFFFF" />
        <circle cx="147" cy="86" r="1.8" fill="#FFFFFF" opacity="0.8" />
        {/* bochecha, nariz e boquinha */}
        <ellipse cx="140" cy="106" rx="9" ry="6" fill={fur.ear} opacity="0.75" />
        <ellipse cx="184" cy="96" rx="4.6" ry="3.6" fill="#F08A9A" />
        <path d="M170 110 q6 5 12 0" stroke="#6B3A2A" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* bracinho segurando a alça */}
        <path d="M96 76 C102 96 108 106 116 116" stroke="#8C5A3A" strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="118" cy="120" rx="13" ry="9.5" fill={cloth ?? fur.body} stroke={bodyL} strokeWidth="2.2" transform="rotate(-28 118 120)" />
      </g>
      {/* perninha da frente */}
      <g className="wk-leg wk-leg-a">
        <ellipse cx="132" cy="181" rx="16" ry="9.5" fill={fur.belly} stroke={line} strokeWidth="2.2" />
      </g>
    </svg>
  );
}

// ---------- Cenários de viagem: um por arena, mais a Lua ----------

type Prop = 'arvore' | 'arbusto' | 'flor' | 'casa' | 'pinheiro' | 'cogumelo' | 'pedra' | 'palmeira' | 'concha' | 'pinheiro-neve' | 'boneco' | 'predio' | 'poste' | 'coral' | 'alga' | 'nuvem' | 'estrela' | 'torre' | 'bandeira' | 'planeta' | 'cratera' | 'foguete' | 'templo';
interface Theme {
  sky: [string, string];
  far: string;
  ground: string;
  props: Prop[];
  night?: boolean;
  extra?: 'bolhas' | 'neve' | 'estrelas' | 'terra';
}
export const TREK_THEMES: Record<string, Theme> = {
  casinha: { sky: ['#8FD0FF', '#E3F6FF'], far: '#A9DBA0', ground: '#8CC47A', props: ['arvore', 'arbusto', 'casa', 'flor'] },
  jardim: { sky: ['#9FDFFF', '#F4FFE6'], far: '#B9E6A4', ground: '#86C98A', props: ['flor', 'arbusto', 'arvore', 'flor'] },
  vila: { sky: ['#FFCF9F', '#FFF1DD'], far: '#D9B48C', ground: '#C29A70', props: ['casa', 'arvore', 'poste', 'casa'] },
  floresta: { sky: ['#7C86C8', '#C3D996'], far: '#5E9A5A', ground: '#8AB66A', props: ['pinheiro', 'arvore', 'cogumelo', 'pedra'] },
  tropical: { sky: ['#7FD6FF', '#D9F6FF'], far: '#6EC6D8', ground: '#E7C984', props: ['palmeira', 'pedra', 'palmeira', 'concha'] },
  neve: { sky: ['#A9C8F5', '#EEF5FF'], far: '#D5E4F7', ground: '#C9D9EE', props: ['pinheiro-neve', 'boneco', 'pinheiro-neve', 'pedra'], extra: 'neve' },
  cidade: { sky: ['#8FA6D8', '#DBE4F7'], far: '#7D8DB0', ground: '#8E98B0', props: ['predio', 'poste', 'predio', 'arvore'] },
  mar: { sky: ['#2F7FB8', '#7FD3E8'], far: '#2A6F9F', ground: '#CDB57A', props: ['coral', 'alga', 'concha', 'coral'], extra: 'bolhas' },
  sonhos: { sky: ['#C9A8FF', '#FFD5EC'], far: '#F2D9FF', ground: '#EFA9D2', props: ['nuvem', 'estrela', 'nuvem', 'flor'] },
  castelo: { sky: ['#9D8BE0', '#E9DDFF'], far: '#B9A3E6', ground: '#9A7FD6', props: ['torre', 'arvore', 'bandeira', 'torre'] },
  espaco: { sky: ['#14183F', '#3B2F73'], far: '#2A2F6B', ground: '#5A4F9A', props: ['planeta', 'estrela', 'cratera', 'foguete'], night: true, extra: 'estrelas' },
  celeste: { sky: ['#9FD6FF', '#FFF3C9'], far: '#DFF1FF', ground: '#E3CB93', props: ['nuvem', 'templo', 'estrela', 'nuvem'] },
  lua: { sky: ['#0D1030', '#262A5C'], far: '#3A3F73', ground: '#8E94AE', props: ['cratera', 'pedra', 'bandeira', 'foguete'], night: true, extra: 'terra' },
};

/** Tema da viagem: a arena onde o Hami mora (ou a Lua). */
export function trekThemeOf(s: State): string {
  const n = homeArenaOf(s);
  if (n === MOON_N) return 'lua';
  return gameCfg().arenas.find((a) => a.n === n)?.id ?? 'casinha';
}

function PropArt({ kind, x, t }: { kind: Prop; x: number; t: Theme }) {
  const g = (children: ReactNode) => <g transform={`translate(${x} 0)`}>{children}</g>;
  const dark = shade(t.far, 0.25);
  switch (kind) {
    case 'arvore':
      return g(<><rect x="-6" y="-70" width="12" height="70" rx="4" fill="#8C5A3A" /><circle cx="0" cy="-92" r="36" fill="#5FA85A" /><circle cx="-22" cy="-74" r="22" fill="#6FB868" /><circle cx="22" cy="-76" r="24" fill="#4F9A52" /></>);
    case 'arbusto':
      return g(<><circle cx="-14" cy="-12" r="16" fill="#5FA85A" /><circle cx="6" cy="-18" r="20" fill="#6FB868" /><circle cx="24" cy="-10" r="14" fill="#4F9A52" /></>);
    case 'flor':
      return g(<><rect x="-1.5" y="-26" width="3" height="26" fill="#4F9A52" /><circle cx="0" cy="-30" r="9" fill="#FF9FC2" /><circle cx="0" cy="-30" r="4" fill="#FFE27A" /><rect x="16" y="-18" width="3" height="18" fill="#4F9A52" /><circle cx="17.5" cy="-22" r="7" fill="#FFE27A" /><circle cx="17.5" cy="-22" r="3" fill="#FF9F6B" /></>);
    case 'casa':
      return g(<><rect x="-34" y="-52" width="68" height="52" rx="6" fill="#FFE9C9" /><path d="M-42 -50 L0 -88 L42 -50 Z" fill="#E0685F" /><rect x="-10" y="-30" width="20" height="30" rx="4" fill="#B97A4A" /><rect x="14" y="-40" width="14" height="14" rx="3" fill="#9FD6FF" /></>);
    case 'pinheiro':
      return g(<><rect x="-5" y="-30" width="10" height="30" fill="#7A4F33" /><path d="M0 -130 L34 -70 H-34 Z" fill="#3F8A54" /><path d="M0 -100 L40 -34 H-40 Z" fill="#357A4A" /></>);
    case 'cogumelo':
      return g(<><rect x="-6" y="-20" width="12" height="20" rx="5" fill="#FFF3E0" /><path d="M-22 -18 C-22 -42 22 -42 22 -18 Z" fill="#E0554F" /><circle cx="-8" cy="-28" r="4" fill="#FFF" /><circle cx="8" cy="-24" r="3" fill="#FFF" /></>);
    case 'pedra':
      return g(<><path d="M-26 0 C-28 -20 -8 -30 8 -26 C24 -22 30 -10 26 0 Z" fill={t.night ? '#6D7392' : '#A9A9B4'} /><path d="M-14 -16 C-8 -22 4 -22 10 -18" stroke="#FFF" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" fill="none" /></>);
    case 'palmeira':
      return g(<><path d="M-4 0 C-10 -40 0 -80 8 -110" stroke="#B98251" strokeWidth="12" strokeLinecap="round" fill="none" /><path d="M8 -110 C-20 -130 -44 -118 -54 -100 M8 -110 C30 -136 58 -124 66 -104 M8 -110 C-6 -140 -30 -146 -44 -138 M8 -110 C26 -140 48 -146 60 -138" stroke="#3FA060" strokeWidth="10" strokeLinecap="round" fill="none" /></>);
    case 'concha':
      return g(<><path d="M-14 0 C-18 -18 18 -18 14 0 Z" fill="#FFC6DD" /><path d="M0 0 V-13 M-7 0 L-5 -11 M7 0 L5 -11" stroke="#F072A8" strokeWidth="2" /></>);
    case 'pinheiro-neve':
      return g(<><rect x="-5" y="-30" width="10" height="30" fill="#7A4F33" /><path d="M0 -130 L34 -70 H-34 Z" fill="#4F8F7A" /><path d="M0 -100 L40 -34 H-40 Z" fill="#437F6C" /><path d="M0 -130 L16 -102 H-16 Z M-22 -70 H22 L30 -58 H-30 Z" fill="#FFFFFF" /></>);
    case 'boneco':
      return g(<><circle cx="0" cy="-18" r="20" fill="#FFFFFF" /><circle cx="0" cy="-48" r="14" fill="#FFFFFF" /><circle cx="-4" cy="-50" r="2" fill="#3A2016" /><circle cx="5" cy="-50" r="2" fill="#3A2016" /><path d="M0 -46 l12 3 l-12 3 Z" fill="#FF9F4D" /><rect x="-12" y="-40" width="24" height="5" rx="2.5" fill="#E0554F" /></>);
    case 'predio':
      return g(<><rect x="-30" y="-140" width="60" height="140" rx="6" fill={dark} />{[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={-20 + c * 24} y={-128 + r * 30} width="16" height="18" rx="3" fill="#FFE9A8" opacity={(r + c) % 2 ? 0.9 : 0.45} />))}</>);
    case 'poste':
      return g(<><rect x="-3" y="-90" width="6" height="90" rx="3" fill="#5A5F78" /><circle cx="0" cy="-96" r="11" fill="#FFE9A8" /><circle cx="0" cy="-96" r="18" fill="#FFE9A8" opacity="0.3" /></>);
    case 'coral':
      return g(<><path d="M0 0 V-50 M0 -24 C-16 -30 -20 -46 -18 -58 M0 -34 C16 -40 22 -54 20 -68 M0 -50 C-4 -62 0 -74 4 -80" stroke="#FF8FA8" strokeWidth="10" strokeLinecap="round" fill="none" /></>);
    case 'alga':
      return g(<><path d="M-8 0 C-18 -24 2 -40 -8 -70 M8 0 C18 -20 0 -36 10 -56" stroke="#3FB88A" strokeWidth="8" strokeLinecap="round" fill="none" /></>);
    case 'nuvem':
      return g(<><circle cx="-20" cy="-70" r="18" fill="#FFFFFF" /><circle cx="2" cy="-80" r="24" fill="#FFFFFF" /><circle cx="26" cy="-70" r="18" fill="#FFFFFF" /><rect x="-36" y="-72" width="78" height="20" rx="10" fill="#FFFFFF" /></>);
    case 'estrela':
      return g(<path d="M0 -120 l6 14 15 2 -11 10 3 15 -13 -8 -13 8 3 -15 -11 -10 15 -2 Z" fill="#FFE27A" />);
    case 'torre':
      return g(<><rect x="-20" y="-110" width="40" height="110" fill="#E9DDFF" /><path d="M-26 -108 L0 -150 L26 -108 Z" fill="#7E5BD9" /><rect x="-7" y="-80" width="14" height="22" rx="7" fill="#5A4196" /><path d="M-20 -110 h8 v-8 h8 v8 h8 v-8 h8 v8 h8" stroke="#C9B6FF" strokeWidth="4" fill="none" /></>);
    case 'bandeira':
      return g(<><rect x="-2" y="-70" width="4" height="70" fill={t.night ? '#D5D8E6' : '#8C5A3A'} /><path d="M2 -70 H34 L26 -58 L34 -46 H2 Z" fill="#FF8FA8" /></>);
    case 'planeta':
      return g(<><circle cx="0" cy="-110" r="22" fill="#FFB86B" /><ellipse cx="0" cy="-110" rx="36" ry="8" fill="none" stroke="#FFE27A" strokeWidth="4" transform="rotate(-16 0 -110)" /></>);
    case 'cratera':
      return g(<><ellipse cx="0" cy="-4" rx="34" ry="9" fill={shade(t.ground, 0.22)} /><ellipse cx="0" cy="-6" rx="24" ry="5" fill={shade(t.ground, 0.38)} /></>);
    case 'foguete':
      return g(<><path d="M0 -96 C16 -76 16 -40 12 -16 H-12 C-16 -40 -16 -76 0 -96 Z" fill="#F4F5F8" /><circle cx="0" cy="-58" r="8" fill="#7FB8F0" /><path d="M-12 -30 L-26 -8 H-12 Z M12 -30 L26 -8 H12 Z" fill="#E0554F" /><path d="M0 -96 C8 -86 10 -80 11 -74 H-11 C-10 -80 -8 -86 0 -96 Z" fill="#E0554F" /></>);
    case 'templo':
      return g(<><rect x="-36" y="-14" width="72" height="14" fill="#FFF7E2" /><path d="M-40 -70 L0 -96 L40 -70 Z" fill="#FFE7A3" />{[-28, -10, 8, 26].map((cx) => <rect key={cx} x={cx - 4} y="-70" width="8" height="56" fill="#FFFFFF" />)}</>);
  }
}

/** Cenário com três camadas que passam em velocidades diferentes (o Hami fica no meio, andando). */
export function TrekScene({ theme, height = 430, children, still = false }: { theme: string; height?: number; children?: ReactNode; still?: boolean }) {
  const t = TREK_THEMES[theme] ?? TREK_THEMES.casinha;
  const W = 800;
  const hills = `M0 60 Q100 10 200 44 T400 40 T600 46 T800 60 V120 H0 Z`;
  const strip = (
    <>
      {/* fileira de trás (menor) e fileira da frente */}
      <g transform="scale(0.72)" opacity="0.8">
        {[...t.props].reverse().map((k, i) => <PropArt key={i} kind={k} x={(190 + i * 200) / 0.72} t={t} />)}
      </g>
      {t.props.map((k, i) => <PropArt key={i} kind={k} x={90 + i * 200} t={t} />)}
    </>
  );
  return (
    <div className={`trek ${still ? 'is-still' : ''}`} style={{ height, ['--tg' as string]: t.ground, background: `linear-gradient(180deg, ${t.sky[0]}, ${t.sky[1]} 62%)` }}>
      {t.extra === 'estrelas' || t.extra === 'terra' ? <div className="trek-stars" aria-hidden="true" /> : null}
      {t.extra === 'terra' && <div className="trek-earth" aria-hidden="true" />}
      {t.extra === 'bolhas' && <div className="trek-bubbles" aria-hidden="true"><i /><i /><i /><i /></div>}
      {t.extra === 'neve' && <div className="trek-snow" aria-hidden="true"><i /><i /><i /><i /><i /></div>}
      {!t.night && t.extra !== 'bolhas' && <div className="trek-sun" aria-hidden="true" />}
      {/* morros ao fundo */}
      <div className="trek-layer trek-far" aria-hidden="true">
        <svg viewBox={`0 0 ${W * 2} 120`} preserveAspectRatio="none">
          <path d={hills} fill={t.far} />
          <path d={hills} fill={t.far} transform={`translate(${W} 0)`} />
        </svg>
      </div>
      {/* árvores, casas e outras coisas do caminho */}
      <div className="trek-layer trek-mid" aria-hidden="true">
        <svg viewBox={`0 -160 ${W * 2} 160`} preserveAspectRatio="xMidYMax meet">
          {strip}
          <g transform={`translate(${W} 0)`}>{strip}</g>
        </svg>
      </div>
      {/* chão: a mesma cor do resto da tela */}
      <div className="trek-ground" aria-hidden="true">
        <div className="trek-marks" />
      </div>
      <div className="trek-pet">{children}</div>
    </div>
  );
}

// ---------- Barra de progresso e textos ----------

const clock = (ms: number) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function backText(endsAt: number) {
  const d = new Date(endsAt);
  const tomorrow = d.toDateString() !== new Date().toDateString();
  return `volta ${tomorrow ? 'amanhã ' : ''}às ${clock(endsAt)}`;
}
function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function TrekTrack({ pct, fur }: { pct: number; fur: string }) {
  const f = furById(fur);
  return (
    <div className="trek-track" aria-hidden="true">
      <span className="trek-energy"><Zap size={18} fill="#fff" strokeWidth={0} /></span>
      <span className="trek-dots">
        <span className="trek-head" style={{ left: `${Math.min(100, Math.max(0, pct * 100))}%`, background: f.body }}>
          <i /><i />
        </span>
      </span>
      <span className="trek-q">?</span>
    </div>
  );
}

/** Faixa do Início durante a viagem: "Aventurando · volta às 04:25" com a trilha pontilhada. */
export function TrekBar({ now }: { now: number }) {
  const s = useApp();
  const t = s.trek;
  if (!t) return null;
  const pct = (now - t.startedAt) / Math.max(1, t.endsAt - t.startedAt);
  const back = now >= t.endsAt;
  return (
    <section className="trek-bar" aria-label="Viagem do dia">
      <p>
        <b>{back ? `${s.pet.name} voltou!` : 'Aventurando'}</b> {back ? 'Ele trouxe uma coisa para você.' : backText(t.endsAt)}
      </p>
      <TrekTrack pct={back ? 1 : pct} fur={s.pet.fur} />
      {!back && <small>Cada missão feita traz ele {TREK.perTaskMin} min mais cedo.</small>}
    </section>
  );
}

/** Cartão do Início antes da viagem: quanto falta ou o botão de começar. */
export function TrekCard({ onStarted }: { onStarted: () => void }) {
  const s = useApp();
  if (s.trek) return null;
  const missing = trekMissing(s);
  const ready = trekReady(s);
  if (!ready && (missing <= 0 || s.pet.sleeping || s.adventure)) return null;
  return (
    <section className={`trek-card ${ready ? 'is-ready' : ''}`} aria-label="Viagem do dia">
      <span className="trek-card-pet" aria-hidden="true">
        <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={64} still={!ready} />
      </span>
      <span className="min-w-0 flex-1">
        <b>{ready ? `${s.pet.name} está pronto para explorar!` : `Viagem do ${s.pet.name}`}</b>
        <small>{ready ? 'Ele sai andando e volta com um presente para você.' : `Faça mais ${missing} ${missing === 1 ? 'missão' : 'missões'} hoje para ele sair em viagem.`}</small>
        {!ready && (
          <span className="trek-card-steps" aria-hidden="true">
            {Array.from({ length: TREK.needs }, (_, i) => <i key={i} className={i < TREK.needs - missing ? 'is-on' : ''} />)}
          </span>
        )}
      </span>
      {ready && (
        <button className="trek-card-btn" data-sound="enviar" onClick={() => startTrek() && onStarted()}>
          Começar
        </button>
      )}
    </section>
  );
}

/** Tela cheia logo depois de começar: "Nova aventura começou!". */
export function TrekStart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);
  if (!open || !s.trek) return null;
  const theme = trekThemeOf(s);
  const t = TREK_THEMES[theme] ?? TREK_THEMES.casinha;
  return (
    <div className="trek-start" role="dialog" aria-modal="true" aria-label="Nova aventura começou" style={{ background: t.ground, color: inkOn(t.ground) }}>
      <TrekScene theme={theme} height={Math.round(window.innerHeight * 0.48)}>
        <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={170} />
      </TrekScene>
      <div className="trek-start-body">
        <h2>Nova aventura começou!</h2>
        <TrekTrack pct={0.03} fur={s.pet.fur} />
        <p>
          {s.pet.name} vai ter uma coisa para te mostrar quando voltar da aventura de hoje, em <b className="tabular-nums">{countdown(s.trek.endsAt - now)}</b>
        </p>
        <button className="trek-start-btn" onClick={onClose}>
          Entendi!
        </button>
      </div>
    </div>
  );
}

/** Texto escuro em chão claro, branco em chão escuro. */
export function inkOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? '#4A3423' : '#FFFFFF';
}

/** O que ele trouxe da viagem. */
export function TrekResultModal({ result, onClose }: { result: TrekResult | null; onClose: () => void }) {
  const s = useApp();
  const food = result ? itemById(result.food) : null;
  return (
    <Modal open={!!result} onClose={onClose} label="Volta da viagem">
      {result && (
        <div className="grid justify-items-center gap-3 p-6 text-center">
          <WalkingHami fur={s.pet.fur} outfit={s.pet.outfit} size={130} still />
          <h2 className="font-display text-[24px] font-bold leading-tight">{s.pet.name} voltou da viagem!</h2>
          <p className="text-[16px] leading-relaxed text-muted">
            Hoje ele {result.story}.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="chip chip-gold"><Seed /> +{result.coins} sementes</span>
            <span className="chip chip-plain">+{result.xp} XP</span>
            {food && (
              <span className="chip chip-leaf">
                <Glyph e={food.art ?? food.emoji} size={18} /> {food.name}
              </span>
            )}
          </div>
          <button className="btn btn-primary w-full" data-sound="conquista" onClick={onClose}>
            Que viagem boa!
          </button>
        </div>
      )}
    </Modal>
  );
}

export { finishTrek };

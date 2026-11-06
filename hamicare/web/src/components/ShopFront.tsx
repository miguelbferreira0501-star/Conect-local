// Fachada de cada lojinha: toldo, parede, prateleiras, balcão e o próprio Hami de vendedor,
// com a roupa da loja (pedreiro na marcenaria, chef na cozinha, estilista no ateliê, capitão nos baús).
// Tudo desenhado aqui (quadro 360 x 210); o Hami fica entre o fundo e o balcão.
import { useState } from 'react';
import { Hamster } from './Hamster';
import { play, type SoundId } from '../lib/sound';
import { todayKey, useApp } from '../lib/store';
import { hashStr } from '../lib/util';
import type { Outfit } from '../types';

export type ShopId = 'vendinha' | 'roupas' | 'casa' | 'comida' | 'baus';

const O = (chapeu: string, roupa: string, acessorio: string): Outfit => ({ chapeu, oculos: null, roupa, acessorio, efeito: null });

interface ShopLook {
  name: string;
  outfit: Outfit;
  awning: [string, string];
  wall: string;
  wall2: string;
  wood: string;
  sound: SoundId;
  lines: string[];
}

export const SHOPS: Record<ShopId, ShopLook> = {
  vendinha: {
    name: 'Vendinha do {pet}',
    outfit: O('bone-rosa', 'avental-vendinha', 'm-sacola'),
    awning: ['#FF86AC', '#FFFFFF'],
    wall: '#FFF3E8',
    wall2: '#FFE6D4',
    wood: '#D99A6C',
    sound: 'risada',
    lines: [
      'Oi! Separei a coleção do dia pra você dar uma olhadinha.',
      'A coleção do dia muda à meia-noite. Amanhã tem mais!',
      'Guardar sementes também é ótimo, viu? Sem pressa.',
      'Cuidar de si também merece um mimo de vez em quando.',
    ],
  },
  roupas: {
    name: 'Ateliê do {pet}',
    outfit: O('boina-lilas', 'avental-costura', 'm-tesoura'),
    awning: ['#B399F0', '#FFFFFF'],
    wall: '#F5EFFF',
    wall2: '#E7DCFF',
    wood: '#C98A5B',
    sound: 'vestir',
    lines: [
      'Tirei as medidas: tudo aqui serve certinho em você!',
      'Experimenta no provador antes de levar. É de graça!',
      'Costurei umas fantasias novas, olha só!',
      'Um look novo pra começar o dia sorrindo.',
    ],
  },
  casa: {
    name: 'Marcenaria do {pet}',
    outfit: O('capacete-obra', 'colete-obra', 'm-martelo'),
    awning: ['#FFB547', '#4A4458'],
    wall: '#F8E0CC',
    wall2: '#EEC6A6',
    wood: '#B9784A',
    sound: 'colocar',
    lines: [
      'Bora deixar a casinha ainda mais aconchegante?',
      'Toc, toc! Tô pregando uma prateleira nova.',
      'Dá pra ver o móvel na sua casa antes de comprar!',
      'Cada móvel sai da oficina lixadinho e cheiroso.',
    ],
  },
  comida: {
    name: 'Cozinha do {pet}',
    outfit: O('chef', 'dolma', 'm-frigideira'),
    awning: ['#F0525F', '#FFFFFF'],
    wall: '#ECF8F4',
    wall2: '#D3EEE5',
    wood: '#C98A5B',
    sound: 'cozinhar',
    lines: [
      'Comidinha fresquinha saindo agora!',
      'Hoje o cardápio tá caprichado.',
      'Lavou as patinhas? Então pode escolher!',
      'Uma comidinha deixa a barriguinha feliz.',
    ],
  },
  baus: {
    name: 'Porto dos Baús',
    outfit: O('pirata', 'casaco-capitao', 'm-mapa'),
    awning: ['#2F8FA8', '#FFFFFF'],
    wall: '#D4A174',
    wall2: '#B9855C',
    wood: '#8A5A3B',
    sound: 'bau-treme',
    lines: [
      'Ahoy! Todo baú mostra as chances antes de abrir.',
      'Achei esse mapa na praia… será que tem tesouro?',
      'Peça repetida vira fragmento pra Oficina.',
      'Sem pressa, marujo: o baú grátis sempre volta.',
    ],
  },
};

/** Cores de cada lojinha (quadradinhos, botões e abas). */
export const SHOP_COLORS: Record<ShopId, { tile: string; edge: string; label: string; title: string }> = {
  vendinha: { tile: '#FF8A65', edge: '#DE6340', label: 'Vendinha', title: 'Vendinha' },
  roupas: { tile: '#F2679B', edge: '#CC497C', label: 'Roupas', title: 'Ateliê' },
  casa: { tile: '#17A8BF', edge: '#0E8497', label: 'Casa', title: 'Marcenaria' },
  comida: { tile: '#F68B3D', edge: '#D56A1E', label: 'Comida', title: 'Cozinha' },
  baus: { tile: '#8D6BEF', edge: '#6A4BCF', label: 'Baús', title: 'Porto dos Baús' },
};

/** Ícone de cada lojinha (quadro 40 x 40), para a placa, as abas e as portas. */
export function ShopIconShape({ id, c = '#7A4A2E' }: { id: ShopId; c?: string }) {
  switch (id) {
    case 'vendinha':
      return (
        <g>
          <path d="M14 15 Q14 6 20 6 Q26 6 26 15" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M9 14 H31 L33 35 H7 Z" fill={c} />
          <path d="M20 31 C14 27 15 21 20 24 C25 21 26 27 20 31 Z" fill="#FFFFFF" opacity="0.9" />
        </g>
      );
    case 'roupas':
      return (
        <g>
          <path d="M20 9 v-2 q0 -3 3 -3" stroke={c} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M7 15 L20 9 L33 15" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 13 H25 L24 20 L32 36 H8 L16 20 Z" fill={c} />
          <path d="M16 20 H24" stroke="#FFFFFF" strokeWidth="2" opacity="0.8" />
        </g>
      );
    case 'casa':
      return (
        <g>
          <path d="M5 21 L20 8 L35 21" stroke={c} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 19 V35 H31 V19 L20 10 Z" fill={c} />
          <path d="M17 35 V27 Q20 24 23 27 V35 Z" fill="#FFFFFF" opacity="0.9" />
        </g>
      );
    case 'comida':
      return (
        <g>
          <circle cx="20" cy="9" r="2.8" fill={c} />
          <path d="M6 29 A14 14 0 0 1 34 29 Z" fill={c} />
          <rect x="3" y="29" width="34" height="4" rx="2" fill={c} />
          <path d="M12 23 Q14 17 19 15" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case 'baus':
      return (
        <g>
          <path d="M6 17 Q6 8 20 8 Q34 8 34 17 Z" fill={c} />
          <rect x="6" y="17" width="28" height="17" rx="3" fill={c} />
          <path d="M6 20 H34" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
          <rect x="17" y="16" width="6" height="8" rx="1.6" fill="#FFD34D" />
        </g>
      );
  }
}

export function ShopIcon({ id, size = 28, c }: { id: ShopId; size?: number; c?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="block">
      <ShopIconShape id={id} c={c} />
    </svg>
  );
}

/** O Hami de vendedor da loja, com o fundo e o balcão. Tocar nele faz ele pular e falar outra coisa.
 *  `immersive`: versão da tela cheia da loja (placa redonda com o ícone e a fala só aparece ao tocar). */
export function ShopFront({ shop, immersive }: { shop: ShopId; immersive?: boolean }) {
  const s = useApp();
  const look = SHOPS[shop];
  const pet = s.pet.name || 'Hami';
  const start = hashStr(`${s.seed}:${todayKey()}:${shop}`) % look.lines.length;
  const [taps, setTaps] = useState(0);
  const line = look.lines[(start + taps) % look.lines.length];
  const name = look.name.replace('{pet}', pet);
  return (
    <section className={`shop-front ${immersive ? 'is-immersive' : ''}`} aria-label={name}>
      <div className="sf-scene">
        <svg className="sf-back" viewBox="0 0 360 210" aria-hidden="true">
          <Back id={shop} look={look} />
          <Awning colors={look.awning} />
          {immersive ? <RoundSign id={shop} wood={look.wood} /> : <Sign text={name} wood={look.wood} />}
        </svg>
        <button
          className="sf-keeper"
          data-sound="none"
          aria-label={`${pet}, vendedor da loja. Tocar para conversar`}
          onClick={() => {
            play(look.sound);
            setTaps((t) => t + 1);
          }}
        >
          <span key={taps} className={taps ? 'sf-hop' : undefined}>
            <Hamster growth={1} fur={s.pet.fur} outfit={look.outfit} size={160} mood={taps % 2 ? 'animado' : 'feliz'} label={`${pet} de vendedor`} />
          </span>
        </button>
        <svg className="sf-front" viewBox="0 -14 360 100" aria-hidden="true">
          <Counter id={shop} wood={look.wood} />
        </svg>
        {immersive && taps > 0 && (
          <p key={taps} className="sf-bubble" aria-live="polite">
            {line}
          </p>
        )}
      </div>
      {!immersive && (
        <p className="sf-speech" aria-live="polite">
          <b>{pet}:</b> {line}
        </p>
      )}
    </section>
  );
}

/** Placa redonda pendurada com o ícone da loja. */
function RoundSign({ id, wood }: { id: ShopId; wood: string }) {
  return (
    <g>
      <path d="M300 20 V30" stroke="#6B4A33" strokeWidth="2.4" />
      <circle cx="300" cy="50" r="21" fill={wood} />
      <circle cx="300" cy="50" r="17" fill="#FFF3E2" />
      <svg x="286" y="36" width="28" height="28" viewBox="0 0 40 40">
        <ShopIconShape id={id} c={SHOP_COLORS[id].edge} />
      </svg>
    </g>
  );
}

// ---------- Partes comuns ----------

function Awning({ colors }: { colors: [string, string] }) {
  const n = 12;
  const sw = 360 / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} fill={colors[i % 2]}>
          <rect x={i * sw} y="0" width={sw + 0.5} height="22" />
          <path d={`M${i * sw} 22 a${sw / 2} ${sw / 2.4} 0 0 0 ${sw} 0 Z`} />
        </g>
      ))}
      <rect x="0" y="0" width="360" height="6" fill="#000000" opacity="0.12" />
      <path d={`M0 22 ${Array.from({ length: n }, () => `a${sw / 2} ${sw / 2.4} 0 0 0 ${sw} 0`).join(' ')}`} fill="none" stroke="#000000" strokeOpacity="0.1" strokeWidth="1.5" />
    </g>
  );
}

function Sign({ text, wood }: { text: string; wood: string }) {
  const long = text.length > 17;
  return (
    <g>
      <path d="M140 30 V40 M220 30 V40" stroke="#6B4A33" strokeWidth="2" />
      <rect x="104" y="38" width="152" height="28" rx="9" fill={wood} />
      <rect x="108" y="41" width="144" height="22" rx="7" fill="#FFF8EC" />
      <text x="180" y="57" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#5A3A26" {...(long ? { textLength: 132, lengthAdjust: 'spacingAndGlyphs' } : {})}>
        {text}
      </text>
    </g>
  );
}

function Shelf({ x, y, w, c = '#B9784A' }: { x: number; y: number; w: number; c?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="6" rx="2" fill={c} />
      <rect x={x} y={y + 6} width={w} height="2.5" fill="#000000" opacity="0.15" />
      <path d={`M${x + 8} ${y + 6} l6 10 M${x + w - 8} ${y + 6} l-6 10`} stroke={c} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

const Jar = ({ x, y, c, lid = '#FF86AC' }: { x: number; y: number; c: string; lid?: string }) => (
  <g>
    <rect x={x - 9} y={y - 24} width="18" height="24" rx="5" fill="#E8F4FF" opacity="0.85" />
    {[[-4, -6], [3, -5], [-1, -12], [4, -13], [-4, -17]].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={y + dy} r="3.2" fill={i % 2 ? c : '#FFFFFF'} />)}
    <rect x={x - 10} y={y - 28} width="20" height="6" rx="2" fill={lid} />
    <rect x={x - 6} y={y - 21} width="2.5" height="14" rx="1.2" fill="#FFFFFF" opacity="0.7" />
  </g>
);

const Gift = ({ x, y, w, h, c, r }: { x: number; y: number; w: number; h: number; c: string; r: string }) => (
  <g>
    <rect x={x - w / 2} y={y - h} width={w} height={h} rx="2" fill={c} />
    <rect x={x - 2.5} y={y - h} width="5" height={h} fill={r} />
    <path d={`M${x} ${y - h} q-9 -9 -10 -1 q2 3 10 1 q8 2 10 -1 q-1 -8 -10 1`} fill={r} />
  </g>
);

const Plant = ({ x, y, pot = '#D9825B' }: { x: number; y: number; pot?: string }) => (
  <g>
    {[[-9, -30, -20], [0, -36, 0], [9, -30, 20], [-4, -26, -40], [5, -25, 40]].map(([dx, dy, r], i) => (
      <ellipse key={i} cx={x + dx * 0.7} cy={y + dy * 0.7} rx="4.5" ry="10" fill={i % 2 ? '#5FAE84' : '#7CC39A'} transform={`rotate(${r} ${x + dx * 0.7} ${y + dy * 0.7})`} />
    ))}
    <path d={`M${x - 9} ${y - 14} H${x + 9} L${x + 7} ${y} H${x - 7} Z`} fill={pot} />
    <rect x={x - 10} y={y - 16} width="20" height="4" rx="2" fill={pot} />
  </g>
);

// ---------- Fundo de cada loja ----------

function Back({ id, look }: { id: ShopId; look: ShopLook }) {
  const { wall, wall2 } = look;
  return (
    <g>
      <rect width="360" height="210" fill={wall} />
      {id === 'vendinha' && Array.from({ length: 13 }, (_, i) => <rect key={i} x={i * 28} y="0" width="14" height="210" fill={wall2} />)}
      {id === 'roupas' && Array.from({ length: 48 }, (_, i) => <circle key={i} cx={(i % 12) * 30 + ((Math.floor(i / 12) % 2) * 15) + 8} cy={Math.floor(i / 12) * 34 + 40} r="3.2" fill={wall2} />)}
      {id === 'casa' &&
        Array.from({ length: 10 }, (_, r) => (
          <g key={r}>
            <path d={`M0 ${28 + r * 15} H360`} stroke={wall2} strokeWidth="2" />
            {Array.from({ length: 10 }, (_, c) => <path key={c} d={`M${c * 40 + (r % 2) * 20} ${28 + r * 15} v15`} stroke={wall2} strokeWidth="2" />)}
          </g>
        ))}
      {id === 'comida' && (
        <g>
          <rect y="118" width="360" height="92" fill="#FFFFFF" opacity="0.6" />
          {Array.from({ length: 21 }, (_, i) => <path key={i} d={`M${i * 18} 118 V210`} stroke={wall2} strokeWidth="1.5" />)}
          {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${118 + i * 18} H360`} stroke={wall2} strokeWidth="1.5" />)}
        </g>
      )}
      {id === 'baus' && (
        <g>
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0 ${30 + i * 16} H360`} stroke={wall2} strokeWidth="2.5" />)}
          {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={(i * 67) % 350 + 6} cy={36 + ((i * 3) % 10) * 16} r="1.6" fill="#7A5236" />)}
        </g>
      )}
      {/* sombra em cima, perto do toldo */}
      <rect y="20" width="360" height="16" fill="#000000" opacity="0.06" />
      {id === 'vendinha' && <VendinhaBack />}
      {id === 'roupas' && <AtelieBack />}
      {id === 'casa' && <MarcenariaBack />}
      {id === 'comida' && <CozinhaBack />}
      {id === 'baus' && <PortoBack />}
    </g>
  );
}

function VendinhaBack() {
  return (
    <g>
      {/* bandeirinhas */}
      <path d="M8 40 Q90 56 172 40 M188 40 Q270 56 352 40" stroke="#B88A6A" strokeWidth="1.2" fill="none" />
      {[20, 46, 72, 98, 124, 150, 210, 236, 262, 288, 314, 340].map((x, i) => {
        const y = 40 + Math.sin(((x % 180) / 180) * Math.PI) * 12;
        return <path key={x} d={`M${x - 7} ${y} L${x + 7} ${y} L${x} ${y + 13} Z`} fill={['#FF86AC', '#FFD34D', '#7FB8F0', '#7CC39A'][i % 4]} />;
      })}
      <Shelf x={12} y={98} w={90} />
      <Jar x={30} y={98} c="#FF86AC" />
      <Jar x={56} y={98} c="#FFD34D" lid="#7FB8F0" />
      <Jar x={82} y={98} c="#7CC39A" lid="#FFD34D" />
      <Shelf x={12} y={140} w={90} />
      <Gift x={32} y={140} w={26} h={20} c="#FF9FC2" r="#FFFFFF" />
      <Gift x={32} y={120} w={18} h={13} c="#FFD34D" r="#FF6F91" />
      <Plant x={76} y={140} />
      <Shelf x={258} y={98} w={90} />
      <Plant x={276} y={98} pot="#7FB8F0" />
      <Gift x={306} y={98} w={22} h={18} c="#B399F0" r="#FFE27A" />
      <Gift x={332} y={98} w={18} h={24} c="#7FD8BE" r="#FF86AC" />
      <Shelf x={258} y={140} w={90} />
      <Jar x={278} y={140} c="#B399F0" lid="#FFFFFF" />
      {/* pãezinhos */}
      <ellipse cx="316" cy="133" rx="16" ry="8" fill="#E8A866" />
      <path d="M306 131 q4 -4 6 1 M314 129 q4 -4 6 1 M322 131 q4 -4 6 1" stroke="#C47A3E" strokeWidth="1.6" fill="none" />
    </g>
  );
}

function Hanger({ x, y, c, kind }: { x: number; y: number; c: string; kind: 'vestido' | 'camisa' | 'jaqueta' }) {
  return (
    <g>
      <path d={`M${x} ${y} v-4 q0 -4 3 -4`} stroke="#8A90A0" strokeWidth="1.5" fill="none" />
      <path d={`M${x - 11} ${y + 6} L${x} ${y} L${x + 11} ${y + 6}`} stroke="#8A90A0" strokeWidth="1.8" fill="none" />
      {kind === 'vestido' && <path d={`M${x - 6} ${y + 4} H${x + 6} L${x + 5} ${y + 16} L${x + 14} ${y + 40} H${x - 14} L${x - 5} ${y + 16} Z`} fill={c} />}
      {kind === 'vestido' && <path d={`M${x - 14} ${y + 40} q3.5 4 7 0 q3.5 4 7 0 q3.5 4 7 0 q3.5 4 7 0`} stroke="#FFFFFF" strokeWidth="2" fill="none" />}
      {kind === 'camisa' && <path d={`M${x - 8} ${y + 4} H${x + 8} L${x + 16} ${y + 12} L${x + 12} ${y + 17} L${x + 9} ${y + 14} V${y + 36} H${x - 9} V${y + 14} L${x - 12} ${y + 17} L${x - 16} ${y + 12} Z`} fill={c} />}
      {kind === 'camisa' && <path d={`M${x - 4} ${y + 4} L${x} ${y + 10} L${x + 4} ${y + 4}`} stroke="#FFFFFF" strokeWidth="1.8" fill="none" />}
      {kind === 'jaqueta' && <path d={`M${x - 9} ${y + 4} H${x + 9} L${x + 15} ${y + 10} L${x + 15} ${y + 34} H${x + 9} V${y + 38} H${x - 9} V${y + 34} H${x - 15} V${y + 10} Z`} fill={c} />}
      {kind === 'jaqueta' && <path d={`M${x} ${y + 6} V${y + 38}`} stroke="#000000" strokeOpacity="0.2" strokeWidth="1.5" />}
    </g>
  );
}

function AtelieBack() {
  return (
    <g>
      {/* arara de roupas */}
      <path d="M14 64 H104 M18 64 V152 M100 64 V152" stroke="#9A8FB0" strokeWidth="3.5" strokeLinecap="round" />
      <Hanger x={34} y={68} c="#FF9FC2" kind="vestido" />
      <Hanger x={60} y={68} c="#7FB8F0" kind="camisa" />
      <Hanger x={86} y={68} c="#FFD34D" kind="jaqueta" />
      {/* roupas dobradas e chapéu */}
      <Shelf x={258} y={96} w={90} />
      {[[276, '#FF86AC'], [302, '#7CC39A'], [328, '#B399F0']].map(([x, c]) =>
        [0, 1, 2].map((k) => <rect key={`${x}-${k}`} x={(x as number) - 11} y={96 - 7 - k * 7} width="22" height="7" rx="2" fill={c as string} opacity={1 - k * 0.12} stroke="#FFFFFF" strokeWidth="0.8" />),
      )}
      <Shelf x={258} y={140} w={90} />
      {[[274, '#FF6F91'], [294, '#7FB8F0'], [314, '#FFD34D']].map(([x, c]) => (
        <g key={x}>
          <circle cx={x as number} cy="131" r="8.5" fill={c as string} />
          <path d={`M${(x as number) - 7} 128 q7 -4 14 2 M${(x as number) - 8} 133 q8 -4 15 2`} stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.3" fill="none" />
        </g>
      ))}
      {/* carretel */}
      <rect x="328" y="122" width="14" height="18" rx="2" fill="#F0525F" />
      <rect x="325" y="120" width="20" height="4" rx="1.5" fill="#C98A5B" />
      <rect x="325" y="138" width="20" height="4" rx="1.5" fill="#C98A5B" />
      {/* espelho redondo */}
      <circle cx="304" cy="50" r="15" fill="#E8B97A" />
      <circle cx="304" cy="50" r="11.5" fill="#DDF0FF" />
      <path d="M297 46 l6 -6 M299 52 l9 -9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function MarcenariaBack() {
  return (
    <g>
      {/* painel de ferramentas */}
      <rect x="12" y="50" width="92" height="84" rx="5" fill="#E8D2B4" stroke="#C9A77E" strokeWidth="2" />
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={20 + (i % 6) * 15} cy={58 + Math.floor(i / 6) * 16} r="1.4" fill="#B99567" />)}
      {/* serrote */}
      <path d="M22 70 L56 66 L56 80 L22 84 Z" fill="#C9CED8" />
      <path d="M22 84 l3 3 3 -3 3 3 3 -3 3 3 3 -3 3 3 3 -3 3 3 3 -3" stroke="#A9AFBB" strokeWidth="1.4" fill="none" />
      <rect x="54" y="64" width="12" height="18" rx="4" fill="#F0525F" />
      {/* chave inglesa */}
      <path d="M78 64 V108" stroke="#8A90A0" strokeWidth="5" strokeLinecap="round" />
      <path d="M72 60 a7 7 0 1 0 12 0 l-3 5 h-6 Z" fill="#8A90A0" />
      {/* régua */}
      <rect x="22" y="100" width="44" height="9" rx="1.5" fill="#FFD34D" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${26 + i * 5} 100 v${i % 2 ? 3 : 5}`} stroke="#8A6A2F" strokeWidth="1" />)}
      <path d="M92 64 l4 34 l-4 6 l-4 -6 Z" fill="#7FB8F0" />
      <rect x="89" y="58" width="6" height="8" rx="2" fill="#5B8DEF" />
      {/* latas de tinta */}
      <Shelf x={258} y={98} w={90} />
      {[[276, '#FF86AC'], [302, '#7FB8F0'], [328, '#FFD34D']].map(([x, c]) => (
        <g key={x}>
          <rect x={(x as number) - 10} y="76" width="20" height="22" rx="3" fill="#D8DCE4" />
          <rect x={(x as number) - 10} y="76" width="20" height="5" rx="2" fill={c as string} />
          <path d={`M${(x as number) - 4} 81 v6 a2 2 0 0 0 4 0 v-6`} fill={c as string} />
          <rect x={(x as number) - 6} y="86" width="12" height="8" rx="2" fill={c as string} opacity="0.85" />
        </g>
      ))}
      <Shelf x={258} y={140} w={90} />
      {/* tábuas */}
      {[0, 1, 2].map((k) => <rect key={k} x={264 + k * 3} y={132 - k * 7} width="56" height="7" rx="1.5" fill={['#D9A066', '#C98A5B', '#E2B27A'][k]} stroke="#A8703F" strokeWidth="0.8" />)}
      {/* pote de pregos */}
      <rect x="328" y="122" width="14" height="18" rx="3" fill="#E8F4FF" opacity="0.9" />
      {[0, 1, 2].map((k) => <path key={k} d={`M${331 + k * 4} 126 v10`} stroke="#8A90A0" strokeWidth="1.4" />)}
    </g>
  );
}

function CozinhaBack() {
  return (
    <g>
      {/* varal de utensílios */}
      <path d="M14 48 H104" stroke="#9AA3B2" strokeWidth="3" strokeLinecap="round" />
      {/* concha */}
      <path d="M28 48 V80" stroke="#AEB4C2" strokeWidth="3" />
      <path d="M20 80 a8 8 0 0 0 16 0 Z" fill="#AEB4C2" />
      {/* espátula */}
      <path d="M52 48 V74" stroke="#C98A5B" strokeWidth="3.5" />
      <rect x="46" y="72" width="12" height="16" rx="2" fill="#F0525F" />
      {/* batedor */}
      <path d="M78 48 V66" stroke="#AEB4C2" strokeWidth="3" />
      <path d="M78 66 q-9 12 0 22 q9 -10 0 -22 M78 66 q-4 12 0 22 q4 -10 0 -22" stroke="#AEB4C2" strokeWidth="1.6" fill="none" />
      {/* panelinha */}
      <path d="M96 48 V58" stroke="#AEB4C2" strokeWidth="2" />
      <ellipse cx="96" cy="70" rx="10" ry="11" fill="#FF8A3D" />
      <ellipse cx="96" cy="67" rx="6" ry="5" fill="#FFB066" />
      <Shelf x={12} y={140} w={90} />
      {[[30, '#F7E3C8', 'farinha'], [56, '#E8A866', 'biscoito'], [82, '#FF9FC2', 'doce']].map(([x, c]) => (
        <g key={x}>
          <rect x={(x as number) - 10} y="112" width="20" height="28" rx="5" fill="#E8F4FF" opacity="0.9" />
          <rect x={(x as number) - 9} y="120" width="18" height="19" rx="4" fill={c as string} />
          <rect x={(x as number) - 11} y="108" width="22" height="6" rx="2" fill="#C98A5B" />
          <rect x={(x as number) - 7} y="124" width="14" height="7" rx="2" fill="#FFFFFF" />
        </g>
      ))}
      <Shelf x={258} y={98} w={90} />
      {/* pães */}
      <ellipse cx="282" cy="90" rx="18" ry="9" fill="#E8A866" />
      <path d="M270 88 q4 -4 6 1 M278 86 q4 -4 6 1 M286 88 q4 -4 6 1" stroke="#C47A3E" strokeWidth="1.6" fill="none" />
      <path d="M310 98 l28 -26" stroke="#E2A35E" strokeWidth="9" strokeLinecap="round" />
      <path d="M318 88 l4 3 M324 82 l4 3 M330 76 l4 3" stroke="#C47A3E" strokeWidth="1.6" />
      <Shelf x={258} y={140} w={90} />
      {/* fruteira */}
      <path d="M266 126 Q290 146 314 126 Z" fill="#7FB8F0" />
      <circle cx="280" cy="122" r="7" fill="#F0525F" />
      <circle cx="292" cy="119" r="7" fill="#FFB347" />
      <circle cx="302" cy="123" r="6.5" fill="#7CC39A" />
      {/* garrafa de leite */}
      <path d="M328 140 V122 q0 -4 3 -6 V110 h8 v6 q3 2 3 6 V140 Z" fill="#FFFFFF" />
      <rect x="330" y="108" width="10" height="4" rx="1.5" fill="#7FB8F0" />
    </g>
  );
}

function PortoBack() {
  return (
    <g>
      {/* janela redonda com o mar */}
      <circle cx="56" cy="92" r="30" fill="#C9A35A" />
      <circle cx="56" cy="92" r="24" fill="#9FD8F0" />
      <path d="M32 98 q6 -4 12 0 t12 0 t12 0 t12 0 V116 H32 Z" fill="#3F9FC8" />
      <path d="M44 84 l10 -14 v14 Z" fill="#FFFFFF" />
      <path d="M40 86 h20 l-4 5 h-12 Z" fill="#B0703F" />
      {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={56 + Math.cos((a * Math.PI) / 180) * 27} cy={92 + Math.sin((a * Math.PI) / 180) * 27} r="2" fill="#8A6A2F" />)}
      {/* âncora */}
      <g transform="translate(56 140)">
        <circle cy="-8" r="4" fill="none" stroke="#5E6878" strokeWidth="2.5" />
        <path d="M0 -4 V16 M-8 2 H8 M-12 10 Q0 22 12 10" stroke="#5E6878" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <Shelf x={258} y={98} w={90} c="#6B4A33" />
      {/* baús empilhados */}
      {[[282, 98, 30, 18, '#B0703F'], [282, 80, 22, 13, '#7FB8F0']].map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={(x as number) - (w as number) / 2} y={(y as number) - (h as number)} width={w as number} height={h as number} rx="3" fill={c as string} />
          <path d={`M${(x as number) - (w as number) / 2} ${(y as number) - (h as number) * 0.6} H${(x as number) + (w as number) / 2}`} stroke="#F6C445" strokeWidth="2" />
          <rect x={(x as number) - 3} y={(y as number) - (h as number) * 0.7} width="6" height="6" rx="1" fill="#F6C445" />
        </g>
      ))}
      {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={320 + (k % 2) * 8} cy={96 - k * 3} rx="8" ry="2.6" fill="#F6C445" stroke="#D99E1E" strokeWidth="0.8" />)}
      <Shelf x={258} y={140} w={90} c="#6B4A33" />
      {/* garrafa com barquinho */}
      <ellipse cx="290" cy="130" rx="22" ry="10" fill="#DDF3FF" opacity="0.9" />
      <rect x="310" y="126" width="8" height="8" rx="2" fill="#C98A5B" />
      <path d="M280 134 h18 l-3 3 h-12 Z M288 134 V122 l8 10 Z" fill="#B0703F" />
      <path d="M288 124 l-6 9 h6 Z" fill="#FFFFFF" />
      {/* rolinho de mapa */}
      <rect x="326" y="124" width="20" height="16" rx="3" fill="#F3DDB0" />
      <path d="M332 128 l5 5 m0 -5 l-5 5" stroke="#E2547A" strokeWidth="1.8" />
    </g>
  );
}

// ---------- Balcão (fica na frente do Hami) ----------

function Counter({ id, wood }: { id: ShopId; wood: string }) {
  return (
    <g>
      <rect x="0" y="62" width="360" height="38" fill={wood} />
      {[60, 120, 180, 240, 300].map((x) => <path key={x} d={`M${x} 70 V100`} stroke="#000000" strokeOpacity="0.14" strokeWidth="2" />)}
      {[30, 90, 150, 210, 270, 330].map((x) => <rect key={x} x={x - 20} y="72" width="40" height="22" rx="4" fill="#FFFFFF" opacity="0.1" />)}
      <rect x="-4" y="54" width="368" height="10" rx="4" fill={wood} />
      <rect x="-4" y="54" width="368" height="4" rx="2" fill="#FFFFFF" opacity="0.28" />
      <rect x="-4" y="63" width="368" height="3" fill="#000000" opacity="0.15" />
      {id === 'vendinha' && (
        <g>
          {/* caixa registradora */}
          <path d="M28 56 L34 30 H86 L92 56 Z" fill="#FF86AC" />
          <rect x="40" y="18" width="40" height="14" rx="3" fill="#4A4458" />
          <text x="60" y="29" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7CF0B4">
            ♥ 0,00
          </text>
          {[44, 54, 64, 74].map((x) => <rect key={x} x={x} y="38" width="7" height="5" rx="1.5" fill="#FFFFFF" />)}
          {[44, 54, 64, 74].map((x) => <rect key={x} x={x} y="46" width="7" height="5" rx="1.5" fill="#FFE3EC" />)}
          {/* cesta de frutas */}
          <path d="M272 56 L268 38 H330 L326 56 Z" fill="#D9A766" />
          <path d="M268 44 H330 M270 50 H328" stroke="#B8854A" strokeWidth="1.5" />
          <circle cx="284" cy="34" r="7" fill="#F0525F" />
          <circle cx="298" cy="31" r="7.5" fill="#FFD34D" />
          <circle cx="312" cy="34" r="7" fill="#7CC39A" />
        </g>
      )}
      {id === 'roupas' && (
        <g>
          {/* rolos de tecido */}
          {[[30, '#FF9FC2'], [46, '#7FB8F0'], [62, '#FFD34D']].map(([x, c]) => (
            <g key={x}>
              <rect x={(x as number) - 7} y="18" width="14" height="38" rx="3" fill={c as string} />
              <ellipse cx={x as number} cy="18" rx="7" ry="3" fill="#FFFFFF" opacity="0.6" />
            </g>
          ))}
          {/* almofada de alfinetes */}
          <ellipse cx="292" cy="46" rx="16" ry="11" fill="#F0525F" />
          <path d="M292 36 v20 M278 46 h28" stroke="#C93A4A" strokeWidth="1.2" />
          {[[284, 38], [296, 36], [302, 42]].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x} ${y} l-3 -8`} stroke="#8A90A0" strokeWidth="1.2" />
              <circle cx={x - 3} cy={y - 8} r="2.2" fill={['#FFD34D', '#7FB8F0', '#FFFFFF'][i]} />
            </g>
          ))}
          {/* fita métrica enrolada */}
          <circle cx="326" cy="46" r="9" fill="#FFD34D" />
          <circle cx="326" cy="46" r="4" fill="#E8B020" />
          <path d="M335 48 q12 2 14 8" stroke="#FFD34D" strokeWidth="4" fill="none" />
        </g>
      )}
      {id === 'casa' && (
        <g>
          {/* caixa de ferramentas */}
          <rect x="24" y="30" width="62" height="26" rx="4" fill="#F0525F" />
          <rect x="24" y="30" width="62" height="7" rx="3" fill="#D13F4C" />
          <path d="M42 30 v-7 h26 v7" stroke="#4A4458" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
          <rect x="50" y="38" width="10" height="6" rx="1.5" fill="#FFD34D" />
          {/* plantinha e pregos */}
          <Plant x={292} y={56} />
          <rect x="314" y="36" width="20" height="20" rx="4" fill="#E8F4FF" opacity="0.9" />
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M${318 + k * 4} 40 v12`} stroke="#8A90A0" strokeWidth="1.5" />)}
        </g>
      )}
      {id === 'comida' && (
        <g>
          {/* bolo no pratinho */}
          <path d="M22 56 h52 l-4 -4 h-44 Z" fill="#E8F4FF" />
          <rect x="30" y="30" width="36" height="22" rx="5" fill="#FFE3EC" />
          <rect x="30" y="38" width="36" height="5" fill="#FF86AC" />
          <path d="M30 34 q4 6 9 0 q4 6 9 0 q4 6 9 0 q4 6 9 0" fill="#FFFFFF" />
          <circle cx="48" cy="26" r="4" fill="#F0525F" />
          {/* tábua com cenoura e tomate */}
          <rect x="268" y="46" width="64" height="10" rx="5" fill="#E2B27A" />
          <path d="M280 46 l22 -6 l-22 -2 Z" fill="#FF8A3D" />
          <path d="M278 40 l-6 -5 M279 41 l-5 -9" stroke="#5FAE84" strokeWidth="2" strokeLinecap="round" />
          <circle cx="318" cy="38" r="8" fill="#F0525F" />
          <path d="M314 31 l4 2 4 -2" stroke="#5FAE84" strokeWidth="2" fill="none" />
        </g>
      )}
      {id === 'baus' && (
        <g>
          {/* baú aberto com moedas */}
          <path d="M22 26 Q54 8 86 26 V32 H22 Z" fill="#8A5A3B" />
          <rect x="22" y="32" width="64" height="24" rx="3" fill="#B0703F" />
          <path d="M22 40 H86 M38 32 V56 M70 32 V56" stroke="#F6C445" strokeWidth="2.5" />
          {[[34, 30], [46, 27], [58, 29], [70, 27], [52, 23]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#F6C445" stroke="#D99E1E" strokeWidth="1" />)}
          <path d="M60 18 l4 -6 l4 6 l-4 5 Z" fill="#7FD8F0" />
          {/* pilha de moedas e pedra preciosa */}
          {[0, 1, 2, 3].map((k) => <ellipse key={k} cx="292" cy={52 - k * 5} rx="11" ry="4" fill="#F6C445" stroke="#D99E1E" strokeWidth="1" />)}
          {[0, 1].map((k) => <ellipse key={k} cx="312" cy={52 - k * 5} rx="11" ry="4" fill="#F6C445" stroke="#D99E1E" strokeWidth="1" />)}
          <path d="M326 52 l8 -12 h10 l8 12 l-13 6 Z" fill="#FF6FB0" />
          <path d="M334 40 l5 18 l5 -18" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        </g>
      )}
    </g>
  );
}

// Ilustrações planas da história do começo: o Hami encolhido na chuva (com uma folhinha na cabeça),
// as mãos que levam ele para casa, o quarto quentinho e o Hami embrulhado na toalha.
import { furById } from '../data/fur';

function darken(hex: string, t: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.round(v * (1 - t)).toString(16).padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}
const INK = '#2E2230';

/** Folhinha verde (cai com a chuva e fica na cabeça dele). */
export function Leaf({ size = 26, color = '#4FA36B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 40 28" aria-hidden="true" className="block">
      <path d="M2 16 Q14 0 38 6 Q30 26 2 16Z" fill={color} />
      <path d="M4 16 Q20 11 36 7" stroke={darken(color, 0.25)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M2 16 L-2 20" stroke={darken(color, 0.25)} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** O Hami encolhido como uma bolinha: olhos fechados, tristinhos ou olhando para cima. */
export function CurledHami({ fur: furId, eyes, wet = true, leaf = true, size = 190 }: { fur: string; eyes: 'fechados' | 'tristes' | 'acima'; wet?: boolean; leaf?: boolean; size?: number }) {
  const f = furById(furId);
  const line = darken(f.shade, 0.18);
  const lift = eyes === 'acima' ? -3 : 0;
  return (
    <svg viewBox="0 0 200 150" width={size} height={size * 0.75} aria-hidden="true" className="block overflow-visible">
      <ellipse cx="100" cy="138" rx="72" ry="9" fill="#000" opacity="0.18" />
      {/* rabinho e corpo redondinho */}
      <circle cx="170" cy="112" r="9" fill={f.body} stroke={line} strokeWidth="2.5" />
      <path d="M28 124 C22 78 56 44 102 44 C148 44 178 78 172 124 Q170 136 156 136 H44 Q30 136 28 124Z" fill={f.body} stroke={line} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M150 64 Q168 86 166 116" stroke="#fff" strokeOpacity="0.25" strokeWidth="6" fill="none" strokeLinecap="round" />
      {f.pattern === 'manchas' && <ellipse cx="140" cy="84" rx="20" ry="15" fill={f.patch} opacity="0.85" />}
      {/* orelhinhas (baixinhas, de quem está com frio) */}
      <g transform={`translate(0 ${lift})`}>
        <ellipse cx="64" cy="58" rx="15" ry="12" fill={f.body} stroke={line} strokeWidth="2.5" transform="rotate(-28 64 58)" />
        <ellipse cx="65" cy="59" rx="8.5" ry="6.5" fill={f.ear} transform="rotate(-28 65 59)" />
        <ellipse cx="116" cy="52" rx="15" ry="12" fill={f.body} stroke={line} strokeWidth="2.5" transform="rotate(18 116 52)" />
        <ellipse cx="115" cy="53" rx="8.5" ry="6.5" fill={f.ear} transform="rotate(18 115 53)" />
        {/* carinha clara na frente */}
        <ellipse cx="84" cy="100" rx="44" ry="28" fill={f.belly} />
        {eyes === 'fechados' ? (
          <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M58 94 q8 5 15 0" />
            <path d="M94 94 q8 5 15 0" />
          </g>
        ) : (
          <g>
            {[66, 102].map((x, i) => (
              <g key={x}>
                <ellipse cx={x} cy={eyes === 'acima' ? 90 : 94} rx="6.4" ry="7.6" fill={INK} />
                <circle cx={x + 2} cy={eyes === 'acima' ? 87 : 91.5} r="2.3" fill="#fff" />
                {eyes === 'tristes' && <path d={i === 0 ? `M${x - 8} ${82} q6 -4 12 -1` : `M${x + 8} ${82} q-6 -4 -12 -1`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
              </g>
            ))}
          </g>
        )}
        <ellipse cx="54" cy="106" rx="8" ry="5" fill={f.ear} opacity="0.55" />
        <ellipse cx="114" cy="106" rx="8" ry="5" fill={f.ear} opacity="0.55" />
        <ellipse cx="84" cy="103" rx="3.2" ry="2.3" fill="#F28C9A" />
        <path d={eyes === 'acima' ? 'M80 108 q4 3 8 0' : 'M80 110 q4 -2.4 8 0'} stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
      {/* patinhas da frente */}
      <ellipse cx="66" cy="132" rx="10" ry="6" fill={f.belly} stroke={line} strokeWidth="2" />
      <ellipse cx="100" cy="133" rx="10" ry="6" fill={f.belly} stroke={line} strokeWidth="2" />
      {wet &&
        [
          [128, 70],
          [150, 96],
          [44, 80],
          [140, 120],
        ].map(([x, y], i) => <path key={i} className="sx-drip" style={{ animationDelay: `${i * 0.35}s` }} d={`M${x} ${y} q-3 5 0 8 q3 -3 0 -8Z`} fill="#9FD6FF" />)}
      {leaf && (
        <g transform="translate(76 30) rotate(-14)">
          <path d="M0 16 Q12 0 36 6 Q28 26 0 16Z" fill="#4FA36B" />
          <path d="M2 16 Q18 11 34 7" stroke="#357A4F" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/** Duas mãos em concha que pegam o Hami por baixo (cor neutra, sem tom de pele, para todo mundo se ver). */
export function Hands({ width = 360 }: { width?: number }) {
  const hand = (
    <g>
      {/* palma e pulso vindo do canto */}
      <path d="M-30 230 L-6 150 Q8 104 58 100 L150 104 Q172 106 172 124 Q172 140 152 140 L118 138 Q114 146 118 152 L156 156 Q174 158 172 174 Q170 190 150 188 L104 184 Q70 210 50 236Z" fill="#5C68D6" />
      {/* divisões dos dedos */}
      <path d="M118 138 L84 136 M118 152 L86 150" stroke="#4954C2" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* polegar por cima */}
      <path d="M54 104 Q60 70 96 70 Q118 72 116 88 Q112 100 92 102Z" fill="#6E7AE2" />
      <path d="M20 160 Q40 120 70 112" stroke="#6E7AE2" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
    </g>
  );
  return (
    <svg viewBox="0 0 360 240" width={width} height={(width * 240) / 360} aria-hidden="true" className="block overflow-visible">
      {hand}
      <g transform="translate(360 0) scale(-1 1)">{hand}</g>
    </svg>
  );
}

/** O Hami embrulhado na toalha branca, só com a carinha feliz de fora. */
export function WrappedHami({ fur: furId, size = 210 }: { fur: string; size?: number }) {
  const f = furById(furId);
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className="block overflow-visible">
      <ellipse cx="100" cy="188" rx="70" ry="9" fill="#000" opacity="0.12" />
      {/* toalha: capuz e corpo */}
      <path d="M100 18 C150 18 172 60 170 104 C168 150 160 186 100 186 C40 186 32 150 30 104 C28 60 50 18 100 18Z" fill="#FFFFFF" />
      <path d="M46 150 Q100 170 156 146 Q160 172 132 182 Q100 190 68 182 Q42 172 46 150Z" fill="#EEF1F6" />
      <path d="M58 120 Q66 160 92 178 M142 120 Q136 160 110 178" stroke="#E2E6EE" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* abertura do rosto */}
      <ellipse cx="100" cy="88" rx="44" ry="38" fill={f.body} />
      <ellipse cx="100" cy="100" rx="34" ry="24" fill={f.belly} />
      <path d="M58 70 C66 40 134 40 142 70 C130 56 70 56 58 70Z" fill="#FFFFFF" />
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M76 88 q7 -7 14 0" />
        <path d="M110 88 q7 -7 14 0" />
      </g>
      <ellipse cx="72" cy="102" rx="8" ry="5" fill={f.ear} opacity="0.6" />
      <ellipse cx="128" cy="102" rx="8" ry="5" fill={f.ear} opacity="0.6" />
      <ellipse cx="100" cy="100" rx="3.4" ry="2.4" fill="#F28C9A" />
      <path d="M95 105 q2.5 2.6 5 0 q2.5 2.6 5 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M128 40 Q150 44 160 64" stroke="#fff" strokeWidth="1" fill="none" />
    </svg>
  );
}

/** Quarto quentinho: parede pêssego, janela em arco com a chuva lá fora, plantinha e tapete. */
export function CozyRoom() {
  return (
    <svg className="sx-room-art" viewBox="0 0 390 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="390" height="700" fill="#F7DCC8" />
      <rect y="470" width="390" height="230" fill="#F2B184" />
      <rect y="462" width="390" height="12" fill="#E79F72" />
      {/* janela em arco */}
      <g transform="translate(250 200)">
        <path d="M0 140 V60 Q0 0 60 0 Q120 0 120 60 V140Z" fill="#FFF3E8" />
        <path d="M10 134 V62 Q10 10 60 10 Q110 10 110 62 V134Z" fill="#2B3566" />
        <path d="M60 10 V134 M10 74 H110" stroke="#FFF3E8" strokeWidth="6" />
        {[22, 42, 74, 92, 30, 84].map((x, i) => (
          <path key={i} className="sx-win-rain" style={{ animationDelay: `${i * 0.2}s` }} d={`M${x} ${20 + (i % 3) * 30} l-4 12`} stroke="#9FB4FF" strokeWidth="2" strokeLinecap="round" />
        ))}
        <rect x="-8" y="138" width="136" height="10" rx="4" fill="#FFF3E8" />
      </g>
      {/* plantinha */}
      <g transform="translate(26 330)">
        <path d="M40 40 Q10 20 6 -20 Q30 0 40 30Z" fill="#5FAE77" />
        <path d="M44 40 Q60 0 92 -12 Q80 24 48 40Z" fill="#4C9A66" />
        <path d="M42 40 Q36 -10 52 -40 Q60 0 46 40Z" fill="#6CBD84" />
        <path d="M18 40 H74 L66 108 Q65 116 56 116 H36 Q27 116 26 108Z" fill="#C97C55" />
        <rect x="14" y="34" width="64" height="12" rx="4" fill="#B56A45" />
      </g>
      {/* tapete */}
      <path d="M70 560 L320 560 L350 640 L40 640Z" fill="#F5D372" />
      <path d="M86 574 H304 L326 628 H64Z" fill="none" stroke="#FFF1B8" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
    </svg>
  );
}

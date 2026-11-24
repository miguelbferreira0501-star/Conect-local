// O Hami dormindo de barriguinha para baixo (o da foto de referência), desenhado dentro da cena:
// - no chão: deitado numa caminha redonda desenhada no mesmo estilo dos móveis (borda de trás, almofada, borda da
//   frente por cima da barriga e as patinhas apoiadas na borda), com sombrinha de contato;
// - na cama: em cima do colchão, com sombrinha de contato.
// Ele respira devagar (só as costas sobem e descem) e solta os "z".
import { HamiPhoto, photoRatio, Zzz } from './HamiPhoto';
import { S } from './room/kit';

const BED = '#F6B3C8';
const BED_LIGHT = '#FBD3DF';
const BED_DARK = '#E58FAD';
const CUSHION = '#FFF3F6';

/** As duas patinhas da frente (para ficarem apoiadas por cima da borda da caminha). */
const PAWS = (
  <>
    <ellipse cx="222" cy="482" rx="64" ry="44" />
    <ellipse cx="466" cy="484" rx="70" ry="42" />
  </>
);

export function SleepingHami({ fur, size = 150, place = 'cama' }: { fur: string; size?: number; place?: 'cama' | 'chao' }) {
  const ph = size * photoRatio('dormindo');
  const zzz = <Zzz size={Math.max(26, size * 0.22)} />;
  if (place === 'cama') {
    return (
      <span className="sleep-hami sleep-photo is-cama" style={{ width: size, height: ph }} role="img" aria-label="Hami dormindo na caminha">
        <span className="sleep-contact" aria-hidden="true" />
        <HamiPhoto kind="dormindo" fur={fur} width={size} breathe />
        <span className="sleep-zzz">{zzz}</span>
      </span>
    );
  }
  // No chão: a caminha redonda (borda fofa e alta) é um pouco mais larga que ele.
  const w = size * 1.3;
  const bedH = (w * 124) / 240;
  const lift = bedH * (36 / 124); // a barriga dele fica afundada na almofada
  const left = (w - size) / 2 + size * 0.02;
  // frente da caminha: da curva de dentro (onde ele afunda) até embaixo; e a faixa clarinha de cima da borda
  const front = 'M4 56 L4 84 A116 38 0 0 0 236 84 L236 56 L204 62 A84 24 0 0 1 36 62 Z';
  const rim = 'M4 56 A116 38 0 0 0 236 56 L204 62 A84 24 0 0 1 36 62 Z';
  return (
    <span className="sleep-hami sleep-photo is-chao" style={{ width: w, height: ph + lift }} role="img" aria-label="Hami tirando uma soneca na caminha">
      <span className="nap-floor-shadow" aria-hidden="true" />
      {/* caminha: corpo, borda de trás e almofada */}
      <span className="nap-layer" style={{ height: bedH, zIndex: 1 }} aria-hidden="true">
        <S w={240} h={124}>
          <path d="M4 56 A116 38 0 0 1 236 56 L236 84 A116 38 0 0 1 4 84 Z" fill={BED} />
          <ellipse cx="120" cy="56" rx="116" ry="38" fill={BED_LIGHT} />
          <ellipse cx="120" cy="60" rx="86" ry="25" fill={BED} />
          <ellipse cx="120" cy="66" rx="80" ry="18" fill={CUSHION} />
          <ellipse cx="120" cy="57" rx="76" ry="8" fill={BED_DARK} opacity="0.22" />
          <path d="M26 44 Q120 14 214 44" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="5" fill="none" strokeLinecap="round" />
        </S>
      </span>
      {/* sombrinha de contato na almofada */}
      <span className="nap-contact" style={{ zIndex: 2, left: left + size * 0.05, width: size * 0.9, bottom: lift - size * 0.04, height: size * 0.12 }} aria-hidden="true" />
      <span className="nap-hami" style={{ left, bottom: lift, zIndex: 3 }}>
        <HamiPhoto kind="dormindo" fur={fur} width={size} breathe />
      </span>
      {/* borda da frente (fofa), por cima da barriguinha: contorno só onde ele afunda e por fora */}
      <span className="nap-layer" style={{ height: bedH, zIndex: 4 }} aria-hidden="true">
        <svg viewBox="0 0 240 124" className="block h-auto w-full overflow-visible">
          <path d={front} fill={BED} />
          <path d={rim} fill={BED_LIGHT} />
          <path d="M14 70 Q120 116 226 70" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M10 96 Q120 138 230 96" stroke={BED_DARK} strokeWidth="2.6" strokeDasharray="6 6" fill="none" opacity="0.7" />
          <path d="M36 62 A84 24 0 0 0 204 62" stroke="#4A2E22" strokeOpacity="0.6" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M4 56 L4 84 A116 38 0 0 0 236 84 L236 56" stroke="#4A2E22" strokeOpacity="0.72" strokeWidth="5" fill="none" strokeLinejoin="round" />
          <path d="M8 104 Q120 140 232 104" stroke="#2B1A14" strokeOpacity="0.12" strokeWidth="6" fill="none" />
        </svg>
      </span>
      {/* as patinhas apoiadas na borda */}
      <span className="nap-hami" style={{ left, bottom: lift, zIndex: 5 }} aria-hidden="true">
        <HamiPhoto kind="dormindo" fur={fur} width={size} clip={PAWS} />
      </span>
      <span className="sleep-zzz">{zzz}</span>
    </span>
  );
}

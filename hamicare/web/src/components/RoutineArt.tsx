// Ilustração de cada rotina do Crescer: o Hami fazendo a rotina, com os objetos em volta (no estilo dos cartões das áreas).
import { Glyph } from './art';
import type { Routine } from '../data/routines';

import a_ansiedade from '../assets/routines/ansiedade.webp';
import a_basico from '../assets/routines/basico.webp';
import a_cabeca from '../assets/routines/cabeca.webp';
import a_carinho from '../assets/routines/carinho.webp';
import a_casa15 from '../assets/routines/casa15.webp';
import a_domingo from '../assets/routines/domingo.webp';
import a_dormir from '../assets/routines/dormir.webp';
import a_energia from '../assets/routines/energia.webp';
import a_estudo from '../assets/routines/estudo.webp';
import a_foco from '../assets/routines/foco.webp';
import a_gratidao from '../assets/routines/gratidao.webp';
import a_manha from '../assets/routines/manha.webp';
import a_mexer from '../assets/routines/mexer.webp';
import a_noite from '../assets/routines/noite.webp';
import a_quarto from '../assets/routines/quarto.webp';
import a_sol from '../assets/routines/sol.webp';
import a_trabalho from '../assets/routines/trabalho.webp';
import a_yoga from '../assets/routines/yoga.webp';

const ART: Record<string, string> = {
  ansiedade: a_ansiedade,
  basico: a_basico,
  cabeca: a_cabeca,
  carinho: a_carinho,
  casa15: a_casa15,
  domingo: a_domingo,
  dormir: a_dormir,
  energia: a_energia,
  estudo: a_estudo,
  foco: a_foco,
  gratidao: a_gratidao,
  manha: a_manha,
  mexer: a_mexer,
  noite: a_noite,
  quarto: a_quarto,
  sol: a_sol,
  trabalho: a_trabalho,
  yoga: a_yoga,
};

export function RoutineArt({ r, fit = 'cover', glyph = 60 }: { r: Routine; fit?: 'cover' | 'contain'; glyph?: number }) {
  const src = ART[r.id];
  if (!src) return <Glyph e={r.emoji} size={glyph} />;
  return <img className={`rt-art is-${fit}`} src={src} alt="" draggable={false} loading="lazy" decoding="async" />;
}

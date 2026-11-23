// Ilustração de cada rotina do Crescer (o Hami fazendo a rotina), igual aos cartões do vídeo de referência.
import { Glyph } from './art';
import type { Routine } from '../data/routines';
import a_academia from '../assets/routines/academia.webp';
import a_ansiedade_calma from '../assets/routines/ansiedade-calma.webp';
import a_boost_manha from '../assets/routines/boost-manha.webp';
import a_carteira from '../assets/routines/carteira.webp';
import a_controle_ansiedade from '../assets/routines/controle-ansiedade.webp';
import a_cuide_casa from '../assets/routines/cuide-casa.webp';
import a_desconexao from '../assets/routines/desconexao.webp';
import a_dia_produtivo from '../assets/routines/dia-produtivo.webp';
import a_diario_criativo from '../assets/routines/diario-criativo.webp';
import a_domingo from '../assets/routines/domingo.webp';
import a_emagrecer from '../assets/routines/emagrecer.webp';
import a_essenciais from '../assets/routines/essenciais.webp';
import a_estudos from '../assets/routines/estudos.webp';
import a_fitness from '../assets/routines/fitness.webp';
import a_hidratacao from '../assets/routines/hidratacao.webp';
import a_limpeza_facil from '../assets/routines/limpeza-facil.webp';
import a_modo_crise from '../assets/routines/modo-crise.webp';
import a_movimento from '../assets/routines/movimento.webp';
import a_movimento_diario from '../assets/routines/movimento-diario.webp';
import a_organize_casa from '../assets/routines/organize-casa.webp';
import a_organize_dia from '../assets/routines/organize-dia.webp';
import a_pos_escola from '../assets/routines/pos-escola.webp';
import a_recomeco from '../assets/routines/recomeco.webp';
import a_skincare from '../assets/routines/skincare.webp';
import a_tdah from '../assets/routines/tdah.webp';
import a_verao from '../assets/routines/verao.webp';

const ART: Record<string, string> = {
  academia: a_academia,
  'ansiedade-calma': a_ansiedade_calma,
  'boost-manha': a_boost_manha,
  carteira: a_carteira,
  'controle-ansiedade': a_controle_ansiedade,
  'cuide-casa': a_cuide_casa,
  desconexao: a_desconexao,
  'dia-produtivo': a_dia_produtivo,
  'diario-criativo': a_diario_criativo,
  domingo: a_domingo,
  emagrecer: a_emagrecer,
  essenciais: a_essenciais,
  estudos: a_estudos,
  fitness: a_fitness,
  hidratacao: a_hidratacao,
  'limpeza-facil': a_limpeza_facil,
  'modo-crise': a_modo_crise,
  movimento: a_movimento,
  'movimento-diario': a_movimento_diario,
  'organize-casa': a_organize_casa,
  'organize-dia': a_organize_dia,
  'pos-escola': a_pos_escola,
  recomeco: a_recomeco,
  skincare: a_skincare,
  tdah: a_tdah,
  verao: a_verao,
};

export function RoutineArt({ r, glyph = 60 }: { r: Routine; glyph?: number }) {
  const src = ART[r.id];
  if (!src) return <Glyph e={r.emoji} size={glyph} />;
  return <img className="rt-art" src={src} alt="" draggable={false} loading="lazy" decoding="async" />;
}

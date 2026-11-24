// O Hami 3D passeando de mochilinha: anda de verdade (perninhas, bracinhos, corpo e orelhas), meio de lado,
// com a roupa que está usando.
import { Hami3D } from './Hami3D';
import type { Outfit } from '../types';

export function WalkingHami({ fur, outfit, size = 150, still = false }: { fur: string; outfit?: Outfit; size?: number; still?: boolean }) {
  return (
    <span className="wk3d" style={{ width: size }} role="img" aria-label="Hami passeando de mochilinha">
      <Hami3D fur={fur} outfit={outfit} mood={still ? 'feliz' : 'risada'} action="andar" size={size} still={still} label="" />
    </span>
  );
}

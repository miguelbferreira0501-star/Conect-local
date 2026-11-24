// O cachorrinho passeando de lado (virado para a direita, para onde o caminho anda) (pose da folha de poses): as perninhas vão e voltam, o corpo balança e o
// rabo abana, com a roupa que está usando.
import { DogPose } from './DogPose';
import type { Outfit } from '../types';

export function WalkingHami({ fur, outfit, size = 150, still = false }: { fur: string; outfit?: Outfit; size?: number; still?: boolean }) {
  return (
    <span className="wk3d" style={{ width: size }} role="img" aria-label="Passeando">
      <DogPose kind="anda" fur={fur} outfit={outfit} width={size} still={still} label="" flip />
    </span>
  );
}

// O Hami usando os móveis (Início e aba Cuidar): tocar na cama, banheira, sofá, cadeira ou rodinha faz ele
// ir até lá e deitar, tomar banho, sentar ou correr por alguns segundos. Banho e brincar contam como cuidado.
import { useRef, useState } from 'react';
import { Hamster } from './Hamster';
import { SleepingHami } from './SleepingHami';
import { BathPhoto } from './HamiPhoto';
import { toast } from './ui';
import type { UseKind } from './Room';
import { care, useApp } from '../lib/store';
import { play, type SoundId } from '../lib/sound';

const USE_SOUND: Record<UseKind, SoundId> = { deitar: 'bocejo', banho: 'espuma', sentar: 'pulo', correr: 'pega', balancar: 'iii' };
const USE_LINE: Record<UseKind, string> = {
  deitar: 'Que caminha gostosa… vou tirar uma sonequinha.',
  banho: 'Banho quentinho! Que delícia.',
  sentar: 'Sentadinho aqui, descansando um pouco.',
  correr: 'Corre, corre! Que divertido!',
  balancar: 'Uiii, lá vou eu!',
};

/** O Hami usando o móvel (desenhado dentro dele, na largura do móvel). */
export function UsePet({ kind, w }: { kind: UseKind; w: number }) {
  const s = useApp();
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  if (kind === 'deitar') return <SleepingHami fur={s.pet.fur} size={clamp(w * 0.66, 80, 180)} />;
  // No banho, a foto (tina de madeira, espuma, patinho e toalha) fica no lugar da banheira.
  if (kind === 'banho') return <BathPhoto fur={s.pet.fur} width={clamp(w * 1.22, 130, 300)} />;
  const size = kind === 'sentar' ? clamp(w * 0.5, 70, 140) : kind === 'correr' ? clamp(w * 0.58, 60, 130) : clamp(w * 0.45, 60, 120);
  return (
    <div className={`use-pet use-pet-${kind}`}>
      <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={size} mood={kind === 'sentar' ? 'feliz' : 'animado'} idle={kind === 'sentar'} growth={1} label="" />
    </div>
  );
}
/** Estado e ações do "usar o móvel". `busy` = ele está passeando ou viajando (não dá para usar). */
export function useFurniturePlay(busy: boolean) {
  const s = useApp();
  const [use, setUse] = useState<{ uid: string; kind: UseKind; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  /** `quiet`: ele já estava assim quando a pessoa abriu o app (sem som, sem contar cuidado, fica até tocar). */
  function useItem(uid: string, kind: UseKind, quiet = false) {
    if (!quiet && s.pet.sleeping) return toast(`${s.pet.name} está dormindo. Shhh…`);
    if (busy) return quiet ? undefined : toast(`${s.pet.name} está passeando agora.`);
    if (use?.uid === uid) {
      if (use.kind === 'deitar') play('squeak');
      return setUse(null);
    }
    const id = Date.now();
    setUse({ uid, kind, id });
    if (quiet) return;
    play(USE_SOUND[kind]);
    if (kind === 'banho') care('banho');
    if (kind === 'correr' || kind === 'balancar') care('brincar');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setUse((cur) => (cur?.id === id ? null : cur)), kind === 'deitar' ? 9000 : 7000);
  }
  const usage = use ? { uid: use.uid, kind: use.kind, node: (w: number) => <UsePet kind={use.kind} w={w} /> } : null;
  return { use, useItem, usage, line: use ? USE_LINE[use.kind] : null, stop: () => setUse(null) };
}

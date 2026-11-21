// O Hami usando os móveis (Início e aba Cuidar): tocar na cama, banheira, sofá, cadeira ou rodinha faz ele
// ir até lá e deitar, tomar banho, sentar ou correr por alguns segundos. Banho e brincar contam como cuidado.
import { useRef, useState } from 'react';
import { Hamster } from './Hamster';
import { SleepingHami } from './SleepingHami';
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
  if (kind === 'deitar') return <SleepingHami fur={s.pet.fur} outfit={s.pet.outfit} size={clamp(w * 0.72, 90, 190)} />;
  const size = kind === 'banho' ? clamp(w * 0.62, 80, 150) : kind === 'sentar' ? clamp(w * 0.5, 70, 140) : kind === 'correr' ? clamp(w * 0.58, 60, 130) : clamp(w * 0.45, 60, 120);
  return (
    <div className={`use-pet use-pet-${kind}`}>
      <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={kind === 'banho' ? { ...s.pet.outfit, roupa: null } : s.pet.outfit} size={size} mood={kind === 'banho' ? 'calmo' : kind === 'sentar' ? 'feliz' : 'animado'} wet={kind === 'banho'} idle={kind === 'sentar'} growth={1} label="" />
      {kind === 'banho' && (
        <span className="use-bubbles" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}
/** Estado e ações do "usar o móvel". `busy` = ele está passeando ou viajando (não dá para usar). */
export function useFurniturePlay(busy: boolean) {
  const s = useApp();
  const [use, setUse] = useState<{ uid: string; kind: UseKind; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  function useItem(uid: string, kind: UseKind) {
    if (s.pet.sleeping) return toast(`${s.pet.name} está dormindo. Shhh…`);
    if (busy) return toast(`${s.pet.name} está passeando agora.`);
    if (use?.uid === uid) return setUse(null);
    const id = Date.now();
    setUse({ uid, kind, id });
    play(USE_SOUND[kind]);
    if (kind === 'banho') care('banho');
    if (kind === 'correr' || kind === 'balancar') care('brincar');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setUse((cur) => (cur?.id === id ? null : cur)), kind === 'deitar' ? 9000 : 7000);
  }
  const usage = use ? { uid: use.uid, kind: use.kind, node: (w: number) => <UsePet kind={use.kind} w={w} /> } : null;
  return { use, useItem, usage, line: use ? USE_LINE[use.kind] : null, stop: () => setUse(null) };
}

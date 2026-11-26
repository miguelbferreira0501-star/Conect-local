// As 20 poses do Lumbi (folha enviada pela dona do app), usadas pelo app inteiro em reações simples:
// um pulinho ao aparecer, um balanço leve parado e um "boing" quando alguém toca.
import { useState } from 'react';
import feliz from '../assets/lumbi/pose-feliz.webp';
import acena from '../assets/lumbi/pose-acena.webp';
import coracao from '../assets/lumbi/pose-coracao.webp';
import duvida from '../assets/lumbi/pose-duvida.webp';
import dorme from '../assets/lumbi/pose-dorme.webp';
import danca from '../assets/lumbi/pose-danca.webp';
import bandana from '../assets/lumbi/pose-bandana.webp';
import curioso from '../assets/lumbi/pose-curioso.webp';
import espia from '../assets/lumbi/pose-espia.webp';
import rola from '../assets/lumbi/pose-rola.webp';
import musica from '../assets/lumbi/pose-musica.webp';
import chora from '../assets/lumbi/pose-chora.webp';
import travesseiro from '../assets/lumbi/pose-travesseiro.webp';
import risada from '../assets/lumbi/pose-risada.webp';
import orgulho from '../assets/lumbi/pose-orgulho.webp';
import estrela from '../assets/lumbi/pose-estrela.webp';
import comemora from '../assets/lumbi/pose-comemora.webp';
import costas from '../assets/lumbi/pose-costas.webp';
import deitado from '../assets/lumbi/pose-deitado.webp';
import late from '../assets/lumbi/pose-late.webp';
import { play } from '../lib/sound';

export const POSES = { feliz, acena, coracao, duvida, dorme, danca, bandana, curioso, espia, rola, musica, chora, travesseiro, risada, orgulho, estrela, comemora, costas, deitado, late } as const;
export type PoseName = keyof typeof POSES;

/** Poses alegres (para comemorar e para enfeitar telas). */
export const HAPPY_POSES: PoseName[] = ['feliz', 'acena', 'coracao', 'danca', 'bandana', 'risada', 'orgulho', 'estrela', 'comemora', 'late'];

/** Uma pose pelo dia (muda todo dia, igual para a tela inteira). */
export function poseOfDay(list: PoseName[] = HAPPY_POSES, salt = 0): PoseName {
  const d = new Date();
  const n = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate() + salt;
  return list[n % list.length];
}

export const randomPose = (list: PoseName[] = HAPPY_POSES): PoseName => list[Math.floor(Math.random() * list.length)];

/**
 * Uma pose do Lumbi. Toque: ele dá um pulinho e troca de pose (quando `cycle` vem com a lista).
 * `float` deixa ele balançando devagar; `pop` faz ele entrar com um pulinho.
 */
export function Pose({ name, size = 120, className = '', float = true, pop = true, cycle, label = '' }: { name: PoseName; size?: number; className?: string; float?: boolean; pop?: boolean; cycle?: PoseName[]; label?: string }) {
  const [cur, setCur] = useState<PoseName>(name);
  const [boing, setBoing] = useState(0);
  const shown = cycle ? cur : name;
  const tap = () => {
    setBoing((b) => b + 1);
    play('pulo');
    if (cycle?.length) setCur((c) => cycle[(cycle.indexOf(c) + 1) % cycle.length]);
  };
  return (
    <button type="button" className={`pose ${float ? 'is-float' : ''} ${pop ? 'is-pop' : ''} ${className}`} onClick={tap} aria-label={label || 'Lumbi'} data-sound="none" style={{ width: size }}>
      <img key={`${shown}-${boing}`} src={POSES[shown]} alt="" className={boing ? 'is-boing' : ''} draggable={false} />
    </button>
  );
}

// Faixa do Lumbi+ no Início (embaixo da Aventura), em carrossel: o Lumbi (vivo, mexendo) espiando, a namorada
// dele e as pelagens raras. Passa sozinha a cada poucos segundos e dá para arrastar com o dedo.
// Não aparece para quem já é Plus nem para crianças de até 12 anos.
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Crown } from 'lucide-react';
import { Hamster } from './Hamster';
import { partnerOutfit } from './Partner';
import { showPlusOffers } from './PlusCard';
import { partnerWord, useApp } from '../lib/store';
import { prefersReducedMotion } from '../lib/util';

export function PlusBanner({ onOpen, onInvite }: { onOpen: () => void; onInvite?: () => void }) {
  const s = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const ele = s.pet.gender === 'menina' ? 'ela' : 'ele';
  const word = partnerWord(s);
  const slides = [
    {
      id: 'momentos',
      cls: 'pb-yellow',
      title: `Mais pequenos momentos com ${ele}`,
      art: (
        // o Lumbi de verdade espiando por cima da faixa (vivo, fazendo as ações dele)
        <span className="pb-peek" aria-hidden="true">
          <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={124} mood="risada" label="" />
        </span>
      ),
    },
    {
      id: 'par',
      cls: 'pb-pink',
      title: `${word === 'namorada' ? 'Uma namorada' : 'Um namorado'} para o ${s.pet.name}`,
      art: (
        <span className="pb-duo" aria-hidden="true">
          <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={66} mood="feliz" label="" />
          <span className="pb-heart">♥</span>
          <Hamster fur={word === 'namorada' ? 'rosinha' : 'creme'} outfit={partnerOutfit(s)} size={62} mood="amor" label="" />
        </span>
      ),
    },
    {
      id: 'amigos',
      cls: 'pb-mint',
      title: `Chame amigos para cuidar com o ${s.pet.name}`,
      art: (
        <span className="pb-duo" aria-hidden="true">
          <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={64} mood="feliz" label="" />
          <Hamster fur="chocolate" size={58} mood="risada" label="" />
        </span>
      ),
    },
  ];
  // Passa sozinha (para quando a pessoa está arrastando).
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || el.matches(':active')) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % el.children.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length]);
  // Quem já é Plus (ou criança) vê só a faixa dos amigos.
  const shown = showPlusOffers(s) ? slides : slides.filter((sl) => sl.id === 'amigos');
  return (
    <section className="pb" aria-label="Lumbi+">
      <div ref={ref} className="pb-track" onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}>
        {shown.map((sl) => (
          <button key={sl.id} className={`pb-slide ${sl.cls}`} onClick={sl.id === 'amigos' ? onInvite ?? onOpen : onOpen} aria-label={sl.id === 'amigos' ? `${sl.title}. Convidar amigos` : `Lumbi+: ${sl.title}. Ver planos`}>
            <span className="pb-text">
              <span className="pb-chip">{sl.id === 'amigos' ? <>AMIGOS</> : <><Crown size={13} /> PREMIUM</>}</span>
              <b>{sl.title}</b>
            </span>
            <span className="pb-art">{sl.art}</span>
            <span className="pb-go" aria-hidden="true">
              <ChevronRight size={20} strokeWidth={3} />
            </span>
          </button>
        ))}
      </div>
      <span className="pb-dots" aria-hidden="true">
        {shown.length > 1 && shown.map((sl, k) => (
          <i key={sl.id} className={k === i ? 'is-on' : ''} />
        ))}
      </span>
    </section>
  );
}

// Faixa do Lumbi+ no Início (embaixo da Aventura), em carrossel: o Lumbi espiando (arte enviada), a namorada
// dele e as pelagens raras. Passa sozinha a cada poucos segundos e dá para arrastar com o dedo.
// Não aparece para quem já é Plus nem para crianças de até 12 anos.
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Crown } from 'lucide-react';
import bannerDog from '../assets/lumbi/banner-plus.webp';
import { Hamster } from './Hamster';
import { partnerOutfit } from './Partner';
import { showPlusOffers } from './PlusCard';
import { POSES } from './Poses';
import { partnerWord, useApp } from '../lib/store';
import { prefersReducedMotion } from '../lib/util';

export function PlusBanner({ onOpen }: { onOpen: () => void }) {
  const s = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const ele = s.pet.gender === 'menina' ? 'ela' : 'ele';
  const word = partnerWord(s);
  const slides = [
    { id: 'momentos', cls: 'pb-yellow', title: `Mais pequenos momentos com ${ele}`, art: <img src={bannerDog} alt="" className="pb-dog" draggable={false} /> },
    {
      id: 'par',
      cls: 'pb-pink',
      title: `${word === 'namorada' ? 'Uma namorada' : 'Um namorado'} para o ${s.pet.name}`,
      art: (
        <span className="pb-duo" aria-hidden="true">
          <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={66} idle={false} mood="feliz" label="" />
          <span className="pb-heart">♥</span>
          <Hamster fur={word === 'namorada' ? 'rosinha' : 'creme'} outfit={partnerOutfit(s)} size={62} idle={false} mood="amor" label="" />
        </span>
      ),
    },
    {
      id: 'pelagens',
      cls: 'pb-lilac',
      title: 'Pelagens raras e 99 itens só do Plus',
      art: (
        <span className="pb-furs" aria-hidden="true">
          <Hamster fur="algodao" size={50} idle={false} mood="feliz" label="" />
          <img src={POSES.estrela} alt="" className="pb-pose" draggable={false} />
          <Hamster fur="menta" size={50} idle={false} mood="feliz" label="" />
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
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!showPlusOffers(s)) return null;
  return (
    <section className="pb" aria-label="Lumbi+">
      <div ref={ref} className="pb-track" onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}>
        {slides.map((sl) => (
          <button key={sl.id} className={`pb-slide ${sl.cls}`} onClick={onOpen} aria-label={`Lumbi+: ${sl.title}. Ver planos`}>
            <span className="pb-text">
              <span className="pb-chip">
                <Crown size={13} /> PREMIUM
              </span>
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
        {slides.map((sl, k) => (
          <i key={sl.id} className={k === i ? 'is-on' : ''} />
        ))}
      </span>
    </section>
  );
}

// Namorada (ou namorado) do Lumbi, do Lumbi+. Fica do lado dele no Início, com corações subindo de vez em
// quando; um toque nela faz carinho (mais corações). Nos Ajustes dá para escolher nome, pelagem e ligar/desligar.
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Hamster } from './Hamster';
import { FURS } from '../data/fur';
import { isPremium, partnerWord, updatePartner, useApp } from '../lib/store';
import { play } from '../lib/sound';
import type { Outfit, State } from '../types';

export function partnerOutfit(s: State): Outfit {
  const girl = partnerWord(s) === 'namorada';
  // nada na cabeça (as orelhinhas ficam livres): ela usa um colar de coração; ele, gravata
  return { chapeu: null, oculos: null, roupa: null, acessorio: girl ? 'colar-coracao-ouro' : 'gravata', efeito: null } as Outfit;
}

/** Ela do lado do Lumbi no Início. */
export function PartnerPet({ size = 132 }: { size?: number }) {
  const s = useApp();
  const [taps, setTaps] = useState(0);
  if (!s.partner) return null;
  const pet = () => {
    play('coracao');
    setTaps((t) => t + 1);
  };
  return (
    <button className="partner" onClick={pet} aria-label={`${s.partner.name}, ${partnerWord(s)} do ${s.pet.name}. Toque para fazer carinho`} data-sound="none">
      <Hamster fur={s.partner.fur} outfit={partnerOutfit(s)} mood={taps % 3 === 2 ? 'amor' : 'feliz'} size={size} growth={0.92} label="" />
      <span className="partner-heart" aria-hidden="true">♥</span>
      {taps > 0 &&
        Array.from({ length: 3 }, (_, i) => (
          <span key={`${taps}-${i}`} className="partner-pop" style={{ left: `${30 + i * 18}%`, animationDelay: `${i * 0.12}s` }} aria-hidden="true">
            ♥
          </span>
        ))}
    </button>
  );
}

/** Ajustes: escolher o par do Lumbi (ou ver o convite do Plus). */
export function PartnerSettings({ onPlus }: { onPlus: () => void }) {
  const s = useApp();
  const word = partnerWord(s);
  const Word = word[0].toUpperCase() + word.slice(1);
  if (!isPremium(s)) {
    return (
      <button className="partner-lock" onClick={onPlus}>
        <span className="partner-lock-pets" aria-hidden="true">
          <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={64} idle={false} mood="feliz" />
          <span className="partner-lock-heart">♥</span>
          <Hamster fur={partnerWord(s) === 'namorada' ? 'rosinha' : 'creme'} outfit={partnerOutfit(s)} size={58} idle={false} mood="amor" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <b>
            {Word} do {s.pet.name} <Lock size={13} className="inline" />
          </b>
          <small>Com o Lumbi+, o {s.pet.name} ganha um par que fica com ele no Início.</small>
        </span>
      </button>
    );
  }
  const p = s.partner ?? { name: word === 'namorada' ? 'Mel' : 'Bento', fur: 'creme', on: false };
  return (
    <div className="grid gap-3">
      <div className="partner-preview" aria-hidden="true">
        <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={92} idle={false} mood="feliz" />
        <span className="partner-lock-heart">♥</span>
        <Hamster fur={p.fur} outfit={partnerOutfit(s)} size={84} idle={false} mood="amor" />
      </div>
      <label className="flex items-center justify-between gap-3 font-bold">
        Mostrar {word === 'namorada' ? 'a' : 'o'} {word} no Início
        <input type="checkbox" role="switch" className="switch" checked={!!s.partner?.on} onChange={(e) => updatePartner({ on: e.target.checked })} />
      </label>
      <label className="grid gap-1 text-[14px] font-bold">
        Nome
        <input className="field" maxLength={18} value={p.name} onChange={(e) => updatePartner({ name: e.target.value })} />
      </label>
      <div className="grid grid-cols-5 gap-1.5">
        {[...FURS.filter((f) => f.partner), ...FURS.filter((f) => !f.partner)].map((f) => (
          <button key={f.id} className="color-opt !p-0.5" aria-pressed={p.fur === f.id} aria-label={f.label} onClick={() => updatePartner({ fur: f.id })}>
            <Hamster fur={f.id} size={50} idle={false} />
          </button>
        ))}
      </div>
    </div>
  );
}

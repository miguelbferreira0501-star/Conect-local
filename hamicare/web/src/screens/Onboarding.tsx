import { useState } from 'react';
import { Pet } from '../components/Pet';
import { COLOR_ORDER, PET_COLORS, type PetColor } from '../data/colors';
import { PET_NAME_IDEAS } from '../data/lines';
import { completeOnboarding } from '../lib/store';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [color, setColor] = useState<PetColor>('maracuja');
  const [petName, setPetName] = useState('');
  const [userName, setUserName] = useState('');

  return (
    <div className="shell grid content-center gap-6 !pb-8">
      <div className="grid justify-items-center gap-2 pt-4 text-center">
        <Pet color={color} stage={step === 0 ? 0 : 1} mood={step === 0 ? 'sono' : 'feliz'} size={step === 0 ? 210 : 180} label="Seu futuro xodó" />
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-2 rounded-full transition-[width] duration-200 ${i === step ? 'w-6 bg-accent' : 'w-2 bg-line'}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <section className="grid gap-4 text-center">
          <h1 className="font-display text-[34px] font-bold leading-[1.05]">Oi! Eu sou um xodó.</h1>
          <p className="mx-auto max-w-[34ch] text-[17px] text-muted">
            Eu cresço quando você cuida de você: beber água, sair da cama, respirar fundo. Sem culpa e sem cobrança, no seu tempo.
          </p>
          <button className="btn btn-primary" onClick={() => setStep(1)}>
            Vamos lá
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="grid gap-4">
          <h1 className="text-center font-display text-[28px] font-bold leading-tight">De que cor eu sou?</h1>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_ORDER.map((c) => (
              <button key={c} className="color-opt" aria-pressed={color === c} aria-label={PET_COLORS[c].label} onClick={() => setColor(c)}>
                <Pet color={c} stage={1} size={52} idle={false} />
              </button>
            ))}
          </div>
          <p className="text-center font-display text-[20px] font-semibold">{PET_COLORS[color].label}</p>
          <button className="btn btn-primary" onClick={() => setStep(2)}>
            Essa!
          </button>
        </section>
      )}

      {step === 2 && (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (petName.trim()) setStep(3);
          }}
        >
          <label className="grid gap-3 text-center" htmlFor="pet-name">
            <span className="font-display text-[28px] font-bold leading-tight">Qual vai ser o meu nome?</span>
            <input id="pet-name" className="field text-center text-[20px] font-bold" value={petName} maxLength={20} autoComplete="off" placeholder="Escreva um nome" onChange={(e) => setPetName(e.target.value)} />
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            {PET_NAME_IDEAS.map((n) => (
              <button type="button" key={n} className="chip chip-leaf" onClick={() => setPetName(n)}>
                {n}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={!petName.trim()}>
            Continuar
          </button>
        </form>
      )}

      {step === 3 && (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            completeOnboarding(userName, petName, color);
          }}
        >
          <label className="grid gap-3 text-center" htmlFor="user-name">
            <span className="font-display text-[28px] font-bold leading-tight">E você, como quer que eu te chame?</span>
            <input id="user-name" className="field text-center text-[20px] font-bold" value={userName} maxLength={24} autoComplete="given-name" placeholder="Seu nome ou apelido" onChange={(e) => setUserName(e.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={!userName.trim()}>
            Prazer, {petName}!
          </button>
          <p className="text-center text-[13px] text-muted">
            O Xodó ajuda no dia a dia, mas não substitui terapia. Se precisar de ajuda agora, o CVV atende no 188, de graça, 24h.
          </p>
        </form>
      )}
    </div>
  );
}

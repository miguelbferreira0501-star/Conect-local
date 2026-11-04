// "Mudar de área": perder peso, ganhar peso, manter, só hábitos ou calma para a ansiedade.
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Sheet, toast } from './ui';
import { Glyph } from './art';
import { AREA_GOAL, AREAS, areasFor, isWeightArea, type Area } from '../logic/areas';
import { isMinor } from '../logic/evolution';
import { libById } from '../data/tasks';
import { areaNow, changeArea, starterPlan, useApp } from '../lib/store';

export function AreaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const current = areaNow(s);
  const [pick, setPick] = useState<Area | null>(null);
  useEffect(() => {
    if (!open) setPick(null);
  }, [open]);
  const list = areasFor(s.profile.ageGroup, 'app');
  const p = s.profile;
  const preview = pick ? starterPlan({ goal: AREA_GOAL[pick], focus: p.focus, minutes: p.minutes, likes: p.likes, ageGroup: p.ageGroup }).slice(0, 4) : [];

  function apply(trocar: boolean) {
    if (!pick) return;
    changeArea(pick, trocar);
    toast(trocar ? `Área nova: ${AREAS[pick].short}. Missões do dia trocadas!` : `Área nova: ${AREAS[pick].short}.`);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={pick ? AREAS[pick].label : 'Mudar de área'}>
      {!pick ? (
        <div className="grid gap-2 pb-2">
          <p className="text-[14px] text-muted">Escolha o que você quer cuidar agora. O {s.pet.name}, as sementes, as roupas e o seu progresso continuam iguais.</p>
          {list.map((a) => (
            <button key={a} className="opt" aria-pressed={current === a} onClick={() => (a === current ? onClose() : setPick(a))}>
              <Glyph e={AREAS[a].emoji} size={42} />
              <span className="min-w-0 flex-1">
                <span className="block leading-tight">{AREAS[a].label}</span>
                <span className="block text-[13px] font-semibold text-muted">{AREAS[a].desc}</span>
              </span>
              {current === a ? <span className="chip chip-leaf shrink-0">Atual</span> : <ChevronRight size={18} className="shrink-0 text-muted" />}
            </button>
          ))}
          {isMinor(s.profile.ageGroup) && (
            <p className="rounded-2xl bg-surface2 p-3 text-[13px] font-semibold text-muted">
              Perder, ganhar e manter o peso só aparecem para quem tem 18 anos ou mais. Se a sua idade estiver errada, troque em Ajustes › Faixa de idade.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 pb-2">
          <div className="flex items-center gap-3 rounded-3xl bg-surface2 p-3">
            <Glyph e={AREAS[pick].emoji} size={52} />
            <p className="min-w-0 text-[15px] font-semibold leading-snug">
              {isWeightArea(pick)
                ? `O ${s.pet.name} começa do peso de agora e muda junto com você.`
                : pick === 'calma'
                  ? `Aqui ninguém fala de peso. O ${s.pet.name} te ajuda a respirar, desacelerar e dormir melhor, e o SOS fica sempre à mão.`
                  : `Sem peso e sem calorias: só os hábitos do dia a dia, com o ${s.pet.name} torcendo por você.`}
            </p>
          </div>
          <p className="font-display text-[18px] font-bold leading-tight">Trocar também as missões do dia?</p>
          <div className="grid gap-1.5">
            {preview.map((id) => {
              const t = libById(id);
              return t ? (
                <p key={id} className="flex items-center gap-2 rounded-2xl bg-surface2 px-3 py-2 text-[14px] font-bold">
                  <Glyph e={t.emoji} size={26} />
                  <span className="min-w-0 flex-1">{t.title}</span>
                </p>
              ) : null;
            })}
            <p className="text-[12.5px] text-muted">…e mais algumas. As missões que você criou continuam.</p>
          </div>
          <button className="btn btn-primary" onClick={() => apply(true)}>
            Sim, trocar as missões
          </button>
          <button className="btn btn-ghost" onClick={() => apply(false)}>
            Só mudar a área
          </button>
          <button className="justify-self-center text-[14px] font-extrabold text-muted underline underline-offset-4" onClick={() => setPick(null)}>
            Voltar
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** Pílula "Área: … · Mudar" para o topo do Início e dos Ajustes. */
export function AreaPill({ onClick }: { onClick: () => void }) {
  const s = useApp();
  const a = areaNow(s);
  return (
    <button className="area-pill" onClick={onClick} aria-label={`Área: ${AREAS[a].short}. Mudar de área`}>
      <Glyph e={AREAS[a].emoji} size={22} />
      <span className="min-w-0 truncate">
        Área: <b>{AREAS[a].short}</b>
      </span>
      <span className="area-pill-cta">Mudar</span>
    </button>
  );
}

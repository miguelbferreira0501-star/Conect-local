// Perfil do Lumbi: foto, nome e pronome, idade (dias juntos), quem cuida dele, viagens; a sequência da
// semana em bolinhas e as descobertas das viagens e passeios. Segunda aba: o jeitinho dele.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Pencil, X } from 'lucide-react';
import { Hamster } from './Hamster';
import { Glyph } from './art';
import { toast } from './ui';
import { PLACES } from '../data/world';
import { TRAITS } from '../data/lines';
import { sinceStart, todayKey, updatePet, useApp } from '../lib/store';
import { streakOf } from '../logic/streak';
import { isActive } from '../logic/evolution';
import { addDays, weekStart } from '../lib/util';
import { openUi } from '../lib/bus';
import type { PetGender } from '../types';

const PRONOUN: Record<PetGender, string> = { menino: 'Ele/dele', menina: 'Ela/dela', outro: 'Do jeitinho dele' };
const LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const ALL_FINDS = PLACES.flatMap((p) => p.finds.map((f) => ({ ...f, place: p.name })));

export function PetProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [tab, setTab] = useState<'perfil' | 'jeitinho'>('perfil');
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(s.pet.name);
  if (!open) return null;
  const today = todayKey();
  const age = sinceStart(s) + 1;
  const trips = Object.values(s.trekCards ?? {}).reduce((a, b) => a + b, 0) + Object.values(s.placesDone).reduce((a, b) => a + b, 0);
  const streak = streakOf(s.days, today, s.createdAt);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));
  const finds = s.finds.map((id) => ALL_FINDS.find((f) => f.id === id)).filter(Boolean) as typeof ALL_FINDS;
  const gender = s.pet.gender ?? 'menino';
  const setGender = (g: PetGender) => updatePet({ gender: g });
  const trait = TRAITS[s.pet.trait];

  return createPortal(
    <div className="pp" role="dialog" aria-modal="true" aria-label={`Perfil do ${s.pet.name}`}>
      <div className="pp-in">
        <div className="pp-top">
          <button className="pp-ico" onClick={onClose} aria-label="Fechar">
            <X size={22} />
          </button>
          <button className="pp-ico" onClick={() => (onClose(), openUi('ajustes'))} aria-label="Ajustes">
            <Glyph e="⚙️" size={26} />
          </button>
        </div>

        <section className="pp-card">
          <div className="pp-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'perfil'} className={tab === 'perfil' ? 'is-on' : ''} onClick={() => setTab('perfil')}>
              Perfil do {s.pet.name}
            </button>
            <button role="tab" aria-selected={tab === 'jeitinho'} className={tab === 'jeitinho' ? 'is-on' : ''} onClick={() => setTab('jeitinho')}>
              Jeitinho
            </button>
          </div>

          {tab === 'perfil' ? (
            <div className="pp-main">
              <div className="pp-photo">
                <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} size={150} mood="feliz" pose="tchau" idle={false} label={s.pet.name} />
              </div>
              <div className="pp-info">
                {edit ? (
                  <form
                    className="pp-edit"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (name.trim()) updatePet({ name: name.trim().slice(0, 18) });
                      setEdit(false);
                      toast('Perfil atualizado');
                    }}
                  >
                    <input className="field" value={name} maxLength={18} onChange={(e) => setName(e.target.value)} aria-label="Nome" autoFocus />
                    <div className="pp-gender">
                      {(['menino', 'menina', 'outro'] as PetGender[]).map((g) => (
                        <button type="button" key={g} className={gender === g ? 'is-on' : ''} onClick={() => setGender(g)}>
                          {g === 'outro' ? 'Outro' : g === 'menino' ? 'Menino' : 'Menina'}
                        </button>
                      ))}
                    </div>
                    <button className="pp-save" type="submit">
                      Salvar
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="pp-name">
                      <span>
                        <b>{s.pet.name}</b>
                        <small>{PRONOUN[gender]}</small>
                      </span>
                      <button className="pp-pen" onClick={() => (setName(s.pet.name), setEdit(true))} aria-label="Editar nome e pronome">
                        <Pencil size={18} />
                      </button>
                    </div>
                    <dl className="pp-rows">
                      <dt>Idade</dt>
                      <dd>
                        {age} {age === 1 ? 'dia' : 'dias'}
                      </dd>
                      <dt>Humano</dt>
                      <dd>{s.profile.name || 'Você'}</dd>
                      <dt>Viagens</dt>
                      <dd>
                        {trips} {trips === 1 ? 'aventura' : 'aventuras'}
                      </dd>
                    </dl>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="pp-trait">
              <Glyph e={trait.emoji} size={46} />
              <b>{trait.label}</b>
              <p>“{trait.hello}”</p>
              <small>O jeitinho muda as falas do {s.pet.name}. Dá para trocar em Ajustes.</small>
            </div>
          )}
        </section>

        <section className="pp-card pp-streak">
          <button className="pp-streak-head" onClick={() => (onClose(), openUi('evolucao'))} aria-label="Ver a evolução">
            <Glyph e="🔥" size={46} />
            <ChevronRight size={22} className="opacity-60" />
          </button>
          <h3>
            {streak.count} {streak.count === 1 ? 'dia seguido' : 'dias seguidos'}
          </h3>
          <p>Cuide de você um pouquinho todo dia para manter a sequência.</p>
          <div className="pp-week">
            {week.map((k, i) => {
              const on = isActive(s.days[k]);
              return (
                <span key={k} className={`${on ? 'is-on' : ''} ${k === today ? 'is-today' : ''}`} aria-label={`${LETTERS[i]}${on ? ': feito' : ''}`}>
                  {LETTERS[i]}
                </span>
              );
            })}
          </div>
        </section>

        <section className="pp-card">
          <div className="pp-row-head">
            <h3>Descobertas</h3>
            <small>
              {finds.length}/{ALL_FINDS.length}
            </small>
          </div>
          <div className="pp-finds">
            {Array.from({ length: Math.max(3, Math.min(6, finds.length)) }, (_, i) => {
              const f = finds[i];
              return (
                <span key={i} className={`pp-find ${f ? '' : 'is-empty'}`} title={f ? `${f.name} (${f.place})` : 'Ainda não descoberto'}>
                  {f ? <Glyph e={f.emoji} size={40} /> : <b>?</b>}
                  {f && <small>{f.name}</small>}
                </span>
              );
            })}
          </div>
          <p className="pp-hint">As viagens e os passeios trazem descobertas novas.</p>
        </section>
      </div>
    </div>,
    document.body,
  );
}

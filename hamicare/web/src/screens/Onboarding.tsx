import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { FURS } from '../data/fur';
import { GOALS, INCENTIVES, LIKES, MOODS, PET_NAME_IDEAS, TRAITS } from '../data/lines';
import { CAT_ORDER, CATEGORIES, libById } from '../data/tasks';
import { JOURNEY_GRAMS, KCAL_PER_KG, REF_KG, checkJourneyGoal, defaultGoalKg, directionOf, isMinor, taskKcal } from '../logic/evolution';
import { completeOnboarding, getState, starterPlan, useApp, type OnboardingAnswers } from '../lib/store';
import type { AgeGroup, Category, GoalId, Incentive, Mood, TraitId } from '../types';
import { fmtNum } from '../lib/util';
import { Paywall } from './Paywall';
import { Glyph } from '../components/art';

type StepId = 'intro' | 'age' | 'goal' | 'body-data' | 'journey' | 'focus' | 'minutes' | 'likes' | 'incentive' | 'feeling' | 'pet' | 'name' | 'you' | 'plan' | 'plus';

export function Onboarding() {
  const s = useApp();
  const migrated = s.from === 'xodo';
  const [a, setA] = useState<OnboardingAnswers>(() => ({
    goal: 'emagrecer', focus: [], minutes: 15, likes: [], incentive: 'carinho', feeling: 3, ageGroup: '18mais', tracking: false,
    weightKg: null, heightCm: null, goalKg: null, fur: getState().pet.fur, trait: 'carinhoso', petName: getState().pet.name, userName: getState().profile.name, body: 'equilibrado',
  }));
  const [ageSet, setAgeSet] = useState(false);
  const [guardianOk, setGuardianOk] = useState(false);
  const [consent, setConsent] = useState(false);
  const [i, setI] = useState(0);
  const up = (patch: Partial<OnboardingAnswers>) => setA((x) => ({ ...x, ...patch }));
  const minor = isMinor(a.ageGroup);
  const dir = directionOf(a.goal, minor);
  const weightJourney = dir !== 'manter';

  const steps: StepId[] = useMemo(() => {
    const list: StepId[] = ['intro', 'age', 'goal'];
    if (weightJourney) list.push('body-data', 'journey');
    list.push('focus', 'minutes', 'likes', 'incentive', 'feeling', 'pet', 'name', 'you', 'plan', 'plus');
    return list;
  }, [weightJourney]);
  const step = steps[Math.min(i, steps.length - 1)];
  const next = () => setI((n) => Math.min(n + 1, steps.length - 1));
  const back = () => setI((n) => Math.max(0, n - 1));
  const petName = a.petName.trim() || 'Hami';
  const grams = JOURNEY_GRAMS[dir].start;
  const kg = a.tracking && consent && a.weightKg ? a.weightKg : null;
  const goalKg = kg ? a.goalKg ?? defaultGoalKg(kg, dir) : null;
  const goalCheck = kg && goalKg ? checkJourneyGoal(kg, goalKg, dir, a.heightCm, minor) : { ok: true as const };
  const goals = (Object.keys(GOALS) as GoalId[]).filter((g) => !minor || !GOALS[g].weight);

  function finish() {
    completeOnboarding({ ...a, goalKg, tracking: a.tracking && consent && !minor });
  }

  const say = (text: ReactNode) => <p className="bubble-pet text-[17px]">{text}</p>;

  return (
    <div className="shell grid content-start gap-4 !pb-10">
      <div className="flex items-center gap-3">
        <button className="icon-btn" onClick={back} disabled={i === 0} aria-label="Voltar" style={{ visibility: i === 0 ? 'hidden' : 'visible' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="bar flex-1" role="progressbar" aria-label="Progresso do começo" aria-valuemin={0} aria-valuemax={steps.length - 1} aria-valuenow={i}>
          <div className="bar-fill bar-accent" style={{ transform: `scaleX(${i / (steps.length - 1)})` }} />
        </div>
        <span className="w-10 text-right text-[13px] font-bold tabular-nums text-muted">
          {i + 1}/{steps.length}
        </span>
      </div>

      <div className="flex justify-center">
        <Hamster fur={a.fur} grams={grams} phase={0} mood={step === 'intro' ? 'dormindo' : step === 'plus' || step === 'plan' ? 'animado' : 'feliz'} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null }} size={step === 'intro' ? 200 : 150} label={petName} />
      </div>

      <div className="grid gap-3" key={step}>
        {step === 'intro' && (
          <>
            {say(migrated ? <>Oi de novo! O {s.pet.name || 'Xodó'} virou um hamster: o <b>Hami</b>. Seus pontos, itens e diário vieram junto. Me responde umas perguntinhas?</> : <>Zzz… Oi! Eu sou o <b>Hami</b>. Eu <b>emagreço ou ganho peso junto com você</b>: cada missão saudável que você faz tira (ou soma) calorias de nós dois.</>)}
            <p className="text-center text-[14px] text-muted">São perguntas rápidas. Dá pra mudar tudo depois.</p>
            <button className="btn btn-primary" onClick={next}>
              {migrated ? 'Vamos lá' : 'Acordar o Hami'}
            </button>
          </>
        )}

        {step === 'age' && (
          <>
            {say('Quantos anos você tem? Isso deixa o app mais seguro pra você.')}
            {([
              ['ate12', 'Até 12 anos'],
              ['13a17', '13 a 17 anos'],
              ['18mais', '18 anos ou mais'],
            ] as [AgeGroup, string][]).map(([g, t]) => (
              <Opt key={g} on={ageSet && a.ageGroup === g} onClick={() => (up({ ageGroup: g, goal: isMinor(g) ? 'ativo' : 'emagrecer' }), setAgeSet(true), setGuardianOk(false))} emoji={g === '18mais' ? '🧑' : g === '13a17' ? '🧒' : '👶'} title={t} />
            ))}
            {ageSet && a.ageGroup === 'ate12' && (
              <label className="flex items-start gap-3 rounded-2xl bg-gold-soft p-4 text-[15px]" htmlFor="guardian">
                <input id="guardian" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={guardianOk} onChange={(e) => setGuardianOk(e.target.checked)} />
                <span>Sou o adulto responsável, li como o app funciona e autorizo o uso. (Para menores de 13, amigos e feed ficam desligados.)</span>
              </label>
            )}
            {ageSet && minor && <p className="text-[14px] text-muted">Para quem tem menos de 18, o Hami não muda de peso e não tem contagem de calorias: a jornada é de hábitos e movimento.</p>}
            <button className="btn btn-primary" onClick={next} disabled={!ageSet || (a.ageGroup === 'ate12' && !guardianOk)}>
              Continuar
            </button>
          </>
        )}

        {step === 'goal' && (
          <>
            {say(minor ? 'Qual é a sua missão comigo?' : <>Qual é a sua missão comigo? <b>Eu mudo de peso junto com você.</b></>)}
            {goals.map((g) => (
              <Opt key={g} on={a.goal === g} onClick={() => (up({ goal: g, goalKg: null }), next())} emoji={GOALS[g].emoji} title={GOALS[g].label} sub={GOALS[g].desc} big={GOALS[g].weight} />
            ))}
          </>
        )}

        {step === 'body-data' && (
          <>
            {say(<>Pra eu {dir === 'perder' ? 'emagrecer' : 'ganhar peso'} <b>na medida certa</b> com você, me conta seu peso e sua meta? Fica só com você.</>)}
            <Opt on={a.tracking} onClick={() => up({ tracking: true })} emoji="⚖️" title="Informar meu peso e minha meta" sub="As calorias ficam sob medida pra você" />
            {a.tracking && (
              <div className="card grid gap-3 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1" htmlFor="ob-kg">
                    <span className="text-[13px] font-extrabold">Peso hoje (kg)</span>
                    <input id="ob-kg" className="field" inputMode="decimal" placeholder="Ex.: 82" onChange={(e) => up({ weightKg: Number(e.target.value.replace(',', '.')) || null })} />
                  </label>
                  <label className="grid gap-1" htmlFor="ob-goal">
                    <span className="text-[13px] font-extrabold">Meta (kg)</span>
                    <input id="ob-goal" className="field" inputMode="decimal" placeholder={a.weightKg ? fmtNum(defaultGoalKg(a.weightKg, dir)) : 'Ex.: 78'} onChange={(e) => up({ goalKg: Number(e.target.value.replace(',', '.')) || null })} />
                  </label>
                  <label className="col-span-2 grid gap-1" htmlFor="ob-cm">
                    <span className="text-[13px] font-extrabold">Altura (cm), opcional</span>
                    <input id="ob-cm" className="field" inputMode="numeric" placeholder="Ex.: 168" onChange={(e) => up({ heightCm: Number(e.target.value) || null })} />
                  </label>
                </div>
                {!a.goalKg && a.weightKg && <p className="text-[13px] text-muted">Sem meta? Eu sugiro {fmtNum(defaultGoalKg(a.weightKg, dir))} kg (5% do seu peso), um primeiro passo que já faz diferença.</p>}
                {!goalCheck.ok && <p className="rounded-2xl bg-gold-soft p-3 text-[14px] font-bold">{goalCheck.reason}</p>}
                <label className="flex items-start gap-3 text-[14px]" htmlFor="ob-consent">
                  <input id="ob-consent" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>Autorizo o HamiCare a guardar esses dados só para mim. Eles nunca aparecem para amigos, e eu posso apagar tudo nos Ajustes.</span>
                </label>
                <button className="btn btn-primary" onClick={next} disabled={!consent || !(a.weightKg && a.weightKg > 25 && a.weightKg < 400) || !goalCheck.ok}>
                  Salvar e continuar
                </button>
              </div>
            )}
            <Opt on={!a.tracking} onClick={() => (up({ tracking: false }), next())} emoji="🙈" title="Prefiro não informar" sub={`Eu uso uma estimativa (${REF_KG} kg e meta de 5%)`} />
          </>
        )}

        {step === 'journey' && (
          <>
            {say(<>Fechado! A gente vai {dir === 'perder' ? 'emagrecer' : 'ganhar peso'} <b>juntos</b>. Olha como vai ser:</>)}
            <div className="card grid gap-3 p-4">
              <div className="flex items-end justify-around">
                <div className="grid justify-items-center">
                  <Hamster fur={a.fur} grams={JOURNEY_GRAMS[dir].start} size={92} idle={false} />
                  <span className="text-[13px] font-extrabold">Hoje · {JOURNEY_GRAMS[dir].start} g</span>
                </div>
                <span className="pb-10 text-[28px]" aria-hidden="true">➜</span>
                <div className="grid justify-items-center">
                  <Hamster fur={a.fur} grams={JOURNEY_GRAMS[dir].goal} mood="animado" size={92} idle={false} />
                  <span className="text-[13px] font-extrabold">Na meta · {JOURNEY_GRAMS[dir].goal} g</span>
                </div>
              </div>
              <p className="text-[15px] leading-snug">
                {dir === 'perder' ? (
                  <>Cada missão de hábito saudável tira calorias de nós dois, do mesmo tanto.</>
                ) : (
                  <>Eu cresço com o que você come acima da sua referência no <b>Cardápio de hoje</b>. As missões são hábitos que ajudam o corpo a ganhar massa.</>
                )}{' '}
                Quando você chegar {goalKg ? <>aos <b>{fmtNum(goalKg)} kg</b></> : 'na sua meta'}, eu chego aos <b>{JOURNEY_GRAMS[dir].goal} g</b>.
              </p>
              <div className="grid gap-1.5">
                {(dir === 'perder' ? ['caminhada', 'passos', 'escada'] : ['forca', 'sono', 'agua']).map((id) => {
                  const t = libById(id)!;
                  return (
                    <p key={id} className="flex items-center gap-2 rounded-2xl bg-surface2 px-3 py-2 text-[14px] font-bold">
                      <Glyph e={t.emoji} size={28} />
                      <span className="min-w-0 flex-1">{t.title}</span>
                      {dir === 'perder' ? (
                        <span className="kcal-chip">−{taskKcal(t, dir, kg ?? REF_KG)} kcal</span>
                      ) : (
                        <span className="kcal-chip kcal-gain">hábito</span>
                      )}
                    </p>
                  );
                })}
              </div>
              <p className="text-[12px] text-muted">A comida fica no Cardápio de hoje, no Início. São estimativas ({fmtNum(KCAL_PER_KG)} kcal ≈ 1 kg). Até {dir === 'perder' ? 800 : 700} kcal contam por dia: exagerar não acelera, e descanso não tira nada.</p>
            </div>
            <button className="btn btn-primary" onClick={next}>
              Bora juntos!
            </button>
          </>
        )}

        {step === 'focus' && (
          <>
            {say('Em que você quer mais ajuda? Pode escolher mais de um.')}
            {CAT_ORDER.map((c: Category) => (
              <Opt key={c} on={a.focus.includes(c)} onClick={() => up({ focus: a.focus.includes(c) ? a.focus.filter((x) => x !== c) : [...a.focus, c] })} emoji={CATEGORIES[c].emoji} title={CATEGORIES[c].label} sub={CATEGORIES[c].desc} />
            ))}
            <button className="btn btn-primary" onClick={next} disabled={!a.focus.length}>
              Continuar
            </button>
          </>
        )}

        {step === 'minutes' && (
          <>
            {say('Quanto tempo por dia você tem pra cuidar de você?')}
            {[
              [5, '5 minutinhos', 'O básico já conta muito'],
              [15, '15 minutos', 'Dá pra fazer bastante coisa'],
              [30, '30 minutos', 'Um bom tempo pra você'],
              [60, '1 hora ou mais', 'Bora com tudo, no seu ritmo'],
            ].map(([m, t, sub]) => (
              <Opt key={m as number} on={a.minutes === m} onClick={() => (up({ minutes: m as number }), next())} emoji="⏱️" title={t as string} sub={sub as string} />
            ))}
          </>
        )}

        {step === 'likes' && (
          <>
            {say('Que tipo de movimento você curte? (Se nenhum, tudo bem: pula!)')}
            <div className="grid grid-cols-2 gap-2">
              {LIKES.map((l) => (
                <button key={l.id} className="opt !min-h-[52px] !px-3" aria-pressed={a.likes.includes(l.id)} onClick={() => up({ likes: a.likes.includes(l.id) ? a.likes.filter((x) => x !== l.id) : [...a.likes, l.id] })}>
                  <Glyph e={l.emoji} size={30} /> {l.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={next}>
              {a.likes.length ? 'Continuar' : 'Pular'}
            </button>
          </>
        )}

        {step === 'incentive' && (
          <>
            {say('Que tipo de incentivo funciona melhor pra você?')}
            {(Object.keys(INCENTIVES) as Incentive[]).map((k) => (
              <Opt key={k} on={a.incentive === k} onClick={() => (up({ incentive: k }), next())} emoji={INCENTIVES[k].emoji} title={INCENTIVES[k].label} />
            ))}
          </>
        )}

        {step === 'feeling' && (
          <>
            {say('E agora, como você está se sentindo?')}
            <div className="flex justify-between gap-1">
              {MOODS.map((m) => (
                <button key={m.value} className="mood-opt" aria-pressed={a.feeling === m.value} aria-label={m.label} onClick={() => (up({ feeling: m.value as Mood }), next())}>
                  <Glyph e={m.emoji} size={38} label={m.label} />
                </button>
              ))}
            </div>
            {a.feeling <= 2 && <p className="text-center text-[14px] text-muted">Obrigado por contar. A gente vai devagarinho.</p>}
          </>
        )}

        {step === 'pet' && (
          <>
            {say('Agora me conhece direito! Qual pelagem é a minha?')}
            <div className="grid grid-cols-4 gap-2">
              {FURS.filter((f) => !f.price).map((f) => (
                <button key={f.id} className="color-opt relative !p-1" aria-pressed={a.fur === f.id} aria-label={f.plus ? `${f.label} (Plus)` : f.label} disabled={f.plus} onClick={() => up({ fur: f.id })}>
                  <Hamster fur={f.id} size={58} idle={false} />
                  {f.plus && <Lock size={14} className="absolute right-1.5 top-1.5 text-muted" />}
                </button>
              ))}
            </div>
            <p className="text-center font-display text-[18px] font-semibold">{FURS.find((f) => f.id === a.fur)?.label}</p>
            {say('E qual é o meu jeitinho?')}
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TRAITS) as TraitId[]).map((t) => (
                <button key={t} className="opt !min-h-[52px] !px-3" aria-pressed={a.trait === t} onClick={() => up({ trait: t })}>
                  <Glyph e={TRAITS[t].emoji} size={28} /> {TRAITS[t].label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={next}>
              Sou eu!
            </button>
          </>
        )}

        {step === 'name' && (
          <form className="grid gap-3" onSubmit={(e) => (e.preventDefault(), a.petName.trim() && next())}>
            {say('Que nome você me dá?')}
            <label className="sr-only" htmlFor="ob-pet">
              Nome do hamster
            </label>
            <input id="ob-pet" className="field text-center text-[20px] font-bold" value={a.petName} maxLength={18} autoComplete="off" placeholder="Escreva um nome" onChange={(e) => up({ petName: e.target.value })} />
            <div className="flex flex-wrap justify-center gap-2">
              {PET_NAME_IDEAS.map((n) => (
                <button type="button" key={n} className="chip chip-leaf" onClick={() => up({ petName: n })}>
                  {n}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" type="submit" disabled={!a.petName.trim()}>
              Continuar
            </button>
          </form>
        )}

        {step === 'you' && (
          <form className="grid gap-3" onSubmit={(e) => (e.preventDefault(), a.userName.trim() && next())}>
            {say('E você, como quer que eu te chame?')}
            <label className="sr-only" htmlFor="ob-user">
              Seu nome ou apelido
            </label>
            <input id="ob-user" className="field text-center text-[20px] font-bold" value={a.userName} maxLength={24} autoComplete="given-name" placeholder="Seu nome ou apelido" onChange={(e) => up({ userName: e.target.value })} />
            <button className="btn btn-primary" type="submit" disabled={!a.userName.trim()}>
              Prazer, {petName}!
            </button>
          </form>
        )}

        {step === 'plan' && (
          <>
            {say(<>Prontinho, {a.userName.trim()}! Montei nosso plano inicial. Pequeno de propósito: <b>constância vale mais que intensidade</b>.</>)}
            <div className="card grid gap-2 p-4">
              {(migrated && s.tasks.length ? s.tasks.map((t) => ({ id: t.id, emoji: t.emoji, title: t.title })) : starterPlan(a).map((id) => libById(id)!)).map((t) => (
                <p key={t.id} className="flex items-center gap-3 font-bold">
                  <Glyph e={t.emoji} size={32} /> {t.title}
                </p>
              ))}
            </div>
            <p className="text-[14px] text-muted">Dá pra editar, excluir e criar as suas na aba Atividades.</p>
            <button className="btn btn-primary" onClick={next}>
              Começar a jornada
            </button>
          </>
        )}

        {step === 'plus' && <Paywall fromOnboarding fur={a.fur} name={petName} onClose={finish} />}
      </div>
    </div>
  );
}

function Opt({ on, onClick, emoji, title, sub, big }: { on: boolean; onClick: () => void; emoji: string; title: string; sub?: string; big?: boolean }) {
  return (
    <button className={`opt ${big ? 'opt-big' : ''}`} aria-pressed={on} onClick={onClick}>
      <Glyph e={emoji} size={big ? 44 : 34} />
      <span className="min-w-0">
        <span className="block leading-tight">{title}</span>
        {sub && <span className="block text-[13px] font-semibold text-muted">{sub}</span>}
      </span>
    </button>
  );
}

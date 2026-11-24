import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, Lock, Plus as PlusIcon } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { FURS } from '../data/fur';
import { INCENTIVES, LIKES, MOODS, PET_NAME_IDEAS, TRAITS } from '../data/lines';
import { libById } from '../data/tasks';
import { JOURNEY_GRAMS, KCAL_PER_KG, REF_KG, checkJourneyGoal, defaultGoalKg, directionOf, isMinor, taskKcal } from '../logic/evolution';
import { completeOnboarding, getState, starterPlan, useApp, type OnboardingAnswers } from '../lib/store';
import type { AgeGroup, Category, Incentive, Mood, PetGender, TraitId } from '../types';
import { fmtNum } from '../lib/util';
import { Paywall } from './Paywall';
import { StoryIntro } from '../components/StoryIntro';
import { LIFE_AREAS, LIFE_ORDER } from '../data/tasks';
import { AreaArt } from '../components/Areas';
import { Glyph } from '../components/art';
import { AREA_GOAL, AREAS, areaOf, areasFor } from '../logic/areas';

type StepId = 'intro' | 'gender' | 'j1' | 'j2' | 'j3' | 'age' | 'goal' | 'body-data' | 'journey' | 'focus' | 'minutes' | 'likes' | 'incentive' | 'feeling' | 'pet' | 'name' | 'you' | 'plan' | 'plus';

export function Onboarding() {
  const s = useApp();
  const migrated = s.from === 'xodo';
  const [a, setA] = useState<OnboardingAnswers>(() => ({
    goal: 'habitos', focus: ['autocuidado', 'habitos'], minutes: 15, likes: [], incentive: 'carinho', feeling: 3, ageGroup: '18mais', tracking: false,
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
    // Por enquanto só há a área de hábitos saudáveis: sem a pergunta de objetivo nem jornada de peso.
    // Primeiro o Hami (menino ou menina, nome, jeitinho), depois você, as áreas e a nossa jornada.
    const list: StepId[] = ['intro', 'gender', 'name', 'pet', 'you', 'age'];
    if (weightJourney) list.push('body-data', 'journey');
    list.push('focus', 'minutes', 'feeling', 'j1', 'j2', 'j3', 'plan', 'plus');
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
  const areas = areasFor(a.ageGroup, 'comeco');
  const chosenArea = areaOf(a.goal, minor);

  function finish() {
    completeOnboarding({ ...a, goalKg, tracking: a.tracking && consent && !minor });
  }

  const say = (text: ReactNode) => <h2 className="obx-q">{text}</h2>;
  const section = ['gender', 'name', 'pet'].includes(step) ? 'Sobre mim' : ['j1', 'j2', 'j3', 'plan'].includes(step) ? 'A nossa jornada' : 'Sobre você';
  const showPet = !['plus', 'focus', 'j1', 'j2', 'j3', 'pet'].includes(step);

  // Quem chega pela primeira vez conhece o Hami numa pequena história antes das perguntas.
  if (step === 'intro' && !migrated) return <StoryIntro fur={a.fur} onDone={next} />;

  return (
    <div className="shell obx grid content-start gap-4 !pb-10">
      <div className="obx-top">
        <button className="obx-back" onClick={back} disabled={i <= 1} aria-label="Voltar" style={{ visibility: i <= 1 ? 'hidden' : 'visible' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="obx-bar" role="progressbar" aria-label="Progresso do começo" aria-valuemin={0} aria-valuemax={steps.length - 1} aria-valuenow={i}>
          <span style={{ width: `${(i / (steps.length - 1)) * 100}%` }} />
        </div>
      </div>
      <p className="obx-section">{section}</p>

      {/* Na tela do Plus o Hami aparece lá dentro, de cartola: aqui em cima ficaria repetido. */}
      {showPet && (
        <div className="flex justify-center">
          <Hamster fur={a.fur} grams={grams} phase={0} mood={step === 'plan' ? 'animado' : 'feliz'} outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null }} size={104} label={petName} />
        </div>
      )}

      <div className="grid gap-3" key={step}>
        {step === 'intro' && (
          <>
            {say(migrated ? <>Oi de novo! O {s.pet.name || 'Xodó'} virou um cachorrinho: o <b>Hami</b>. Seus pontos, itens e diário vieram junto. Me responde umas perguntinhas?</> : <>Zzz… Oi! Eu sou o <b>Hami</b>. A gente cuida um do outro: posso <b>emagrecer ou ganhar peso junto com você</b>, te ajudar com <b>hábitos saudáveis</b> ou com a <b>ansiedade</b>. Você escolhe.</>)}
            <p className="text-center text-[14px] text-muted">São perguntas rápidas. Dá pra mudar tudo depois.</p>
            <button className="btn btn-primary" onClick={next}>
              {migrated ? 'Vamos lá' : 'Acordar o Hami'}
            </button>
          </>
        )}

        {step === 'gender' && (
          <>
            {say('Você quer que eu seja um menino ou uma menina?')}
            {(
              [
                ['menino', 'Menino'],
                ['menina', 'Menina'],
                ['outro', 'Tanto faz, do meu jeitinho'],
              ] as [PetGender, string][]
            ).map(([g, t]) => (
              <Opt key={g} on={a.petGender === g} onClick={() => (up({ petGender: g }), setTimeout(next, 220))} emoji="" title={t} />
            ))}
          </>
        )}

        {step === 'j1' && (
          <>
            {say(<>Vou montar com você uma lista de autocuidado de <b>passos pequenos</b></>)}
            <div className="obx-art obx-board">
              <svg viewBox="0 0 300 170" aria-hidden="true">
                <rect x="6" y="6" width="288" height="158" rx="14" fill="#C98A5A" />
                <rect x="16" y="16" width="268" height="138" rx="8" fill="#2F4A3E" />
                {[0, 1, 2].map((k) => (
                  <g key={k} transform={`translate(34 ${38 + k * 38})`}>
                    <rect width="22" height="22" rx="5" fill="none" stroke="#F4F1E8" strokeWidth="3" />
                    {k < 2 && <path d="M5 11 l5 5 l9 -11" stroke="#9FE3B1" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                    <rect x="36" y="7" width={k === 1 ? 120 : 150} height="8" rx="4" fill="#F4F1E8" opacity="0.85" />
                  </g>
                ))}
              </svg>
              <span className="obx-board-pet">
                <Hamster fur={a.fur} size={118} idle={false} growth={1} mood="feliz" outfit={{ chapeu: null, oculos: 'redondos', roupa: null, acessorio: null }} label="" />
              </span>
            </div>
            <p className="obx-note">Hábitos curtinhos, feitos quase todo dia, são mais fáceis de manter do que mudanças grandes de uma vez. A gente vai no seu ritmo.</p>
            <button className="btn btn-primary" onClick={next}>
              Continuar
            </button>
          </>
        )}

        {step === 'j2' && (
          <div className="obx-full" role="group" aria-label="Vamos juntos">
            <h2>Vamos agir juntos e trazer de volta o seu brilho!</h2>
            <span className="obx-full-pet">
              <Hamster fur={a.fur} size={190} growth={1} mood="animado" outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: 'medalha' }} label="" />
            </span>
            <button className="obx-full-btn" onClick={next}>
              Continuar
            </button>
          </div>
        )}

        {step === 'j3' && (
          <>
            {say('Vou te ajudar a ter mais calma, aos pouquinhos')}
            <div className="obx-cmp">
              <div className="obx-cmp-card is-before">
                <svg className="obx-cmp-sky" viewBox="0 0 120 50" aria-hidden="true">
                  <path d="M20 34 Q20 18 38 20 Q44 6 62 12 Q80 6 84 22 Q100 22 98 36Z" fill="#9AA0B4" />
                  {[34, 52, 70, 86].map((x) => (
                    <path key={x} d={`M${x} 40 l-3 8`} stroke="#8EA4D8" strokeWidth="2.4" strokeLinecap="round" />
                  ))}
                </svg>
                <Hamster fur={a.fur} size={104} idle={false} growth={1} mood="calmo" outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null }} label="" />
              </div>
              <div className="obx-cmp-card is-after">
                <svg className="obx-cmp-sky" viewBox="0 0 120 50" aria-hidden="true">
                  <circle cx="92" cy="22" r="13" fill="#FFD25A" />
                  <path d="M10 40 Q30 30 50 40" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
                </svg>
                <Hamster fur={a.fur} size={104} idle={false} growth={1} mood="animado" outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null }} label="" />
              </div>
            </div>
            <p className="obx-note">Deixar para trás o estresse e a correria do dia, com respirações, pausas e um amigo do lado.</p>
            <button className="btn btn-primary" onClick={next}>
              Sim, posso
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
              <Opt key={g} on={ageSet && a.ageGroup === g} onClick={() => (up({ ageGroup: g, goal: 'habitos' }), setAgeSet(true), setGuardianOk(false))} emoji={g === '18mais' ? '🧑' : g === '13a17' ? '🧒' : '👶'} title={t} />
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
            {say(<>Em que área você quer que eu te ajude? <b>Dá pra trocar depois</b>, quando quiser.</>)}
            {areas.map((ar) => (
              <Opt
                key={ar}
                on={chosenArea === ar}
                onClick={() => (up({ goal: AREA_GOAL[ar], goalKg: null, focus: ar === 'calma' ? ['emocional'] : ar === 'habitos' ? ['autocuidado', 'habitos'] : a.focus }), next())}
                emoji={AREAS[ar].emoji}
                title={AREAS[ar].label}
                sub={AREAS[ar].desc}
                big
              />
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
            <h2 className="ob-areas-title">
              Em quais <span>áreas</span> você quer começar?
            </h2>
            <p className="text-center text-[14px] text-muted">Escolha uma ou mais. Cada área traz missões prontas, e você muda quando quiser.</p>
            <div className="ob-areas">
              {LIFE_ORDER.map((ar) => {
                const on = (a.lifeAreas ?? []).includes(ar);
                const L = LIFE_AREAS[ar];
                return (
                  <button
                    key={ar}
                    className={`ob-area ob-area-img ${on ? 'is-on' : ''}`}
                    aria-label={L.label}
                    style={{ ['--tone' as string]: L.tone }}
                    aria-pressed={on}
                    onClick={() => {
                      const cur = a.lifeAreas ?? [];
                      const list = on ? cur.filter((x) => x !== ar) : [...cur, ar];
                      up({ lifeAreas: list, focus: [...new Set(list.flatMap((x) => LIFE_AREAS[x].focus))] as Category[] });
                    }}
                  >
                    <AreaArt area={ar} />
                    <span className="ob-area-check" aria-hidden="true">
                      {on ? <Check size={16} strokeWidth={3.5} /> : <PlusIcon size={16} strokeWidth={3.5} />}
                    </span>
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary" onClick={next} disabled={!(a.lifeAreas ?? []).length}>
              Continuar
            </button>
            <button className="btn btn-ghost" onClick={() => (up({ lifeAreas: ['saude'], focus: ['fitness', 'habitos'] }), next())}>
              Escolher depois
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
            {say('Qual é a cor do meu pelinho?')}
            <div className="flex justify-center">
              <Hamster fur={a.fur} size={120} growth={1} mood="feliz" outfit={{ chapeu: null, oculos: null, roupa: null, acessorio: null }} label="" />
            </div>
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
            {say('Me ajuda a escolher um nome que você goste?')}
            <label className="sr-only" htmlFor="ob-pet">
              Nome do hamster
            </label>
            <input id="ob-pet" className="field text-center text-[20px] font-bold" value={a.petName} maxLength={18} autoComplete="off" placeholder="Escreva um nome" onChange={(e) => up({ petName: e.target.value })} />
            <p className="obx-hint">Você pode mudar quando quiser.</p>
            <div className="obx-two">
              <button type="button" className="obx-pick" onClick={() => up({ petName: PET_NAME_IDEAS.filter((n) => n !== a.petName)[Math.floor(Math.random() * (PET_NAME_IDEAS.length - 1))] })}>
                Escolha por mim
              </button>
              <button className="btn btn-primary" type="submit" disabled={!a.petName.trim()}>
                Bora!
              </button>
            </div>
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
      {emoji && <Glyph e={emoji} size={big ? 44 : 34} />}
      <span className="min-w-0">
        <span className="block leading-tight">{title}</span>
        {sub && <span className="block text-[13px] font-semibold text-muted">{sub}</span>}
      </span>
    </button>
  );
}

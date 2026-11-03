import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { FURS } from '../data/fur';
import { GOALS, INCENTIVES, LIKES, MOODS, PET_NAME_IDEAS, TRAITS } from '../data/lines';
import { CAT_ORDER, CATEGORIES, libById } from '../data/tasks';
import { START_GRAMS, isMinor } from '../logic/evolution';
import { completeOnboarding, getState, starterPlan, useApp, type OnboardingAnswers } from '../lib/store';
import type { AgeGroup, BodyStart, Category, GoalId, Incentive, Mood, TraitId } from '../types';
import { Paywall } from './Paywall';

type StepId = 'intro' | 'goal' | 'focus' | 'minutes' | 'likes' | 'incentive' | 'feeling' | 'age' | 'body-data' | 'pet' | 'name' | 'look' | 'you' | 'plan' | 'plus';

export function Onboarding() {
  const s = useApp();
  const migrated = s.from === 'xodo';
  const [a, setA] = useState<OnboardingAnswers>(() => ({
    goal: 'habitos', focus: [], minutes: 15, likes: [], incentive: 'carinho', feeling: 3, ageGroup: '18mais', tracking: false,
    weightKg: null, heightCm: null, fur: getState().pet.fur, trait: 'carinhoso', petName: getState().pet.name, userName: getState().profile.name, body: 'equilibrado',
  }));
  const [ageSet, setAgeSet] = useState(false);
  const [guardianOk, setGuardianOk] = useState(false);
  const [consent, setConsent] = useState(false);
  const [i, setI] = useState(0);
  const up = (patch: Partial<OnboardingAnswers>) => setA((x) => ({ ...x, ...patch }));
  const minor = isMinor(a.ageGroup);

  const steps: StepId[] = useMemo(() => {
    const list: StepId[] = ['intro', 'goal', 'focus', 'minutes', 'likes', 'incentive', 'feeling', 'age'];
    if (!minor) list.push('body-data');
    list.push('pet', 'name');
    if (!minor) list.push('look');
    list.push('you', 'plan', 'plus');
    return list;
  }, [minor]);
  const step = steps[Math.min(i, steps.length - 1)];
  const next = () => setI((n) => Math.min(n + 1, steps.length - 1));
  const back = () => setI((n) => Math.max(0, n - 1));
  const petName = a.petName.trim() || 'Hami';
  const grams = minor ? START_GRAMS.equilibrado : START_GRAMS[a.body];

  function finish() {
    completeOnboarding({ ...a, tracking: a.tracking && consent && !minor });
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
            {say(migrated ? <>Oi de novo! O {s.pet.name || 'Xodó'} virou um hamster: o <b>Hami</b>. Seus pontos, itens e diário vieram junto. Me responde umas perguntinhas?</> : <>Zzz… Oi! Eu sou o <b>Hami</b>. Eu evoluo junto com você: cada cuidado seu me deixa mais forte, mais feliz e mais estiloso.</>)}
            <p className="text-center text-[14px] text-muted">São perguntas rápidas. Dá pra mudar tudo depois.</p>
            <button className="btn btn-primary" onClick={next}>
              {migrated ? 'Vamos lá' : 'Acordar o Hami'}
            </button>
          </>
        )}

        {step === 'goal' && (
          <>
            {say('Qual é o seu principal objetivo comigo?')}
            {(Object.keys(GOALS) as GoalId[]).map((g) => (
              <Opt key={g} on={a.goal === g} onClick={() => (up({ goal: g }), next())} emoji={GOALS[g].emoji} title={GOALS[g].label} sub={GOALS[g].desc} />
            ))}
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
                  <span className="text-[22px]">{l.emoji}</span> {l.label}
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
                  <span className="text-[30px] leading-none">{m.emoji}</span>
                </button>
              ))}
            </div>
            {a.feeling <= 2 && <p className="text-center text-[14px] text-muted">Obrigado por contar. A gente vai devagarinho.</p>}
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
              <Opt key={g} on={ageSet && a.ageGroup === g} onClick={() => (up({ ageGroup: g }), setAgeSet(true), setGuardianOk(false))} emoji={g === '18mais' ? '🧑' : g === '13a17' ? '🧒' : '👶'} title={t} />
            ))}
            {ageSet && a.ageGroup === 'ate12' && (
              <label className="flex items-start gap-3 rounded-2xl bg-gold-soft p-4 text-[15px]" htmlFor="guardian">
                <input id="guardian" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={guardianOk} onChange={(e) => setGuardianOk(e.target.checked)} />
                <span>Sou o adulto responsável, li como o app funciona e autorizo o uso. (Para menores de 13, amigos e feed ficam desligados.)</span>
              </label>
            )}
            {ageSet && minor && <p className="text-[14px] text-muted">Para quem tem menos de 18, o HamiCare foca em hábitos e movimento, sem números de peso.</p>}
            <button className="btn btn-primary" onClick={next} disabled={!ageSet || (a.ageGroup === 'ate12' && !guardianOk)}>
              Continuar
            </button>
          </>
        )}

        {step === 'body-data' && (
          <>
            {say('Quer registrar seu peso pra gente evoluir junto? É opcional, fica só com você e dá pra apagar quando quiser.')}
            <Opt on={!a.tracking} onClick={() => (up({ tracking: false }), next())} emoji="🙅" title="Agora não" sub="O Hami evolui pelos seus hábitos e movimento" />
            <Opt on={a.tracking} onClick={() => up({ tracking: true })} emoji="📈" title="Quero registrar" sub="Peso e altura, privados" />
            {a.tracking && (
              <div className="card grid gap-3 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1" htmlFor="ob-kg">
                    <span className="text-[13px] font-extrabold">Peso (kg)</span>
                    <input id="ob-kg" className="field" inputMode="decimal" placeholder="Ex.: 72,5" onChange={(e) => up({ weightKg: Number(e.target.value.replace(',', '.')) || null })} />
                  </label>
                  <label className="grid gap-1" htmlFor="ob-cm">
                    <span className="text-[13px] font-extrabold">Altura (cm), opcional</span>
                    <input id="ob-cm" className="field" inputMode="numeric" placeholder="Ex.: 168" onChange={(e) => up({ heightCm: Number(e.target.value) || null })} />
                  </label>
                </div>
                <label className="flex items-start gap-3 text-[14px]" htmlFor="ob-consent">
                  <input id="ob-consent" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>Autorizo o HamiCare a guardar esses dados só para mim. Eles nunca aparecem para amigos, e eu posso apagar tudo nos Ajustes.</span>
                </label>
                <button className="btn btn-primary" onClick={next} disabled={!consent || !(a.weightKg && a.weightKg > 25 && a.weightKg < 400)}>
                  Salvar e continuar
                </button>
              </div>
            )}
          </>
        )}

        {step === 'pet' && (
          <>
            {say('Agora me conhece direito! Qual pelagem é a minha?')}
            <div className="grid grid-cols-4 gap-2">
              {FURS.map((f) => (
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
                  <span className="text-[20px]">{TRAITS[t].emoji}</span> {TRAITS[t].label}
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

        {step === 'look' && (
          <>
            {say(<>Como eu começo a jornada? Eu tenho um <b>peso virtual</b> em gramas de hamster e vou mudando devagarinho, junto com você.</>)}
            <div className="grid grid-cols-3 gap-2">
              {(['mignon', 'equilibrado', 'fofinho'] as BodyStart[]).map((b) => (
                <button key={b} className="color-opt grid !gap-1 !p-2" aria-pressed={a.body === b} onClick={() => up({ body: b })}>
                  <Hamster fur={a.fur} grams={START_GRAMS[b]} size={84} idle={false} />
                  <span className="text-[13px] font-extrabold capitalize">{b}</span>
                  <span className="text-[12px] tabular-nums text-muted">{START_GRAMS[b]} g</span>
                </button>
              ))}
            </div>
            <p className="text-[14px] text-muted">A faixa saudável do Hami é de 120 a 150 g. Ele chega lá aos poucos, só com semanas ativas. Exercício nunca muda o peso de uma vez.</p>
            <button className="btn btn-primary" onClick={next}>
              Continuar
            </button>
          </>
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
                  <span className="text-[22px]">{t.emoji}</span> {t.title}
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

function Opt({ on, onClick, emoji, title, sub }: { on: boolean; onClick: () => void; emoji: string; title: string; sub?: string }) {
  return (
    <button className="opt" aria-pressed={on} onClick={onClick}>
      <span className="text-[24px] leading-none">{emoji}</span>
      <span className="min-w-0">
        <span className="block leading-tight">{title}</span>
        {sub && <span className="block text-[13px] font-semibold text-muted">{sub}</span>}
      </span>
    </button>
  );
}

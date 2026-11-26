// Crescer: a missão do dia (com contagem até a meia-noite), atalhos "Para você", rotinas prontas por tema,
// o planejador de missões (nome, área e até 50 tarefas) e testes rápidos para se conhecer (não são diagnóstico).
import { LivePet } from '../components/LivePet';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, Heart, Lock, Phone, Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { Glyph } from '../components/art';
import { RoutineArt, TestArt } from '../components/RoutineArt';
import { Hamster } from '../components/Hamster';
import { PlusCard } from '../components/PlusCard';
import { toast } from '../components/ui';
import type { TabId } from '../components/TabIcon';
import { ROUTINE_CATS, routineById, routinesFor, type Routine, type RoutineCat } from '../data/routines';
import { ANSWERS, SELF_TESTS, isHeavy, testResult, type SelfTest } from '../data/selftests';
import { LIFE_AREAS, LIFE_ORDER, libById, type LifeArea } from '../data/tasks';
import { activeQuests, claimKey, questProgress, questReward, type QuestDef } from '../logic/progress';
import { addRoutine, claimQuest, createPlan, dayOf, isPremium, PLAN_MAX, removePlan, todayKey, useApp } from '../lib/store';
import { openUi } from '../lib/bus';
import { play } from '../lib/sound';
import { untilMidnight } from '../lib/util';
import { requestTool } from './Wellbeing';
import type { State } from '../types';

type Go = (tab: TabId) => void;

// ---------- guardados no aparelho (favoritas e resultados dos testes) ----------

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado: só não guarda */
  }
}
const FAV_KEY = 'hc-rotinas-favoritas';
const TEST_KEY = 'hc-testes';

function useFavorites() {
  const [fav, setFav] = useState<string[]>(() => readLocal<string[]>(FAV_KEY, []));
  const toggle = (id: string) =>
    setFav((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      writeLocal(FAV_KEY, next);
      return next;
    });
  return { fav, toggle };
}

const isKid = (s: State) => s.profile.ageGroup === 'ate12';
const visibleRoutines = (s: State) => routinesFor(s.profile.ageGroup);

// ---------- Missão do dia ----------

const QUEST_LOOK: Record<string, { emoji: string; go: (go: Go) => void }> = {
  tarefas3: { emoji: '🏁', go: (go) => go('inicio') },
  mover1: { emoji: '🏃', go: (go) => go('inicio') },
  cuidar2: { emoji: '🐶', go: () => openUi('interacoes') },
  humor: { emoji: '🫶', go: (go) => (requestTool('humor'), go('bem-estar')) },
  pote: { emoji: '🫙', go: (go) => (requestTool('pote'), go('bem-estar')) },
  vibe: { emoji: '💛', go: (go) => go('amigos') },
  respirar: { emoji: '🌬️', go: (go) => (requestTool('respirar'), go('bem-estar')) },
};

function DailyMission({ onGo }: { onGo: Go }) {
  const s = useApp();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const today = todayKey();
  const quests = activeQuests(s.seed, today).filter((q) => q.period === 'dia');
  const claim = (q: QuestDef) => {
    if (claimQuest(q.id)) {
      play('semente');
      const r = questReward(q);
      toast(`+${r.coins} sementes e +${r.xp} XP!`);
    }
  };
  return (
    <section className="gw-mission" aria-label="Missão do dia">
      <div className="gw-mission-head">
        <h2>Missão do dia</h2>
        <span className="gw-timer tabular-nums">{untilMidnight(now)}</span>
      </div>
      <ul className="gw-mission-list">
        {quests.map((q) => {
          const p = questProgress(q, s.days, today);
          const claimed = !!s.claimed[claimKey(q, today)];
          const look = QUEST_LOOK[q.id] ?? { emoji: '⭐', go: (g: Go) => g('atividades') };
          return (
            <li key={q.id} className={claimed ? 'is-done' : ''}>
              <span className="gw-mission-ico">
                <Glyph e={look.emoji} size={28} />
              </span>
              <span className="min-w-0 flex-1">
                <b>{q.title}</b>
                <small>
                  {p}/{q.target}
                </small>
              </span>
              {claimed ? (
                <span className="gw-mission-ok" aria-label="Feito">
                  <Check size={18} strokeWidth={3.5} />
                </span>
              ) : p >= q.target ? (
                <button className="gw-claim" onClick={() => claim(q)}>
                  Pegar
                </button>
              ) : (
                <button className="gw-mission-go" onClick={() => look.go(onGo)} aria-label={`Ir: ${q.title}`}>
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <button className="gw-mission-all" onClick={() => onGo('atividades')}>
        Ver missões da semana e do mês <ChevronRight size={16} />
      </button>
    </section>
  );
}

// ---------- Rotinas ----------

/** Cartão em forma de ticket: ilustração em cima, picote tracejado com recortes nas laterais e o nome embaixo. */
function RoutineCard({ r, fav, onOpen }: { r: Routine; fav?: boolean; onOpen: (r: Routine) => void }) {
  const s = useApp();
  const locked = r.plus && !isPremium(s);
  return (
    <button className="gw-rc" onClick={() => onOpen(r)} aria-label={r.title}>
      <span className="gw-rc-img" style={{ background: r.tone }}>
        <RoutineArt r={r} glyph={56} />
        {locked && (
          <span className="gw-rc-lock" aria-label="Lumbi+">
            <Lock size={12} strokeWidth={3} />
          </span>
        )}
        {fav && (
          <span className="gw-rc-fav" aria-label="Favorita">
            <Heart size={12} fill="#FF5C8A" color="#FF5C8A" />
          </span>
        )}
      </span>
      <span className="gw-rc-cut" aria-hidden="true" />
      <span className="gw-rc-txt">{r.title}</span>
    </button>
  );
}

function RoutineSheet({ r, fav, onFav, onClose, onPlus }: { r: Routine | null; fav: boolean; onFav: () => void; onClose: () => void; onPlus: () => void }) {
  const s = useApp();
  if (!r) return null;
  const have = new Set(s.tasks.map((t) => t.id));
  const tasks = r.tasks.map((id) => libById(id)).filter((t): t is NonNullable<ReturnType<typeof libById>> => !!t);
  const locked = r.plus && !isPremium(s);
  const missing = tasks.filter((t) => !have.has(t.id)).length;
  const add = () => {
    if (locked) return onPlus();
    const n = addRoutine(r.tasks);
    play('tarefa');
    toast(n ? `${n} ${n === 1 ? 'tarefa nova' : 'tarefas novas'} na sua lista!` : 'Você já tem todas essas tarefas.');
    onClose();
  };
  return createPortal(
    <div className="gw-sheet" role="dialog" aria-modal="true" aria-label={r.title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gw-sheet-panel">
        <div className="gw-sheet-top" style={{ background: r.tone }}>
          <span className="gw-sheet-pic">
            <RoutineArt r={r} glyph={96} />
          </span>
          <button className="gw-round" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
          <button className="gw-round" onClick={onFav} aria-pressed={fav} aria-label={fav ? 'Tirar das favoritas' : 'Favoritar'}>
            <Heart size={20} fill={fav ? '#FF5C8A' : 'none'} color={fav ? '#FF5C8A' : 'currentColor'} />
          </button>
        </div>
        <div className="gw-sheet-body">
          <p className="gw-sheet-cat">{ROUTINE_CATS.find((c) => c.id === r.cat)?.label}</p>
          <h2>{r.title}</h2>
          <p className="gw-sheet-desc">{r.desc}</p>
          {r.help && (
            <p className="gw-help">
              <Phone size={14} /> Se estiver muito difícil, fale com alguém de confiança. O CVV atende de graça, 24 horas, no <a href="tel:188">188</a>.
            </p>
          )}
          <ul className="gw-sheet-tasks">
            {tasks.map((t) => (
              <li key={t.id}>
                <Glyph e={t.emoji} size={28} />
                <span className="flex-1">{t.title}</span>
                {have.has(t.id) && <Check size={18} strokeWidth={3} className="text-leaf" aria-label="Já está na sua lista" />}
              </li>
            ))}
          </ul>
          <button className="gw-cta" onClick={add} disabled={!locked && !missing}>
            {locked ? (
              <>
                <Sparkles size={18} /> Liberar no Lumbi+
              </>
            ) : missing ? (
              `Adicionar ${missing} ${missing === 1 ? 'tarefa' : 'tarefas'}`
            ) : (
              'Já está tudo na sua lista'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RoutinesPage({ open, start, onClose, onOpen, fav }: { open: boolean; start: 'todas' | 'favoritas' | RoutineCat; onClose: () => void; onOpen: (r: Routine) => void; fav: string[] }) {
  const s = useApp();
  const [filter, setFilter] = useState<'todas' | 'favoritas' | RoutineCat>(start);
  useEffect(() => setFilter(start), [start, open]);
  if (!open) return null;
  const all = visibleRoutines(s);
  const list = filter === 'todas' ? all : filter === 'favoritas' ? all.filter((r) => fav.includes(r.id)) : all.filter((r) => r.cat === filter);
  const chips: [typeof filter, string][] = [['todas', 'Todas'], ['favoritas', 'Favoritas'], ...ROUTINE_CATS.map((c) => [c.id, c.label] as [RoutineCat, string])];
  return createPortal(
    <div className="gw-page" role="dialog" aria-modal="true" aria-label="Rotinas">
      <header className="gw-page-head">
        <button className="gw-round" onClick={onClose} aria-label="Voltar">
          <ChevronLeft size={22} />
        </button>
        <h2>Rotinas</h2>
        <span className="w-10" />
      </header>
      <div className="gw-chips" role="tablist" aria-label="Filtrar rotinas">
        {chips.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'is-on' : ''} onClick={() => setFilter(id)}>
            {id === 'favoritas' && <Heart size={13} />} {label}
          </button>
        ))}
      </div>
      <div className="gw-rc-grid">
        {list.map((r) => (
          <RoutineCard key={r.id} r={r} fav={fav.includes(r.id)} onOpen={onOpen} />
        ))}
      </div>
      {!list.length && <p className="gw-empty">{filter === 'favoritas' ? 'Toque no coração de uma rotina para guardar aqui.' : 'Nenhuma rotina por aqui ainda.'}</p>}
    </div>,
    document.body,
  );
}

// ---------- Planejar uma missão ----------

type Entry = { key: string; lib?: string; title: string; emoji: string };

function Planner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [name, setName] = useState('');
  const [area, setArea] = useState<LifeArea>('calma');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (open) {
      setName('');
      setEntries([]);
      setDraft('');
    }
  }, [open]);
  if (!open) return null;
  const inList = new Set(entries.map((e) => e.lib).filter(Boolean));
  const ideas = LIFE_AREAS[area].tasks.map((id) => libById(id)).filter((t): t is NonNullable<ReturnType<typeof libById>> => !!t && !inList.has(t.id));
  const full = entries.length >= PLAN_MAX;
  const push = (e: Omit<Entry, 'key'>) => !full && setEntries((l) => [...l, { ...e, key: `${Date.now()}-${l.length}` }]);
  const addDraft = () => {
    const t = draft.trim();
    if (!t) return;
    push({ title: t.slice(0, 60), emoji: '⭐' });
    setDraft('');
  };
  const hamiPlan = () => {
    // O Lumbi escolhe até 5 tarefas da área (as que ainda não estão no plano) e sugere um nome.
    const pick = ideas.slice(0, Math.max(0, Math.min(5, PLAN_MAX - entries.length)));
    if (!pick.length) return toast('O plano já tem todas as ideias desta área.');
    setEntries((l) => [...l, ...pick.map((t, i) => ({ key: `${Date.now()}-${i}`, lib: t.id, title: t.title, emoji: t.emoji }))]);
    if (!name.trim()) setName(`Missão ${LIFE_AREAS[area].label}`);
    play('magia');
  };
  const create = () => {
    const plan = createPlan(
      name,
      area,
      entries.map((e) => (e.lib ? { lib: e.lib } : { title: e.title, emoji: e.emoji })),
    );
    if (!plan) return toast('Dê um nome e coloque pelo menos uma tarefa.');
    play('conquista');
    toast(`Missão "${plan.name}" criada! As tarefas já estão na sua lista.`);
    onClose();
  };
  return createPortal(
    <div className="gw-page" role="dialog" aria-modal="true" aria-label="Planejar uma missão">
      <header className="gw-page-head">
        <button className="gw-round" onClick={onClose} aria-label="Voltar">
          <ChevronLeft size={22} />
        </button>
        <h2>Planejar uma missão</h2>
        <span className="w-10" />
      </header>
      <div className="gw-plan">
        <input className="gw-plan-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dê um nome para a missão" maxLength={40} aria-label="Nome da missão" />
        <p className="gw-label">Área da vida</p>
        <div className="gw-chips is-wrap" role="tablist" aria-label="Área da vida">
          {LIFE_ORDER.map((a) => (
            <button key={a} role="tab" aria-selected={area === a} className={area === a ? 'is-on' : ''} onClick={() => setArea(a)}>
              {LIFE_AREAS[a].label}
            </button>
          ))}
        </div>
        <div className="gw-plan-tasks">
          <div className="gw-plan-tasks-head">
            <b>Tarefas</b>
            <span className="tabular-nums">
              {entries.length}/{PLAN_MAX}
            </span>
          </div>
          <button className="gw-hami-plan" onClick={hamiPlan}>
            <span className="icon-still">
              <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={44} idle={false} label={s.pet.name} />
            </span>
            <span className="flex-1 text-left">Deixa o {s.pet.name} planejar para você</span>
            <Wand2 size={18} />
          </button>
          {entries.map((e) => (
            <div key={e.key} className="gw-plan-row">
              <Glyph e={e.emoji} size={26} />
              <span className="flex-1">{e.title}</span>
              <button className="gw-x" onClick={() => setEntries((l) => l.filter((x) => x.key !== e.key))} aria-label={`Tirar ${e.title}`}>
                <X size={16} />
              </button>
            </div>
          ))}
          <form
            className="gw-plan-add"
            onSubmit={(e) => {
              e.preventDefault();
              addDraft();
            }}
          >
            <Plus size={18} />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={full ? 'O plano está cheio' : 'Escrever uma tarefa nova'} maxLength={60} disabled={full} aria-label="Tarefa nova" />
            {draft.trim() && <button type="submit">Pôr</button>}
          </form>
        </div>
        {ideas.length > 0 && (
          <>
            <p className="gw-label">Sugestões de {LIFE_AREAS[area].label}</p>
            <div className="gw-chips is-wrap">
              {ideas.map((t) => (
                <button key={t.id} onClick={() => push({ lib: t.id, title: t.title, emoji: t.emoji })} disabled={full}>
                  <Plus size={13} /> {t.title}
                </button>
              ))}
            </div>
          </>
        )}
        <button className="gw-cta" onClick={create} disabled={!name.trim() || !entries.length}>
          Criar missão
        </button>
      </div>
    </div>,
    document.body,
  );
}

function Plans() {
  const s = useApp();
  const plans = s.plans ?? [];
  if (!plans.length) return null;
  const d = dayOf(s);
  return (
    <section className="grid gap-2" aria-label="Suas missões">
      <h2 className="gw-h">Suas missões</h2>
      {plans.map((p) => {
        const tasks = p.tasks.filter((id) => s.tasks.some((t) => t.id === id));
        const done = tasks.filter((id) => id in d.done).length;
        const area = LIFE_AREAS[p.area as LifeArea];
        return (
          <article key={p.id} className="gw-planc" style={{ ['--tone' as string]: area?.tone ?? '#FFE59A' }}>
            <span className="gw-planc-ico">
              <Glyph e={area?.prop ?? '⭐'} size={30} />
            </span>
            <span className="min-w-0 flex-1">
              <b>{p.name}</b>
              <span className="gw-planc-bar">
                <i style={{ width: `${tasks.length ? Math.max(6, (done / tasks.length) * 100) : 6}%` }} />
              </span>
              <small>
                Hoje: {done}/{tasks.length} {done === tasks.length && tasks.length > 0 ? '· completa! 🎉' : ''}
              </small>
            </span>
            <button className="gw-x" onClick={() => (removePlan(p.id), toast('Missão apagada (as tarefas continuam na lista).'))} aria-label={`Apagar a missão ${p.name}`}>
              <Trash2 size={16} />
            </button>
          </article>
        );
      })}
    </section>
  );
}

// ---------- Testes ----------

type Results = Record<string, { score: number; at: string }>;

function TestsPage({ open, onClose, onRoutine }: { open: boolean; onClose: () => void; onRoutine: (r: Routine) => void }) {
  const s = useApp();
  const [results, setResults] = useState<Results>(() => readLocal<Results>(TEST_KEY, {}));
  const [pick, setPick] = useState<SelfTest | null>(null);
  const [step, setStep] = useState<'sobre' | number | 'fim'>('sobre');
  const [answers, setAnswers] = useState<number[]>([]);
  useEffect(() => {
    if (!open) setPick(null);
  }, [open]);
  if (!open) return null;
  const list = SELF_TESTS.filter((t) => !t.teen || !isKid(s));
  const begin = (t: SelfTest) => (setPick(t), setStep('sobre'), setAnswers([]));
  const answer = (v: number) => {
    if (!pick || typeof step !== 'number') return;
    const next = [...answers, v];
    setAnswers(next);
    play('toque');
    if (step + 1 < pick.questions.length) setStep(step + 1);
    else {
      const score = next.reduce((a, b) => a + b, 0);
      const r = { ...results, [pick.id]: { score, at: todayKey() } };
      setResults(r);
      writeLocal(TEST_KEY, r);
      setStep('fim');
      play('conquista');
    }
  };
  const score = answers.reduce((a, b) => a + b, 0);
  const res = pick ? testResult(pick, step === 'fim' ? score : (results[pick.id]?.score ?? 0)) : null;
  const rt = res ? routineById(res.routine) : undefined;

  return createPortal(
    <div className="gw-page" role="dialog" aria-modal="true" aria-label="Testes" style={pick ? { background: pick.tone } : undefined}>
      <header className="gw-page-head">
        <button className="gw-round" onClick={() => (pick ? setPick(null) : onClose())} aria-label="Voltar">
          <ChevronLeft size={22} />
        </button>
        <h2>{pick ? '' : 'Testes'}</h2>
        <span className="w-10" />
      </header>
      {!pick && (
        <>
          <p className="gw-note">Testes rápidos para você se observar com carinho. Não são diagnóstico, só um jeito de se conhecer um pouco mais.</p>
          <div className="gw-tests">
            {list.map((t) => (
              <button key={t.id} className="gw-test" style={{ background: t.tone }} onClick={() => begin(t)}>
                <span className="gw-test-art">
                  <TestArt id={t.id} emoji={t.emoji} />
                </span>
                <b>{t.title}</b>
                <small>{results[t.id] ? `Feito · ${testResult(t, results[t.id].score).title}` : `${t.questions.length} perguntas · 1 min`}</small>
              </button>
            ))}
          </div>
          <p className="gw-help">
            <Phone size={14} /> Se estiver difícil agora, fale com alguém de confiança. O CVV atende de graça, 24 horas, no <a href="tel:188">188</a>.
          </p>
        </>
      )}
      {pick && step === 'sobre' && (
        <div className="gw-tcard">
          <span className="gw-tcard-art">
            <TestArt id={pick.id} emoji={pick.emoji} glyph={92} />
          </span>
          <h2>{pick.title}</h2>
          <h3>Sobre o teste</h3>
          <p>{pick.desc}</p>
          <h3>O que você vai descobrir</h3>
          <p>{pick.get}</p>
          <button className="gw-cta" onClick={() => setStep(0)}>
            Começar
          </button>
          {results[pick.id] && (
            <button className="gw-link" onClick={() => setStep('fim')}>
              Ver meu último resultado
            </button>
          )}
        </div>
      )}
      {pick && typeof step === 'number' && (
        <div className="gw-tcard">
          <div className="gw-tprog" role="progressbar" aria-valuemin={0} aria-valuemax={pick.questions.length} aria-valuenow={step + 1}>
            <i style={{ width: `${((step + 1) / pick.questions.length) * 100}%` }} />
          </div>
          <p className="gw-tcount">
            {step + 1} de {pick.questions.length}
          </p>
          <h2 className="gw-tq">{pick.questions[step]}</h2>
          <div className="gw-answers">
            {ANSWERS.map((a, i) => (
              <button key={a} onClick={() => answer(i)}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
      {pick && step === 'fim' && res && (
        <div className="gw-tcard">
          <span className="gw-tcard-art">
            <Hamster fur={s.pet.fur} outfit={s.pet.outfit} size={120} mood={isHeavy(pick, answers.length ? score : (results[pick.id]?.score ?? 0)) ? 'calmo' : 'feliz'} label={s.pet.name} />
          </span>
          <p className="gw-sheet-cat">Seu resultado</p>
          <h2>{res.title}</h2>
          <p>{res.text}</p>
          {isHeavy(pick, answers.length ? score : (results[pick.id]?.score ?? 0)) && (
            <p className="gw-help is-strong">
              <Phone size={14} /> Você não precisa passar por isso sozinho. Converse com alguém de confiança ou com um profissional. Se precisar falar agora, o CVV atende de graça, 24 horas, no <a href="tel:188">188</a>.
            </p>
          )}
          {rt && (
            <>
              <h3>Uma rotina que pode ajudar</h3>
              <RoutineCard r={rt} onOpen={onRoutine} />
            </>
          )}
          <p className="gw-small">Isso não é um diagnóstico. É só um retrato de agora, e tudo bem ele mudar.</p>
          <button className="gw-link" onClick={() => (setStep(0), setAnswers([]))}>
            Refazer o teste
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

// ---------- A tela ----------

export function Grow({ onGo, onPlus }: { onGo: Go; onPlus: () => void }) {
  const s = useApp();
  const { fav, toggle } = useFavorites();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [page, setPage] = useState<null | 'todas' | 'favoritas' | RoutineCat>(null);
  const [planner, setPlanner] = useState(false);
  const [tests, setTests] = useState(false);
  const all = useMemo(() => visibleRoutines(s), [s]);

  const FOR_YOU: { id: string; label: string; emoji: string; tone: string; act: () => void }[] = [
    { id: 'rotinas', label: 'Rotinas', emoji: '📋', tone: '#FFD36B', act: () => setPage('todas') },
    { id: 'planejar', label: 'Planejar missão', emoji: '🗺️', tone: '#9ED8F5', act: () => setPlanner(true) },
    { id: 'testes', label: 'Testes', emoji: '🧩', tone: '#C7B5FF', act: () => setTests(true) },
    { id: 'diario', label: 'Diário', emoji: '📔', tone: '#FFB3CF', act: () => (requestTool('diario'), onGo('bem-estar')) },
    { id: 'calma', label: 'Bem-estar', emoji: '🌬️', tone: '#A8E6C4', act: () => onGo('bem-estar') },
    { id: 'missoes', label: 'Missões', emoji: '🏁', tone: '#FFC49A', act: () => onGo('atividades') },
    { id: 'mundo', label: 'Mundo', emoji: '🌍', tone: '#BFE6FF', act: () => onGo('mundo') },
    { id: 'evolucao', label: 'Evolução', emoji: '📈', tone: '#B8E3A0', act: () => openUi('evolucao') },
  ];

  return (
    <div className="gw">
      <header className="gw-head has-pose">
        <h1>Crescer</h1>
        <p>Pequenos passos para cuidar de você.</p>
        {/* o Lumbi espiando no cantinho: cada toque troca de pose */}
        <LivePet size={92} className="gw-head-pose" auto label="Lumbi: toque para ele fazer alguma coisa" />
      </header>

      <DailyMission onGo={onGo} />

      <section aria-label="Para você">
        <div className="gw-foryou">
          {FOR_YOU.map((f) => (
            <button key={f.id} onClick={f.act}>
              <span style={{ background: f.tone }}>
                <Glyph e={f.emoji} size={30} />
              </span>
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <Plans />

      {ROUTINE_CATS.map((c) => {
        const list = all.filter((r) => r.cat === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="gw-sec" aria-label={c.label}>
            <button className="gw-sec-head" onClick={() => setPage(c.id)}>
              {c.label} <ChevronRight size={18} strokeWidth={2.6} />
            </button>
            <div className="gw-scroll">
              {list.map((r) => (
                <RoutineCard key={r.id} r={r} fav={fav.includes(r.id)} onOpen={setRoutine} />
              ))}
            </div>
          </section>
        );
      })}

      {!isKid(s) && <PlusCard onOpen={onPlus} title="Rotinas exclusivas" text="Plano de academia iniciante, Deixe sua carteira incrível e muito mais no Lumbi+." />}

      <RoutinesPage open={page !== null} start={page ?? 'todas'} onClose={() => setPage(null)} onOpen={setRoutine} fav={fav} />
      <Planner open={planner} onClose={() => setPlanner(false)} />
      <TestsPage open={tests} onClose={() => setTests(false)} onRoutine={setRoutine} />
      <RoutineSheet r={routine} fav={!!routine && fav.includes(routine.id)} onFav={() => routine && toggle(routine.id)} onClose={() => setRoutine(null)} onPlus={() => (setRoutine(null), onPlus())} />
    </div>
  );
}

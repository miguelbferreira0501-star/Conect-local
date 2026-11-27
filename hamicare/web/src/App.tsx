import { useEffect, useMemo, useRef, useState } from 'react';
import { DuoSync } from './components/Duo';
import { RecapScreen } from './components/Recap';
import { recapDue, recapPick } from './lib/recap';
import { GoalDone } from './components/GoalDone';
import { MoodCheckinHost } from './components/MoodCheckin';
import { Sheet, Toaster, toast } from './components/ui';
import { CelebrationModal, DailyWelcome, StreakScreen } from './components/Celebrate';
import { LevelUpScreen } from './components/LevelUp';
import { TabIcon, type TabId } from './components/TabIcon';
import { Home } from './screens/Home';
import { GrowthContext } from './components/Hamster';
import { careDays, growthOf } from './logic/growth';
import { Activities } from './screens/Activities';
import { World, type WorldTab } from './screens/World';
import type { FriendsTab } from './screens/Friends';
import { Wellbeing } from './screens/Wellbeing';
import { Grow } from './screens/Grow';
import { StoreTab } from './screens/StoreTab';
import { BagTab } from './screens/BagTab';
import { Friends, type ShareDraft } from './screens/Friends';
import { Onboarding } from './screens/Onboarding';
import { SettingsSheet } from './screens/Settings';
import { Evolution } from './screens/Evolution';
import { GuardianHost } from './components/Guardian';
import { Paywall } from './screens/Paywall';
import { AccountSection } from './screens/Account';
import { captureRef, useAccount } from './lib/account';
import { ResetPassword } from './screens/ResetPassword';
import { LegalHost } from './components/Legal';
import { getState, markWelcomed, onCelebrate, tick, todayKey, useApp, type Celebration } from './lib/store';
import { markReminded, pickReminder, reminderDue, showNotification } from './lib/notify';
import { syncProfile } from './lib/social';
import { captureInvite } from './lib/social/invite';
import { onUi } from './lib/bus';
import { PetProfile } from './components/PetProfile';
import { Interactions } from './components/Interactions';
import { AreasPage } from './components/Areas';
import { MenuScreen } from './components/Menu';
import { MailScreen } from './components/Mail';
import { SeasonPass } from './components/Season';
import { WalletSheet } from './screens/Collection';
import { play, type SoundId } from './lib/sound';

type Tab = TabId;

const TABS: { id: Tab; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'crescer', label: 'Crescer' },
  { id: 'bem-estar', label: 'Bem-estar' },
  { id: 'loja', label: 'Loja' },
  { id: 'bolsa', label: 'Bolsa' },
  { id: 'amigos', label: 'Lumbi' },
];
/** Telas que não ficam na barra (abrem pelo Início, pelo Crescer, pelo menu ou por atalhos). */
const HIDDEN: Tab[] = ['atividades', 'mundo'];
/** Qual aba fica acesa na barra quando a tela é uma das escondidas. */
const LIT: Partial<Record<Tab, Tab>> = { atividades: 'crescer', mundo: 'inicio' };

captureRef();

function initialTab(): Tab {
  // Link de convite (#amigo=HAMI-…): vai para Amigos com o código guardado.
  if (captureInvite()) return 'amigos';
  const h = location.hash.slice(1);
  return TABS.some((t) => t.id === h) || HIDDEN.includes(h as Tab) ? (h as Tab) : 'inicio';
}

export default function App() {
  const s = useApp();
  // Ao abrir o app já logado, confere a conta e liga o backup e a carteira do servidor
  // (antes isso só acontecia ao abrir Missões, Amigos ou Ajustes).
  useAccount();
  const account = <AccountSection />;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [settings, setSettings] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mail, setMail] = useState(false);
  const [petProfile, setPetProfile] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [inter, setInter] = useState(false);
  const [season, setSeason] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [plus, setPlus] = useState(false);
  const [evolution, setEvolution] = useState(false);
  const [share, setShare] = useState<ShareDraft>(null);
  const [gift, setGift] = useState<string | null>(null);
  const [worldTab, setWorldTab] = useState<WorldTab | undefined>();
  const [friendsTab, setFriendsTab] = useState<FriendsTab | undefined>();
  const [queue, setQueue] = useState<Celebration[]>([]);
  const themeSet = useRef(false);

  // Tema e cor de destaque
  useEffect(() => {
    const root = document.documentElement;
    if (s.settings.theme === 'claro' || s.settings.theme === 'escuro') {
      root.setAttribute('data-theme', s.settings.theme === 'claro' ? 'light' : 'dark');
      themeSet.current = true;
    } else if (themeSet.current) {
      root.removeAttribute('data-theme');
      themeSet.current = false;
    }
    root.setAttribute('data-accent', s.settings.accent);
  }, [s.settings.theme, s.settings.accent]);

  // Cada aba tem a sua cor de fundo (o começo também).
  useEffect(() => {
    document.documentElement.setAttribute('data-screen', s.onboarded ? tab : 'onboarding');
  }, [tab, s.onboarded]);

  // Ao terminar o começo, o Início abre do topo.
  useEffect(() => {
    if (s.onboarded) window.scrollTo({ top: 0 });
  }, [s.onboarded]);

  // O tempo passa para o Lumbi (fome, sono, pesagem semanal) e os lembretes chegam no horário.
  useEffect(() => {
    tick();
    const id = setInterval(() => {
      tick();
      const st = getState();
      if (reminderDue(st)) {
        const r = pickReminder(st);
        markReminded();
        if (r) showNotification(r.text, toast);
      }
    }, 60_000);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => onCelebrate((c) => setQueue((q) => [...q, c])), []);

  // Retrospectiva do mês: nos primeiros dias do mês, depois do check-in de humor, abre sozinha uma vez.
  const [recap, setRecap] = useState<string | null>(null);
  const moodToday = s.days[todayKey()]?.mood;
  useEffect(() => {
    if (!moodToday || recap) return;
    const due = recapDue(s, todayKey());
    if (!due) return;
    const t = setTimeout(() => setRecap(due), 1200);
    return () => clearTimeout(t);
  }, [moodToday]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atalhos pedidos por outras telas (menu, correio, trilha…).
  useEffect(
    () =>
      onUi((t) => {
        if (t === 'plus') setPlus(true);
        else if (t === 'menu') setMenu(true);
        else if (t === 'ajustes') setSettings(true);
        else if (t === 'correio') setMail(true);
        else if (t === 'temporada') setSeason(true);
        else if (t === 'evolucao') setEvolution(true);
        else if (t === 'carteira') setWalletOpen(true);
        else if (t === 'amigos') setTab('amigos');
        else if (t === 'missoes') setTab('atividades');
        else if (t === 'bemestar') setTab('bem-estar');
        else if (t === 'mundo') setTab('mundo');
        else if (t === 'hami') setPetProfile(true);
        else if (t === 'areas') setAreasOpen(true);
        else if (t === 'loja') setTab('loja');
        else if (t === 'interacoes') setInter(true);
        else if (t === 'retrospectiva') setRecap(recapPick(getState(), todayKey()));
      }),
    [],
  );

  // Perfil público (nome, roupa, casa, nível) acompanha as mudanças.
  useEffect(() => {
    const t = setTimeout(() => syncProfile(s), 1500);
    return () => clearTimeout(t);
  }, [s.profile.name, s.pet.name, s.pet.fur, s.pet.phase, s.pet.outfit, s.house, s.xp, s.privacy.requests, s.privacy.ranking, s.homeArena, s.game.maxLevel, s.bio, s.days, s.achievements]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onHash = () => setTab(initialTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(next: Tab, sub?: WorldTab, friendsSub?: FriendsTab) {
    // Loja e armário saíram do Mundo: agora são abas próprias.
    if (next === 'mundo' && sub === 'loja') (next = 'loja'), (sub = undefined);
    if (next === 'mundo' && sub === 'armario') (next = 'bolsa'), (sub = undefined);
    setTab(next);
    setWorldTab(sub);
    setFriendsTab(friendsSub);
    try {
      history.replaceState(null, '', `#${next}`);
    } catch {
      /* alguns visualizadores bloqueiam: a aba muda do mesmo jeito */
    }
    window.scrollTo({ top: 0 });
  }

  // Tamanho do Lumbi: cresce com os dias de cuidado.
  const growth = useMemo(() => growthOf(careDays(s.days)), [s.days]);

  // Som de cada comemoração quando ela aparece na tela.
  const head = queue[0];
  useEffect(() => {
    if (!head || !s.onboarded) return;
    const ids: Record<Celebration['type'], SoundId> = { level: 'nivel', achievement: 'conquista', phase: 'magia', weigh: 'aviso', goal: 'conquista', streak: 'ofensiva', grow: 'magia' };
    play(ids[head.type]);
  }, [head]); // eslint-disable-line react-hooks/exhaustive-deps
  const welcomeNow = s.onboarded && s.welcomed !== todayKey() && !head;
  useEffect(() => {
    if (welcomeNow) play('bomdia');
  }, [welcomeNow]);

  if (!s.onboarded) {
    return (
      <GrowthContext.Provider value={growth.scale}>
        <Onboarding />
        <ResetPassword />
        <LegalHost />
        <Toaster />
      </GrowthContext.Provider>
    );
  }

  const shareTo = (draft: ShareDraft) => {
    setShare(draft);
    setEvolution(false);
    go('amigos');
  };
  const current = queue[0];
  const showWelcome = s.welcomed !== todayKey() && !current;

  return (
    <GrowthContext.Provider value={growth.scale}>
      <main className="shell">
        {tab === 'inicio' && <Home onGo={go} onSettings={() => setMenu(true)} onEvolution={() => setEvolution(true)} onArenas={() => go('mundo', 'arenas')} onPlus={() => setPlus(true)} onTeam={() => go('amigos', undefined, 'turma')} onWorld={(sub) => go('mundo', sub ?? 'casa')} onBag={() => go('bolsa')} onInvite={() => go('amigos')} />}
        {tab === 'atividades' && <Activities onShareTask={(task) => shareTo({ kind: 'atividade', task })} onPlus={() => setPlus(true)} onHome={() => go('inicio')} />}
        {tab === 'crescer' && <Grow onGo={(t) => go(t)} onPlus={() => setPlus(true)} />}
        {tab === 'loja' && <StoreTab onPlus={() => setPlus(true)} onGift={(id) => (setGift(id), go('amigos'))} />}
        {tab === 'bolsa' && <BagTab onStore={() => go('loja')} onDecorate={() => go('mundo', 'casa')} />}
        {tab === 'mundo' && <World key={worldTab ?? 'mundo'} initialTab={worldTab} onBack={() => go('inicio')} onPlus={() => setPlus(true)} onGift={(id) => (setGift(id), go('amigos'))} />}
        {tab === 'bem-estar' && <Wellbeing onPlus={() => setPlus(true)} />}
        {tab === 'amigos' && <Friends key={friendsTab ?? 'amigos'} initialTab={friendsTab} share={share} onShareDone={() => setShare(null)} giftItem={gift} onGiftDone={() => setGift(null)} account={account} />}
      </main>
      <nav className="tabbar" aria-label="Seções do app">
        <div className="tabbar-inner">
          {TABS.map(({ id, label }) => (
            <button key={id} className="tab" aria-current={(LIT[tab] ?? tab) === id ? 'page' : undefined} onClick={() => go(id)}>
              <TabIcon id={id} />
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </nav>
      {evolution && <Evolution onClose={() => setEvolution(false)} onShare={(photo) => shareTo({ kind: 'foto', photo })} onPlus={() => setPlus(true)} />}
      <MenuScreen open={menu} onClose={() => setMenu(false)} />
      <MailScreen open={mail} onClose={() => setMail(false)} />
      <PetProfile open={petProfile} onClose={() => setPetProfile(false)} />
      <AreasPage open={areasOpen ? 'todas' : null} onClose={() => setAreasOpen(false)} />
      <Interactions open={inter} onClose={() => setInter(false)} onStore={() => go('loja')} />
      <SeasonPass open={season} onClose={() => setSeason(false)} />
      <WalletSheet open={walletOpen} onClose={() => setWalletOpen(false)} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} onPlus={() => (setSettings(false), setPlus(true))} account={account} />
      <Sheet open={plus} onClose={() => setPlus(false)} title="Lumbi+" top>
        <Paywall onClose={() => setPlus(false)} />
      </Sheet>
      {current?.type === 'level' ? <LevelUpScreen c={current} onClose={() => setQueue((q) => q.slice(1))} /> : <CelebrationModal c={current} onClose={() => setQueue((q) => q.slice(1))} />}
      {current?.type === 'streak' && <StreakScreen count={current.count} hammer={current.hammer} onClose={() => setQueue((q) => q.slice(1))} onShare={(photo) => (setQueue((q) => q.slice(1)), shareTo({ kind: 'foto', photo }))} />}
      {showWelcome && <DailyWelcome onClose={markWelcomed} />}
      <ResetPassword />
      <LegalHost />
      <GoalDone />
      {!showWelcome && <MoodCheckinHost />}
      <GuardianHost />
      <DuoSync />
      {recap && <RecapScreen month={recap} onClose={() => setRecap(null)} />}
      <Toaster />
    </GrowthContext.Provider>
  );
}

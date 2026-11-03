import { useEffect, useRef, useState } from 'react';
import { Sheet, Toaster, toast } from './components/ui';
import { CelebrationModal, DailyWelcome, StreakScreen } from './components/Celebrate';
import { TabIcon, type TabId } from './components/TabIcon';
import { Home } from './screens/Home';
import { Activities } from './screens/Activities';
import { World } from './screens/World';
import { Wellbeing } from './screens/Wellbeing';
import { Friends, type ShareDraft } from './screens/Friends';
import { Onboarding } from './screens/Onboarding';
import { SettingsSheet } from './screens/Settings';
import { Evolution } from './screens/Evolution';
import { Paywall } from './screens/Paywall';
import { AccountSection } from './screens/Account';
import { getState, markWelcomed, onCelebrate, tick, todayKey, useApp, type Celebration } from './lib/store';
import { markReminded, pickReminder, reminderDue, showNotification } from './lib/notify';
import { syncProfile } from './lib/social';

type Tab = TabId;

const TABS: { id: Tab; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'atividades', label: 'Missões' },
  { id: 'mundo', label: 'Mundo' },
  { id: 'bem-estar', label: 'Bem-estar' },
  { id: 'amigos', label: 'Amigos' },
];

function initialTab(): Tab {
  const h = location.hash.slice(1);
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'inicio';
}

export default function App() {
  const s = useApp();
  const account = <AccountSection />;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [settings, setSettings] = useState(false);
  const [plus, setPlus] = useState(false);
  const [evolution, setEvolution] = useState(false);
  const [share, setShare] = useState<ShareDraft>(null);
  const [gift, setGift] = useState<string | null>(null);
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

  // O tempo passa para o Hami (fome, sono, pesagem semanal) e os lembretes chegam no horário.
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

  // Perfil público (nome, roupa, casa, nível) acompanha as mudanças.
  useEffect(() => {
    const t = setTimeout(() => syncProfile(s), 1500);
    return () => clearTimeout(t);
  }, [s.profile.name, s.pet.name, s.pet.fur, s.pet.phase, s.pet.outfit, s.house, s.xp, s.privacy.requests, s.bio, s.days, s.achievements]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onHash = () => setTab(initialTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(next: Tab) {
    setTab(next);
    try {
      history.replaceState(null, '', `#${next}`);
    } catch {
      /* alguns visualizadores bloqueiam: a aba muda do mesmo jeito */
    }
    window.scrollTo({ top: 0 });
  }

  if (!s.onboarded) {
    return (
      <>
        <Onboarding />
        <Toaster />
      </>
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
    <>
      <main className="shell">
        {tab === 'inicio' && <Home onGo={go} onSettings={() => setSettings(true)} onEvolution={() => setEvolution(true)} onShare={(photo) => shareTo({ kind: 'foto', photo })} />}
        {tab === 'atividades' && <Activities onShareTask={(task) => shareTo({ kind: 'atividade', task })} />}
        {tab === 'mundo' && <World onPlus={() => setPlus(true)} onGift={(id) => (setGift(id), go('amigos'))} />}
        {tab === 'bem-estar' && <Wellbeing />}
        {tab === 'amigos' && <Friends share={share} onShareDone={() => setShare(null)} giftItem={gift} onGiftDone={() => setGift(null)} account={account} />}
      </main>
      <nav className="tabbar" aria-label="Seções do app">
        <div className="tabbar-inner">
          {TABS.map(({ id, label }) => (
            <button key={id} className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
              <TabIcon id={id} />
              {label}
            </button>
          ))}
        </div>
      </nav>
      {evolution && <Evolution onClose={() => setEvolution(false)} onShare={(photo) => shareTo({ kind: 'foto', photo })} />}
      <SettingsSheet open={settings} onClose={() => setSettings(false)} onPlus={() => (setSettings(false), setPlus(true))} account={account} />
      <Sheet open={plus} onClose={() => setPlus(false)} title="HamiCare+">
        <Paywall onClose={() => setPlus(false)} />
      </Sheet>
      <CelebrationModal c={current} onClose={() => setQueue((q) => q.slice(1))} />
      {current?.type === 'streak' && <StreakScreen count={current.count} onClose={() => setQueue((q) => q.slice(1))} onShare={(photo) => (setQueue((q) => q.slice(1)), shareTo({ kind: 'foto', photo }))} />}
      {showWelcome && <DailyWelcome onClose={markWelcomed} />}
      <Toaster />
    </>
  );
}

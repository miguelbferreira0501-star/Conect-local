import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Compass, Heart, Home as HomeIcon, ListChecks, Users } from 'lucide-react';
import { Modal, Sheet, Toaster, toast } from './components/ui';
import { Hamster } from './components/Hamster';
import { Home } from './screens/Home';
import { Activities } from './screens/Activities';
import { World } from './screens/World';
import { Wellbeing } from './screens/Wellbeing';
import { Friends, type ShareDraft } from './screens/Friends';
import { Onboarding } from './screens/Onboarding';
import { SettingsSheet } from './screens/Settings';
import { Evolution } from './screens/Evolution';
import { Paywall } from './screens/Paywall';
import { getState, minor, onCelebrate, tick, useApp, type Celebration } from './lib/store';
import { markReminded, pickReminder, reminderDue, showNotification } from './lib/notify';
import { syncProfile } from './lib/social';
import { PHASES } from './logic/evolution';
import { fmtNum } from './lib/util';

type Tab = 'inicio' | 'atividades' | 'mundo' | 'bem-estar' | 'amigos';

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'inicio', label: 'Início', Icon: HomeIcon },
  { id: 'atividades', label: 'Atividades', Icon: ListChecks },
  { id: 'mundo', label: 'Mundo', Icon: Compass },
  { id: 'bem-estar', label: 'Bem-estar', Icon: Heart },
  { id: 'amigos', label: 'Amigos', Icon: Users },
];

function initialTab(): Tab {
  const h = location.hash.slice(1);
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'inicio';
}

export default function App({ account }: { account?: ReactNode }) {
  const s = useApp();
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
  }, [s.profile.name, s.pet.name, s.pet.fur, s.pet.phase, s.pet.outfit, s.house, s.xp, s.privacy.requests]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
              <Icon size={23} strokeWidth={tab === id ? 2.6 : 2} aria-hidden="true" />
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
      <Toaster />
    </>
  );
}

function CelebrationModal({ c, onClose }: { c: Celebration | undefined; onClose: () => void }) {
  const s = useApp();
  if (!c) return null;
  const hide = minor(s) || s.body.hideNumbers;
  const content =
    c.type === 'level'
      ? { title: `Nível ${c.level}!`, text: 'Cada cuidado seu fez isso acontecer. Confira o mapa: pode ter lugar novo liberado.', mood: 'animado' as const }
      : c.type === 'phase'
        ? { title: `Fase ${PHASES[c.phase]}!`, text: `O ${s.pet.name} evoluiu junto com você. Constância é tudo!`, mood: 'animado' as const }
        : c.type === 'achievement'
          ? { title: `${c.emoji} ${c.title}`, text: `Conquista nova! +${c.coins} sementes de girassol.`, mood: 'feliz' as const }
          : {
              title: 'Pesagem da semana',
              text: hide
                ? `O ${s.pet.name} seguiu a jornada dele nesta semana.`
                : c.grams === c.before
                  ? `${fmtNum(c.grams)} g: o ${s.pet.name} se manteve. Consistência também é evolução.`
                  : `${fmtNum(c.before)} g → ${fmtNum(c.grams)} g. Devagar e sempre, junto com você.`,
              mood: 'feliz' as const,
            };
  return (
    <Modal open onClose={onClose} label={content.title}>
      <div className="grid justify-items-center gap-2 p-6 text-center">
        <div className="evolve-pop">
          <Hamster fur={s.pet.fur} grams={s.pet.grams} phase={s.pet.phase} outfit={s.pet.outfit} mood={content.mood} size={180} />
        </div>
        <h2 className="font-display text-[26px] font-bold leading-tight">{content.title}</h2>
        <p className="text-muted">{content.text}</p>
        <button className="btn btn-primary mt-2 w-full" onClick={onClose}>
          Que demais!
        </button>
      </div>
    </Modal>
  );
}

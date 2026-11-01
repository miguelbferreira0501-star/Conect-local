import { useEffect, useRef, useState } from 'react';
import { BookHeart, Home, Shirt, Wind } from 'lucide-react';
import { Toaster } from './components/ui';
import { Today } from './screens/Today';
import { Calm } from './screens/Calm';
import { Journal } from './screens/Journal';
import { Collection } from './screens/Collection';
import { Onboarding } from './screens/Onboarding';
import { SettingsSheet } from './screens/Settings';
import { useApp } from './lib/store';

type Tab = 'hoje' | 'calma' | 'diario' | 'colecao';

const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'hoje', label: 'Hoje', Icon: Home },
  { id: 'calma', label: 'Calma', Icon: Wind },
  { id: 'diario', label: 'Diário', Icon: BookHeart },
  { id: 'colecao', label: 'Coleção', Icon: Shirt },
];

function initialTab(): Tab {
  const h = location.hash.slice(1);
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'hoje';
}

export default function App() {
  const s = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [settings, setSettings] = useState(false);
  const themeSet = useRef(false);

  // Tema: só mexe no atributo quando a pessoa escolheu claro ou escuro.
  useEffect(() => {
    const root = document.documentElement;
    if (s.theme === 'claro') {
      root.setAttribute('data-theme', 'light');
      themeSet.current = true;
    } else if (s.theme === 'escuro') {
      root.setAttribute('data-theme', 'dark');
      themeSet.current = true;
    } else if (themeSet.current) {
      root.removeAttribute('data-theme');
      themeSet.current = false;
    }
  }, [s.theme]);

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
      // Alguns visualizadores bloqueiam: a aba muda do mesmo jeito.
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

  return (
    <>
      <main className="shell">
        {tab === 'hoje' && <Today onOpenSettings={() => setSettings(true)} />}
        {tab === 'calma' && <Calm />}
        {tab === 'diario' && <Journal />}
        {tab === 'colecao' && <Collection />}
      </main>
      <nav className="tabbar" aria-label="Seções do app">
        <div className="tabbar-inner">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
              <Icon size={24} strokeWidth={tab === id ? 2.6 : 2} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </nav>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <Toaster />
    </>
  );
}

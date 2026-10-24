import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Heart, House, Search, User, X } from 'lucide-react';
import { BRAND } from '@conecta/shared';
import { useConfig } from '@/lib/queries';
import { storage } from '@/lib/storage';
import { LocationPicker } from './LocationPicker';

const NAV = [
  { to: '/', label: 'Início', Icon: House, end: true },
  { to: '/buscar', label: 'Buscar', Icon: Search },
  { to: '/favoritos', label: 'Favoritos', Icon: Heart },
  { to: '/atividades', label: 'Atividades', Icon: CalendarClock },
  { to: '/perfil', label: 'Perfil', Icon: User },
];

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-brand-700 ${className}`}>
      <svg viewBox="0 0 64 64" width={30} height={30} aria-hidden="true" className="h-[30px] w-[30px]">
        <rect width="64" height="64" rx="14" fill="rgb(var(--brand-700))" />
        <path d="M32 12c-8.3 0-15 6.5-15 14.6C17 37.5 32 52 32 52s15-14.5 15-25.4C47 18.5 40.3 12 32 12z" fill="#fff" />
        <path d="m25.5 31.5 4.5 4.5 9-9.5" fill="none" stroke="rgb(var(--accent-600))" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[19px] tracking-tight">{BRAND.name}</span>
    </span>
  );
}

function DemoBanner() {
  const config = useConfig() as { data?: { demoMode: boolean; preview?: boolean } };
  const [hidden, setHidden] = useState(() => storage.get('cl_demo_banner_hidden', false));
  if (!config.data?.demoMode || hidden) return null;
  return (
    <div className="border-b border-warning-700/20 bg-warning-50 text-warning-700">
      <div className="container-app flex items-center gap-3 py-2 text-sm">
        <p className="flex-1">
          {config.data.preview ? (
            <><strong>Prévia:</strong> empresas e avaliações são fictícias, e o que você criar fica salvo só neste navegador.</>
          ) : (
            <><strong>Modo demonstração:</strong> as empresas e avaliações marcadas como “Exemplo” são fictícias.</>
          )}
        </p>
        <button aria-label="Fechar aviso de demonstração" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-warning-700/10"
          onClick={() => { setHidden(true); storage.set('cl_demo_banner_hidden', true); }}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen md:flex">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-raised">
        Pular para o conteúdo
      </a>
      {/* Navegação lateral em telas grandes */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex lg:w-72">
        <NavLink to="/" className="mb-8 px-3"><Logo /></NavLink>
        <nav aria-label="Navegação principal" className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex min-h-[48px] items-center gap-3 rounded-xl px-3 font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-surface'}`}>
              {({ isActive }) => (<><Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />{label}</>)}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-3 text-xs text-muted">{BRAND.tagline}</p>
      </aside>

      <div className="min-w-0 flex-1">
        <DemoBanner />
        <main id="conteudo" className="pb-24 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Navegação inferior no celular */}
      <nav aria-label="Navegação principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end}
                className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-medium ${isActive ? 'text-brand-700' : 'text-muted'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-brand-50' : ''}`}>
                      <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <LocationPicker />
    </div>
  );
}

/** Cabeçalho das telas internas, com botão voltar. */
export function PageHeader({ title, back = true, actions, subtitle }: { title: string; back?: boolean | string; actions?: ReactNode; subtitle?: ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-app flex min-h-[60px] items-center gap-2 py-2">
        {back && (
          <button aria-label="Voltar" onClick={() => (typeof back === 'string' ? nav(back) : loc.key !== 'default' ? nav(-1) : nav('/'))}
            className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {subtitle && <div className="truncate text-sm text-muted">{subtitle}</div>}
        </div>
        {actions}
      </div>
    </header>
  );
}

import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, House, PawPrint, Search, User, X } from 'lucide-react';
import { BRAND } from '@conecta/shared';
import { useConfig } from '@/lib/queries';
import { storage } from '@/lib/storage';
import { LocationPicker } from './LocationPicker';

const NAV = [
  { to: '/', label: 'Início', Icon: House, end: true },
  { to: '/buscar', label: 'Buscar', Icon: Search },
  { to: '/atividades', label: 'Agenda', Icon: CalendarClock },
  { to: '/pets', label: 'Meus pets', Icon: PawPrint },
  { to: '/perfil', label: 'Perfil', Icon: User },
];

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-ink ${className}`}>
      <svg viewBox="0 0 64 64" width={28} height={28} aria-hidden="true" className="h-7 w-7 shrink-0">
        <rect width="64" height="64" rx="14" fill="rgb(var(--brand-700))" />
        <g fill="#fff">
          <circle cx="19.5" cy="27" r="4.6" /><circle cx="27.2" cy="19" r="4.9" /><circle cx="36.8" cy="19" r="4.9" /><circle cx="44.5" cy="27" r="4.6" />
          <path d="M32 30c-6.9 0-13 6.6-13 12 0 3.9 3 5.8 6.5 5.8 2.6 0 4.1-1.4 6.5-1.4s3.9 1.4 6.5 1.4c3.5 0 6.5-1.9 6.5-5.8 0-5.4-6.1-12-13-12z" />
        </g>
      </svg>
      <span className="text-lg tracking-[-0.02em]">{BRAND.name}</span>
    </span>
  );
}

function DemoBanner() {
  const config = useConfig() as { data?: { demoMode: boolean; preview?: boolean } };
  const [hidden, setHidden] = useState(() => storage.get('cl_demo_banner_hidden', false));
  if (!config.data?.demoMode || hidden) return null;
  return (
    <div className="border-b border-warning-200 bg-warning-50 text-warning-700">
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
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-float">
        Pular para o conteúdo
      </a>
      {/* Navegação lateral em telas grandes: no fundo da página, separada por uma linha fina */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-3 py-6 md:flex">
        <NavLink to="/" className="mb-7 px-3"><Logo /></NavLink>
        <nav aria-label="Navegação principal" className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 text-[15px] transition-colors duration-150 ${isActive ? 'bg-brand-50 font-medium text-brand-900' : 'text-[#374151] hover:bg-raised'}`}>
              {({ isActive }) => (<><Icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand-700' : 'text-muted'}`} strokeWidth={1.75} aria-hidden="true" />{label}</>)}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/empresas" className="mt-auto rounded-xl px-3 py-2 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-ink">
          Tenho um negócio pet
        </NavLink>
      </aside>

      <div className="min-w-0 flex-1">
        <DemoBanner />
        <main id="conteudo" className="pb-24 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Navegação inferior no celular: fundo opaco, cor da marca só no item ativo */}
      <nav aria-label="Navegação principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end}
                className={({ isActive }) => `pressable flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11.5px] ${isActive ? 'font-semibold text-brand-900' : 'font-medium text-muted'}`}>
                {({ isActive }) => (
                  <>
                    <Icon className={`h-[22px] w-[22px] ${isActive ? 'text-brand-700' : ''}`} strokeWidth={isActive ? 2.1 : 1.75} aria-hidden="true" />
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
    <header className="sticky top-0 z-30 border-b border-line bg-card">
      <div className="container-app flex min-h-[60px] items-center gap-2 py-2">
        {back && (
          <button aria-label="Voltar" onClick={() => (typeof back === 'string' ? nav(back) : loc.key !== 'default' ? nav(-1) : nav('/'))}
            className="pressable -ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-raised">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold">{title}</h1>
          {subtitle && <div className="truncate text-sm text-muted">{subtitle}</div>}
        </div>
        {actions}
      </div>
    </header>
  );
}

import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Gift, CalendarClock, CalendarDays, Clock, Crown, ExternalLink, Image, LayoutDashboard, ListChecks, QrCode, Star, Store, Users } from 'lucide-react';
import { useMyBusinesses, usePanelBusiness, usePanelRequests } from '@/lib/panelQueries';
import { Logo } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Alert, PageLoader } from '@/components/ui/Feedback';

/** Estrutura das telas do painel de uma empresa (sem a navegação do cliente). */
export function PanelShell() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-card">
        <div className="container-app flex min-h-[60px] items-center gap-3">
          <NavLink to="/empresas" aria-label="Painel das empresas"><Logo /></NavLink>
          <span className="hidden rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-700 sm:inline">Para empresas</span>
          <div className="flex-1" />
          <NavLink to="/" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-brand-fg hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar ao app
          </NavLink>
        </div>
      </header>
      <RequireAuth title="Entre para acessar o painel" reason="Use a mesma conta do app. Se ainda não tem, crie uma grátis — leva menos de um minuto.">
        <Outlet />
      </RequireAuth>
    </div>
  );
}

const TABS = [
  { to: '', label: 'Início', Icon: LayoutDashboard, end: true },
  { to: 'pedidos', label: 'Pedidos', Icon: CalendarClock },
  { to: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { to: 'divulgar', label: 'Divulgar', Icon: QrCode },
  { to: 'perfil', label: 'Perfil', Icon: Store },
  { to: 'servicos', label: 'Serviços', Icon: ListChecks },
  { to: 'clube', label: 'Clube e Pix', Icon: Gift },
  { to: 'equipe', label: 'Equipe', Icon: Users },
  { to: 'horarios', label: 'Horários', Icon: Clock },
  { to: 'fotos', label: 'Fotos', Icon: Image },
  { to: 'avaliacoes', label: 'Avaliações', Icon: Star },
  { to: 'plano', label: 'Plano', Icon: Crown },
];

export function BusinessPanelLayout() {
  const { businessId } = useParams();
  const biz = usePanelBusiness(businessId);
  const mine = useMyBusinesses();
  const reqs = usePanelRequests(businessId);
  const nav = useNavigate();
  const pending = reqs.data?.filter((r) => r.status === 'requested' || r.status === 'sent').length ?? 0;
  if (biz.isLoading) return <PageLoader />;
  if (biz.isError || !biz.data) return <div className="container-app py-8"><Alert tone="error">{(biz.error as Error)?.message ?? 'Empresa não encontrada.'}</Alert></div>;
  const b = biz.data;
  return (
    <div>
      <div className="border-b border-line bg-card">
        <div className="container-app py-3">
          <div className="flex flex-wrap items-center gap-2">
            {mine.data && mine.data.length > 1 ? (
              <label className="min-w-0">
                <span className="sr-only">Empresa</span>
                <select value={b.id} onChange={(e) => nav(`/empresas/${e.target.value}`)} className="max-w-full rounded-lg border border-line bg-card px-2 py-1.5 text-lg font-semibold">
                  {mine.data.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            ) : (
              <h1 className="truncate text-lg font-semibold">{b.name}</h1>
            )}
            <a href={`/empresa/${b.slug}`} target="_blank" rel="noopener" className="inline-flex min-h-[40px] items-center gap-1 text-sm font-medium text-brand-fg hover:underline">
              Ver página pública <ExternalLink className="h-3.5 w-3.5" /><span className="sr-only">(abre em nova aba)</span>
            </a>
          </div>
          <nav aria-label="Seções do painel" className="scroll-row mt-2">
            {TABS.map(({ to, label, Icon, end }) => (
              <NavLink key={label} to={to} end={end}
                className={({ isActive }) => `inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition ${isActive ? 'bg-brand-700 text-white' : 'bg-surface text-ink hover:bg-brand-50'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />{label}
                {label === 'Pedidos' && pending > 0 && <span className="ml-0.5 rounded-full bg-danger-700 px-1.5 text-xs font-bold text-[#2a0a0a]">{pending}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      {b.status === 'suspended' && (
        <div className="container-app pt-4">
          <Alert tone="error" title="Empresa suspensa">
            Sua empresa não aparece para os clientes no momento.{b.suspendedReason ? ` Motivo: ${b.suspendedReason}.` : ''} Fale com o suporte para regularizar.
          </Alert>
        </div>
      )}
      <div className="container-app max-w-4xl py-5">
        <Outlet context={b} />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate, useParams } from 'react-router-dom';
import { formatCents, PLANS } from '@conecta/shared';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowLeft, Gift, CalendarClock, CalendarDays, Clock, Crown, ExternalLink, Image, LayoutDashboard, ListChecks, Menu, QrCode, Star, Store, Users, type LucideIcon } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useMyBusinesses, usePanelBusiness, usePanelRequests } from '@/lib/panelQueries';
import { Logo } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Alert, PageLoader } from '@/components/ui/Feedback';

/** Estrutura das telas do painel (lista de empresas, cadastro e administração). Dentro de uma empresa, o layout próprio assume. */
export function PanelShell() {
  const inBusiness = useMatch('/empresas/:businessId/*');
  const own = inBusiness && inBusiness.params.businessId !== 'nova';
  return (
    <div className="min-h-screen bg-surface">
      {!own && (
        <header className="border-b border-line bg-card">
          <div className="container-app flex min-h-[56px] items-center gap-3">
            <NavLink to="/empresas" aria-label="Painel das empresas"><Logo /></NavLink>
            <span className="hidden text-sm text-muted sm:inline">para empresas</span>
            <div className="flex-1" />
            <NavLink to="/" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ink hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao app
            </NavLink>
          </div>
        </header>
      )}
      <RequireAuth title="Entre para acessar o painel" reason="Use a mesma conta do app. Se ainda não tem, crie uma grátis, leva menos de um minuto.">
        <Outlet />
      </RequireAuth>
    </div>
  );
}

type Tab = { to: string; label: string; Icon: LucideIcon; end?: boolean };
// Seções agrupadas pelo trabalho: atender, organizar o negócio, aparecer para os clientes.
const GROUPS: Array<{ title: string; tabs: Tab[] }> = [
  { title: 'Atendimento', tabs: [
    { to: '', label: 'Início', Icon: LayoutDashboard, end: true },
    { to: 'pedidos', label: 'Pedidos', Icon: CalendarClock },
    { to: 'agenda', label: 'Agenda', Icon: CalendarDays },
  ] },
  { title: 'Negócio', tabs: [
    { to: 'servicos', label: 'Serviços', Icon: ListChecks },
    { to: 'clube', label: 'Clube e Pix', Icon: Gift },
    { to: 'equipe', label: 'Equipe', Icon: Users },
    { to: 'horarios', label: 'Horários', Icon: Clock },
  ] },
  { title: 'Presença', tabs: [
    { to: 'perfil', label: 'Perfil', Icon: Store },
    { to: 'fotos', label: 'Fotos', Icon: Image },
    { to: 'avaliacoes', label: 'Avaliações', Icon: Star },
    { to: 'divulgar', label: 'Divulgar', Icon: QrCode },
  ] },
];
const ALL_TABS = [...GROUPS.flatMap((g) => g.tabs), { to: 'plano', label: 'Plano', Icon: Crown } as Tab];
const PHONE_TABS = ['', 'pedidos', 'agenda', 'clube'];

function NavItem({ t, pending, onClick, phone }: { t: Tab; pending: number; onClick?: () => void; phone?: boolean }) {
  return (
    <NavLink to={t.to} end={t.end} onClick={onClick}
      className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 text-[15px] transition-colors duration-150 ${phone ? 'min-h-[48px]' : 'min-h-[36px] text-sm'} ${isActive ? 'bg-brand-50 font-medium text-brand-900' : 'text-[#374151] hover:bg-raised'}`}>
      {({ isActive }) => (
        <>
          <t.Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-700' : 'text-muted'}`} strokeWidth={1.75} aria-hidden="true" />
          <span className="flex-1">{t.label}</span>
          {t.to === 'pedidos' && pending > 0 && <span className="num min-w-[20px] rounded-full bg-danger-700 px-1.5 text-center text-xs font-semibold leading-5 text-white" aria-label={`${pending} aguardando`}>{pending}</span>}
        </>
      )}
    </NavLink>
  );
}

function SectionsNav({ pending, onPick, phone }: { pending: number; onPick?: () => void; phone?: boolean }) {
  return (
    <nav aria-label="Seções do painel" className="flex flex-col gap-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1 px-3 text-xs text-muted">{g.title}</p>
          <div className="flex flex-col gap-0.5">{g.tabs.map((t) => <NavItem key={t.label} t={t} pending={pending} onClick={onPick} phone={phone} />)}</div>
        </div>
      ))}
      <div className="flex flex-col gap-0.5 border-t border-line pt-3">
        <NavItem t={ALL_TABS.at(-1)!} pending={0} onClick={onPick} phone={phone} />
      </div>
    </nav>
  );
}

function BusinessSwitcher({ b }: { b: { id: string; name: string } }) {
  const mine = useMyBusinesses();
  const nav = useNavigate();
  if (!mine.data || mine.data.length < 2) return <p className="truncate text-[15px] font-semibold">{b.name}</p>;
  return (
    <label className="block min-w-0">
      <span className="sr-only">Empresa</span>
      <select value={b.id} onChange={(e) => nav(`/empresas/${e.target.value}`)}
        className="w-full truncate rounded-xl border border-control bg-card px-2 py-1.5 text-[15px] font-semibold">
        {mine.data.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </label>
  );
}

export function BusinessPanelLayout() {
  const { businessId } = useParams();
  const biz = usePanelBusiness(businessId);
  const reqs = usePanelRequests(businessId);
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  const pending = reqs.data?.filter((r) => r.status === 'requested' || r.status === 'sent').length ?? 0;
  if (biz.isLoading) return <PageLoader />;
  if (biz.isError || !biz.data) return <div className="container-app py-8"><Alert tone="error">{(biz.error as Error)?.message ?? 'Empresa não encontrada.'}</Alert></div>;
  const b = biz.data;
  // Teste grátis acabou sem assinatura: o painel fica bloqueado (só a aba Plano abre).
  const locked = !b.isDemo && b.plan.effective === 'free';
  const onPlan = /\/plano\/?$/.test(loc.pathname);
  // Título da tela (o Início tem o seu próprio, com o resumo do dia)
  const seg = loc.pathname.replace(/\/+$/, '').split('/').slice(3)[0] ?? '';
  const screenTitle = seg ? ALL_TABS.find((t) => t.to === seg)?.label : null;
  const trialDays = b.plan.trial && b.plan.until ? Math.max(0, Math.ceil((new Date(b.plan.until).getTime() - Date.now()) / 86_400_000)) : null;
  const publicLink = (
    <a href={`/empresa/${b.slug}`} target="_blank" rel="noopener" className="inline-flex min-h-[36px] items-center gap-1 rounded-xl px-3 text-sm text-muted hover:bg-raised hover:text-ink">
      Ver página pública <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">(abre em nova aba)</span>
    </a>
  );

  return (
    <div className="lg:flex">
      {/* Computador: barra lateral no fundo da página, separada por uma linha fina */}
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col overflow-y-auto border-r border-line px-2 py-5 lg:flex">
        <NavLink to="/empresas" className="mb-4 px-3" aria-label="Pataí para empresas"><Logo /></NavLink>
        <div className="mb-1 px-3"><BusinessSwitcher b={b} /></div>
        <div className="mb-5">{publicLink}</div>
        {locked ? <div className="flex flex-col gap-0.5"><NavItem t={ALL_TABS.at(-1)!} pending={0} /></div> : <SectionsNav pending={pending} />}
        <NavLink to="/" className="mt-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 pt-6 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao app
        </NavLink>
      </aside>

      {/* Celular e tablet: barra de 52px com o nome da empresa e o menu */}
      <header className="sticky top-0 z-30 flex h-[52px] items-center gap-2 border-b border-line bg-card px-2 lg:hidden">
        <button onClick={() => setMenu(true)} aria-label="Menu do painel" aria-expanded={menu}
          className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-raised">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1"><BusinessSwitcher b={b} /></div>
        <a href={`/empresa/${b.slug}`} target="_blank" rel="noopener" aria-label="Ver página pública (abre em nova aba)"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-raised"><ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /></a>
      </header>
      <Sheet open={menu} onClose={() => setMenu(false)} title="Painel da empresa">
        {locked ? <NavItem t={ALL_TABS.at(-1)!} pending={0} onClick={() => setMenu(false)} phone /> : <SectionsNav pending={pending} onPick={() => setMenu(false)} phone />}
        <NavLink to="/" className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm text-muted"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao app</NavLink>
      </Sheet>

      <div className="min-w-0 flex-1 pb-24 lg:pb-10">
        {b.status === 'suspended' && (
          <div className="mx-auto max-w-5xl px-4 pt-5 md:px-8">
            <Alert tone="error" title="Empresa suspensa">
              Sua empresa não aparece para os clientes no momento.{b.suspendedReason ? ` Motivo: ${b.suspendedReason}.` : ''} Fale com o suporte para regularizar.
            </Alert>
          </div>
        )}
        {trialDays != null && !onPlan && (
          <div className="mx-auto max-w-5xl px-4 pt-5 md:px-8">
            <Alert tone={trialDays <= 5 ? 'warning' : 'info'} title={trialDays === 0 ? 'Seu teste grátis termina hoje' : `Teste grátis: ${trialDays} ${trialDays === 1 ? 'dia restante' : 'dias restantes'}`}
              action={<ButtonLink size="sm" to="plano">Assinar</ButtonLink>}>
              Depois do teste, a empresa só continua no app com o Plano Pataí ({formatCents(PLANS.pro.priceCents)}/mês). Assine agora e a primeira cobrança só vem no fim do teste.
            </Alert>
          </div>
        )}
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {locked && !onPlan ? (
            <section className="card p-6 text-center" data-testid="panel-locked">
              <h1 className="text-xl font-semibold">Assine para usar o Pataí</h1>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Sua empresa está fora do app: não aparece na busca e não recebe agendamentos. Assine o Plano Pataí por {formatCents(PLANS.pro.priceCents)}/mês
                e tudo volta na hora. Perfil, avaliações, serviços e histórico continuam guardados.
              </p>
              <ButtonLink className="mt-4" to="plano">Ver assinatura</ButtonLink>
            </section>
          ) : (
            <>
              {screenTitle && <h1 className="mb-5 text-2xl font-bold">{screenTitle}</h1>}
              <Outlet context={b} />
            </>
          )}
        </div>
      </div>

      {/* Celular: atalhos para o dia a dia; o resto fica no menu */}
      {!locked && (
        <nav aria-label="Atalhos do painel" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card lg:hidden">
          <ul className="grid grid-cols-5">
            {ALL_TABS.filter((t) => PHONE_TABS.includes(t.to)).map((t) => (
              <li key={t.label}>
                <NavLink to={t.to} end={t.end}
                  className={({ isActive }) => `pressable relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11.5px] ${isActive ? 'font-semibold text-brand-900' : 'font-medium text-muted'}`}>
                  {({ isActive }) => (
                    <>
                      <t.Icon className={`h-[22px] w-[22px] ${isActive ? 'text-brand-700' : ''}`} strokeWidth={isActive ? 2.1 : 1.75} aria-hidden="true" />
                      {t.label === 'Clube e Pix' ? 'Clube' : t.label}
                      {t.to === 'pedidos' && pending > 0 && <span className="num absolute right-[22%] top-2 min-w-[18px] rounded-full bg-danger-700 px-1 text-center text-[11px] font-semibold leading-[18px] text-white">{pending}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button onClick={() => setMenu(true)} className="pressable flex min-h-[58px] w-full flex-col items-center justify-center gap-1 text-[11.5px] font-medium text-muted">
                <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden="true" />Mais
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

// Painel do negócio (Admin): quantas pessoas usam o app, quem voltou, quem assina (e por qual loja),
// quanto entra por mês (estimado pelo preço de tabela) e os pagamentos e cadastros mais recentes.
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from '../components/ui';
import { http, ApiError } from '../lib/social/api';

interface Dash {
  usuarios: { total: number; novosHoje: number; novos7: number; novos30: number; ativosHoje: number; ativos7: number; ativos30: number; menores: number };
  serie: { dia: string; novos: number; ativos: number }[];
  assinantes: { plusAtivos: number; googleMensal: number; googleAnual: number; appleMensal: number; appleAnual: number; guardiao: number; teste: number };
  mrrCents: number;
  guardiao30Cents: number;
  pagamentos: { loja: string; plano: string; nome: string | null; email: string | null; quando: string; vence: string | null; ativo: boolean }[];
  recentes: { nome: string; email: string; idade: string; origem: string; criado: string; visto: string | null; plus: boolean }[];
}

const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const plano = (p: string) => (p.includes('anual') ? 'Anual' : p.includes('mensal') ? 'Mensal' : p);
const dia = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function Kpi({ n, label, hint, tone }: { n: string | number; label: string; hint?: string; tone?: string }) {
  return (
    <div className="ad-kpi" style={tone ? { background: tone } : undefined}>
      <b>{n}</b>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

/** Barras dos últimos 30 dias: cadastros (cor forte) e pessoas que abriram o app (cor clara). */
function Chart({ serie }: { serie: Dash['serie'] }) {
  const max = Math.max(1, ...serie.map((d) => Math.max(d.novos, d.ativos)));
  const W = 300;
  const H = 110;
  const bw = W / serie.length;
  return (
    <div className="ad-card">
      <div className="ad-card-head">
        <b>Últimos 30 dias</b>
        <span className="ad-legend">
          <i className="is-act" /> abriram o app <i className="is-new" /> cadastros
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="ad-chart" role="img" aria-label="Cadastros e pessoas ativas por dia nos últimos 30 dias">
        {serie.map((d, i) => {
          const ha = (d.ativos / max) * H;
          const hn = (d.novos / max) * H;
          return (
            <g key={d.dia}>
              <title>{`${dia(d.dia)}: ${d.ativos} abriram, ${d.novos} cadastros`}</title>
              <rect x={i * bw + 1} y={H - ha} width={bw - 2} height={ha} rx={2} className="ad-bar-act" />
              <rect x={i * bw + bw * 0.25} y={H - hn} width={bw * 0.5} height={hn} rx={2} className="ad-bar-new" />
            </g>
          );
        })}
        <text x={0} y={H + 12} className="ad-axis">{dia(serie[0]?.dia ?? '')}</text>
        <text x={W} y={H + 12} textAnchor="end" className="ad-axis">hoje</text>
      </svg>
    </div>
  );
}

export function AdminDashboard() {
  const [d, setD] = useState<Dash | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => {
    setBusy(true);
    http<{ dashboard: Dash }>('GET', '/admin/dashboard')
      .then((r) => setD(r.dashboard))
      .catch((e) => toast(e instanceof ApiError ? e.message : 'Não deu para carregar o painel.'))
      .finally(() => setBusy(false));
  };
  useEffect(load, []);
  if (!d) return <p className="text-muted">Carregando o painel…</p>;
  const u = d.usuarios;
  const a = d.assinantes;
  const pagos = a.googleMensal + a.googleAnual + a.appleMensal + a.appleAnual;
  const conv = u.total ? ((pagos / u.total) * 100).toFixed(1).replace('.', ',') : '0';
  const voltam = u.ativos30 ? Math.round((u.ativos7 / u.ativos30) * 100) : 0;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-muted">Atualizado agora · valores em reais</p>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={busy}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <h2 className="ad-h">Pessoas</h2>
      <div className="ad-grid">
        <Kpi n={u.total} label="Contas criadas" hint={`+${u.novosHoje} hoje · +${u.novos7} na semana`} />
        <Kpi n={u.ativosHoje} label="Abriram hoje" hint={`${u.ativos7} na semana · ${u.ativos30} no mês`} />
        <Kpi n={u.novos30} label="Novos em 30 dias" />
        <Kpi n={`${voltam}%`} label="Voltam toda semana" hint="ativos 7 dias ÷ ativos 30 dias" />
      </div>
      <Chart serie={d.serie} />

      <h2 className="ad-h">Assinantes e dinheiro</h2>
      <div className="ad-grid">
        <Kpi n={brl(d.mrrCents)} label="Receita por mês (estimada)" hint="preço cheio, antes da taxa da loja" tone="#E6F7E9" />
        <Kpi n={pagos} label="Assinantes pagantes" hint={`${conv}% das contas`} tone="#FFF4D6" />
        <Kpi n={a.plusAtivos} label="Com Lumbi+ agora" hint="inclui teste grátis e Guardiões" />
        <Kpi n={a.teste} label="No teste grátis" />
      </div>
      <div className="ad-card">
        <div className="ad-card-head">
          <b>De onde vêm os assinantes</b>
        </div>
        <ul className="ad-list">
          <li>
            <span>Google Play · mensal</span>
            <b>{a.googleMensal}</b>
          </li>
          <li>
            <span>Google Play · anual</span>
            <b>{a.googleAnual}</b>
          </li>
          <li>
            <span>App Store · mensal</span>
            <b>{a.appleMensal}</b>
          </li>
          <li>
            <span>App Store · anual</span>
            <b>{a.appleAnual}</b>
          </li>
          <li>
            <span>Presente de Guardião</span>
            <b>{a.guardiao}</b>
          </li>
          <li>
            <span>Guardiões (Pix/cartão) nos últimos 30 dias</span>
            <b>{brl(d.guardiao30Cents)}</b>
          </li>
        </ul>
      </div>

      <h2 className="ad-h">Pagamentos recentes</h2>
      <div className="ad-card">
        {d.pagamentos.length === 0 ? (
          <p className="text-[14px] text-muted">Ainda nenhum pagamento. Quando alguém assinar, aparece aqui.</p>
        ) : (
          <ul className="ad-rows">
            {d.pagamentos.map((p, i) => (
              <li key={i}>
                <div className="min-w-0">
                  <b>{p.nome || p.email || 'Conta apagada'}</b>
                  <small>
                    {p.loja} · {plano(p.plano)} · {p.quando}
                  </small>
                </div>
                <span className={`ad-pill ${p.ativo ? 'is-on' : ''}`}>{p.ativo ? (p.vence ? `até ${dia(p.vence)}` : 'pago') : 'cancelado'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="ad-h">Últimos cadastros</h2>
      <div className="ad-card">
        <ul className="ad-rows">
          {d.recentes.map((r, i) => (
            <li key={i}>
              <div className="min-w-0">
                <b>{r.nome || 'Sem nome'}</b>
                <small>
                  {r.email} · {r.criado} · veio de: {r.origem}
                  {r.idade !== '18mais' ? ' · menor' : ''}
                </small>
              </div>
              <span className={`ad-pill ${r.plus ? 'is-on' : ''}`}>{r.plus ? 'Lumbi+' : r.visto ? `visto ${dia(r.visto)}` : 'novo'}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[12px] text-muted">
        "Abriram" conta quem entrou com conta no app no dia. A receita é uma estimativa: soma as assinaturas ativas pelo preço da tabela (R$ 10,00 por mês e R$ 65,90 por ano ÷ 12). O valor exato, com taxas e impostos, fica no Play Console (Relatórios financeiros) e no App Store Connect.
      </p>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Empty, Seg, toast } from '../components/ui';
import { http, ApiError } from '../lib/social/api';
import { addDays } from '../lib/util';
import { todayKey } from '../lib/store';
import { AdminGame } from './AdminGame';

type Tab = 'resumo' | 'denuncias' | 'usuarios' | 'eventos' | 'jogo';

const STAT_LABEL: Record<string, string> = {
  usuarios: 'Usuários',
  ativos7: 'Ativos (7 dias)',
  novos7: 'Novos (7 dias)',
  plus: 'Com Plus',
  menores: 'Menores de 18',
  amizades: 'Amizades',
  posts7: 'Posts (7 dias)',
  comentarios7: 'Comentários (7 dias)',
  denunciasAbertas: 'Denúncias abertas',
  ocultados: 'Conteúdos ocultos',
  banidos: 'Contas suspensas',
};

/** Painel de administração (só aparece para quem tem papel de admin no servidor). */
export function Admin({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('resumo');
  // Fora da gaveta de Ajustes (uma gaveta com animação prende o "fixed" dentro dela).
  return createPortal(
    <div className="fullscreen admin-screen" role="dialog" aria-modal="true" aria-label="Administração">
      <div className="mx-auto grid max-w-[560px] gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[26px] font-bold">Administração</h1>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <Seg value={tab} onChange={setTab} label="Seções" options={[{ id: 'resumo', label: 'Resumo' }, { id: 'denuncias', label: 'Denúncias' }, { id: 'usuarios', label: 'Usuários' }, { id: 'eventos', label: 'Eventos' }, { id: 'jogo', label: 'Jogo' }]} />
        {tab === 'resumo' && <Stats />}
        {tab === 'denuncias' && <Reports />}
        {tab === 'usuarios' && <Users />}
        {tab === 'eventos' && <Events />}
        {tab === 'jogo' && <AdminGame />}
      </div>
    </div>,
    document.body,
  );
}

const fail = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');

function Stats() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    http<{ stats: Record<string, number> }>('GET', '/admin/stats').then((r) => setStats(r.stats)).catch(fail);
  }, []);
  if (!stats) return <p className="text-muted">Carregando…</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(STAT_LABEL).map(([k, label]) => (
        <div key={k} className={`card p-3 ${k === 'denunciasAbertas' && stats[k] > 0 ? 'ring-2 ring-[var(--danger)]' : ''}`}>
          <p className="font-display text-[26px] font-bold leading-none tabular-nums">{stats[k] ?? 0}</p>
          <p className="text-[13px] font-bold text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

interface ReportRow {
  type: 'post' | 'comment' | 'user';
  targetId: string;
  total: number;
  reasons: string[];
  content: string | null;
  hasImage: boolean;
  hidden: boolean;
  targetUser: string | null;
}

function Reports() {
  const [list, setList] = useState<ReportRow[] | null>(null);
  const load = useCallback(() => http<{ reports: ReportRow[] }>('GET', '/admin/reports').then((r) => setList(r.reports)).catch(fail), []);
  useEffect(() => {
    load();
  }, [load]);
  if (!list) return <p className="text-muted">Carregando…</p>;
  if (!list.length) return <Empty>Nenhuma denúncia aberta. Comunidade em paz.</Empty>;
  const act = async (r: ReportRow, action: 'remover' | 'manter') => {
    try {
      await http('POST', '/admin/reports/resolve', { type: r.type, targetId: r.targetId, action });
      toast(action === 'remover' ? 'Removido' : 'Mantido');
      load();
    } catch (e) {
      fail(e);
    }
  };
  return (
    <ul className="grid gap-2">
      {list.map((r) => (
        <li key={`${r.type}:${r.targetId}`} className="card grid gap-2 p-3">
          <p className="text-[13px] font-extrabold uppercase text-muted">
            {r.type === 'post' ? 'Post' : r.type === 'comment' ? 'Comentário' : 'Perfil'} · {r.total} {r.total === 1 ? 'denúncia' : 'denúncias'} {r.hidden && '· já oculto'}
          </p>
          {r.content && <p className="rounded-xl bg-surface2 p-2 text-[15px]">“{r.content}”</p>}
          {r.hasImage && <p className="text-[13px] text-muted">Contém foto real.</p>}
          <p className="text-[13px] text-muted">
            Autor: {r.targetUser ?? 'desconhecido'} · Motivos: {r.reasons.join(', ')}
          </p>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm flex-1" onClick={() => act(r, 'remover')}>
              {r.type === 'user' ? 'Suspender conta' : 'Remover'}
            </button>
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => act(r, 'manter')}>
              Manter
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  ageGroup: string;
  role: string;
  premiumUntil: string | null;
  banned: boolean;
  createdAt: string;
  lastSeen: string;
}

function Users() {
  const [q, setQ] = useState('');
  const [list, setList] = useState<UserRow[] | null>(null);
  const load = useCallback(() => http<{ users: UserRow[] }>('GET', `/admin/users?q=${encodeURIComponent(q)}`).then((r) => setList(r.users)).catch(fail), [q]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);
  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
    } catch (e) {
      fail(e);
    }
  };
  return (
    <div className="grid gap-3">
      <label className="sr-only" htmlFor="adm-q">
        Buscar por nome ou e-mail
      </label>
      <input id="adm-q" className="field" placeholder="Buscar por nome, e-mail ou código (HAMI-…)" value={q} onChange={(e) => setQ(e.target.value)} />
      {list?.map((u) => (
        <div key={u.id} className="card grid gap-2 p-3">
          <p className="font-bold leading-tight">
            {u.name} <span className="text-[13px] font-semibold text-muted">· {u.email}</span>
          </p>
          <p className="text-[13px] text-muted">
            {u.ageGroup === '18mais' ? '18+' : u.ageGroup === '13a17' ? '13–17' : 'até 12'} · desde {u.createdAt} · visto {u.lastSeen}
            {u.role === 'admin' && ' · admin'} {u.premiumUntil && ` · Plus até ${u.premiumUntil}`} {u.banned && ' · SUSPENSO'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-soft btn-sm" onClick={() => run(() => http('POST', `/admin/users/${u.id}/premium`, { until: addDays(todayKey(), 30) }), 'Plus por 30 dias')}>
              +30 dias de Plus
            </button>
            <button className="btn btn-soft btn-sm" onClick={() => run(() => http('POST', `/admin/users/${u.id}/premium`, { until: addDays(todayKey(), 365) }), 'Plus por 1 ano')}>
              Plus por 1 ano
            </button>
            {u.premiumUntil && (
              <button className="btn btn-ghost btn-sm" onClick={() => run(() => http('POST', `/admin/users/${u.id}/premium`, { until: null }), 'Plus removido')}>
                Tirar Plus
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => run(() => http('POST', `/admin/users/${u.id}/ban`, { banned: !u.banned }), u.banned ? 'Conta reativada' : 'Conta suspensa')}>
              {u.banned ? 'Reativar' : 'Suspender'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface EventRow {
  id: string;
  title: string;
  description: string;
  startsOn: string;
  endsOn: string;
  rewardCoins: number;
  claims: number;
}

function Events() {
  const [list, setList] = useState<EventRow[] | null>(null);
  const [form, setForm] = useState({ title: '', description: '', startsOn: todayKey(), endsOn: addDays(todayKey(), 7), rewardCoins: 30 });
  const load = useCallback(() => http<{ events: EventRow[] }>('GET', '/admin/events').then((r) => setList(r.events)).catch(fail), []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="grid gap-3">
      <form
        className="card grid gap-2 p-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await http('POST', '/admin/events', { ...form, itemId: null });
            toast('Evento criado');
            setForm({ ...form, title: '', description: '' });
            load();
          } catch (err) {
            fail(err);
          }
        }}
      >
        <p className="font-display text-[18px] font-bold">Novo evento ou missão especial</p>
        <input aria-label="Título" className="field" placeholder="Ex.: Semana da água" maxLength={60} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input aria-label="Descrição" className="field" placeholder="O que fazer para ganhar" maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input aria-label="Início" type="date" className="field !px-2" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} />
          <input aria-label="Fim" type="date" className="field !px-2" value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} />
          <input aria-label="Sementes de recompensa" type="number" min={0} max={500} className="field !px-2" value={form.rewardCoins} onChange={(e) => setForm({ ...form, rewardCoins: Number(e.target.value) || 0 })} />
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={!form.title.trim()}>
          Criar evento
        </button>
      </form>
      {list?.map((ev) => (
        <div key={ev.id} className="card flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold">{ev.title}</p>
            <p className="text-[13px] text-muted">
              {ev.startsOn} a {ev.endsOn} · 🌻 {ev.rewardCoins} · {ev.claims} resgates
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={async () => (await http('DELETE', `/admin/events/${ev.id}`).catch(fail), load())}>
            Apagar
          </button>
        </div>
      ))}
    </div>
  );
}

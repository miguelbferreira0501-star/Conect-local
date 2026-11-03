import { useEffect, useState } from 'react';
import { Cloud, LogOut, Shield } from 'lucide-react';
import { Modal, Seg, toast } from '../components/ui';
import { Hamster } from '../components/Hamster';
import { deleteAccount, login, logout, onSyncChoice, register, resolveChoice, useAccount, type SyncChoice, type User } from '../lib/account';
import { ApiError } from '../lib/social/api';
import { useApp } from '../lib/store';
import { formatDay } from '../lib/util';
import { Group } from './Settings';
import { Admin } from './Admin';

/** Conta e backup na nuvem. Fora do app instalado (página de teste), explica o que muda com a conta. */
export function AccountSection() {
  const { user, ready, online } = useAccount();
  const [admin, setAdmin] = useState(false);
  if (!ready) return null;
  return (
    <Group title="Conta e nuvem">
      {!online ? (
        <p className="rounded-2xl bg-surface2 p-3 text-[14px] text-muted">
          A conta fica disponível no app instalado do HamiCare. Nesta versão de teste, seu progresso fica salvo neste aparelho e no código de backup.
        </p>
      ) : user ? (
        <LoggedIn user={user} onAdmin={() => setAdmin(true)} />
      ) : (
        <AuthForm />
      )}
      <SyncChoiceModal />
      {admin && <Admin onClose={() => setAdmin(false)} />}
    </Group>
  );
}

function LoggedIn({ user, onAdmin }: { user: User; onAdmin: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState('');
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3">
        <Cloud className="shrink-0 text-leaf" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{user.email}</p>
          <p className="text-[13px] text-muted">Backup automático ligado{user.premiumUntil ? ` · Plus até ${formatDay(user.premiumUntil, { day: 'numeric', month: 'short' })}` : ''}</p>
        </div>
      </div>
      {user.role === 'admin' && (
        <button className="btn btn-soft" onClick={onAdmin}>
          <Shield size={18} /> Painel de administração
        </button>
      )}
      <button className="btn btn-ghost" onClick={async () => (await logout(), toast('Você saiu da conta. O progresso continua neste aparelho.'))}>
        <LogOut size={18} /> Sair da conta
      </button>
      {confirm ? (
        <div className="grid gap-2 rounded-2xl bg-accent-soft p-3">
          <p className="font-bold">Excluir a conta apaga backup, amigos, posts e presentes no servidor. Digite sua senha para confirmar.</p>
          <input aria-label="Senha" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              disabled={!password}
              onClick={async () => {
                try {
                  await deleteAccount(password);
                  toast('Conta excluída.');
                } catch (e) {
                  toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');
                }
              }}
            >
              Excluir conta
            </button>
            <button className="btn btn-ghost btn-sm flex-1" onClick={() => setConfirm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button className="text-left text-[14px] font-bold text-muted underline underline-offset-4" onClick={() => setConfirm(true)}>
          Excluir minha conta
        </button>
      )}
    </div>
  );
}

function AuthForm() {
  const s = useApp();
  const [mode, setMode] = useState<'entrar' | 'criar'>('criar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const isKid = s.profile.ageGroup === 'ate12';
  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = mode === 'criar' ? await register({ name: s.profile.name || 'Alguém', email, password, ageGroup: s.profile.ageGroup, guardianConsent: isKid }) : await login(email, password);
          if (r !== 'escolher') toast(r === 'nuvem' ? 'Progresso recuperado da nuvem!' : 'Conta pronta. Seu progresso está salvo na nuvem.');
        } catch (err) {
          toast(err instanceof ApiError ? err.message : 'Não deu certo agora.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-[14px] text-muted">Com conta, seu progresso é salvo na nuvem automaticamente e você pode adicionar amigos.</p>
      <Seg value={mode} onChange={setMode} label="Conta" options={[{ id: 'criar', label: 'Criar conta' }, { id: 'entrar', label: 'Já tenho conta' }]} />
      <label className="grid gap-1" htmlFor="acc-email">
        <span className="text-[14px] font-extrabold">E-mail</span>
        <input id="acc-email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="grid gap-1" htmlFor="acc-pass">
        <span className="text-[14px] font-extrabold">Senha</span>
        <input id="acc-pass" type="password" autoComplete={mode === 'criar' ? 'new-password' : 'current-password'} minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {mode === 'criar' && (
        <label className="flex items-start gap-3 text-[14px]" htmlFor="acc-terms">
          <input id="acc-terms" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            Li e aceito os termos e a política de privacidade.{isKid && ' Sou o responsável e autorizo o uso.'} Peso, diário e humor ficam só no meu backup privado.
          </span>
        </label>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy || !email || password.length < 8 || (mode === 'criar' && !terms)}>
        {mode === 'criar' ? 'Criar conta' : 'Entrar'}
      </button>
    </form>
  );
}

function SyncChoiceModal() {
  const [choice, setChoice] = useState<SyncChoice>(null);
  useEffect(() => onSyncChoice(setChoice), []);
  if (!choice) return null;
  const card = (st: typeof choice.server, label: string, keep: 'nuvem' | 'aparelho') => (
    <button className="opt" onClick={async () => (await resolveChoice(keep, choice.server), setChoice(null), toast('Pronto! O backup está em dia.'))}>
      <Hamster fur={st.pet.fur} grams={st.pet.grams} phase={st.pet.phase} outfit={st.pet.outfit} size={56} idle={false} />
      <span className="min-w-0">
        <span className="block">{label}</span>
        <span className="block text-[13px] font-semibold text-muted">
          {st.pet.name} · {Object.keys(st.days ?? {}).length} dias registrados
        </span>
      </span>
    </button>
  );
  return (
    <Modal open onClose={() => {}} label="Qual progresso manter?">
      <div className="grid gap-3 p-5">
        <h2 className="font-display text-[22px] font-bold">Qual progresso manter?</h2>
        <p className="text-[14px] text-muted">Esta conta já tem um Hami salvo na nuvem, diferente do deste aparelho.</p>
        {card(choice.server, 'O da nuvem', 'nuvem')}
        {card(choice.local, 'O deste aparelho', 'aparelho')}
      </div>
    </Modal>
  );
}

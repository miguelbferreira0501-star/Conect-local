import { useEffect, useState } from 'react';
import { Cloud, LogOut, Shield } from 'lucide-react';
import { Modal, Seg, toast } from '../components/ui';
import { Hamster } from '../components/Hamster';
import { LegalLinks } from '../components/Legal';
import { deleteAccount, login, logout, onSyncChoice, register, requestReset, resolveChoice, useAccount, type SyncChoice, type User } from '../lib/account';
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
  const [health, setHealth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const isKid = s.profile.ageGroup === 'ate12';
  if (forgot) return <ForgotForm initialEmail={email} onBack={() => setForgot(false)} />;
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
      <p className="text-[14px] text-muted">Com conta, seu progresso é salvo na nuvem automaticamente e você pode adicionar amigos. Sem conta, tudo fica só neste aparelho.</p>
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
        <>
          <div className="flex items-start gap-3 text-[14px]">
            <input id="acc-terms" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span className="min-w-0">
              <label htmlFor="acc-terms">Li e aceito os </label>
              <LegalLinks />.{isKid && <label htmlFor="acc-terms"> Sou o responsável e autorizo o uso.</label>}
            </span>
          </div>
          <label className="flex items-start gap-3 text-[14px]" htmlFor="acc-health">
            <input id="acc-health" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" checked={health} onChange={(e) => setHealth(e.target.checked)} />
            <span className="min-w-0">
              Autorizo guardar meus dados de saúde (peso, calorias, humor, sono e diário) no meu backup privado. Só eu vejo, e posso apagar quando quiser.
            </span>
          </label>
        </>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy || !email || password.length < 8 || (mode === 'criar' && !(terms && health))}>
        {mode === 'criar' ? 'Criar conta' : 'Entrar'}
      </button>
      {mode === 'entrar' && (
        <button type="button" className="justify-self-center text-[14px] font-extrabold text-muted underline underline-offset-4" onClick={() => setForgot(true)}>
          Esqueci minha senha
        </button>
      )}
    </form>
  );
}

/** Pede o link de troca de senha por e-mail. */
function ForgotForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="grid gap-3" role="status">
        <div className="rounded-2xl bg-surface2 p-4 text-center">
          <p className="text-[34px] leading-none" aria-hidden="true">
            💌
          </p>
          <p className="mt-2 font-display text-[19px] font-bold">Confira seu e-mail</p>
          <p className="mt-1 text-[14px] text-muted">
            Se existir uma conta com <b className="break-all text-ink">{email}</b>, mandamos um link para criar uma senha nova. Ele vale por 1 hora. Olhe também a caixa de spam.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>
          Voltar para entrar
        </button>
      </div>
    );
  }
  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await requestReset(email.trim());
          setSent(true);
        } catch (err) {
          toast(err instanceof ApiError ? err.message : 'Não deu certo agora.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="font-display text-[19px] font-bold">Esqueci minha senha</p>
      <p className="text-[14px] text-muted">Digite o e-mail da sua conta. Vamos mandar um link para você criar uma senha nova.</p>
      <label className="grid gap-1" htmlFor="forgot-email">
        <span className="text-[14px] font-extrabold">E-mail</span>
        <input id="forgot-email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}>
        {busy ? 'Enviando…' : 'Mandar link'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        Voltar
      </button>
    </form>
  );
}

export function SyncChoiceModal() {
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

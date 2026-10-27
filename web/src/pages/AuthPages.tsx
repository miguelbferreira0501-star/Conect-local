import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { BRAND, loginSchema, registerSchema } from '@conecta/shared';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useConfig } from '@/lib/queries';
import { Logo, PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Checkbox, TextField } from '@/components/ui/Form';

/** Só aceitamos redirecionamentos internos (evita "open redirect"). */
function safeBack(v: string | null) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

function PasswordField({ label, value, onChange, error, autoComplete, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextField label={label} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} error={error} autoComplete={autoComplete} hint={hint} className={`field pr-12 ${error ? 'field-error' : ''}`} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-1 top-[30px] inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-raised">
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

const REASONS: Record<string, string> = { favoritos: 'Entre para salvar empresas nos favoritos.' };

export function LoginPage() {
  const [sp] = useSearchParams();
  const back = safeBack(sp.get('voltar'));
  const { login } = useAuth();
  const nav = useNavigate();
  const config = useConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path[0] as string] ??= i.message;
      return setErrors(f);
    }
    setErrors({});
    setLoading(true);
    try {
      await login(parsed.data);
      nav(back, { replace: true });
    } catch (err) {
      setApiError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Entrar" />
      <div className="container-app max-w-md py-8">
        <div className="mb-6 text-center"><Logo /></div>
        {sp.get('motivo') && REASONS[sp.get('motivo')!] && <div className="mb-4"><Alert>{REASONS[sp.get('motivo')!]}</Alert></div>}
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="E-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <PasswordField label="Senha" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
          {apiError && <Alert tone="error">{apiError}</Alert>}
          <Button type="submit" block size="lg" loading={loading}>Entrar</Button>
        </form>
        <p className="mt-6 text-center text-muted">
          Ainda não tem conta? <Link to={`/criar-conta?voltar=${encodeURIComponent(back)}`} className="font-semibold text-brand-fg hover:underline">Criar conta grátis</Link>
        </p>
        {config.data?.demoMode && (
          <div className="mt-6">
            <Alert tone="warning" title="Conta de demonstração"
              action={<Button size="sm" variant="secondary" onClick={() => { setEmail('demo@conectalocal.app'); setPassword('Demo1234'); }}>Preencher dados de teste</Button>}>
              E-mail <strong>demo@conectalocal.app</strong> e senha <strong>Demo1234</strong>. Já tem agendamentos e favoritos de exemplo.
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [sp] = useSearchParams();
  const back = safeBack(sp.get('voltar'));
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path[0] as string] ??= i.message;
      return setErrors(f);
    }
    setErrors({});
    setLoading(true);
    try {
      await register(parsed.data);
      nav(back, { replace: true });
    } catch (err) {
      const ae = err as ApiError;
      if (ae.fields) setErrors(ae.fields);
      setApiError(ae.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Criar conta" />
      <div className="container-app max-w-md py-8">
        <h2 className="text-xl font-semibold">Leva menos de um minuto</h2>
        <p className="mb-5 mt-1 text-muted">Com a conta você salva favoritos, agenda serviços e avalia empresas.</p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Seu nome" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <TextField label="E-mail" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <PasswordField label="Crie uma senha" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={errors.password} autoComplete="new-password" hint="Pelo menos 8 caracteres, com letras e números." />
          <div>
            <Checkbox checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
              label={<>Li e aceito os <Link to="/termos" className="font-semibold text-brand-fg underline">termos de uso e a política de privacidade</Link> do {BRAND.name}.</>} />
            {errors.acceptTerms && <p className="text-sm text-danger-700">{errors.acceptTerms}</p>}
          </div>
          {apiError && <Alert tone="error">{apiError}</Alert>}
          <Button type="submit" block size="lg" loading={loading}>Criar conta</Button>
        </form>
        <p className="mt-6 text-center text-muted">
          Já tem conta? <Link to={`/entrar?voltar=${encodeURIComponent(back)}`} className="font-semibold text-brand-fg hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

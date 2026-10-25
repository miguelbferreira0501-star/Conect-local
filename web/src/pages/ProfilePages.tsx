import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, FileText, Info, LogOut, MapPin, ShieldCheck, Star, Store, Trash2, UserRound } from 'lucide-react';
import { BRAND, profileUpdateSchema, relativeTime, REVIEW_RULES, reviewUpdateSchema } from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useUserLocation } from '@/lib/location';
import { useMyReviews } from '@/lib/queries';
import { storage } from '@/lib/storage';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Checkbox, TextArea, TextField } from '@/components/ui/Form';
import { Stars, StarInput } from '@/components/ui/Rating';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tags';
import { useToast } from '@/components/ui/Toast';

function MenuItem({ to, icon: Icon, label, hint }: { to: string; icon: typeof Star; label: string; hint?: string }) {
  return (
    <li>
      <Link to={to} className="flex min-h-[60px] items-center gap-3 px-4 py-2 hover:bg-surface">
        <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <span className="flex-1"><span className="block font-medium">{label}</span>{hint && <span className="text-sm text-muted">{hint}</span>}</span>
        <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const { city, openPicker } = useUserLocation();
  const nav = useNavigate();
  if (loading) return <PageLoader />;
  return (
    <div>
      <PageHeader title="Perfil" back={false} />
      <div className="container-app max-w-2xl space-y-5 py-5">
        {user ? (
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-xl font-semibold text-white" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Você está navegando sem conta</h2>
            <p className="mt-1 text-muted">Crie uma conta para salvar favoritos, agendar e avaliar empresas.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink to="/entrar?voltar=/perfil">Entrar</ButtonLink>
              <ButtonLink to="/criar-conta?voltar=/perfil" variant="secondary">Criar conta</ButtonLink>
            </div>
          </div>
        )}

        <ul className="card divide-y divide-line overflow-hidden">
          {user && <MenuItem to="/perfil/dados" icon={UserRound} label="Meus dados" hint="Nome, telefone e cidade" />}
          {user && <MenuItem to="/perfil/avaliacoes" icon={Star} label="Minhas avaliações" />}
          <li>
            <button onClick={openPicker} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface">
              <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <span className="flex-1"><span className="block font-medium">Localização</span><span className="text-sm text-muted">{city ? `${city.name}, ${city.uf}` : 'Não definida'}</span></span>
              <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
            </button>
          </li>
          <MenuItem to="/perfil/privacidade" icon={ShieldCheck} label="Privacidade e dados" />
          <MenuItem to="/como-funciona" icon={Info} label="Como funcionam avaliações e ranking" />
          <MenuItem to="/termos" icon={FileText} label="Termos de uso e privacidade" />
          <MenuItem to="/empresas" icon={Store} label="Tenho uma empresa" hint="Cadastre e gerencie sua empresa" />
        </ul>

        {user && (
          <Button variant="secondary" block icon={<LogOut className="h-5 w-5" />} onClick={async () => { await logout(); nav('/'); }}>Sair da conta</Button>
        )}
      </div>
    </div>
  );
}

export function EditProfilePage() {
  return (
    <div>
      <PageHeader title="Meus dados" />
      <div className="container-app max-w-xl py-5">
        <RequireAuth title="Entre para ver seus dados" reason="">
          <EditProfileForm />
        </RequireAuth>
      </div>
    </div>
  );
}

function EditProfileForm() {
  const { user, refresh } = useAuth();
  const { city } = useUserLocation();
  const toast = useToast();
  const [name, setName] = useState(user!.name);
  const [phone, setPhone] = useState(user!.phone ?? '');
  const [saveCity, setSaveCity] = useState(!!user!.cityIbge);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, phone, cityIbge: saveCity && city ? city.ibge : null };
    const parsed = profileUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path[0] as string] ??= i.message;
      return setErrors(f);
    }
    setErrors({});
    setLoading(true);
    try {
      await api.patch('/me', payload);
      refresh();
      toast('Dados atualizados.');
    } catch (err) {
      const ae = err as ApiError;
      setErrors(ae.fields ?? {});
      toast(ae.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
      <TextField label="E-mail" value={user!.email} disabled hint="Para trocar o e-mail, fale com o suporte." />
      <TextField label="Telefone com DDD" optional type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" hint="Usado para preencher pedidos de orçamento e agendamento." />
      <Checkbox checked={saveCity} onChange={(e) => setSaveCity(e.target.checked)} label={`Salvar ${city ? `${city.name}, ${city.uf}` : 'minha cidade atual'} na minha conta`} description="Assim sua cidade é carregada em outros aparelhos." disabled={!city} />
      <Button type="submit" block loading={loading}>Salvar alterações</Button>
    </form>
  );
}

export function MyReviewsPage() {
  return (
    <div>
      <PageHeader title="Minhas avaliações" />
      <div className="container-app max-w-2xl py-5">
        <RequireAuth title="Entre para ver suas avaliações" reason="">
          <MyReviewsList />
        </RequireAuth>
      </div>
    </div>
  );
}

function MyReviewsList() {
  const reviews = useMyReviews();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<null | { id: string; rating: number; comment: string; aspects: Record<string, number> }>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (reviews.isLoading) return <PageLoader />;
  if (!reviews.data?.length) {
    return <EmptyState icon={<Star className="h-8 w-8" />} title="Você ainda não avaliou nenhuma empresa" action={<ButtonLink to="/atividades">Ver atividades</ButtonLink>}>Depois de um atendimento, avalie em Atividades.</EmptyState>;
  }
  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['my-reviews'] });
    qc.invalidateQueries({ queryKey: ['activities'] });
    qc.invalidateQueries({ queryKey: ['business'] });
    qc.invalidateQueries({ queryKey: ['reviews'] });
  };
  const save = async () => {
    if (!editing) return;
    const parsed = reviewUpdateSchema.safeParse(editing);
    if (!parsed.success) return setErr(parsed.error.issues[0].message);
    setLoading(true);
    try {
      await api.patch(`/reviews/${editing.id}`, parsed.data);
      refreshAll();
      setEditing(null);
      toast('Avaliação atualizada.');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setLoading(true);
    try {
      await api.delete(`/reviews/${deleting}`);
      refreshAll();
      setDeleting(null);
      toast('Avaliação excluída.');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <ul className="space-y-3">
        {reviews.data.map((r) => {
          const editable = Date.now() - new Date(r.createdAt).getTime() < REVIEW_RULES.editableDays * 86_400_000;
          return (
            <li key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link to={`/empresa/${r.business.slug}`} className="font-semibold hover:underline">{r.business.name}</Link>
                  <p className="text-sm text-muted">{relativeTime(r.createdAt)}{r.serviceName ? ` · ${r.serviceName}` : ''}</p>
                </div>
                {r.status !== 'published' && <Tag tone="warning">Em análise</Tag>}
              </div>
              <div className="mt-2"><Stars value={r.rating} /></div>
              <p className="mt-2">{r.comment}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {editable && <Button size="sm" variant="secondary" onClick={() => { setErr(null); setEditing({ id: r.id, rating: r.rating, comment: r.comment, aspects: (r.aspects ?? {}) as Record<string, number> }); }}>Editar</Button>}
                <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting(r.id)}>Excluir</Button>
              </div>
              {!editable && <p className="mt-2 text-xs text-muted">O prazo de {REVIEW_RULES.editableDays} dias para editar terminou.</p>}
            </li>
          );
        })}
      </ul>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Editar avaliação" footer={<Button block loading={loading} onClick={save}>Salvar</Button>}>
        {editing && (
          <div className="space-y-4">
            <StarInput label="Nota" value={editing.rating} onChange={(v) => setEditing({ ...editing, rating: v })} />
            <TextArea label="Comentário" value={editing.comment} maxLength={1000} onChange={(e) => setEditing({ ...editing, comment: e.target.value })} />
            {err && <Alert tone="error">{err}</Alert>}
          </div>
        )}
      </Sheet>
      <Sheet open={!!deleting} onClose={() => setDeleting(null)} title="Excluir avaliação?"
        footer={<div className="flex gap-3"><Button variant="secondary" onClick={() => setDeleting(null)}>Voltar</Button><Button block variant="danger" loading={loading} onClick={remove}>Excluir</Button></div>}>
        <p>A avaliação deixará de aparecer no perfil da empresa e na nota média. Essa ação não pode ser desfeita.</p>
      </Sheet>
    </>
  );
}

export function PrivacyPage() {
  const { user, logout } = useAuth();
  const { remember, setRemember } = useUserLocation();
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const del = async () => {
    setLoading(true);
    setErr(null);
    try {
      await api.delete('/me', { password });
      await logout().catch(() => {});
      storage.remove('cl_location');
      toast('Sua conta e seus dados foram excluídos.');
      nav('/');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <PageHeader title="Privacidade e dados" />
      <div className="container-app max-w-2xl space-y-5 py-5">
        <section className="card p-5">
          <h2 className="font-semibold">Localização</h2>
          <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} label="Lembrar a cidade escolhida neste aparelho"
            description="A cidade fica salva só neste navegador. A localização exata do GPS nunca é salva." />
        </section>
        <section className="card p-5">
          <h2 className="font-semibold">Seus dados</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Guardamos nome, e-mail, telefone (se informado), favoritos, pedidos e avaliações.</li>
            <li>Seus dados de contato só são compartilhados com a empresa para a qual você enviar um pedido.</li>
            <li>Nas avaliações, aparece apenas seu primeiro nome e a inicial do sobrenome.</li>
            <li>Não vendemos dados pessoais.</li>
          </ul>
          <Link to="/termos" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">Ler a política de privacidade</Link>
        </section>
        {user && (
          <section className="card border-danger-700/20 p-5">
            <h2 className="font-semibold text-danger-700">Excluir conta</h2>
            <p className="mt-1 text-sm text-muted">Apaga definitivamente sua conta, favoritos, pedidos e avaliações (direito previsto na LGPD).</p>
            <Button variant="danger" className="mt-3" icon={<Trash2 className="h-4 w-4" />} onClick={() => setOpen(true)}>Excluir minha conta</Button>
          </section>
        )}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Excluir conta definitivamente?"
        footer={<Button block variant="danger" loading={loading} disabled={!password} onClick={del}>Excluir conta e dados</Button>}>
        <div className="space-y-3">
          <p>Essa ação não pode ser desfeita. Para confirmar, digite sua senha.</p>
          <TextField label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <Alert tone="error">{err}</Alert>}
        </div>
      </Sheet>
    </div>
  );
}

export function ForBusinessPage() {
  return (
    <div>
      <PageHeader title="Para empresas" />
      <div className="container-app max-w-2xl space-y-4 py-5">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Painel empresarial em breve</h2>
          <p className="mt-2 text-muted">
            Em breve, empresas poderão gerenciar perfil, serviços, preços, horários, áreas de atendimento, pedidos de orçamento,
            agendamentos e responder avaliações publicamente — tudo em uma única conta, mesmo atendendo várias cidades.
          </p>
          <p className="mt-3 text-sm text-muted">
            Regras que valem para todas: avaliações legítimas não podem ser removidas, e a posição nos resultados não pode ser comprada.
            Anúncios, se existirem, serão sempre identificados como “Patrocinado”.
          </p>
          <p className="mt-3 text-sm">Interessado? Escreva para <a className="font-semibold text-brand-700" href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
        </div>
      </div>
    </div>
  );
}

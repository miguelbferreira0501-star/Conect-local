import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import { quoteRequestSchema, type BusinessDetailDTO } from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useBusiness } from '@/lib/queries';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ChipToggle, SelectField, TextArea, TextField } from '@/components/ui/Form';

export function QuotePage() {
  const { slug } = useParams();
  const { data: b, isLoading, error } = useBusiness(slug);
  if (isLoading) return <PageLoader />;
  if (error || !b) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader title="Solicitar orçamento" subtitle={b.name} />
      <div className="container-app max-w-2xl py-5">
        <RequireAuth title="Entre para pedir um orçamento" reason="Assim a empresa sabe como falar com você e você acompanha o pedido em Atividades.">
          <QuoteForm b={b} />
        </RequireAuth>
      </div>
    </div>
  );
}

function QuoteForm({ b }: { b: BusinessDetailDTO }) {
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    serviceId: b.services.find((s) => s.id === sp.get('servico'))?.id ?? '',
    description: '',
    preferredDate: '',
    contactPreference: 'whatsapp' as 'whatsapp' | 'phone' | 'email',
    contactPhone: user?.phone ?? '',
    neighborhood: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (p: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...p }));
    // Ao corrigir um campo, a mensagem de erro dele some.
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in p))));
  };

  if (!b.acceptsQuote) {
    return <EmptyState icon={<Send className="h-8 w-8" />} title="Orçamento indisponível">Esta empresa não recebe pedidos de orçamento pela plataforma.</EmptyState>;
  }
  if (done) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent-600" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">Pedido de orçamento registrado</h2>
        <p className="mt-2 text-muted">Seu pedido para <strong className="text-ink">{b.name}</strong> foi salvo. A empresa responderá pelo contato que você escolheu.</p>
        {b.isDemo && <div className="mt-3 text-left"><Alert tone="warning">Empresa de exemplo: nenhuma empresa real recebeu este pedido.</Alert></div>}
        <p className="mt-3 text-sm text-muted">Quando fechar o serviço, marque “Contratei” em Atividades para poder avaliar depois.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink to="/atividades">Ver minhas atividades</ButtonLink>
          <ButtonLink to={`/empresa/${b.slug}`} variant="secondary">Voltar para a empresa</ButtonLink>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const payload = {
      businessId: b.id,
      serviceId: form.serviceId || null,
      description: form.description,
      preferredDate: form.preferredDate || null,
      contactPreference: form.contactPreference,
      contactPhone: form.contactPhone,
      neighborhood: form.neighborhood || undefined,
    };
    const parsed = quoteRequestSchema.safeParse(payload);
    const fieldErrors: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[i.path.join('.')] ??= i.message;
    if (form.contactPreference !== 'email' && !form.contactPhone) fieldErrors.contactPhone = 'Informe um telefone para a empresa entrar em contato.';
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;
    setLoading(true);
    try {
      await api.post('/quotes', payload);
      qc.invalidateQueries({ queryKey: ['activities'] });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const ae = err as ApiError;
      if (ae.fields) setErrors(ae.fields);
      setApiError(ae.message);
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {b.services.length > 0 && (
        <SelectField label="Serviço" optional value={form.serviceId} onChange={(e) => set({ serviceId: e.target.value })}>
          <option value="">Não sei / outro serviço</option>
          {b.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </SelectField>
      )}
      <TextArea label="O que você precisa?" required maxLength={1500} value={form.description} onChange={(e) => set({ description: e.target.value })} error={errors.description}
        placeholder="Descreva o serviço, tamanho, quantidade, local… Quanto mais detalhes, mais preciso o orçamento."
        hint={`${form.description.trim().length}/1500 · mínimo de 15 caracteres`} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Data desejada" optional type="date" min={minDate} value={form.preferredDate} onChange={(e) => set({ preferredDate: e.target.value })} error={errors.preferredDate} />
        <TextField label="Bairro" optional value={form.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })} placeholder="Ex.: Centro" autoComplete="address-level3" />
      </div>
      <fieldset>
        <legend className="label">Como prefere ser contatado?</legend>
        <div className="flex flex-wrap gap-2">
          {([['whatsapp', 'WhatsApp'], ['phone', 'Ligação'], ['email', 'E-mail']] as const).map(([v, l]) => (
            <ChipToggle key={v} selected={form.contactPreference === v} onClick={() => set({ contactPreference: v })}>{l}</ChipToggle>
          ))}
        </div>
        {form.contactPreference === 'email' && <p className="mt-2 text-sm text-muted">Usaremos o e-mail da sua conta: {user?.email}</p>}
      </fieldset>
      {form.contactPreference !== 'email' && (
        <TextField label="Telefone com DDD" type="tel" inputMode="tel" autoComplete="tel" value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} error={errors.contactPhone} placeholder="(47) 99999-9999" />
      )}
      <p className="text-sm text-muted">Seus dados de contato serão compartilhados apenas com esta empresa, para responder ao seu pedido.</p>
      {apiError && <Alert tone="error">{apiError}</Alert>}
      <Button type="submit" block size="lg" loading={loading} icon={<Send className="h-5 w-5" />}>Enviar pedido de orçamento</Button>
    </form>
  );
}

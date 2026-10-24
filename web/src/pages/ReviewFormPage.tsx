import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { REVIEW_ASPECT_LABELS, REVIEW_ASPECTS, reviewInputSchema, type ReviewAspect } from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { useActivities } from '@/lib/queries';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, PageLoader } from '@/components/ui/Feedback';
import { TextArea } from '@/components/ui/Form';
import { StarInput } from '@/components/ui/Rating';

export function ReviewFormPage() {
  return (
    <div>
      <PageHeader title="Avaliar atendimento" />
      <div className="container-app max-w-2xl py-5">
        <RequireAuth title="Entre para avaliar" reason="As avaliações ficam ligadas à sua conta e ao serviço contratado.">
          <ReviewForm />
        </RequireAuth>
      </div>
    </div>
  );
}

function ReviewForm() {
  const { type, id } = useParams<{ type: 'booking' | 'quote'; id: string }>();
  const acts = useActivities();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState<Partial<Record<ReviewAspect, number>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (acts.isLoading) return <PageLoader />;
  const a = acts.data?.find((x) => x.id === id && x.type === type);
  if (done && a) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent-600" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">Obrigado pela avaliação!</h2>
        <p className="mt-2 text-muted">Ela já está publicada no perfil de {a.business.name}. Você pode editá-la por até 30 dias.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink to={`/empresa/${a.business.slug}?aba=avaliacoes`}>Ver na página da empresa</ButtonLink>
          <ButtonLink to="/atividades" variant="secondary">Voltar para Atividades</ButtonLink>
        </div>
      </div>
    );
  }
  if (!a || !a.canReview) {
    return (
      <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="Não é possível avaliar este atendimento" action={<ButtonLink to="/atividades">Ir para Atividades</ButtonLink>}>
        {a?.reviewId ? 'Você já avaliou este atendimento.' : 'Para manter as avaliações confiáveis, só é possível avaliar depois de confirmar que o serviço foi realizado.'}
      </EmptyState>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const payload = { businessId: a.business.id, activityType: a.type, activityId: a.id, rating, comment, aspects };
    const parsed = reviewInputSchema.safeParse(payload);
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[i.path[0] as string] ??= i.message;
      setErrors(f);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.post('/reviews', payload);
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      qc.invalidateQueries({ queryKey: ['business', a.business.slug] });
      qc.invalidateQueries({ queryKey: ['reviews', a.business.id] });
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

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="card p-4">
        <p className="text-sm text-muted">Você está avaliando</p>
        <p className="font-semibold">{a.business.name}</p>
        <p className="text-sm text-muted">{a.serviceName}</p>
      </div>
      <StarInput label="Sua nota geral" value={rating} onChange={(v) => { setRating(v); setErrors(({ rating: _r, ...e }) => e); }} error={errors.rating} />
      <TextArea label="Conte como foi" value={comment} onChange={(e) => { setComment(e.target.value); if (errors.comment) setErrors(({ comment: _c, ...rest }) => rest); }} maxLength={1000} error={errors.comment}
        placeholder="O que deu certo? O que poderia melhorar? Seja específico e respeitoso."
        hint={`${comment.trim().length}/1000 · mínimo de 20 caracteres. Não inclua telefones, e-mails ou links.`} />
      <fieldset>
        <legend className="label">Detalhes <span className="font-normal text-muted">(opcional)</span></legend>
        <div className="space-y-3">
          {REVIEW_ASPECTS.map((k) => (
            <StarInput key={k} label={REVIEW_ASPECT_LABELS[k]} size={28} value={aspects[k] ?? 0} onChange={(v) => setAspects((s) => ({ ...s, [k]: v }))} />
          ))}
        </div>
      </fieldset>
      <p className="text-sm text-muted">Sua avaliação aparecerá com seu primeiro nome e a inicial do sobrenome. A empresa não pode apagá-la.</p>
      {apiError && <Alert tone="error">{apiError}</Alert>}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => nav(-1)}>Cancelar</Button>
        <Button type="submit" block size="lg" loading={loading}>Publicar avaliação</Button>
      </div>
    </form>
  );
}

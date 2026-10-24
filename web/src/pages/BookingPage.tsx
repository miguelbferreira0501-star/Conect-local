import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarX2, CheckCircle2, Clock } from 'lucide-react';
import { formatDuration, formatServicePrice, type BusinessDetailDTO } from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAvailability, useBusiness } from '@/lib/queries';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, ErrorState, PageLoader, Skeleton } from '@/components/ui/Feedback';
import { TextArea, TextField } from '@/components/ui/Form';

const WEEK_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function localDates(timeZone: string, count: number) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const out: Array<{ iso: string; weekday: number; day: number; month: number }> = [];
  for (let i = 0; i < count; i++) {
    const iso = fmt.format(new Date(Date.now() + i * 86_400_000));
    const [y, m, d] = iso.split('-').map(Number);
    out.push({ iso, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), day: d, month: m });
  }
  return out;
}

export function BookingPage() {
  const { slug } = useParams();
  const { data: b, isLoading, error } = useBusiness(slug);
  if (isLoading) return <PageLoader />;
  if (error || !b) return <ErrorState error={error} />;
  return (
    <div>
      <PageHeader title="Agendar horário" subtitle={b.name} />
      <div className="container-app max-w-2xl py-5">
        <RequireAuth title="Entre para agendar" reason="Assim você acompanha o pedido em Atividades e pode avaliar a empresa depois do atendimento.">
          <BookingForm b={b} />
        </RequireAuth>
      </div>
    </div>
  );
}

function BookingForm({ b }: { b: BusinessDetailDTO }) {
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const bookable = b.services.filter((s) => s.bookable);
  const [serviceId, setServiceId] = useState(bookable.find((s) => s.id === sp.get('servico'))?.id ?? (bookable.length === 1 ? bookable[0].id : ''));
  const dates = useMemo(() => localDates(b.timezone, 21), [b.timezone]);
  const openDays = dates.filter((d) => (b.openingHours?.[String(d.weekday) as '0'] ?? []).length > 0);
  const [date, setDate] = useState(openDays[0]?.iso ?? '');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [done, setDone] = useState<{ startsAt: string } | null>(null);
  const avail = useAvailability(b.id, serviceId || undefined, date || undefined);
  const service = bookable.find((s) => s.id === serviceId);

  if (!b.acceptsBooking || bookable.length === 0) {
    return (
      <EmptyState icon={<CalendarX2 className="h-8 w-8" />} title="Agendamento indisponível"
        action={b.acceptsQuote && <ButtonLink to={`/empresa/${b.slug}/orcamento`}>Solicitar orçamento</ButtonLink>}>
        Esta empresa não oferece agendamento pela plataforma.
      </EmptyState>
    );
  }

  if (done) {
    const when = new Date(done.startsAt).toLocaleString('pt-BR', { timeZone: b.timezone, weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent-600" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">Pedido de agendamento registrado</h2>
        <p className="mt-2 text-muted"><strong className="text-ink">{service?.name}</strong> com {b.name}<br />{when}</p>
        <Alert tone="info" title="Aguardando confirmação da empresa">
          O horário fica reservado para você enquanto a empresa confirma. Acompanhe o status em Atividades.
        </Alert>
        {b.isDemo && <div className="mt-3"><Alert tone="warning">Empresa de exemplo: nenhuma empresa real recebeu este pedido.</Alert></div>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink to="/atividades">Ver minhas atividades</ButtonLink>
          <ButtonLink to={`/empresa/${b.slug}`} variant="secondary">Voltar para a empresa</ButtonLink>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!serviceId || !slot) return;
    setSubmitting(true);
    setErr(null);
    try {
      await api.post('/bookings', { businessId: b.id, serviceId, startsAt: slot, notes: notes || undefined, contactPhone: phone || undefined });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      setDone({ startsAt: slot });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e as ApiError);
      if ((e as ApiError).code === 'slot_unavailable') { setSlot(''); avail.refetch(); }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold">1. Escolha o serviço</h2>
        <div className="space-y-2" role="radiogroup" aria-label="Serviço">
          {bookable.map((s) => (
            <label key={s.id} className={`card flex cursor-pointer items-center gap-3 p-4 transition ${serviceId === s.id ? 'border-brand-700 ring-2 ring-brand-500/20' : 'hover:border-brand-200'}`}>
              <input type="radio" name="service" className="h-5 w-5 accent-[rgb(var(--brand-700))]" checked={serviceId === s.id} onChange={() => { setServiceId(s.id); setSlot(''); }} />
              <span className="flex-1">
                <span className="block font-medium">{s.name}</span>
                <span className="text-sm text-muted">{s.durationMinutes ? formatDuration(s.durationMinutes) : ''}</span>
              </span>
              <span className="text-sm font-semibold">{formatServicePrice(s)}</span>
            </label>
          ))}
        </div>
      </section>

      {serviceId && (
        <section>
          <h2 className="mb-2 font-semibold">2. Escolha o dia</h2>
          <div className="scroll-row" role="radiogroup" aria-label="Dia">
            {dates.map((d) => {
              const closed = !openDays.some((o) => o.iso === d.iso);
              const selected = date === d.iso;
              return (
                <button key={d.iso} type="button" role="radio" aria-checked={selected} disabled={closed} onClick={() => { setDate(d.iso); setSlot(''); }}
                  aria-label={`${WEEK_SHORT[d.weekday]} ${d.day}/${d.month}${closed ? ' — fechado' : ''}`}
                  className={`flex min-h-[64px] w-[60px] shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition disabled:opacity-40 ${selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-white hover:bg-brand-50'}`}>
                  <span className="text-xs uppercase">{WEEK_SHORT[d.weekday]}</span>
                  <span className="text-lg font-semibold">{d.day}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {serviceId && date && (
        <section>
          <h2 className="mb-2 font-semibold">3. Escolha o horário</h2>
          {avail.isLoading && <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}
          {avail.isError && <Alert tone="error">{(avail.error as Error).message}</Alert>}
          {avail.data && avail.data.slots.length === 0 && <Alert tone="info">Não há horários livres neste dia. Escolha outra data.</Alert>}
          {avail.data && avail.data.slots.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Horário">
              {avail.data.slots.map((s) => (
                <button key={s.startsAt} type="button" role="radio" aria-checked={slot === s.startsAt} onClick={() => setSlot(s.startsAt)}
                  className={`min-h-[48px] rounded-xl border text-[15px] font-medium transition ${slot === s.startsAt ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-white hover:bg-brand-50'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 flex items-center gap-1 text-sm text-muted"><Clock className="h-4 w-4" aria-hidden="true" /> Horário de {b.city.name}.</p>
        </section>
      )}

      {slot && (
        <section className="space-y-4">
          <h2 className="font-semibold">4. Detalhes</h2>
          <TextArea label="Observações para a empresa" optional maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: é a primeira vez, tenho alergia a algum produto…" className="field min-h-[90px]" />
          <TextField label="Telefone para contato" optional type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(47) 99999-9999" error={err?.fields?.contactPhone} />
        </section>
      )}

      {err && <Alert tone="error">{err.message}</Alert>}

      <div className="sticky bottom-[64px] z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <Button block size="lg" disabled={!slot} loading={submitting} onClick={submit} icon={<CalendarCheck className="h-5 w-5" />}>
          {slot ? 'Solicitar agendamento' : 'Escolha um horário'}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">Você pode cancelar pelo app até o horário marcado.</p>
      </div>
    </div>
  );
}

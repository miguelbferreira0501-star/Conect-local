import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarX2, CheckCircle2, Clock, UserRound } from 'lucide-react';
import { formatDuration, formatServicePrice, isReservationCategory, PERIODS, REPEAT_OPTIONS, type BusinessDetailDTO, type Period, type PetDTO } from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAvailability, useBusiness } from '@/lib/queries';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, ErrorState, PageLoader, Skeleton } from '@/components/ui/Feedback';
import { ChipToggle, TextArea, TextField } from '@/components/ui/Form';
import { usePets } from '@/lib/pets';
import { PetAvatar, PetFormSheet } from '@/components/pets';
import { Plus, Repeat } from 'lucide-react';

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
      <PageHeader title={isReservationCategory(b.category.slug) ? 'Reservar mesa' : 'Agendar horário'} subtitle={b.name} />
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
  const qc = useQueryClient();
  const bookable = b.services.filter((s) => s.bookable);
  const [serviceId, setServiceId] = useState(bookable.find((s) => s.id === sp.get('servico'))?.id ?? (bookable.length === 1 ? bookable[0].id : ''));
  const service = bookable.find((s) => s.id === serviceId);
  const mode = service?.bookingMode ?? 'slot';
  const staffForService = b.staff.filter((st) => st.serviceIds.length === 0 || st.serviceIds.includes(serviceId));
  const [staffId, setStaffId] = useState<string | null>(null); // null = sem preferência
  const dates = useMemo(() => localDates(b.timezone, 21), [b.timezone]);
  const openDays = dates.filter((d) => (b.openingHours?.[String(d.weekday) as '0'] ?? []).length > 0);
  const [date, setDate] = useState(openDays[0]?.iso ?? dates[0].iso);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [done, setDone] = useState<{ startsAt: string; label: string; count: number; skipped: number } | null>(null);
  const pets = usePets();
  const [petId, setPetId] = useState<string | null | undefined>(undefined); // undefined = ainda não escolheu
  const chosenPetId = petId === undefined ? pets.data?.[0]?.id ?? null : petId;
  const [addingPet, setAddingPet] = useState<PetDTO | null | undefined>(undefined);
  const [everyWeeks, setEveryWeeks] = useState<0 | 1 | 2 | 4>(0);
  const maxRepeat = everyWeeks === 1 ? 12 : everyWeeks === 2 ? 6 : 3;
  const [repeatCount, setRepeatCount] = useState(4);
  const count = Math.min(repeatCount, maxRepeat);
  // Na diária, buscamos a lista de dias a partir de hoje.
  const avail = useAvailability(b.id, serviceId || undefined, mode === 'day' ? dates[0].iso : date, staffId);
  const chosen = avail.data?.slots.find((x) => x.startsAt === slot);
  const reservation = isReservationCategory(b.category.slug);
  const [people, setPeople] = useState(2);
  const step = (n: number) => (staffForService.length > 0 ? n + 1 : n) + (reservation ? 1 : 0);
  const label = b.staffLabel;

  if (!b.acceptsBooking || bookable.length === 0) {
    return (
      <EmptyState icon={<CalendarX2 className="h-8 w-8" />} title="Agendamento indisponível"
        action={b.acceptsQuote && <ButtonLink to={`/empresa/${b.slug}/orcamento`}>Solicitar orçamento</ButtonLink>}>
        Esta empresa não oferece agendamento pela plataforma.
      </EmptyState>
    );
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent-600" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">{done.count > 1 ? `${done.count} agendamentos registrados` : reservation ? 'Pedido de reserva registrado' : 'Pedido de agendamento registrado'}</h2>
        <p className="mt-2 text-muted"><strong className="text-ink">{service?.name}</strong> com {b.name}<br />{done.label}</p>
        {done.skipped > 0 && <div className="mt-3"><Alert tone="warning">{done.skipped} {done.skipped === 1 ? 'data não tinha' : 'datas não tinham'} vaga nesse horário e ficaram de fora. Você pode marcar à parte.</Alert></div>}
        <Alert tone="info" title="Aguardando confirmação da empresa">
          {mode === 'period' ? 'A empresa vai combinar com você o horário exato dentro do turno escolhido.' : 'O horário fica reservado para você enquanto a empresa confirma.'} Acompanhe o status em Atividades.
        </Alert>
        {b.isDemo && <div className="mt-3"><Alert tone="warning">Empresa de exemplo: nenhuma empresa real recebeu este pedido.</Alert></div>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink to="/atividades">Ver minhas atividades</ButtonLink>
          <ButtonLink to={`/empresa/${b.slug}`} variant="secondary">Voltar para a empresa</ButtonLink>
        </div>
      </div>
    );
  }

  const describe = (x: { startsAt: string; label: string }) => {
    const d = new Date(x.startsAt).toLocaleDateString('pt-BR', { timeZone: b.timezone, weekday: 'long', day: '2-digit', month: 'long' });
    if (mode === 'day') return `${d} (diária)`;
    if (mode === 'period') return `${d}, ${PERIODS[x.label as Period]?.label.toLowerCase()}`;
    return `${d}, às ${x.label}`;
  };

  const submit = async () => {
    if (!serviceId || !chosen) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r = await api.post<{ ids: string[]; skipped: string[] }>('/bookings', {
        businessId: b.id, serviceId, startsAt: chosen.startsAt, staffId, notes: notes || undefined, contactPhone: phone || undefined,
        partySize: reservation ? people : undefined, petId: chosenPetId, repeat: everyWeeks && mode !== 'day' ? { everyWeeks, count } : null,
      });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      const petName = pets.data?.find((p) => p.id === chosenPetId)?.name;
      const repeatLabel = everyWeeks && mode !== 'day' ? ` · ${REPEAT_OPTIONS.find((o) => o.everyWeeks === everyWeeks)?.label.toLowerCase()}` : '';
      setDone({ count: r.ids?.length ?? 1, skipped: r.skipped?.length ?? 0, startsAt: chosen.startsAt, label: (petName ? `${petName} · ` : '') + describe(chosen) + repeatLabel + (reservation ? ` · ${people} ${people === 1 ? 'pessoa' : 'pessoas'}` : '') + (staffId ? ` · ${reservation ? '' : 'com '}${b.staff.find((s) => s.id === staffId)?.name}` : '') });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e as ApiError);
      if ((e as ApiError).code === 'slot_unavailable') { setSlot(''); avail.refetch(); }
    } finally {
      setSubmitting(false);
    }
  };

  const pick = (k: string) => { setSlot(k); setErr(null); };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold">Para qual pet?</h2>
        {pets.isLoading ? <Skeleton className="h-16" /> : (
          <div className="scroll-row" role="radiogroup" aria-label="Pet">
            {pets.data?.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={chosenPetId === p.id} onClick={() => setPetId(p.id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 transition ${chosenPetId === p.id ? 'border-brand-700 bg-brand-50' : 'border-line bg-card hover:bg-brand-50'}`}>
                <PetAvatar pet={p} size={40} />
                <span className="font-medium">{p.name}</span>
              </button>
            ))}
            <button type="button" onClick={() => setAddingPet(null)} className="flex shrink-0 items-center gap-2 rounded-2xl border border-dashed border-brand-200 px-3 py-2 text-brand-fg hover:bg-brand-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50"><Plus className="h-5 w-5" /></span>
              <span className="font-medium">{pets.data?.length ? 'Outro pet' : 'Cadastrar meu pet'}</span>
            </button>
          </div>
        )}
        {!pets.isLoading && !pets.data?.length && <p className="mt-2 text-sm text-muted">Com a ficha, quem atender já sabe raça, porte, alergias e medos do seu pet.</p>}
        <PetFormSheet pet={addingPet} onClose={() => setAddingPet(undefined)} onSaved={(p) => setPetId(p.id)} />
      </section>

      {reservation && (
        <section>
          <h2 className="mb-2 font-semibold">1. Quantas pessoas?</h2>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Menos uma pessoa" disabled={people <= 1} onClick={() => setPeople(people - 1)} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card text-xl font-semibold disabled:opacity-40">−</button>
            <span className="min-w-[90px] text-center text-lg font-semibold" aria-live="polite">{people} {people === 1 ? 'pessoa' : 'pessoas'}</span>
            <button type="button" aria-label="Mais uma pessoa" disabled={people >= 50} onClick={() => setPeople(people + 1)} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card text-xl font-semibold disabled:opacity-40">+</button>
          </div>
          {people > 12 && <p className="mt-2 text-sm text-muted">Para grupos grandes, o restaurante pode pedir para confirmar por telefone.</p>}
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">{reservation ? '2. Escolha a reserva' : '1. Escolha o serviço'}</h2>
        <div className="space-y-2" role="radiogroup" aria-label="Serviço">
          {bookable.map((s) => (
            <label key={s.id} className={`card flex cursor-pointer items-center gap-3 p-4 transition ${serviceId === s.id ? 'border-brand-700 ring-2 ring-brand-500/20' : 'hover:border-brand-200'}`}>
              <input type="radio" name="service" className="h-5 w-5 accent-[rgb(var(--brand-700))]" checked={serviceId === s.id} onChange={() => { setServiceId(s.id); setSlot(''); setStaffId(null); }} />
              <span className="flex-1">
                <span className="block font-medium">{s.name}</span>
                <span className="text-sm text-muted">{s.bookingMode === 'day' ? 'Diária' : s.bookingMode === 'period' ? 'Você escolhe o turno' : s.durationMinutes ? formatDuration(s.durationMinutes) : ''}</span>
              </span>
              <span className="text-sm font-semibold">{reservation && s.priceType === 'quote' ? '' : formatServicePrice(s)}</span>
            </label>
          ))}
        </div>
      </section>

      {serviceId && staffForService.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">{reservation ? '3' : '2'}. Escolha {/^(quadra|equipe|mesa)/.test(label.toLowerCase()) ? 'a' : 'o'} {label.toLowerCase()}</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
            <ChipToggle selected={staffId === null} onClick={() => { setStaffId(null); setSlot(''); }}>Sem preferência</ChipToggle>
            {staffForService.map((st) => (
              <ChipToggle key={st.id} selected={staffId === st.id} onClick={() => { setStaffId(st.id); setSlot(''); }} icon={<UserRound className="h-4 w-4" />}>
                {st.name}{st.roleTitle ? ` · ${st.roleTitle}` : ''}
              </ChipToggle>
            ))}
          </div>
        </section>
      )}

      {serviceId && mode !== 'day' && (
        <section>
          <h2 className="mb-2 font-semibold">{step(2)}. Escolha o dia</h2>
          <div className="scroll-row" role="radiogroup" aria-label="Dia">
            {dates.map((d) => {
              const closed = !openDays.some((o) => o.iso === d.iso);
              const selected = date === d.iso;
              return (
                <button key={d.iso} type="button" role="radio" aria-checked={selected} disabled={closed} onClick={() => { setDate(d.iso); setSlot(''); }}
                  aria-label={`${WEEK_SHORT[d.weekday]} ${d.day}/${d.month}${closed ? ' — fechado' : ''}`}
                  className={`flex min-h-[64px] w-[60px] shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition disabled:opacity-40 ${selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                  <span className="text-xs uppercase">{WEEK_SHORT[d.weekday]}</span>
                  <span className="text-lg font-semibold">{d.day}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {serviceId && (
        <section>
          <h2 className="mb-2 font-semibold">{mode === 'day' ? `${step(2)}. Escolha o dia` : `${step(3)}. Escolha ${mode === 'period' ? 'o turno' : 'o horário'}`}</h2>
          {avail.isLoading && <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}
          {avail.isError && <Alert tone="error">{(avail.error as Error).message}</Alert>}
          {avail.data && avail.data.slots.length === 0 && <Alert tone="info">{mode === 'day' ? 'Não há datas livres nos próximos dias.' : 'Não há horários livres neste dia. Escolha outra data' + (staffId ? ' ou outro profissional.' : '.')}</Alert>}
          {avail.data && avail.data.slots.length > 0 && mode === 'slot' && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Horário">
              {avail.data.slots.map((x) => (
                <button key={x.startsAt} type="button" role="radio" aria-checked={slot === x.startsAt} onClick={() => pick(x.startsAt)}
                  className={`min-h-[48px] rounded-xl border text-[15px] font-medium transition ${slot === x.startsAt ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                  {x.label}
                </button>
              ))}
            </div>
          )}
          {avail.data && avail.data.slots.length > 0 && mode === 'period' && (
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Turno">
              {avail.data.slots.map((x) => {
                const p = PERIODS[x.label as Period];
                return (
                  <button key={x.startsAt} type="button" role="radio" aria-checked={slot === x.startsAt} onClick={() => pick(x.startsAt)}
                    className={`min-h-[64px] rounded-xl border px-4 text-left transition ${slot === x.startsAt ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                    <span className="block font-semibold">{p.label}</span>
                    <span className={`text-sm ${slot === x.startsAt ? 'text-white/85' : 'text-muted'}`}>Entre {p.start} e {p.end}</span>
                  </button>
                );
              })}
            </div>
          )}
          {avail.data && avail.data.slots.length > 0 && mode === 'day' && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Data">
              {avail.data.slots.slice(0, 45).map((x) => {
                const [y, m, d] = x.label.split('-').map(Number);
                const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
                return (
                  <button key={x.startsAt} type="button" role="radio" aria-checked={slot === x.startsAt} onClick={() => pick(x.startsAt)}
                    className={`min-h-[56px] rounded-xl border text-sm transition ${slot === x.startsAt ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                    <span className="block text-xs uppercase">{WEEK_SHORT[wd]}</span>
                    <span className="font-semibold">{String(d).padStart(2, '0')}/{String(m).padStart(2, '0')}</span>
                  </button>
                );
              })}
            </div>
          )}
          {mode !== 'day' && <p className="mt-2 flex items-center gap-1 text-sm text-muted"><Clock className="h-4 w-4" aria-hidden="true" /> Horário de {b.city.name}.</p>}
        </section>
      )}

      {chosen && mode !== 'day' && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><Repeat className="h-5 w-5 text-accent-600" aria-hidden="true" /> Repetir este horário?</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Repetição">
            <ChipToggle selected={everyWeeks === 0} onClick={() => setEveryWeeks(0)}>Só desta vez</ChipToggle>
            {REPEAT_OPTIONS.map((o) => <ChipToggle key={o.everyWeeks} selected={everyWeeks === o.everyWeeks} onClick={() => setEveryWeeks(o.everyWeeks)}>{o.label}</ChipToggle>)}
          </div>
          {everyWeeks > 0 && (
            <div className="mt-3">
              <p className="label">Quantas vezes?</p>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 6, 8, 12].filter((n) => n <= maxRepeat).map((n) => <ChipToggle key={n} selected={count === n} onClick={() => setRepeatCount(n)}>{n} vezes</ChipToggle>)}
              </div>
              <p className="mt-2 text-sm text-muted">Mesmo dia da semana e horário. Se alguma data não tiver vaga, ela fica de fora e as outras continuam. Você pode cancelar as próximas quando quiser.</p>
            </div>
          )}
        </section>
      )}

      {chosen && (
        <section className="space-y-4">
          <h2 className="font-semibold">Detalhes</h2>
          <TextArea label="Observações para a empresa" optional maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={mode === 'period' ? 'Ex.: portão azul, interfone 12; deixe a ração no pote da cozinha' : 'Ex.: ele chega de coleira vermelha; prefere perfume suave'} className="field min-h-[90px]" />
          <TextField label="Telefone para contato" optional={mode !== 'period'} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(47) 99999-9999" error={err?.fields?.contactPhone} />
        </section>
      )}

      {err && <Alert tone="error">{err.message}</Alert>}

      <div className="sticky bottom-[64px] z-10 -mx-4 border-t border-line bg-card/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {chosen && <p className="mb-2 text-center text-sm font-medium">{describe(chosen)}</p>}
        <Button block size="lg" disabled={!chosen} loading={submitting} onClick={submit} icon={<CalendarCheck className="h-5 w-5" />}>
          {chosen ? (reservation ? 'Solicitar reserva' : everyWeeks && mode !== 'day' ? `Solicitar ${count} agendamentos` : 'Solicitar agendamento') : mode === 'day' ? 'Escolha uma data' : mode === 'period' ? 'Escolha um turno' : 'Escolha um horário'}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">Você pode cancelar pelo app até o horário marcado.</p>
      </div>
    </div>
  );
}

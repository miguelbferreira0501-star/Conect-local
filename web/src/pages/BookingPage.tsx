import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarX2, CheckCircle2, Clock, MapPin, Plus, Repeat, UserRound } from 'lucide-react';
import {
  bookingFlow, bookingOccurrences, FLOW_COPY, formatCents, formatDuration, formatServicePrice, PERIODS, REPEAT_OPTIONS, stayNights,
  WEEKDAY_SHORT, zonedToUtc, type BookingFlow, type BusinessDetailDTO, type Period, type PetDTO,
} from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAvailability, useBusiness } from '@/lib/queries';
import { usePets } from '@/lib/pets';
import { useMyPackages } from '@/lib/benefits';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { PetAvatar, PetFormSheet } from '@/components/pets';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, EmptyState, ErrorState, PageLoader, Skeleton } from '@/components/ui/Feedback';
import { Checkbox, ChipToggle, TextArea, TextField } from '@/components/ui/Form';
import { DepositCard } from '@/components/DepositCard';
import { PushPrompt } from '@/components/PushPrompt';

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
const fmtDate = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/');

export function BookingPage() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const { data: b, isLoading, error } = useBusiness(slug);
  if (isLoading) return <PageLoader />;
  if (error || !b) return <ErrorState error={error} />;
  const first = b.services.find((s) => s.id === sp.get('servico')) ?? b.services.find((s) => s.bookable);
  const flow = bookingFlow(b.category.slug, first?.bookingMode);
  return (
    <div>
      <PageHeader title={b.category.slug === 'hospedagem-e-creche' && !sp.get('servico') ? 'Hospedagem ou creche' : FLOW_COPY[flow].title} subtitle={b.name} />
      <div className="container-app max-w-2xl py-5">
        <RequireAuth title="Entre para agendar" reason="Assim você acompanha o pedido, recebe o Pet ao Vivo e pode avaliar depois do atendimento.">
          <BookingForm b={b} />
        </RequireAuth>
      </div>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 text-base font-semibold">{icon}{title}</h2>
      {children}
    </section>
  );
}

function DateStrip({ dates, value, onChange, isOpen, label = 'Dia' }: { dates: ReturnType<typeof localDates>; value: string; onChange: (iso: string) => void; isOpen: (iso: string) => boolean; label?: string }) {
  return (
    <div className="scroll-row" role="radiogroup" aria-label={label}>
      {dates.map((d) => {
        const closed = !isOpen(d.iso);
        const selected = value === d.iso;
        return (
          <button key={d.iso} type="button" role="radio" aria-checked={selected} disabled={closed} onClick={() => onChange(d.iso)}
            aria-label={`${WEEK_SHORT[d.weekday]} ${d.day}/${d.month}${closed ? ', fechado' : ''}`}
            className={`flex min-h-[64px] w-[60px] shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition disabled:opacity-40 ${selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
            <span className="text-xs uppercase">{WEEK_SHORT[d.weekday]}</span>
            <span className="text-lg font-semibold">{d.day}</span>
          </button>
        );
      })}
    </div>
  );
}

function BookingForm({ b }: { b: BusinessDetailDTO }) {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const bookable = b.services.filter((s) => s.bookable);
  const [serviceId, setServiceId] = useState(bookable.find((s) => s.id === sp.get('servico'))?.id ?? (bookable.length === 1 ? bookable[0].id : ''));
  const service = bookable.find((s) => s.id === serviceId);
  const mode = service?.bookingMode ?? 'slot';
  const flow: BookingFlow = bookingFlow(b.category.slug, service?.bookingMode);
  const staffForService = b.staff.filter((st) => st.serviceIds.length === 0 || st.serviceIds.includes(serviceId));
  const [staffId, setStaffId] = useState<string | null>(null);
  const dates = useMemo(() => localDates(b.timezone, 45), [b.timezone]);
  const isOpen = (iso: string) => (b.openingHours?.[String(dates.find((d) => d.iso === iso)?.weekday) as '0'] ?? []).length > 0;
  const [date, setDate] = useState(dates.find((d) => isOpen(d.iso))?.iso ?? dates[0].iso);
  const [slot, setSlot] = useState('');
  // Pet sitter
  const [untilDate, setUntilDate] = useState('');
  const [periods, setPeriods] = useState<Period[]>(['morning']);
  // Hospedagem
  const [checkOut, setCheckOut] = useState('');
  // Repetição
  const [everyWeeks, setEveryWeeks] = useState<0 | 1 | 2 | 4>(0);
  const [repeatCount, setRepeatCount] = useState(4);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  // Onde
  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState('');
  const [pickup, setPickup] = useState(false);
  const atHomeDefault = b.modes.includes('at_customer') && !b.modes.includes('in_person');
  const [atHome, setAtHome] = useState(atHomeDefault);
  const [roundTrip, setRoundTrip] = useState(false);
  const [returnTime, setReturnTime] = useState('');
  const [houseNotes, setHouseNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [usePackage, setUsePackage] = useState<string | null>(null);
  const pets = usePets();
  const [petId, setPetId] = useState<string | null | undefined>(undefined);
  const chosenPetId = petId === undefined ? pets.data?.[0]?.id ?? null : petId;
  const chosenPet = pets.data?.find((p) => p.id === chosenPetId);
  const [addingPet, setAddingPet] = useState<PetDTO | null | undefined>(undefined);
  const myPackages = useMyPackages();
  const packagesHere = (myPackages.data ?? []).filter((p) => p.business.id === b.id && p.serviceId === serviceId && p.status === 'active' && p.remaining > 0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [done, setDone] = useState<{ label: string; count: number; skipped: number; depositCents: number | null } | null>(null);

  const availDate = mode === 'day' ? dates[0].iso : date;
  const avail = useAvailability(b.id, serviceId && mode !== 'period' ? serviceId : undefined, availDate, staffId);
  const chosen = avail.data?.slots.find((x) => x.startsAt === slot);

  if (!b.acceptsBooking || bookable.length === 0) {
    return (
      <EmptyState icon={<CalendarX2 className="h-8 w-8" />} title="Agendamento indisponível"
        action={b.acceptsQuote && <ButtonLink to={`/empresa/${b.slug}/orcamento`}>Solicitar orçamento</ButtonLink>}>
        Esta empresa não está com a agenda on-line ativa no momento.
      </EmptyState>
    );
  }

  // ── O que o pedido vai criar (resumo calculado aqui mesmo) ──
  const firstPeriod = [...periods].sort((x, y) => PERIODS[x].start.localeCompare(PERIODS[y].start))[0];
  const startsAt: string | null =
    flow === 'sitter' ? (date && firstPeriod ? zonedToUtc(date, Number(PERIODS[firstPeriod].start.slice(0, 2)) * 60, b.timezone).toISOString() : null)
      : chosen?.startsAt ?? null;
  const repeatAllowed = ['grooming', 'training', 'walk', 'daycare', 'generic'].includes(flow) && mode === 'slot';
  const useWeekdays = flow === 'walk' || flow === 'daycare';
  const firstWeekday = dates.find((d) => d.iso === date)?.weekday ?? 0;
  const effWeekdays = useWeekdays ? (weekdays.length ? weekdays : [firstWeekday]) : [];
  const repeat = repeatAllowed && everyWeeks ? { everyWeeks, count: repeatCount } : null;
  const nights = mode === 'day' && chosen && checkOut ? stayNights(chosen.label, checkOut) : [];
  let occurrences: Date[] = [];
  let occErr = '';
  try {
    if (startsAt && mode !== 'day') {
      occurrences = bookingOccurrences({
        startsAt: new Date(startsAt), timezone: b.timezone, mode,
        repeat, weekdays: useWeekdays && repeat ? effWeekdays : null,
        untilDate: flow === 'sitter' ? untilDate || date : null, periods: flow === 'sitter' ? periods : null,
      });
    }
  } catch (e) { occErr = (e as Error).message; }
  const count = mode === 'day' ? (nights.length ? 1 : 0) : occurrences.length;
  const pkg = packagesHere.find((p) => p.id === usePackage);
  const depositEach = !pkg && b?.pixKey && service?.depositCents ? service.depositCents : null;
  const depositTotal = depositEach ? depositEach * (mode === 'day' ? nights.length : 1) : null;
  const needsAddress = flow === 'walk' || flow === 'sitter' || flow === 'ride' || (flow === 'grooming' && pickup) || (flow === 'training' && atHome);
  const ready = !!serviceId && (mode === 'day' ? nights.length > 0 : count > 0) && !occErr && (!needsAddress || address.trim().length >= 5) && (flow !== 'ride' || destination.trim().length >= 3);

  const describe = () => {
    if (mode === 'day' && chosen && checkOut) return `Entrada ${fmtDate(chosen.label)} · saída ${fmtDate(checkOut)} · ${nights.length} ${nights.length === 1 ? 'noite' : 'noites'}`;
    if (!startsAt) return '';
    const d = new Date(startsAt).toLocaleDateString('pt-BR', { timeZone: b.timezone, weekday: 'long', day: '2-digit', month: 'long' });
    if (flow === 'sitter') return `${count} ${count === 1 ? 'visita' : 'visitas'} · de ${fmtDate(date)} a ${fmtDate(untilDate || date)} · ${periods.map((p) => PERIODS[p].label.toLowerCase()).join(' e ')}`;
    const base = `${d}, às ${chosen?.label}`;
    if (count > 1 && useWeekdays) return `${count} ${flow === 'walk' ? 'passeios' : 'dias'} · ${effWeekdays.sort().map((w) => WEEKDAY_SHORT[w]).join(', ')} às ${chosen?.label}`;
    if (count > 1) return `${base} · ${count} vezes`;
    return base;
  };

  const submit = async () => {
    if (!ready || !startsAt && mode !== 'day') return;
    setSubmitting(true);
    setErr(null);
    try {
      const r = await api.post<{ ids: string[]; skipped: string[]; depositCents: number | null }>('/bookings', {
        businessId: b.id, serviceId, staffId, notes: notes || undefined, contactPhone: phone || undefined, petId: chosenPetId,
        startsAt: mode === 'day' ? chosen!.startsAt : startsAt,
        untilDate: mode === 'day' ? checkOut : flow === 'sitter' ? untilDate || date : undefined,
        periods: flow === 'sitter' ? periods : undefined,
        repeat, weekdays: useWeekdays && repeat ? effWeekdays : undefined,
        address: needsAddress ? address : undefined, destination: flow === 'ride' ? destination : undefined,
        details: { pickup: flow === 'grooming' ? pickup : undefined, atHome: flow === 'training' ? atHome : undefined, roundTrip: flow === 'ride' ? roundTrip : undefined,
          returnTime: flow === 'ride' && roundTrip && returnTime ? returnTime : undefined, houseNotes: flow === 'sitter' && houseNotes ? houseNotes : undefined },
        customerPackageId: pkg?.id ?? null,
      });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['availability'] });
      qc.invalidateQueries({ queryKey: ['my-packages'] });
      setDone({ count: r.ids?.length ?? 1, skipped: r.skipped?.length ?? 0, depositCents: r.depositCents ?? null,
        label: (chosenPet ? `${chosenPet.name} · ` : '') + describe() });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr(e as ApiError);
      if ((e as ApiError).code === 'slot_unavailable') { setSlot(''); avail.refetch(); }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success-700" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">{done.count > 1 ? `${done.count} agendamentos registrados` : 'Pedido de agendamento registrado'}</h2>
        <p className="mt-2 text-muted"><strong className="text-ink">{service?.name}</strong> com {b.name}<br />{done.label}</p>
        {done.skipped > 0 && <div className="mt-3"><Alert tone="warning">{done.skipped} {done.skipped === 1 ? 'data não tinha' : 'datas não tinham'} vaga e ficaram de fora.</Alert></div>}
        <div className="mt-4 text-left"><PushPrompt variant="booking" /></div>
        {done.depositCents && <div className="mt-4 text-left"><DepositCard cents={done.depositCents} pixKey={b.pixKey ?? null} businessName={b.name} city={b.city.name} /></div>}
        <div className="mt-3"><Alert tone="info" title="Aguardando confirmação da empresa">Acompanhe em Agenda. No dia, as fotos de cada etapa aparecem no Pet ao Vivo.</Alert></div>
        {b.isDemo && <div className="mt-3"><Alert tone="warning">Empresa de exemplo: nenhuma empresa real recebeu este pedido.</Alert></div>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => nav('/atividades')}>Ver minha agenda</Button>
          <ButtonLink to={`/empresa/${b.slug}`} variant="secondary">Voltar para a empresa</ButtonLink>
        </div>
      </div>
    );
  }

  const label = b.staffLabel;
  return (
    <div className="space-y-6">
      <Section title="Para qual pet?">
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
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-control text-muted"><Plus className="h-5 w-5" aria-hidden /></span>
              <span className="font-medium">{pets.data?.length ? 'Outro pet' : 'Cadastrar meu pet'}</span>
            </button>
          </div>
        )}
        <PetFormSheet pet={addingPet} onClose={() => setAddingPet(undefined)} onSaved={(p) => setPetId(p.id)} />
      </Section>

      <Section title="Serviço">
        <div className="card overflow-hidden" role="radiogroup" aria-label="Serviço">
          {bookable.map((s) => {
            const sizeHint = chosenPet?.size && /porte/i.test(s.name) && new RegExp({ mini: 'pequeno|mini', small: 'pequeno', medium: 'médio', large: 'grande', giant: 'grande|gigante' }[chosenPet.size], 'i').test(s.name);
            return (
              <label key={s.id} className={`flex cursor-pointer items-center gap-3 border-b border-rule px-4 py-3.5 transition-colors duration-150 last:border-b-0 ${serviceId === s.id ? 'bg-brand-50' : 'hover:bg-raised'}`}>
                <input type="radio" name="service" className="h-5 w-5 accent-[rgb(var(--brand-700))]" checked={serviceId === s.id} onChange={() => { setServiceId(s.id); setSlot(''); setStaffId(null); setCheckOut(''); }} />
                <span className="flex-1">
                  <span className="block font-medium">{s.name}</span>
                  <span className="text-sm text-muted">{s.bookingMode === 'day' ? 'Por noite' : s.bookingMode === 'period' ? 'Por visita' : s.durationMinutes ? formatDuration(s.durationMinutes) : ''}{s.depositCents ? ` · sinal de ${formatCents(s.depositCents)}` : ''}</span>
                  {sizeHint && <span className="mt-0.5 block text-xs font-medium text-brand-900">Indicado para o porte de {chosenPet!.name}</span>}
                </span>
                <span className="num shrink-0 text-right text-sm font-semibold">{formatServicePrice(s)}</span>
              </label>
            );
          })}
        </div>
      </Section>

      {serviceId && packagesHere.length > 0 && (
        <Section title="Usar meu pacote?">
          <div className="flex flex-wrap gap-2">
            <ChipToggle selected={!usePackage} onClick={() => setUsePackage(null)}>Não, pagar avulso</ChipToggle>
            {packagesHere.map((p) => <ChipToggle key={p.id} selected={usePackage === p.id} onClick={() => setUsePackage(p.id)}>{p.name} · {p.remaining} restantes</ChipToggle>)}
          </div>
        </Section>
      )}

      {serviceId && staffForService.length > 0 && (
        <Section title={`Escolha ${/^(vaga|equipe)/i.test(label) ? 'a' : 'o'} ${label.toLowerCase()}`}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
            <ChipToggle selected={staffId === null} onClick={() => { setStaffId(null); setSlot(''); }}>Sem preferência</ChipToggle>
            {staffForService.map((st) => (
              <ChipToggle key={st.id} selected={staffId === st.id} onClick={() => { setStaffId(st.id); setSlot(''); }} icon={<UserRound className="h-4 w-4" />}>
                {st.name}{st.roleTitle ? ` · ${st.roleTitle}` : ''}
              </ChipToggle>
            ))}
          </div>
        </Section>
      )}

      {/* ── Quando: cada área do seu jeito ── */}
      {serviceId && mode === 'slot' && (
        <>
          <Section title={flow === 'walk' ? 'Primeiro passeio' : flow === 'daycare' ? 'Primeiro dia' : 'Escolha o dia'}>
            <DateStrip dates={dates} value={date} onChange={(d) => { setDate(d); setSlot(''); }} isOpen={isOpen} />
          </Section>
          <Section title={flow === 'walk' ? 'Horário do passeio' : flow === 'ride' ? 'Horário da busca' : 'Escolha o horário'}>
            {avail.isLoading && <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}
            {avail.isError && <Alert tone="error">{(avail.error as Error).message}</Alert>}
            {avail.data && avail.data.slots.length === 0 && <Alert tone="info">Não há horários livres neste dia. Escolha outra data{staffId ? ' ou outra pessoa' : ''}.</Alert>}
            {avail.data && avail.data.slots.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Horário">
                {avail.data.slots.map((x) => (
                  <button key={x.startsAt} type="button" role="radio" aria-checked={slot === x.startsAt} onClick={() => { setSlot(x.startsAt); setErr(null); }}
                    className={`min-h-[48px] rounded-xl border text-[15px] font-medium transition ${slot === x.startsAt ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                    {x.label}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 flex items-center gap-1 text-sm text-muted"><Clock className="h-4 w-4" aria-hidden="true" /> Horário de {b.city.name}.</p>
          </Section>
        </>
      )}

      {serviceId && mode === 'period' && (
        <>
          <Section title="Primeiro dia das visitas">
            <DateStrip dates={dates} value={date} onChange={(d) => { setDate(d); if (untilDate && untilDate < d) setUntilDate(''); }} isOpen={isOpen} />
          </Section>
          <Section title="Último dia das visitas">
            <DateStrip dates={dates.filter((d) => d.iso >= date).slice(0, 31)} value={untilDate || date} onChange={setUntilDate} isOpen={isOpen} label="Último dia" />
          </Section>
          <Section title="Visitas por dia">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PERIODS) as Period[]).map((p) => (
                <ChipToggle key={p} selected={periods.includes(p)} onClick={() => setPeriods(periods.includes(p) ? (periods.length > 1 ? periods.filter((x) => x !== p) : periods) : [...periods, p])}>
                  {PERIODS[p].label} ({PERIODS[p].start}–{PERIODS[p].end})
                </ChipToggle>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">O cuidador combina com você a hora exata de cada visita dentro do turno.</p>
          </Section>
        </>
      )}

      {serviceId && mode === 'day' && (
        <>
          <Section title="Entrada (check-in)">
            {avail.isLoading && <Skeleton className="h-16" />}
            {avail.data && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Entrada">
                {avail.data.slots.slice(0, 40).map((x) => (
                  <button key={x.startsAt} type="button" role="radio" aria-checked={slot === x.startsAt} onClick={() => { setSlot(x.startsAt); setCheckOut(''); }}
                    className={`min-h-[52px] rounded-xl border text-sm transition ${slot === x.startsAt ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                    <span className="block text-xs uppercase">{WEEK_SHORT[new Date(`${x.label}T12:00:00Z`).getUTCDay()]}</span>
                    <span className="font-semibold">{fmtDate(x.label)}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>
          {chosen && (
            <Section title="Saída (check-out)">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Saída">
                {(() => {
                  // Só até a primeira noite sem vaga (a estadia precisa ser contínua).
                  const free = new Set(avail.data!.slots.map((x) => x.label));
                  const out: string[] = [];
                  for (let k = 1; k <= 30; k++) {
                    const d = new Date(Date.parse(`${chosen.label}T12:00:00Z`) + k * 86_400_000).toISOString().slice(0, 10);
                    out.push(d);
                    if (!free.has(d)) break;
                  }
                  return out.map((d) => (
                    <button key={d} type="button" role="radio" aria-checked={checkOut === d} onClick={() => setCheckOut(d)}
                      className={`min-h-[52px] rounded-xl border text-sm transition ${checkOut === d ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-card hover:bg-brand-50'}`}>
                      <span className="block text-xs uppercase">{WEEK_SHORT[new Date(`${d}T12:00:00Z`).getUTCDay()]}</span>
                      <span className="font-semibold">{fmtDate(d)}</span>
                    </button>
                  ));
                })()}
              </div>
              {nights.length > 0 && service?.priceMinCents && <p className="mt-2 text-sm">{nights.length} {nights.length === 1 ? 'noite' : 'noites'} · estimativa de <strong>{formatCents(service.priceMinCents * nights.length)}</strong></p>}
            </Section>
          )}
        </>
      )}

      {/* ── Repetição ── */}
      {chosen && repeatAllowed && (
        <Section title={useWeekdays ? (flow === 'walk' ? 'Passear em quais dias?' : 'Em quais dias da semana?') : 'Repetir este horário?'} icon={<Repeat className="h-5 w-5 text-muted" aria-hidden="true" />}>
          <div className="flex flex-wrap gap-2">
            <ChipToggle selected={everyWeeks === 0} onClick={() => setEveryWeeks(0)}>Só desta vez</ChipToggle>
            {REPEAT_OPTIONS.filter((o) => !useWeekdays || o.everyWeeks !== 4).map((o) => <ChipToggle key={o.everyWeeks} selected={everyWeeks === o.everyWeeks} onClick={() => setEveryWeeks(o.everyWeeks)}>{o.label}</ChipToggle>)}
          </div>
          {everyWeeks > 0 && useWeekdays && (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Dias da semana">
              {WEEKDAY_SHORT.map((w, i) => (
                <ChipToggle key={w} selected={effWeekdays.includes(i)} onClick={() => {
                  const cur = effWeekdays;
                  setWeekdays(cur.includes(i) ? (cur.length > 1 ? cur.filter((x) => x !== i) : cur) : [...cur, i]);
                }}>{w}</ChipToggle>
              ))}
            </div>
          )}
          {everyWeeks > 0 && (
            <div className="mt-3">
              <p className="label">{useWeekdays ? 'Por quantas semanas?' : 'Quantas vezes?'}</p>
              <div className="flex flex-wrap gap-2">
                {[2, 4, 8, 12].filter((n) => n * everyWeeks <= 12).map((n) => <ChipToggle key={n} selected={repeatCount === n} onClick={() => setRepeatCount(n)}>{n} {useWeekdays ? 'semanas' : 'vezes'}</ChipToggle>)}
              </div>
              <p className="mt-2 text-sm text-muted">Se alguma data não tiver vaga, ela fica de fora e as outras continuam. Você pode cancelar as próximas quando quiser.</p>
            </div>
          )}
        </Section>
      )}

      {/* ── Onde ── */}
      {serviceId && flow === 'grooming' && b.modes.includes('at_customer') && (
        <Section title="Leva e traz">
          <Checkbox label="Buscar e entregar meu pet em casa" description="A empresa combina o valor do transporte com você." checked={pickup} onChange={(e) => setPickup(e.target.checked)} />
        </Section>
      )}
      {serviceId && flow === 'training' && b.modes.includes('at_customer') && b.modes.includes('in_person') && (
        <Section title="Onde será a aula?">
          <div className="flex flex-wrap gap-2">
            <ChipToggle selected={atHome} onClick={() => setAtHome(true)}>Na minha casa</ChipToggle>
            <ChipToggle selected={!atHome} onClick={() => setAtHome(false)}>No local do adestrador</ChipToggle>
          </div>
        </Section>
      )}
      {serviceId && needsAddress && (
        <Section title={flow === 'walk' ? 'Onde buscar o cão?' : flow === 'sitter' ? 'Endereço da sua casa' : flow === 'ride' ? 'Trajeto' : 'Seu endereço'} icon={<MapPin className="h-5 w-5 text-muted" aria-hidden="true" />}>
          <div className="space-y-3">
            <TextField label={flow === 'ride' ? 'Buscar o pet em' : 'Endereço'} value={address} maxLength={200} autoComplete="street-address" onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro (e apartamento)" error={err?.fields?.address} />
            {flow === 'ride' && (
              <>
                <TextField label="Levar para" value={destination} maxLength={200} onChange={(e) => setDestination(e.target.value)} placeholder="Ex.: Clínica Vet Amigo, Rua das Flores, 50" error={err?.fields?.destination} />
                <Checkbox label="Ida e volta" description="Trazer o pet de volta depois." checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} />
                {roundTrip && <TextField label="Horário aproximado da volta" type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />}
              </>
            )}
            {flow === 'sitter' && (
              <TextArea label="Instruções da casa" optional maxLength={500} value={houseNotes} onChange={(e) => setHouseNotes(e.target.value)} className="field min-h-[90px]"
                placeholder="Ex.: chave com o porteiro; ração no armário da cozinha (1 xícara); remédio às 8h; não abrir a janela da sala" />
            )}
          </div>
        </Section>
      )}

      {ready && (
        <Section title="Detalhes">
          <div className="space-y-4">
            <TextArea label="Observações para a empresa" optional maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} className="field min-h-[80px]"
              placeholder="Ex.: ele chega de coleira vermelha; prefere perfume suave" />
            <TextField label="Telefone para contato" optional={!needsAddress} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(47) 99999-9999" error={err?.fields?.contactPhone} />
          </div>
        </Section>
      )}

      {occErr && <Alert tone="warning">{occErr}</Alert>}
      {err && <Alert tone="error">{err.message}</Alert>}

      <div className="sticky bottom-[58px] z-10 -mx-4 border-t border-line bg-card px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {ready && <p className="mb-1 text-center text-sm font-medium">{describe()}</p>}
        {ready && depositTotal && <p className="mb-2 text-center text-xs text-accent-700">Sinal de {formatCents(depositTotal)} pelo Pix para garantir</p>}
        {pkg && ready && <p className="mb-2 text-center text-xs text-accent-700">Usando o pacote {pkg.name} ({pkg.remaining - count} restarão)</p>}
        <Button block size="lg" disabled={!ready} loading={submitting} onClick={submit} icon={<CalendarCheck className="h-5 w-5" />}>
          {ready ? (count > 1 ? `${FLOW_COPY[flow].submit} (${count})` : FLOW_COPY[flow].submit)
            : !serviceId ? 'Escolha o serviço' : needsAddress && address.trim().length < 5 && (mode === 'day' ? nights.length : count) ? 'Informe o endereço' : mode === 'day' ? 'Escolha entrada e saída' : 'Escolha dia e horário'}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">Você pode cancelar pelo app até o horário marcado.</p>
      </div>
    </div>
  );
}

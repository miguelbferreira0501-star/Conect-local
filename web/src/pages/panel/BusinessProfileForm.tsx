import { useEffect, useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { businessProfileSchema, normalize, PRICE_LEVEL_LABELS, type BusinessProfileInput } from '@conecta/shared';
import { ApiError } from '@/lib/api';
import { fetchCity, useCategories, useCities, useStates } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Checkbox, ChipToggle, SelectField, TextArea, TextField } from '@/components/ui/Form';

export type ProfileForm = Required<{ [K in keyof BusinessProfileInput]: Exclude<BusinessProfileInput[K], undefined> }>;

export const EMPTY_PROFILE: ProfileForm = {
  name: '', professionalName: '', categorySlug: '', shortDescription: '', description: '', cityIbge: 0, neighborhood: '', street: '',
  postalCode: '', addressPublic: true, serviceAreaCities: [], modeInPerson: true, modeAtCustomer: false, modeOnline: false,
  phone: '', whatsapp: '', website: '', instagram: '', email: '', priceLevel: null, acceptsBooking: true, acceptsQuote: true,
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Formulário usado tanto no cadastro quanto na edição do perfil. */
export function BusinessProfileForm({ initial, submitLabel, onSubmit }: { initial: ProfileForm; submitLabel: string; onSubmit: (v: ProfileForm) => Promise<void> }) {
  const [f, setF] = useState<ProfileForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uf, setUf] = useState('');
  const categories = useCategories();
  const states = useStates();
  const cities = useCities(uf || null);
  const [cityTerm, setCityTerm] = useState('');
  const [areaTerm, setAreaTerm] = useState('');

  useEffect(() => {
    if (initial.cityIbge) fetchCity(initial.cityIbge).then((c) => setUf(c.uf)).catch(() => {});
  }, [initial.cityIbge]);

  const set = (p: Partial<ProfileForm>) => {
    setF((v) => ({ ...v, ...p }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in p))));
  };
  const cityName = (ibge: number) => cities.data?.find((c) => c.ibge === ibge)?.name ?? String(ibge);
  const cityMatches = useMemo(() => {
    const t = normalize(cityTerm);
    return t.length >= 2 ? (cities.data ?? []).filter((c) => normalize(c.name).includes(t)).slice(0, 8) : [];
  }, [cities.data, cityTerm]);
  const areaMatches = useMemo(() => {
    const t = normalize(areaTerm);
    return t.length >= 2 ? (cities.data ?? []).filter((c) => normalize(c.name).includes(t) && c.ibge !== f.cityIbge && !f.serviceAreaCities.includes(c.ibge)).slice(0, 8) : [];
  }, [cities.data, areaTerm, f.cityIbge, f.serviceAreaCities]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const parsed = businessProfileSchema.safeParse(f);
    if (!parsed.success || !f.cityIbge) {
      const fe: Record<string, string> = {};
      if (!f.cityIbge) fe.cityIbge = 'Escolha a cidade da empresa.';
      if (!parsed.success) for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
      setErrors(fe);
      setApiError('Confira os campos destacados.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(f);
    } catch (err) {
      const ae = err as ApiError;
      if (ae.fields) setErrors(ae.fields);
      setApiError(ae.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Section title="Sobre a empresa">
        <TextField label="Nome da empresa" value={f.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} maxLength={80} />
        <TextField label="Nome do profissional responsável" optional value={f.professionalName ?? ''} onChange={(e) => set({ professionalName: e.target.value })} hint="Útil para autônomos: aparece junto ao nome da empresa." maxLength={80} />
        <SelectField label="Categoria" value={f.categorySlug} onChange={(e) => set({ categorySlug: e.target.value })} error={errors.categorySlug}>
          <option value="">Escolha a categoria</option>
          {categories.data?.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </SelectField>
        <TextField label="Frase curta" value={f.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} error={errors.shortDescription} maxLength={160}
          hint={`Aparece nos resultados da busca. ${f.shortDescription.length}/160`} placeholder="Ex.: Instalações elétricas residenciais com garantia de 90 dias." />
        <TextArea label="Descrição completa" optional value={f.description ?? ''} onChange={(e) => set({ description: e.target.value })} maxLength={2000}
          hint="Conte sua experiência, diferenciais e como funciona o atendimento." />
      </Section>

      <Section title="Onde fica e onde atende">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Estado" value={uf} onChange={(e) => { setUf(e.target.value); set({ cityIbge: 0, serviceAreaCities: [] }); setCityTerm(''); }}>
            <option value="">Selecione</option>
            {states.data?.map((s) => <option key={s.uf} value={s.uf}>{s.name}</option>)}
          </SelectField>
          <div>
            {f.cityIbge ? (
              <div>
                <span className="label">Cidade</span>
                <div className="flex min-h-[50px] items-center justify-between rounded-xl border border-line bg-card px-3.5">
                  <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-muted" />{cityName(f.cityIbge)}</span>
                  <button type="button" className="text-sm font-medium text-brand-fg hover:underline" onClick={() => set({ cityIbge: 0 })}>Trocar</button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <TextField label="Cidade" value={cityTerm} onChange={(e) => setCityTerm(e.target.value)} disabled={!uf} placeholder={uf ? 'Digite o nome da cidade' : 'Escolha o estado primeiro'} error={errors.cityIbge} autoComplete="off" />
                {cityMatches.length > 0 && (
                  <ul className="absolute inset-x-0 z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-float">
                    {cityMatches.map((c) => (
                      <li key={c.ibge}><button type="button" className="min-h-[44px] w-full px-4 text-left hover:bg-brand-50" onClick={() => { set({ cityIbge: c.ibge }); setCityTerm(''); }}>{c.name}</button></li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <fieldset>
          <legend className="label">Como você atende?</legend>
          <div className="space-y-1">
            <Checkbox label="No meu estabelecimento" description="O cliente vai até você" checked={f.modeInPerson} onChange={(e) => set({ modeInPerson: e.target.checked })} />
            <Checkbox label="No endereço do cliente" description="Você vai até o cliente" checked={f.modeAtCustomer} onChange={(e) => set({ modeAtCustomer: e.target.checked })} />
            <Checkbox label="On-line" description="Atendimento remoto, para qualquer lugar" checked={f.modeOnline} onChange={(e) => set({ modeOnline: e.target.checked })} />
          </div>
          {errors.modeInPerson && <p className="text-sm text-danger-700">{errors.modeInPerson}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Endereço (rua e número)" optional={!f.modeInPerson} value={f.street ?? ''} onChange={(e) => set({ street: e.target.value })} error={errors.street} autoComplete="street-address" />
          <TextField label="Bairro" optional value={f.neighborhood ?? ''} onChange={(e) => set({ neighborhood: e.target.value })} />
          <TextField label="CEP" optional inputMode="numeric" value={f.postalCode ?? ''} onChange={(e) => set({ postalCode: e.target.value })} error={errors.postalCode} autoComplete="postal-code" />
        </div>
        {f.modeInPerson && (
          <Checkbox label="Mostrar o endereço completo no perfil" description="Se desmarcar, aparecem só o bairro e a cidade." checked={f.addressPublic} onChange={(e) => set({ addressPublic: e.target.checked })} />
        )}

        <div>
          <span className="label">Outras cidades que você atende <span className="font-normal text-muted">(opcional)</span></span>
          <p className="mb-2 text-sm text-muted">Sua empresa também aparece para clientes dessas cidades, com o aviso “Atende sua cidade”.</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {f.serviceAreaCities.filter((c) => c !== f.cityIbge).map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-sm text-brand-fg">
                {cityName(c)}
                <button type="button" aria-label={`Remover ${cityName(c)}`} className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-brand-100"
                  onClick={() => set({ serviceAreaCities: f.serviceAreaCities.filter((x) => x !== c) })}><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
          <div className="relative">
            <label htmlFor="area-search" className="sr-only">Adicionar cidade atendida</label>
            <input id="area-search" className="field" placeholder={uf ? 'Digite para adicionar uma cidade' : 'Escolha o estado primeiro'} disabled={!uf} value={areaTerm} onChange={(e) => setAreaTerm(e.target.value)} autoComplete="off" />
            {areaMatches.length > 0 && (
              <ul className="absolute inset-x-0 z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-float">
                {areaMatches.map((c) => (
                  <li key={c.ibge}><button type="button" className="min-h-[44px] w-full px-4 text-left hover:bg-brand-50" onClick={() => { set({ serviceAreaCities: [...f.serviceAreaCities, c.ibge] }); setAreaTerm(''); }}>+ {c.name}</button></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section title="Contato" hint="Informe pelo menos um. Eles aparecem no seu perfil para os clientes.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="WhatsApp" optional type="tel" inputMode="tel" value={f.whatsapp ?? ''} onChange={(e) => set({ whatsapp: e.target.value })} error={errors.whatsapp} placeholder="(47) 99999-9999" />
          <TextField label="Telefone" optional type="tel" inputMode="tel" value={f.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} />
          <TextField label="E-mail" optional type="email" inputMode="email" value={f.email ?? ''} onChange={(e) => set({ email: e.target.value })} error={errors.email} />
          <TextField label="Site" optional inputMode="url" value={f.website ?? ''} onChange={(e) => set({ website: e.target.value })} error={errors.website} placeholder="www.suaempresa.com.br" />
          <TextField label="Instagram" optional value={f.instagram ?? ''} onChange={(e) => set({ instagram: e.target.value })} error={errors.instagram} placeholder="@suaempresa" />
        </div>
      </Section>

      <Section title="Preço e contratação">
        <fieldset>
          <legend className="label">Faixa de preço <span className="font-normal text-muted">(opcional)</span></legend>
          <div className="flex flex-wrap gap-2">
            <ChipToggle selected={f.priceLevel == null} onClick={() => set({ priceLevel: null })}>Não informar</ChipToggle>
            {[1, 2, 3, 4].map((p) => <ChipToggle key={p} selected={f.priceLevel === p} onClick={() => set({ priceLevel: p })}>{PRICE_LEVEL_LABELS[p]}</ChipToggle>)}
          </div>
        </fieldset>
        <Checkbox label="Aceitar agendamento pelo app" description="Clientes escolhem um horário livre. Você confirma ou recusa em Pedidos. Requer serviços com duração e horários cadastrados." checked={f.acceptsBooking} onChange={(e) => set({ acceptsBooking: e.target.checked })} />
        <Checkbox label="Aceitar pedidos de orçamento" description="Clientes descrevem o que precisam e você responde." checked={f.acceptsQuote} onChange={(e) => set({ acceptsQuote: e.target.checked })} />
      </Section>

      {apiError && <Alert tone="error">{apiError}</Alert>}
      <Button type="submit" size="lg" block loading={loading}>{submitLabel}</Button>
    </form>
  );
}

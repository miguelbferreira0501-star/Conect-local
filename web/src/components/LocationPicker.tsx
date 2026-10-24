import { useEffect, useMemo, useState } from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';
import { normalize } from '@conecta/shared';
import { fetchCity, fetchNearestCity, useCities, useStates } from '@/lib/queries';
import { useUserLocation } from '@/lib/location';
import { Button } from './ui/Button';
import { Alert, Spinner } from './ui/Feedback';
import { SelectField } from './ui/Form';
import { Sheet } from './ui/Sheet';

/** Seleção de estado → cidade (base oficial do IBGE), com opção de usar a localização do aparelho. */
export function LocationPicker() {
  const { city, pickerOpen, closePicker, setCity } = useUserLocation();
  const [uf, setUf] = useState<string>(city?.uf ?? '');
  const [term, setTerm] = useState('');
  const [geoStep, setGeoStep] = useState<'idle' | 'explain' | 'loading' | 'denied' | 'error'>('idle');
  const states = useStates();
  const cities = useCities(uf || null);

  useEffect(() => {
    if (pickerOpen) {
      setUf(city?.uf ?? '');
      setTerm('');
      setGeoStep('idle');
    }
  }, [pickerOpen, city?.uf]);

  const filtered = useMemo(() => {
    const t = normalize(term);
    const list = cities.data ?? [];
    return t ? list.filter((c) => normalize(c.name).includes(t)) : list;
  }, [cities.data, term]);

  const choose = async (ibge: number) => {
    const c = await fetchCity(ibge);
    setCity(c);
    closePicker();
  };

  const useDevice = () => {
    if (!('geolocation' in navigator)) {
      setGeoStep('error');
      return;
    }
    setGeoStep('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const c = await fetchNearestCity(pos.coords.latitude, pos.coords.longitude);
          setCity(c, { lat: pos.coords.latitude, lon: pos.coords.longitude });
          closePicker();
        } catch {
          setGeoStep('error');
        }
      },
      (err) => setGeoStep(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };

  return (
    <Sheet open={pickerOpen} onClose={closePicker} title="Onde você está?">
      <div className="space-y-4">
        {geoStep === 'idle' && (
          <button onClick={() => setGeoStep('explain')} className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-line px-4 text-left font-medium text-brand-700 hover:bg-brand-50">
            <Crosshair className="h-5 w-5" aria-hidden="true" /> Usar minha localização atual
          </button>
        )}
        {geoStep === 'explain' && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
            <p className="font-semibold text-brand-800">Por que pedimos sua localização?</p>
            <p className="mt-1 text-sm text-brand-800">
              Para descobrir sua cidade e mostrar a distância até as empresas. Usamos apenas enquanto o app estiver aberto e não salvamos suas coordenadas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={useDevice}>Permitir e continuar</Button>
              <Button size="sm" variant="secondary" onClick={() => setGeoStep('idle')}>Agora não</Button>
            </div>
          </div>
        )}
        {geoStep === 'loading' && <Spinner label="Buscando sua localização…" />}
        {geoStep === 'denied' && (
          <Alert tone="warning" title="Permissão negada">Sem problemas: escolha seu estado e cidade abaixo.</Alert>
        )}
        {geoStep === 'error' && <Alert tone="warning">Não conseguimos identificar sua localização. Escolha manualmente abaixo.</Alert>}

        <SelectField label="Estado" value={uf} onChange={(e) => { setUf(e.target.value); setTerm(''); }}>
          <option value="">Selecione o estado</option>
          {states.data?.map((s) => (
            <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
          ))}
        </SelectField>

        {uf && (
          <div>
            <label htmlFor="city-search" className="label">Cidade</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="city-search"
                className="field pl-11"
                placeholder="Digite o nome da cidade"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="mt-2 max-h-[38vh] overflow-y-auto rounded-xl border border-line" role="listbox" aria-label="Cidades">
              {cities.isLoading && <div className="p-4"><Spinner label="Carregando cidades…" /></div>}
              {cities.isError && <p className="p-4 text-sm text-danger-700">Não foi possível carregar as cidades.</p>}
              {filtered.slice(0, 120).map((c) => (
                <button
                  key={c.ibge}
                  role="option"
                  aria-selected={city?.ibge === c.ibge}
                  onClick={() => choose(c.ibge)}
                  className={`flex min-h-[48px] w-full items-center gap-2 border-b border-line px-4 text-left last:border-0 hover:bg-brand-50 ${city?.ibge === c.ibge ? 'bg-brand-50 font-semibold text-brand-800' : ''}`}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /> {c.name}
                </button>
              ))}
              {cities.data && filtered.length === 0 && <p className="p-4 text-sm text-muted">Nenhuma cidade encontrada com “{term}”.</p>}
              {filtered.length > 120 && <p className="p-3 text-center text-xs text-muted">Digite para encontrar outras cidades ({filtered.length} no total).</p>}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CityDTO } from '@conecta/shared';
import { storage } from './storage';

const KEY = 'cl_location';
const PREF_KEY = 'cl_remember_location';

interface LocationState {
  city: CityDTO | null;
  /** Coordenadas do aparelho: ficam só na memória (não são salvas). */
  coords: { lat: number; lon: number } | null;
  remember: boolean;
  setCity: (city: CityDTO, coords?: { lat: number; lon: number } | null) => void;
  clearCoords: () => void;
  setRemember: (v: boolean) => void;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

const Ctx = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [remember, setRememberState] = useState<boolean>(() => storage.get(PREF_KEY, true));
  const [city, setCityState] = useState<CityDTO | null>(() => (storage.get(PREF_KEY, true) ? storage.get<CityDTO | null>(KEY, null) : null));
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const setCity = useCallback(
    (c: CityDTO, co: { lat: number; lon: number } | null = null) => {
      setCityState(c);
      setCoords(co);
      if (remember) storage.set(KEY, c);
    },
    [remember],
  );

  const setRemember = useCallback(
    (v: boolean) => {
      setRememberState(v);
      storage.set(PREF_KEY, v);
      if (!v) storage.remove(KEY);
      else if (city) storage.set(KEY, city);
    },
    [city],
  );

  const value = useMemo<LocationState>(
    () => ({
      city,
      coords,
      remember,
      setCity,
      clearCoords: () => setCoords(null),
      setRemember,
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
    }),
    [city, coords, remember, setCity, setRemember, pickerOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('LocationProvider ausente');
  return ctx;
}

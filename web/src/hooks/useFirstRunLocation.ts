import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useUserLocation } from '@/lib/location';
import { fetchCity } from '@/lib/queries';

/** Na primeira visita: usa a cidade salva no perfil (se houver) ou abre o seletor. */
export function useFirstRunLocation() {
  const { city, setCity, openPicker } = useUserLocation();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (city || loading) return;
    if (user?.cityIbge) {
      fetchCity(user.cityIbge).then((c) => setCity(c)).catch(() => openPicker());
    } else {
      const t = setTimeout(openPicker, 400);
      return () => clearTimeout(t);
    }
  }, [city, loading, user?.cityIbge, setCity, openPicker]);
}

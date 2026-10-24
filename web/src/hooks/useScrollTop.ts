import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Volta ao topo ao trocar de tela (mas não ao mudar filtros/abas na mesma tela). */
export function useScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}

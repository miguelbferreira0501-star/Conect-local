// Atalhos entre telas: qualquer componente pede para abrir uma tela e o App atende.
export type UiTarget = 'plus' | 'menu' | 'ajustes' | 'correio' | 'temporada' | 'evolucao' | 'amigos' | 'missoes' | 'carteira';
const subs = new Set<(t: UiTarget) => void>();
export const openUi = (t: UiTarget) => subs.forEach((f) => f(t));
export function onUi(f: (t: UiTarget) => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

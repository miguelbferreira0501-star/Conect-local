// Pelagens do Lumbi. Cores de ilustração (valem nos dois temas).
export interface Fur {
  id: string;
  label: string;
  body: string;
  shade: string;
  belly: string;
  ear: string;
  /** Desenho extra na pelagem. */
  pattern?: 'panda' | 'manchas';
  patch?: string;
  plus?: boolean;
  /** Pelagem especial: comprada com sementes no Armário. */
  price?: number;
}

/** Só 4 pelagens, todas liberadas desde o começo. */
export const FURS: Fur[] = [
  { id: 'caramelo', label: 'Caramelo', body: '#EFA46C', shade: '#D8864F', belly: '#FCE7D4', ear: '#F6A8B0' },
  { id: 'creme', label: 'Creme', body: '#F7DFB9', shade: '#E2C08E', belly: '#FFFBF3', ear: '#FFAAB5' },
  { id: 'chocolate', label: 'Chocolate', body: '#A97A5A', shade: '#86593D', belly: '#F1DEC9', ear: '#F59AA5' },
  { id: 'panda', label: 'Branco e preto', body: '#FBFAF7', shade: '#DCD8D0', belly: '#FFFFFF', ear: '#FFAAB5', pattern: 'panda', patch: '#4A4048' },
];

export const furById = (id: string) => FURS.find((f) => f.id === id) ?? FURS[0];

/** Cores do app (cor de destaque). A cor de cada tema claro/escuro fica no CSS. */
export const ACCENTS = [
  { id: 'morango', label: 'Morango' },
  { id: 'lavanda', label: 'Lavanda' },
  { id: 'menta', label: 'Menta' },
  { id: 'ceu', label: 'Céu' },
  { id: 'pessego', label: 'Pêssego' },
  { id: 'girassol', label: 'Girassol' },
] as const;

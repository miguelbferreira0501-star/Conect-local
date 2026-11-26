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
  /** Só para a namorada (ou namorado) do Lumbi. */
  partner?: boolean;
}

/** 4 pelagens liberadas desde o começo, as raras do Lumbi+ e a especial da namorada. */
export const FURS: Fur[] = [
  { id: 'caramelo', label: 'Caramelo', body: '#EFA46C', shade: '#D8864F', belly: '#FCE7D4', ear: '#F6A8B0' },
  { id: 'creme', label: 'Creme', body: '#F7DFB9', shade: '#E2C08E', belly: '#FFFBF3', ear: '#FFAAB5' },
  { id: 'chocolate', label: 'Chocolate', body: '#A97A5A', shade: '#86593D', belly: '#F1DEC9', ear: '#F59AA5' },
  { id: 'panda', label: 'Branco e preto', body: '#FBFAF7', shade: '#DCD8D0', belly: '#FFFFFF', ear: '#FFAAB5', pattern: 'panda', patch: '#4A4048' },
  // Pelagens raras do Lumbi+ (as 4 de cima continuam liberadas para todo mundo)
  { id: 'algodao', label: 'Algodão-doce', body: '#FFD9E6', shade: '#F2A7C3', belly: '#FFF5F9', ear: '#F59AB9', plus: true },
  { id: 'lavanda', label: 'Lavanda', body: '#E6DCFF', shade: '#B7A3EE', belly: '#FAF7FF', ear: '#B49CF0', plus: true },
  { id: 'menta', label: 'Menta', body: '#D6F3E5', shade: '#97D4B8', belly: '#F6FFFA', ear: '#7CC7A4', plus: true },
  { id: 'ceu', label: 'Céu', body: '#DAEBFF', shade: '#A2C4EE', belly: '#F7FBFF', ear: '#8DB6EA', plus: true },
  { id: 'dourado', label: 'Dourado', body: '#FFE6A3', shade: '#E8B957', belly: '#FFF9E6', ear: '#E0A94A', plus: true },
  // Pelagem especial da namorada do Lumbi: rosinha pêssego com orelhinhas cor de rosa
  { id: 'rosinha', label: 'Rosinha', body: '#FFE3DC', shade: '#EEB0A6', belly: '#FFF7F4', ear: '#F29AAE', plus: true, partner: true },
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

// Pelagens do Hami: tons reais de hamster e tons pastel. Cores de ilustração (valem nos dois temas).
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

export const FURS: Fur[] = [
  { id: 'caramelo', label: 'Caramelo', body: '#F2B46D', shade: '#D98E45', belly: '#FFF3E0', ear: '#FF9EAA' },
  { id: 'creme', label: 'Creme', body: '#F7DFB9', shade: '#E2C08E', belly: '#FFFBF3', ear: '#FFAAB5' },
  { id: 'nuvem', label: 'Cinza-nuvem', body: '#C9CDD6', shade: '#A3A9B6', belly: '#F4F5F8', ear: '#FFB0BE' },
  { id: 'panda', label: 'Panda', body: '#FBFAF7', shade: '#DCD8D0', belly: '#FFFFFF', ear: '#FFAAB5', pattern: 'panda', patch: '#4A4048' },
  { id: 'chocolate', label: 'Chocolate', body: '#A97A5A', shade: '#86593D', belly: '#F1DEC9', ear: '#F59AA5' },
  { id: 'malhado', label: 'Malhado', body: '#FBF4EA', shade: '#E6D6C2', belly: '#FFFFFF', ear: '#FFAAB5', pattern: 'manchas', patch: '#E59A52' },
  { id: 'algodao', label: 'Algodão-doce', body: '#FFC6DA', shade: '#F49CBB', belly: '#FFF0F6', ear: '#FF86AA' },
  { id: 'lavanda', label: 'Lavanda', body: '#CDB8F2', shade: '#A98DDF', belly: '#F6F0FF', ear: '#FF9FC2' },
  { id: 'menta', label: 'Menta', body: '#AEE6CC', shade: '#7FCBA9', belly: '#F0FFF7', ear: '#FFA3B5' },
  { id: 'ceu', label: 'Céu', body: '#B4DBFA', shade: '#85BDEB', belly: '#F2F9FF', ear: '#FFA6BC' },
  { id: 'pessego', label: 'Pêssego', body: '#FFCBA8', shade: '#F5A97B', belly: '#FFF5EE', ear: '#FF94A4' },
  { id: 'limao', label: 'Limão', body: '#F2EC9B', shade: '#D9CF6A', belly: '#FFFDE8', ear: '#FFA8B4' },
  { id: 'arco-iris', label: 'Arco-íris', body: '#FFD3E8', shade: '#B9A6F2', belly: '#E9FFF6', ear: '#FF94C2', plus: true },
  { id: 'dourado', label: 'Dourado', body: '#F7CF5C', shade: '#E0A92A', belly: '#FFF6D6', ear: '#FF9EAA', plus: true },
  { id: 'mel', label: 'Mel', body: '#E8A85C', shade: '#C98238', belly: '#FFEBD0', ear: '#FF9EAA', price: 60 },
  { id: 'neve', label: 'Branquinho', body: '#FFFFFF', shade: '#E1E3EA', belly: '#FFFFFF', ear: '#FFB3C1', price: 60 },
  { id: 'grafite', label: 'Grafite', body: '#8E8C97', shade: '#6E6C78', belly: '#E9E8EE', ear: '#F59AAA', price: 70 },
  { id: 'cereja', label: 'Cereja', body: '#F79AA8', shade: '#E2707F', belly: '#FFEFF2', ear: '#FF6F91', price: 80 },
  { id: 'oceano', label: 'Oceano', body: '#8FC9E8', shade: '#5FA6CF', belly: '#EEF8FF', ear: '#FFA6BC', price: 80 },
  { id: 'pistache', label: 'Pistache', body: '#C8E29C', shade: '#A2C46E', belly: '#F7FFE9', ear: '#FFA8B4', price: 80 },
  { id: 'cookies', label: 'Cookies', body: '#F3E7D6', shade: '#DCCDB8', belly: '#FFFFFF', ear: '#FFAAB5', pattern: 'manchas', patch: '#6B4A3A', price: 100 },
  { id: 'sorvete', label: 'Sorvete', body: '#FFF1F6', shade: '#F4D5E1', belly: '#FFFFFF', ear: '#FF9FC2', pattern: 'manchas', patch: '#9FD8FF', price: 120 },
  { id: 'galaxia', label: 'Galáxia', body: '#6F6AD8', shade: '#4B46B0', belly: '#DCD9FF', ear: '#FF9FC2', plus: true },
  { id: 'vaquinha', label: 'Vaquinha', body: '#FFFFFF', shade: '#E4E2E8', belly: '#FFFFFF', ear: '#FFB3C1', pattern: 'manchas', patch: '#3A3440', plus: true },
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

// Alimentos comuns com calorias aproximadas por porção caseira (referência: tabelas
// brasileiras de composição de alimentos). A pessoa pode editar tudo.
export type MealId = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia';

export const MEALS: { id: MealId; label: string; emoji: string }[] = [
  { id: 'cafe', label: 'Café da manhã', emoji: '☕' },
  { id: 'almoco', label: 'Almoço', emoji: '🍛' },
  { id: 'lanche', label: 'Lanche', emoji: '🍎' },
  { id: 'jantar', label: 'Jantar', emoji: '🍲' },
  { id: 'ceia', label: 'Ceia', emoji: '🌙' },
];

export interface FoodPreset {
  name: string;
  qty: string;
  kcal: number;
  emoji: string;
  /** Em quais refeições ele aparece como sugestão. */
  for: MealId[];
}

export const FOOD_PRESETS: FoodPreset[] = [
  { name: 'Pão francês', qty: '1 unidade', kcal: 135, emoji: '🥖', for: ['cafe', 'lanche'] },
  { name: 'Pão integral', qty: '2 fatias', kcal: 120, emoji: '🍞', for: ['cafe', 'lanche'] },
  { name: 'Tapioca', qty: '1 unidade média', kcal: 130, emoji: '🫓', for: ['cafe', 'lanche'] },
  { name: 'Cuscuz', qty: '1 pedaço', kcal: 140, emoji: '🌽', for: ['cafe', 'jantar'] },
  { name: 'Ovo cozido', qty: '1 unidade', kcal: 70, emoji: '🥚', for: ['cafe', 'lanche', 'almoco', 'jantar'] },
  { name: 'Ovo mexido', qty: '2 ovos', kcal: 180, emoji: '🍳', for: ['cafe', 'jantar'] },
  { name: 'Queijo branco', qty: '1 fatia', kcal: 70, emoji: '🧀', for: ['cafe', 'lanche'] },
  { name: 'Manteiga', qty: '1 colher de chá', kcal: 35, emoji: '🧈', for: ['cafe', 'lanche'] },
  { name: 'Café com leite', qty: '1 xícara', kcal: 80, emoji: '☕', for: ['cafe', 'lanche'] },
  { name: 'Café preto sem açúcar', qty: '1 xícara', kcal: 5, emoji: '☕', for: ['cafe', 'lanche'] },
  { name: 'Leite', qty: '1 copo', kcal: 120, emoji: '🥛', for: ['cafe', 'ceia'] },
  { name: 'Iogurte natural', qty: '1 pote', kcal: 100, emoji: '🥣', for: ['cafe', 'lanche', 'ceia'] },
  { name: 'Aveia', qty: '2 colheres de sopa', kcal: 75, emoji: '🥣', for: ['cafe', 'lanche'] },
  { name: 'Banana', qty: '1 unidade', kcal: 90, emoji: '🍌', for: ['cafe', 'lanche', 'ceia'] },
  { name: 'Maçã', qty: '1 unidade', kcal: 70, emoji: '🍎', for: ['lanche', 'cafe', 'ceia'] },
  { name: 'Mamão', qty: '1 fatia', kcal: 55, emoji: '🍈', for: ['cafe', 'lanche'] },
  { name: 'Laranja', qty: '1 unidade', kcal: 60, emoji: '🍊', for: ['lanche', 'almoco'] },
  { name: 'Suco de laranja', qty: '1 copo', kcal: 110, emoji: '🧃', for: ['cafe', 'almoco'] },
  { name: 'Arroz branco', qty: '4 colheres de sopa', kcal: 160, emoji: '🍚', for: ['almoco', 'jantar'] },
  { name: 'Arroz integral', qty: '4 colheres de sopa', kcal: 140, emoji: '🍚', for: ['almoco', 'jantar'] },
  { name: 'Feijão', qty: '1 concha', kcal: 100, emoji: '🫘', for: ['almoco', 'jantar'] },
  { name: 'Frango grelhado', qty: '1 filé (100 g)', kcal: 165, emoji: '🍗', for: ['almoco', 'jantar'] },
  { name: 'Carne moída', qty: '100 g', kcal: 215, emoji: '🥩', for: ['almoco', 'jantar'] },
  { name: 'Bife', qty: '1 bife (100 g)', kcal: 220, emoji: '🥩', for: ['almoco', 'jantar'] },
  { name: 'Peixe assado', qty: '1 filé (100 g)', kcal: 130, emoji: '🐟', for: ['almoco', 'jantar'] },
  { name: 'Salada verde', qty: '1 prato', kcal: 30, emoji: '🥗', for: ['almoco', 'jantar'] },
  { name: 'Legumes cozidos', qty: '1 pires', kcal: 50, emoji: '🥦', for: ['almoco', 'jantar'] },
  { name: 'Batata-doce', qty: '100 g', kcal: 86, emoji: '🍠', for: ['almoco', 'jantar', 'lanche'] },
  { name: 'Macarrão', qty: '1 prato raso', kcal: 220, emoji: '🍝', for: ['almoco', 'jantar'] },
  { name: 'Farofa', qty: '2 colheres de sopa', kcal: 110, emoji: '🥄', for: ['almoco', 'jantar'] },
  { name: 'Sopa de legumes', qty: '1 prato', kcal: 150, emoji: '🍲', for: ['jantar', 'ceia'] },
  { name: 'Castanhas', qty: '1 punhado (30 g)', kcal: 180, emoji: '🥜', for: ['lanche', 'ceia'] },
  { name: 'Vitamina de banana', qty: '1 copo', kcal: 250, emoji: '🍌', for: ['cafe', 'lanche'] },
  { name: 'Pizza', qty: '1 fatia', kcal: 270, emoji: '🍕', for: ['jantar', 'lanche'] },
  { name: 'Hambúrguer', qty: '1 sanduíche', kcal: 500, emoji: '🍔', for: ['jantar', 'almoco', 'lanche'] },
  { name: 'Refrigerante', qty: '1 lata', kcal: 140, emoji: '🥤', for: ['almoco', 'jantar', 'lanche'] },
  { name: 'Chocolate', qty: '1 barra pequena (25 g)', kcal: 135, emoji: '🍫', for: ['lanche', 'ceia'] },
  { name: 'Bolo simples', qty: '1 fatia', kcal: 200, emoji: '🍰', for: ['lanche', 'cafe'] },
  { name: 'Biscoito recheado', qty: '3 unidades', kcal: 150, emoji: '🍪', for: ['lanche', 'ceia'] },
];

export const presetByName = (name: string) => FOOD_PRESETS.find((f) => f.name.toLowerCase() === name.trim().toLowerCase());

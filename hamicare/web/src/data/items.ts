// Catálogo da loja. Roupas são desenhadas no próprio Hami (Hamster.tsx); móveis e decoração
// vão para a casa (Room.tsx); comidas são consumíveis.
export type ItemKind = 'chapeu' | 'oculos' | 'roupa' | 'acessorio' | 'efeito' | 'movel' | 'decor' | 'brinquedo' | 'comida' | 'parede' | 'piso';
export type Season = 'natal' | 'junina' | 'halloween';

export interface Item {
  id: string;
  name: string;
  kind: ItemKind;
  price: number;
  emoji?: string;
  /** Móvel desenhado em SVG (Furniture.tsx) em vez de emoji. */
  svg?: string;
  /** Largura na casa, em % do cômodo. */
  size?: number;
  plus?: boolean;
  season?: Season;
  level?: number;
  /** Só vem de aventura: não está à venda. */
  souvenir?: boolean;
  food?: { saciedade: number; felicidade: number };
  /** Desenho próprio (chave do conjunto de ilustrações) quando não há emoji. */
  art?: string;
  /** Exclusivo de arena: vem de presente ao abrir a arena (não está à venda). */
  arena?: number;
  /** Raridade definida à mão (se faltar, é estimada pelo preço). */
  rarity?: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';
  /** Peça desenhada no Hami: o modelo e as cores (as variações de cor usam o mesmo desenho). */
  base?: string;
  c1?: string;
  c2?: string;
}

const W = (id: string, name: string, kind: ItemKind, price: number, extra: Partial<Item> = {}): Item => ({ id, name, kind, price, ...extra });

type Rar = NonNullable<Item['rarity']>;
/** Itens exclusivos de uma arena: não estão à venda (vêm de presente ao abrir a arena). */
function arenaItems(arena: number, rarity: Rar, list: [string, string, ItemKind, Partial<Item>][]): Item[] {
  return list.map(([id, name, kind, extra]) => W(id, name, kind, 0, { rarity, ...extra, arena, souvenir: true }));
}

/** Cores das variações. [cor principal, cor de detalhe, nome no masculino, nome no feminino] */
const COR: Record<string, [string, string, string, string]> = {
  rosa: ['#FF86AC', '#E2557F', 'rosa', 'rosa'],
  azul: ['#5B8DEF', '#3D6FD8', 'azul', 'azul'],
  verde: ['#5FBF77', '#3E9C55', 'verde', 'verde'],
  amarelo: ['#FFD34D', '#E8B020', 'amarelo', 'amarela'],
  roxo: ['#A57CF0', '#7E57D6', 'roxo', 'roxa'],
  laranja: ['#FF9A4D', '#E07A2E', 'laranja', 'laranja'],
  preto: ['#3A3440', '#24202A', 'preto', 'preta'],
  branco: ['#FFFFFF', '#DADAE2', 'branco', 'branca'],
  vermelho: ['#F0525F', '#C93A47', 'vermelho', 'vermelha'],
  menta: ['#6FD8C0', '#3FB8A0', 'menta', 'menta'],
  lilas: ['#D7C2FF', '#B399F0', 'lilás', 'lilás'],
  dourado: ['#F6C445', '#D99E1E', 'dourado', 'dourada'],
  jeans: ['#5E7FB8', '#3F5E94', 'jeans', 'jeans'],
};

/** Gera uma peça em várias cores. A primeira cor de `cores` pode reaproveitar um id antigo. */
function cores(base: string, nome: string, kind: ItemKind, price: number, lista: string[], opts: { fem?: boolean; extra?: Partial<Item>; plusCores?: string[] } = {}): Item[] {
  return lista.map((c) => {
    const [c1, c2, m, f] = COR[c];
    return W(`${base}-${c}`, `${nome} ${opts.fem ? f : m}`, kind, price, { base, c1, c2, ...(opts.plusCores?.includes(c) ? { plus: true } : {}), ...opts.extra });
  });
}


/** Móveis do kit novo (components/room/kit.tsx): cada cor é um item. [sufixo, nome da cor, cor principal, cor de detalhe] */
type Cor = [string, string, string, string];
function moveis(base: string, nome: string, kind: ItemKind, price: number, size: number, lista: Cor[], extra: Partial<Item> = {}): Item[] {
  return lista.map(([suf, cor, c1, c2]) => W(`k-${base}-${suf}`, cor ? `${nome} ${cor}` : nome, kind, price, { svg: `k-${base}`, size, c1, c2, ...extra }));
}
const BR: Cor = ['branco', 'branco', '#F7F3EE', '#FF9FC2'];
const MAD: Cor = ['madeira', 'de madeira', '#C98A5B', '#F7D9A8'];

export const KIT_ITEMS: Item[] = [
  // Quarto
  ...moveis('cama', 'Cama', 'movel', 130, 44, [['rosa', 'rosa', '#FF9FC2', '#FFE3EC'], ['azul', 'azul', '#7FB8F0', '#E6F1FB'], ['lilas', 'lilás', '#C3A6F2', '#F1E9FF'], ['menta', 'menta', '#7FD8BE', '#E9FAF1'], ['amarela', 'amarela', '#FFD66B', '#FFF7D6']]),
  ...moveis('criado', 'Criado-mudo com abajur', 'movel', 45, 14, [BR, MAD, ['rosa', 'rosa', '#FFC2D6', '#FFFFFF'], ['azul', 'azul', '#A9D4F5', '#FFF3B0']]),
  ...moveis('guarda-roupa', 'Guarda-roupa', 'movel', 140, 25, [BR, ['rosa', 'rosa', '#FFB3CC', '#FFFFFF'], MAD, ['lilas', 'lilás', '#C9B5F0', '#FFE27A']], { level: 2 }),
  ...moveis('comoda', 'Cômoda', 'movel', 100, 30, [BR, ['rosa', 'rosa', '#FFC2D6', '#7FB8F0'], MAD, ['menta', 'menta', '#9FE3CF', '#FF9FC2']]),
  ...moveis('espelho', 'Espelho de pé', 'movel', 60, 13, [['dourado', 'dourado', '#F2C14E', '#FF9FC2'], ['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['branco', 'branco', '#F7F3EE', '#B399F0']]),
  ...moveis('penteadeira', 'Penteadeira', 'movel', 120, 28, [['rosa', 'rosa', '#FFC2D6', '#FF9FC2'], ['branca', 'branca', '#F7F3EE', '#B399F0'], ['lilas', 'lilás', '#D7C2FF', '#FFE27A']], { level: 3 }),
  // Sala
  ...moveis('sofa', 'Sofá', 'movel', 140, 40, [['rosa', 'rosa', '#FF9FC2', '#FFF3B0'], ['azul', 'azul', '#7FB8F0', '#FFD66B'], ['verde', 'verde', '#7FD8BE', '#FF9FC2'], ['amarelo', 'amarelo', '#FFD66B', '#7FB8F0'], ['lilas', 'lilás', '#C3A6F2', '#FFFFFF'], ['vermelho', 'vermelho', '#E2547A', '#FFE3EA']]),
  ...moveis('poltrona', 'Poltrona', 'movel', 80, 22, [['rosa', 'rosa', '#FF9FC2', '#FFF3B0'], ['azul', 'azul', '#7FB8F0', '#FFFFFF'], ['verde', 'verde', '#7FD8BE', '#FFE27A'], ['vermelha', 'vermelha', '#E2547A', '#F7E3C8']]),
  ...moveis('mesa-centro', 'Mesinha de centro', 'movel', 50, 24, [MAD, BR, ['rosa', 'rosa', '#FFC2D6', '#FFFFFF']]),
  ...moveis('estante', 'Estante de livros', 'movel', 110, 23, [['madeira', 'de madeira', '#B98258', '#FF9FC2'], ['branca', 'branca', '#E8E2DA', '#7FB8F0'], ['rosa', 'rosa', '#F7A8C2', '#FFE27A']], { level: 2 }),
  ...moveis('rack-tv', 'TV com rack', 'movel', 120, 30, [MAD, BR, ['azul', 'azul', '#A9D4F5', '#FF9FC2']], { level: 3 }),
  ...moveis('luminaria', 'Luminária de pé', 'movel', 50, 10, [['amarela', 'amarela', '#FFE27A', '#FFFFFF'], ['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['menta', 'menta', '#9FE3CF', '#FFFFFF'], ['branca', 'branca', '#F7F3EE', '#FFFFFF']]),
  // Cozinha
  ...moveis('mesa-jantar', 'Mesa com cadeiras', 'movel', 110, 34, [['vermelha', 'xadrez vermelho', '#F0525F', '#F7D9A8'], ['azul', 'azul', '#7FB8F0', '#FFFFFF'], ['rosa', 'rosa', '#FF9FC2', '#FFF3B0']], { level: 2 }),
  ...moveis('geladeira', 'Geladeira retrô', 'movel', 120, 15, [['menta', 'menta', '#9FE3CF', '#FFFFFF'], ['rosa', 'rosa', '#FFB3CC', '#FFFFFF'], ['azul', 'azul', '#A9D4F5', '#FFFFFF'], ['amarela', 'amarela', '#FFE08A', '#FFFFFF']], { level: 3 }),
  ...moveis('fogao', 'Fogão com panelinha', 'movel', 100, 21, [['branco', 'branco', '#F7F3EE', '#E2547A'], ['menta', 'menta', '#9FE3CF', '#FF9A4D'], ['rosa', 'rosa', '#FFC2D6', '#7FB8F0']], { level: 3 }),
  // Cantinho do hamster
  ...moveis('torre', 'Torre de brincar', 'movel', 120, 23, [['rosa', 'rosa', '#FF9FC2', '#7FB8F0'], ['azul', 'azul', '#7FB8F0', '#FFD66B'], ['verde', 'verde', '#7FD8BE', '#FF9FC2']]),
  ...moveis('casinha', 'Casinha de hamster', 'movel', 80, 22, [['vermelha', 'vermelha', '#E2547A', '#FFD66B'], ['azul', 'azul', '#5B8DEF', '#FF9FC2'], ['verde', 'verde', '#5FBF77', '#FFD66B']]),
  ...moveis('rodinha', 'Rodinha nova', 'movel', 60, 20, [['rosa', 'rosa', '#FF86AC', '#FFD66B'], ['azul', 'azul', '#5B8DEF', '#FFFFFF'], ['menta', 'menta', '#3FB8A0', '#FFE27A']]),
  ...moveis('tubo', 'Túnel colorido', 'movel', 70, 28, [['rosa', 'rosa e azul', '#FF9FC2', '#7FB8F0'], ['verde', 'verde e amarelo', '#7FD8BE', '#FFD66B'], ['roxo', 'roxo e rosa', '#B399F0', '#FF9FC2']]),
  ...moveis('almofada', 'Caminha almofadada', 'movel', 45, 22, [['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['azul', 'azul', '#7FB8F0', '#FFE27A'], ['lilas', 'lilás', '#C3A6F2', '#FF9FC2']]),
  // Parede
  ...moveis('relogio', 'Relógio cuco', 'decor', 70, 10, [['madeira', '', '#FF9FC2', '#F2C14E']], { level: 2 }),
  ...moveis('prateleira', 'Prateleira enfeitada', 'decor', 55, 26, [MAD, ['branca', 'branca', '#F7F3EE', '#7FB8F0'], ['rosa', 'rosa', '#FFB3CC', '#FFFFFF']]),
  ...moveis('quadro', 'Quadro de paisagem', 'decor', 40, 16, [['dourado', 'dourado', '#F2C14E', '#BFE3FF'], ['madeira', 'de madeira', '#C98A5B', '#FFE7C7'], ['rosa', 'rosa', '#FF9FC2', '#DDF0FF']]),
  ...moveis('quadro-coracao', 'Quadro de coração', 'decor', 35, 11, [['rosa', 'rosa', '#FF86AC', '#FFF0F4'], ['dourado', 'dourado', '#F2C14E', '#FFF8EC']]),
  ...moveis('quadro-hami', 'Retrato do Hami', 'decor', 45, 12, [['madeira', 'de madeira', '#C98A5B', '#DDF0FF'], ['rosa', 'rosa', '#FF9FC2', '#FFF6E8']]),
  ...moveis('planta-pendurada', 'Planta pendurada', 'decor', 45, 11, [['rosa', 'em vaso rosa', '#FF9FC2', '#FFFFFF'], ['branca', 'em vaso branco', '#F7F3EE', '#FFFFFF'], ['terracota', 'em vaso de barro', '#D9825B', '#FFFFFF']]),
  ...moveis('luminaria-teto', 'Luminária pendente', 'decor', 45, 10, [['amarela', 'amarela', '#FFD66B', '#FFFFFF'], ['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['menta', 'menta', '#9FE3CF', '#FFFFFF']]),
  ...moveis('varal', 'Varal de fotos', 'decor', 50, 46, [['rosa', '', '#FF9FC2', '#B399F0']], { level: 2 }),
  // Plantas, tapetes e fofuras
  ...moveis('planta-grande', 'Planta grande', 'decor', 55, 15, [['terracota', 'no vaso de barro', '#D9825B', '#FFFFFF'], ['branca', 'no vaso branco', '#F7F3EE', '#FFFFFF'], ['rosa', 'no vaso rosa', '#FF9FC2', '#FFFFFF'], ['azul', 'no vaso azul', '#7FB8F0', '#FFFFFF']]),
  ...moveis('vaso-flores', 'Vaso de flores', 'decor', 30, 9, [['azul', 'azul', '#7FB8F0', '#B399F0'], ['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['amarelo', 'amarelo', '#FFD66B', '#FF86AC']]),
  ...moveis('tapete', 'Tapete redondo', 'movel', 60, 52, [['rosa', 'rosa', '#FF9FC2', '#FFE3EC'], ['azul', 'azul', '#7FB8F0', '#E6F1FB'], ['verde', 'verde', '#7FD8BE', '#E9FAF1'], ['lilas', 'lilás', '#C3A6F2', '#F1E9FF'], ['amarelo', 'amarelo', '#FFD66B', '#FFF7D6'], ['vermelho', 'vermelho', '#E2547A', '#F7E3C8']]),
  ...moveis('tapete-retangulo', 'Tapete estampado', 'movel', 80, 60, [['vermelho', 'vermelho', '#E2547A', '#F7D9A8'], ['azul', 'azul', '#5B8DEF', '#E6F1FB'], ['verde', 'verde', '#5FBF77', '#F7F3EE'], ['rosa', 'rosa', '#FF86AC', '#FFF0F4']]),
  ...moveis('tapete-coracao', 'Tapete de coração', 'movel', 60, 44, [['rosa', 'rosa', '#FF86AC', '#FFFFFF'], ['vermelho', 'vermelho', '#E2547A', '#FFE3EA']], { plus: true }),
  ...moveis('ursinho', 'Ursinho de pelúcia', 'decor', 40, 11, [['caramelo', 'caramelo', '#C98A5B', '#FF9FC2'], ['rosa', 'rosa', '#FFB3CC', '#7FB8F0'], ['branco', 'branco', '#F2EDE6', '#E2547A']]),
  ...moveis('cesto', 'Cesto de novelos', 'decor', 35, 12, [['rosa', '', '#FF9FC2', '#7FB8F0']]),
  ...moveis('bau', 'Baú de brinquedos', 'movel', 70, 19, [['azul', 'azul', '#7FB8F0', '#FFD66B'], ['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['madeira', 'de madeira', '#C98A5B', '#FFD66B']]),
  ...moveis('pufe', 'Pufe', 'movel', 40, 11, [['rosa', 'rosa', '#FF9FC2', '#FFFFFF'], ['amarelo', 'amarelo', '#FFD66B', '#FF9FC2'], ['azul', 'azul', '#7FB8F0', '#FFFFFF'], ['verde', 'verde', '#7FD8BE', '#FFFFFF']]),
];

export const ITEMS: Item[] = [
  // Chapéus
  W('laco', 'Laço de fita', 'chapeu', 20),
  W('bone', 'Boné', 'chapeu', 30),
  W('gorro', 'Gorro de lã', 'chapeu', 35),
  W('coroa', 'Coroa de flores', 'chapeu', 40),
  W('chef', 'Chapéu de chef', 'chapeu', 45, { level: 3 }),
  W('cartola', 'Cartola', 'chapeu', 60, { plus: true }),
  W('capacete', 'Capacete espacial', 'chapeu', 80, { plus: true }),
  W('palha', 'Chapéu de palha', 'chapeu', 30, { season: 'junina' }),
  W('gorro-natal', 'Gorro de Natal', 'chapeu', 30, { season: 'natal' }),
  // Óculos
  W('redondos', 'Óculos redondos', 'oculos', 25),
  W('sol', 'Óculos de sol', 'oculos', 35),
  W('coracao', 'Óculos de coração', 'oculos', 40, { plus: true }),
  // Roupas
  W('moletom', 'Moletom', 'roupa', 45),
  W('regata', 'Regata esportiva', 'roupa', 35, { level: 2 }),
  W('tutu', 'Saia de tule', 'roupa', 40),
  W('capa', 'Capa de herói', 'roupa', 70, { plus: true }),
  W('pijama', 'Pijama de estrelas', 'roupa', 50, { level: 4 }),
  // Acessórios
  W('cachecol', 'Cachecol', 'acessorio', 30),
  W('gravata', 'Gravata-borboleta', 'acessorio', 20),
  W('mochila', 'Mochilinha', 'acessorio', 40, { level: 2 }),
  W('medalha', 'Medalha de ouro', 'acessorio', 90, { level: 6 }),

  // ---------- Coleção grande: chapéus ----------
  ...cores('laco', 'Laço', 'chapeu', 20, ['azul', 'amarelo', 'roxo', 'preto', 'branco', 'menta']),
  ...cores('bone', 'Boné', 'chapeu', 30, ['vermelho', 'verde', 'rosa', 'preto', 'amarelo']),
  ...cores('gorro', 'Gorro', 'chapeu', 35, ['rosa', 'roxo', 'vermelho', 'amarelo', 'branco']),
  ...cores('boina', 'Boina', 'chapeu', 35, ['vermelho', 'preto', 'rosa', 'verde', 'lilas'], { fem: true }),
  ...cores('fone', 'Fone de ouvido', 'chapeu', 55, ['rosa', 'preto', 'branco', 'azul', 'menta'], { extra: { level: 2 } }),
  ...cores('flor', 'Florzinha', 'chapeu', 15, ['rosa', 'amarelo', 'branco', 'lilas', 'vermelho'], { fem: true }),
  ...cores('faixa', 'Faixa de treino', 'chapeu', 20, ['rosa', 'azul', 'verde', 'preto', 'amarelo'], { fem: true }),
  ...cores('orelhas-coelho', 'Orelhas de coelho', 'chapeu', 40, ['branco', 'rosa', 'lilas', 'preto']),
  ...cores('festa', 'Chapéu de festa', 'chapeu', 25, ['rosa', 'azul', 'amarelo', 'verde']),
  ...cores('touca-urso', 'Touca de ursinho', 'chapeu', 45, ['laranja', 'branco', 'rosa', 'preto'], { fem: true }),
  ...cores('chapeu-sol', 'Chapéu de sol', 'chapeu', 40, ['amarelo', 'rosa', 'branco', 'azul']),
  W('tiara', 'Tiara de princesa', 'chapeu', 60, { base: 'tiara', c1: '#F6C445', c2: '#FF6F91', level: 2 }),
  W('coroa-rei', 'Coroa real', 'chapeu', 120, { base: 'coroa-rei', c1: '#F6C445', c2: '#D7263D', plus: true }),
  W('aureola', 'Auréola', 'chapeu', 90, { base: 'aureola', c1: '#FFE27A', c2: '#F6C445', plus: true }),
  W('cowboy', 'Chapéu de cowboy', 'chapeu', 55, { base: 'cowboy', c1: '#B07A52', c2: '#8A5A3B', level: 3 }),
  W('viking', 'Capacete viking', 'chapeu', 70, { base: 'viking', c1: '#B8C0CC', c2: '#FFF1D6', level: 4 }),
  W('sapo', 'Chapéu de sapinho', 'chapeu', 50, { base: 'sapo', c1: '#7BD389', c2: '#3E9C55' }),
  W('antenas', 'Antenas de abelha', 'chapeu', 30, { base: 'antenas', c1: '#2B2224', c2: '#FFD34D' }),
  W('unicornio', 'Chifre de unicórnio', 'chapeu', 85, { base: 'unicornio', c1: '#FFE27A', c2: '#FF9FC2', plus: true }),
  W('pirata', 'Chapéu de pirata', 'chapeu', 65, { base: 'pirata', c1: '#2B2224', c2: '#F6C445', level: 3 }),
  W('formatura', 'Capelo de formatura', 'chapeu', 70, { base: 'formatura', c1: '#2B2224', c2: '#F6C445', level: 5 }),
  W('bruxa', 'Chapéu de bruxinha', 'chapeu', 45, { base: 'bruxa', c1: '#4B3A78', c2: '#FF9A4D', season: 'halloween' }),

  // ---------- Óculos ----------
  ...cores('redondos', 'Óculos redondos', 'oculos', 25, ['rosa', 'azul', 'dourado']),
  ...cores('sol', 'Óculos de sol', 'oculos', 35, ['rosa', 'azul', 'amarelo']),
  ...cores('quadrado', 'Óculos quadrados', 'oculos', 30, ['preto', 'vermelho', 'azul', 'verde']),
  ...cores('gatinho', 'Óculos gatinho', 'oculos', 40, ['rosa', 'roxo', 'preto']),
  W('estrela-oculos', 'Óculos de estrela', 'oculos', 45, { base: 'estrela', c1: '#FFD34D', c2: '#E8B020', level: 2 }),
  W('aviador', 'Óculos aviador', 'oculos', 55, { base: 'aviador', c1: '#3A3440', c2: '#F6C445', level: 3 }),
  W('monoculo', 'Monóculo', 'oculos', 60, { base: 'monoculo', c1: '#F6C445', c2: '#D99E1E', level: 4 }),
  ...cores('mascara', 'Máscara de herói', 'oculos', 50, ['vermelho', 'preto', 'azul'], { fem: true }),
  W('natacao', 'Óculos de natação', 'oculos', 35, { base: 'natacao', c1: '#5B8DEF', c2: '#3D6FD8' }),

  // ---------- Roupas ----------
  ...cores('moletom', 'Moletom', 'roupa', 45, ['rosa', 'verde', 'amarelo', 'roxo', 'preto']),
  ...cores('regata', 'Regata', 'roupa', 35, ['azul', 'verde', 'amarelo'], { fem: true, extra: { level: 2 } }),
  ...cores('camiseta', 'Camiseta', 'roupa', 30, ['branco', 'rosa', 'azul', 'verde', 'amarelo', 'vermelho'], { fem: true }),
  ...cores('listrada', 'Blusa listrada', 'roupa', 40, ['azul', 'vermelho', 'verde', 'rosa'], { fem: true }),
  ...cores('vestido', 'Vestido', 'roupa', 55, ['rosa', 'azul', 'amarelo', 'lilas', 'vermelho']),
  ...cores('jaqueta', 'Jaqueta', 'roupa', 65, ['preto', 'vermelho', 'jeans', 'verde'], { fem: true, extra: { level: 3 } }),
  ...cores('kimono', 'Quimono', 'roupa', 70, ['vermelho', 'azul', 'rosa'], { extra: { level: 4 } }),
  ...cores('tutu', 'Saia de tule', 'roupa', 40, ['lilas', 'azul', 'amarelo'], { fem: true }),
  ...cores('capa', 'Capa', 'roupa', 70, ['azul', 'roxo', 'preto'], { fem: true, extra: { plus: true } }),
  ...cores('florida', 'Camisa florida', 'roupa', 45, ['azul', 'rosa', 'verde'], { fem: true }),
  W('jardineira', 'Jardineira jeans', 'roupa', 60, { base: 'jardineira', c1: '#5E7FB8', c2: '#3F5E94', level: 2 }),
  W('futebol', 'Camisa de futebol', 'roupa', 50, { base: 'futebol', c1: '#FFD34D', c2: '#2E9D5B' }),
  W('abelha', 'Fantasia de abelhinha', 'roupa', 60, { base: 'abelha', c1: '#FFD34D', c2: '#2B2224' }),
  W('avental', 'Avental de cozinheiro', 'roupa', 35, { base: 'avental', c1: '#FFFFFF', c2: '#FF6F91' }),
  W('smoking', 'Smoking', 'roupa', 90, { base: 'smoking', c1: '#2B2224', c2: '#FFFFFF', level: 5 }),
  W('astronauta', 'Roupa de astronauta', 'roupa', 120, { base: 'astronauta', c1: '#F4F6FA', c2: '#5B8DEF', plus: true }),
  W('princesa', 'Vestido de princesa', 'roupa', 110, { base: 'princesa', c1: '#FFB3CF', c2: '#F6C445', plus: true }),
  W('sueter-natal', 'Suéter de Natal', 'roupa', 50, { base: 'sueter', c1: '#D7263D', c2: '#FFFFFF', season: 'natal' }),
  W('abobora-roupa', 'Fantasia de abóbora', 'roupa', 55, { base: 'abobora', c1: '#FF9A3D', c2: '#3E9C55', season: 'halloween' }),
  W('caipira', 'Camisa xadrez de festa junina', 'roupa', 40, { base: 'xadrez', c1: '#F0525F', c2: '#FFFFFF', season: 'junina' }),

  // ---------- Fantasias de corpo inteiro (capuz com orelhinhas) ----------
  W('fantasia-coelho-rosa', 'Fantasia de coelhinho rosa', 'roupa', 120, { base: 'fantasia-coelho', c1: '#FFB3CF', c2: '#FFFFFF' }),
  W('fantasia-coelho-branco', 'Fantasia de coelhinho branco', 'roupa', 120, { base: 'fantasia-coelho', c1: '#FFFFFF', c2: '#FFD6E4' }),
  W('fantasia-coelho-lilas', 'Fantasia de coelhinho lilás', 'roupa', 120, { base: 'fantasia-coelho', c1: '#D7C2FF', c2: '#FFFFFF', level: 2 }),
  W('fantasia-urso-marrom', 'Fantasia de ursinho', 'roupa', 110, { base: 'fantasia-urso', c1: '#B07A52', c2: '#F2D2B0' }),
  W('fantasia-urso-rosa', 'Fantasia de ursinho rosa', 'roupa', 110, { base: 'fantasia-urso', c1: '#FF9FC2', c2: '#FFE3EC' }),
  W('fantasia-gato-cinza', 'Fantasia de gatinho cinza', 'roupa', 110, { base: 'fantasia-gato', c1: '#B8BCCB', c2: '#FFFFFF' }),
  W('fantasia-gato-laranja', 'Fantasia de gatinho laranja', 'roupa', 110, { base: 'fantasia-gato', c1: '#FFB066', c2: '#FFF1DE' }),
  W('fantasia-gato-preto', 'Fantasia de gatinho preto', 'roupa', 110, { base: 'fantasia-gato', c1: '#4A4452', c2: '#FFFFFF', level: 3 }),
  W('fantasia-sapo', 'Fantasia de sapinho', 'roupa', 110, { base: 'fantasia-sapo', c1: '#7BD389', c2: '#E8F7C8' }),
  W('fantasia-dino-verde', 'Fantasia de dinossauro', 'roupa', 130, { base: 'fantasia-dino', c1: '#6CC48C', c2: '#FFE27A', level: 2 }),
  W('fantasia-dino-roxo', 'Fantasia de dinossauro roxo', 'roupa', 130, { base: 'fantasia-dino', c1: '#A57CF0', c2: '#FFD6E4', level: 4 }),
  W('fantasia-pintinho', 'Fantasia de pintinho', 'roupa', 100, { base: 'fantasia-pintinho', c1: '#FFE066', c2: '#FFF5C2' }),
  W('fantasia-pinguim', 'Fantasia de pinguim', 'roupa', 120, { base: 'fantasia-pinguim', c1: '#3A3440', c2: '#FFFFFF', level: 3 }),
  W('fantasia-unicornio', 'Fantasia de unicórnio', 'roupa', 160, { base: 'fantasia-unicornio', c1: '#FFFFFF', c2: '#FF9FC2', plus: true }),
  // ---------- Vestidos de festa ----------
  W('babado-rosa', 'Vestido de babados rosa', 'roupa', 80, { base: 'babado', c1: '#FF9FC2', c2: '#FFFFFF' }),
  W('babado-lilas', 'Vestido de babados lilás', 'roupa', 80, { base: 'babado', c1: '#C3A6F2', c2: '#FFFFFF' }),
  W('babado-azul', 'Vestido de babados azul', 'roupa', 80, { base: 'babado', c1: '#9FC8F2', c2: '#FFFFFF' }),
  W('babado-amarelo', 'Vestido de babados amarelo', 'roupa', 80, { base: 'babado', c1: '#FFD66B', c2: '#FFFFFF' }),
  W('estrelado-roxo', 'Vestido de estrelinhas', 'roupa', 110, { base: 'estrelado', c1: '#7E57D6', c2: '#FFE27A', level: 3 }),
  W('estrelado-noite', 'Vestido noite estrelada', 'roupa', 110, { base: 'estrelado', c1: '#3D4F9E', c2: '#FFE27A', plus: true }),

  // ---------- Acessórios ----------
  ...cores('cachecol', 'Cachecol', 'acessorio', 30, ['azul', 'verde', 'amarelo', 'rosa']),
  ...cores('gravata', 'Gravata-borboleta', 'acessorio', 20, ['vermelho', 'rosa', 'preto', 'amarelo'], { fem: true }),
  ...cores('mochila', 'Mochilinha', 'acessorio', 40, ['rosa', 'azul', 'verde'], { fem: true, extra: { level: 2 } }),
  ...cores('lenco', 'Lenço no pescoço', 'acessorio', 25, ['vermelho', 'azul', 'rosa', 'amarelo']),
  ...cores('gravata-longa', 'Gravata', 'acessorio', 30, ['vermelho', 'azul', 'preto'], { fem: true }),
  ...cores('bolsa', 'Bolsinha', 'acessorio', 45, ['rosa', 'amarelo', 'preto'], { fem: true, extra: { level: 2 } }),
  ...cores('pochete', 'Pochete', 'acessorio', 35, ['preto', 'rosa', 'verde'], { fem: true }),
  W('colar-perolas', 'Colar de pérolas', 'acessorio', 60, { base: 'colar-perolas', c1: '#FFFFFF', c2: '#E8E2F0', level: 3 }),
  W('colar-flores', 'Colar de flores', 'acessorio', 40, { base: 'colar-flores', c1: '#FF86AC', c2: '#FFD34D' }),
  W('broche', 'Broche de coração', 'acessorio', 25, { base: 'broche', c1: '#FF5E7E', c2: '#E2416A' }),
  W('asas-fada', 'Asas de fada', 'acessorio', 110, { base: 'asas-fada', c1: '#BFE3FF', c2: '#E6D2FF', plus: true }),
  W('asas-anjo', 'Asas de anjinho', 'acessorio', 120, { base: 'asas-anjo', c1: '#FFFFFF', c2: '#E3E6EE', plus: true }),
  W('asas-borboleta', 'Asas de borboleta', 'acessorio', 80, { base: 'asas-borboleta', c1: '#FF9A4D', c2: '#2B2224', level: 4 }),

  // Colares com pingente
  W('colar-coracao-ouro', 'Colar de coração', 'acessorio', 55, { base: 'colar-pingente', c1: '#FF5E7E', c2: '#F6C445' }),
  W('colar-coracao-prata', 'Colar de coração prateado', 'acessorio', 55, { base: 'colar-pingente', c1: '#FF9FC2', c2: '#C9CED8' }),
  W('colar-estrela-ouro', 'Colar de estrela', 'acessorio', 60, { base: 'colar-pingente', c1: '#FFD34D', c2: '#F6C445', level: 2 }),
  W('colar-ouro', 'Corrente dourada com estrela', 'acessorio', 90, { base: 'colar-ouro', c1: '#F6C445', c2: '#7FB8F0', level: 4 }),
  // Coisinhas de segurar (na patinha)
  W('m-suco', 'Suquinho com canudo', 'acessorio', 30, { base: 'segurar', c1: '#FFB347', c2: '#FF5E7E' }),
  W('m-microfone', 'Microfone', 'acessorio', 45, { base: 'segurar', c1: '#C9CED8', c2: '#3A3440', level: 2 }),
  W('m-cestinha', 'Cestinha de morangos', 'acessorio', 40, { base: 'segurar', c1: '#F0525F', c2: '#FFFFFF' }),
  W('m-pirulito', 'Pirulito', 'acessorio', 20, { base: 'segurar', c1: '#FF86AC', c2: '#FFFFFF' }),
  W('m-balao', 'Balão na patinha', 'acessorio', 25, { base: 'segurar', c1: '#FF5E7E', c2: '#FFFFFF' }),
  W('m-varinha', 'Varinha de estrela', 'acessorio', 70, { base: 'segurar', c1: '#FFD34D', c2: '#FFFFFF', level: 3 }),
  W('m-girassol', 'Girassol na patinha', 'acessorio', 25, { base: 'segurar', c1: '#FFD34D', c2: '#8A5A3B' }),
  W('m-chaveiro', 'Chaveiro de estrelinha', 'acessorio', 35, { base: 'segurar', c1: '#FFD34D', c2: '#E8B020' }),

  // ---------- Efeitos (brilhos ao redor do Hami) ----------
  W('fx-brilhos', 'Brilhinhos', 'efeito', 60, { base: 'brilhos', c1: '#FFE27A' }),
  W('fx-coracoes', 'Chuva de coraçõezinhos', 'efeito', 80, { base: 'coracoes', c1: '#FF6F91' }),
  W('fx-notas', 'Notas musicais', 'efeito', 70, { base: 'notas', c1: '#7E57D6', level: 2 }),
  W('fx-bolhas', 'Bolhinhas de sabão', 'efeito', 60, { base: 'bolhas', c1: '#BFE3FF' }),
  W('fx-flores', 'Pétalas no ar', 'efeito', 75, { base: 'flores', c1: '#FF9FC2', level: 3 }),
  W('fx-estrelas', 'Estrelinhas em volta', 'efeito', 90, { base: 'estrelas', c1: '#FFD34D', level: 4 }),
  W('fx-aura-dourada', 'Aura dourada', 'efeito', 150, { base: 'aura', c1: '#FFE27A', plus: true }),
  W('fx-aura-rosa', 'Aura rosa', 'efeito', 130, { base: 'aura', c1: '#FF9FC2', plus: true }),
  W('fx-arco-iris', 'Arco-íris nas costas', 'efeito', 140, { base: 'arco-iris', c1: '#FF6F91', plus: true }),
  W('fx-raios', 'Raios de sol', 'efeito', 110, { base: 'raios', c1: '#FFE27A', level: 5 }),
  W('fx-neve', 'Neve caindo', 'efeito', 70, { base: 'neve', c1: '#FFFFFF', season: 'natal' }),
  W('fx-morcegos', 'Morceguinhos', 'efeito', 70, { base: 'morcegos', c1: '#4B3A78', season: 'halloween' }),
  // Móveis (kit novo, desenhado com detalhe)
  ...KIT_ITEMS,
  // Móveis
  W('rodinha', 'Rodinha de exercício', 'movel', 30, { svg: 'rodinha', size: 26 }),
  W('caminha', 'Caminha de hamster', 'movel', 35, { svg: 'caminha', size: 26 }),
  W('casinha', 'Casinha de madeira', 'movel', 50, { svg: 'casinha', size: 28 }),
  W('mesa', 'Mesinha', 'movel', 30, { svg: 'mesa', size: 22 }),
  W('luminaria', 'Luminária de pé', 'movel', 35, { svg: 'luminaria', size: 12 }),
  W('tapete', 'Tapete redondo', 'movel', 25, { svg: 'tapete', size: 40 }),
  W('estante', 'Estante com livros', 'movel', 55, { svg: 'estante', size: 20, level: 3 }),
  W('sofa', 'Sofá', 'movel', 60, { emoji: '🛋️', size: 26, level: 2 }),
  W('cadeira', 'Cadeira', 'movel', 25, { emoji: '🪑', size: 14 }),
  W('cama', 'Cama grande', 'movel', 70, { emoji: '🛏️', size: 28, level: 4 }),
  // Decoração
  W('planta', 'Costela-de-adão', 'decor', 15, { emoji: '🪴', size: 14 }),
  W('cacto', 'Cacto', 'decor', 15, { emoji: '🌵', size: 11 }),
  W('flores', 'Vaso de flores', 'decor', 20, { emoji: '🌷', size: 11 }),
  W('quadro', 'Quadrinho', 'decor', 20, { emoji: '🖼️', size: 14 }),
  W('relogio', 'Relógio da vó', 'decor', 35, { emoji: '🕰️', size: 12 }),
  W('vela', 'Velinha cheirosa', 'decor', 15, { emoji: '🕯️', size: 9 }),
  W('livros', 'Pilha de livros', 'decor', 15, { emoji: '📚', size: 12 }),
  W('palmeira', 'Palmeirinha', 'decor', 35, { emoji: '🌴', size: 16, level: 3 }),
  W('arco-iris', 'Arco-íris', 'decor', 45, { emoji: '🌈', size: 18, plus: true }),
  W('nuvem', 'Nuvem fofinha', 'decor', 25, { emoji: '☁️', size: 14 }),
  W('estrela', 'Estrela', 'decor', 20, { emoji: '⭐', size: 10 }),
  W('aquario', 'Aquário', 'decor', 50, { emoji: '🐠', size: 12, level: 5 }),
  W('pisca', 'Pisca-pisca', 'decor', 30, { svg: 'pisca', size: 60, season: 'natal' }),
  W('arvore-natal', 'Arvorezinha de Natal', 'decor', 40, { emoji: '🎄', size: 16, season: 'natal' }),
  W('bandeirinhas', 'Bandeirinhas', 'decor', 25, { svg: 'bandeirinhas', size: 60, season: 'junina' }),
  W('girassol-vaso', 'Vaso de girassol', 'decor', 25, { emoji: '🌻', size: 12 }),
  W('broto', 'Brotinho', 'decor', 10, { emoji: '🌱', size: 9 }),
  W('cogumelo', 'Cogumelo', 'decor', 15, { emoji: '🍄', size: 10 }),
  W('hibisco', 'Hibisco', 'decor', 20, { emoji: '🌺', size: 11 }),
  W('buque', 'Buquê', 'decor', 30, { emoji: '💐', size: 12 }),
  W('espelho', 'Espelho', 'decor', 35, { emoji: '🪞', size: 13, level: 2 }),
  W('tv', 'TV retrô', 'decor', 60, { emoji: '📺', size: 14, level: 3 }),
  W('piano', 'Piano', 'decor', 90, { emoji: '🎹', size: 18, level: 5 }),
  W('violao', 'Violão', 'decor', 50, { emoji: '🎸', size: 13, level: 3 }),
  W('radio', 'Radinho', 'decor', 30, { emoji: '📻', size: 11 }),
  W('lanterna', 'Lanterna de papel', 'decor', 25, { emoji: '🏮', size: 10 }),
  W('sininho', 'Sininho dos ventos', 'decor', 20, { emoji: '🎐', size: 9 }),
  W('cavalete', 'Cavalete de pintura', 'decor', 45, { emoji: '🎨', size: 13, level: 2 }),
  W('trofeu', 'Troféu', 'decor', 70, { emoji: '🏆', size: 11, level: 4 }),
  W('laco-gigante', 'Laço gigante', 'decor', 30, { emoji: '🎀', size: 12 }),
  W('bolo', 'Bolo de aniversário', 'decor', 35, { emoji: '🎂', size: 12 }),
  W('cupcake', 'Cupcake', 'decor', 15, { emoji: '🧁', size: 9 }),
  W('lua', 'Lua de pendurar', 'decor', 30, { emoji: '🌙', size: 11 }),
  W('sol-decor', 'Sol sorridente', 'decor', 30, { emoji: '🌞', size: 12 }),
  W('borboletas', 'Borboletas', 'decor', 25, { emoji: '🦋', size: 10 }),
  W('concha', 'Concha', 'decor', 15, { emoji: '🐚', size: 9 }),
  W('mapa', 'Mapa do tesouro', 'decor', 35, { emoji: '🗺️', size: 13, level: 2 }),
  W('camera', 'Câmera', 'decor', 40, { emoji: '📷', size: 10 }),
  W('presente', 'Caixa de presente', 'decor', 20, { emoji: '🎁', size: 10 }),
  W('globo', 'Globo terrestre', 'decor', 40, { emoji: '🌍', size: 11, level: 2 }),
  W('barraca', 'Barraquinha', 'decor', 70, { emoji: '⛺', size: 18, level: 4 }),
  W('castelinho', 'Castelinho', 'decor', 120, { emoji: '🏰', size: 20, plus: true }),
  W('foguete', 'Foguete', 'decor', 110, { emoji: '🚀', size: 14, plus: true }),
  W('ovni', 'Disco voador', 'decor', 100, { emoji: '🛸', size: 14, plus: true }),
  W('planeta', 'Planetinha', 'decor', 90, { emoji: '🪐', size: 13, plus: true }),
  W('globo-luz', 'Globo de luz', 'decor', 95, { emoji: '🪩', size: 11, plus: true }),
  W('carrossel', 'Carrossel', 'decor', 130, { emoji: '🎠', size: 18, plus: true }),
  W('boneco-neve', 'Boneco de neve', 'decor', 35, { emoji: '⛄', size: 14, season: 'natal' }),
  W('presente-natal', 'Meia de Natal', 'decor', 20, { emoji: '🧦', size: 9, season: 'natal' }),
  W('abobora-decor', 'Abóbora de Halloween', 'decor', 30, { emoji: '🎃', size: 12, season: 'halloween' }),
  W('fantasminha', 'Fantasminha', 'decor', 30, { emoji: '👻', size: 11, season: 'halloween' }),
  W('fogueira', 'Fogueirinha', 'decor', 35, { emoji: '🔥', size: 11, season: 'junina' }),
  // Brinquedos
  W('bola', 'Bolinha', 'brinquedo', 10, { emoji: '⚽', size: 9 }),
  W('novelo', 'Novelo', 'brinquedo', 10, { emoji: '🧶', size: 9 }),
  W('ursinho', 'Ursinho', 'brinquedo', 25, { emoji: '🧸', size: 12 }),
  W('ioio', 'Ioiô', 'brinquedo', 15, { emoji: '🪀', size: 9 }),
  W('balao', 'Balão', 'brinquedo', 15, { emoji: '🎈', size: 10 }),
  W('videogame', 'Videogame', 'brinquedo', 60, { emoji: '🎮', size: 12, level: 4 }),
  W('pipa', 'Pipa', 'brinquedo', 20, { emoji: '🪁', size: 11 }),
  W('skate', 'Skate', 'brinquedo', 45, { emoji: '🛹', size: 13, level: 2 }),
  W('quebra-cabeca', 'Quebra-cabeça', 'brinquedo', 20, { emoji: '🧩', size: 9 }),
  W('fliperama', 'Fliperama', 'brinquedo', 90, { emoji: '🕹️', size: 12, level: 5 }),
  W('matrioska', 'Matrioska', 'brinquedo', 30, { emoji: '🪆', size: 9 }),
  W('dado', 'Dadão', 'brinquedo', 15, { emoji: '🎲', size: 9 }),
  W('bolinha-praia', 'Bola de praia', 'brinquedo', 20, { emoji: '🏐', size: 10 }),
  W('alvo', 'Alvo de dardos', 'brinquedo', 20, { emoji: '🎯', size: 10 }),
  // Exclusivos das arenas (vêm de presente ao abrir cada arena; não estão à venda)
  ...arenaItems(2, 'raro', [
    ['flor-encantada', 'Flor encantada', 'chapeu', { base: 'flor', c1: '#FF8FC7', c2: '#FFD34D' }],
    ['banco-galho', 'Banco de galhos', 'movel', { art: 'art:banco-galho', size: 32 }],
    ['casa-passaro', 'Casinha de passarinho', 'decor', { art: 'art:casa-passaro', size: 12 }],
    ['p-jardim', 'Parede do jardim', 'parede', {}],
    ['f-musgo', 'Piso de musgo', 'piso', {}],
  ]),
  ...arenaItems(3, 'raro', [
    ['boina-vila', 'Boina da vila', 'chapeu', { base: 'boina', c1: '#B07A52', c2: '#7A4E32' }],
    ['balcao-cafe', 'Balcão de café', 'movel', { art: 'art:balcao-cafe', size: 34 }],
    ['lampiao', 'Lampião da vila', 'decor', { art: 'art:lampiao', size: 11 }],
    ['p-vila', 'Parede de casa de vila', 'parede', {}],
    ['f-tacos', 'Piso de tacos', 'piso', {}],
  ]),
  ...arenaItems(4, 'raro', [
    ['chapeu-folhas', 'Chapéu de folhas', 'chapeu', { base: 'chapeu-sol', c1: '#5FBF77', c2: '#3E9C55' }],
    ['luminaria-cogumelo', 'Luminária de cogumelo', 'decor', { art: 'art:luminaria-cogumelo', size: 14, rarity: 'epico' }],
    ['cama-tronco', 'Cama de tronco', 'movel', { art: 'art:cama-tronco', size: 42 }],
    ['p-floresta', 'Parede da floresta', 'parede', {}],
    ['f-folhas', 'Piso de folhas secas', 'piso', {}],
  ]),
  ...arenaItems(5, 'raro', [
    ['oculos-tropical', 'Óculos de sol tropical', 'oculos', { base: 'sol', c1: '#FF6F91', c2: '#FFD34D' }],
    ['camisa-tropical', 'Camisa tropical', 'roupa', { base: 'florida', c1: '#FF9A4D', c2: '#5FBF77', rarity: 'epico' }],
    ['guarda-sol', 'Guarda-sol', 'decor', { art: 'art:guarda-sol', size: 30 }],
    ['cadeira-praia', 'Cadeira de praia', 'movel', { art: 'art:cadeira-praia', size: 24 }],
    ['tapete-tropical', 'Tapete tropical', 'decor', { art: 'art:tapete-tropical', size: 52 }],
    ['p-tropical', 'Parede tropical', 'parede', {}],
  ]),
  ...arenaItems(6, 'epico', [
    ['gorro-neve', 'Gorro de neve', 'chapeu', { base: 'gorro', c1: '#FFFFFF', c2: '#5B8DEF', rarity: 'raro' }],
    ['casaco-neve', 'Casaco de inverno', 'roupa', { base: 'jaqueta', c1: '#5B8DEF', c2: '#FFFFFF' }],
    ['lareira', 'Lareira', 'movel', { art: 'art:lareira', size: 34 }],
    ['tapete-neve', 'Tapete de neve', 'decor', { art: 'art:tapete-neve', size: 52, rarity: 'raro' }],
    ['p-chale', 'Parede de chalé', 'parede', { rarity: 'raro' }],
    ['f-chale', 'Piso de chalé', 'piso', { rarity: 'raro' }],
  ]),
  ...arenaItems(7, 'epico', [
    ['fone-neon', 'Fone neon', 'chapeu', { base: 'fone', c1: '#A57CF0', c2: '#3AE0D0' }],
    ['luminaria-neon', 'Luminária neon', 'decor', { art: 'art:luminaria-neon', size: 12 }],
    ['poltrona-moderna', 'Poltrona moderna', 'movel', { art: 'art:poltrona-moderna', size: 24 }],
    ['p-cidade', 'Parede da cidade', 'parede', { rarity: 'raro' }],
    ['f-concreto', 'Piso de concreto', 'piso', { rarity: 'raro' }],
  ]),
  ...arenaItems(8, 'epico', [
    ['oculos-mergulho', 'Óculos de mergulho', 'oculos', { base: 'natacao', c1: '#3FC6C0', c2: '#2F7FB8' }],
    ['cama-concha', 'Cama de concha', 'movel', { art: 'art:cama-concha', size: 42 }],
    ['coral', 'Coral', 'decor', { art: 'art:coral', size: 14, rarity: 'raro' }],
    ['p-mar', 'Parede do fundo do mar', 'parede', { rarity: 'raro' }],
    ['f-areia-mar', 'Areia do fundo do mar', 'piso', { rarity: 'raro' }],
  ]),
  ...arenaItems(9, 'epico', [
    ['tiara-sonhos', 'Tiara dos sonhos', 'chapeu', { base: 'tiara', c1: '#D7C2FF', c2: '#FF9FC2' }],
    ['cama-nuvem', 'Cama de nuvem', 'movel', { art: 'art:cama-nuvem', size: 42 }],
    ['luminaria-lua', 'Luminária de lua', 'decor', { art: 'art:luminaria-lua', size: 13 }],
    ['p-sonhos', 'Parede dos sonhos', 'parede', { rarity: 'raro' }],
    ['f-algodao', 'Piso de algodão-doce', 'piso', { rarity: 'raro' }],
  ]),
  ...arenaItems(10, 'epico', [
    ['coroa-castelo', 'Coroa do castelo', 'chapeu', { base: 'coroa-rei', c1: '#F6C445', c2: '#5B8DEF', rarity: 'lendario' }],
    ['manto-real', 'Manto real', 'roupa', { base: 'capa', c1: '#D7263D', c2: '#F6C445' }],
    ['trono', 'Trono', 'movel', { art: 'art:trono', size: 28, rarity: 'lendario' }],
    ['tapete-vermelho', 'Tapete vermelho', 'decor', { art: 'art:tapete-vermelho', size: 56 }],
    ['p-castelo', 'Parede de castelo', 'parede', {}],
    ['f-real', 'Piso real', 'piso', {}],
  ]),
  ...arenaItems(11, 'epico', [
    ['capacete-estelar', 'Capacete estelar', 'chapeu', { base: 'capacete', c1: '#E9EEF8', c2: '#A57CF0' }],
    ['traje-estelar', 'Traje espacial estelar', 'roupa', { base: 'astronauta', c1: '#F4F6FA', c2: '#A57CF0', rarity: 'lendario' }],
    ['cama-estrelas', 'Cama de estrelas', 'movel', { art: 'art:cama-estrelas', size: 42, rarity: 'lendario' }],
    ['luminaria-estrelas', 'Luminária de estrelas', 'decor', { art: 'art:luminaria-estrelas', size: 13 }],
    ['mobile-planetas', 'Planetas de pendurar', 'decor', { art: 'art:mobile-planetas', size: 18 }],
    ['p-espaco', 'Parede espacial', 'parede', {}],
    ['f-metal', 'Piso de nave', 'piso', {}],
  ]),
  ...arenaItems(12, 'lendario', [
    ['aureola-celeste', 'Auréola celeste', 'chapeu', { base: 'aureola', c1: '#FFF3B0', c2: '#F2A516' }],
    ['asas-celestes', 'Asas celestes', 'acessorio', { base: 'asas-anjo', c1: '#FFF7DA', c2: '#F2C94C' }],
    ['fonte-celeste', 'Fonte celeste', 'decor', { art: 'art:fonte-celeste', size: 24 }],
    ['portal-celeste', 'Portal celeste', 'decor', { art: 'art:portal-celeste', size: 30 }],
    ['p-celeste', 'Parede celeste', 'parede', { rarity: 'epico' }],
    ['f-ouro', 'Piso de ouro', 'piso', { rarity: 'epico' }],
  ]),
  // Comidas (consumíveis)
  W('semente', 'Semente de girassol extra', 'comida', 3, { emoji: '🌻', food: { saciedade: 8, felicidade: 6 } }),
  W('cenoura', 'Cenourinha', 'comida', 4, { emoji: '🥕', food: { saciedade: 15, felicidade: 4 } }),
  W('brocolis', 'Brócolis', 'comida', 4, { emoji: '🥦', food: { saciedade: 15, felicidade: 3 } }),
  W('maca', 'Maçã', 'comida', 5, { emoji: '🍎', food: { saciedade: 18, felicidade: 5 } }),
  W('milho', 'Milho', 'comida', 5, { emoji: '🌽', food: { saciedade: 20, felicidade: 5 } }),
  W('morango', 'Morango', 'comida', 6, { emoji: '🍓', food: { saciedade: 12, felicidade: 9 }, level: 2 }),
  W('banana', 'Banana', 'comida', 5, { emoji: '🍌', food: { saciedade: 18, felicidade: 6 }, level: 2 }),
  W('mirtilo', 'Mirtilos', 'comida', 7, { emoji: '🫐', food: { saciedade: 10, felicidade: 10 }, level: 3 }),
  W('queijo', 'Queijinho', 'comida', 8, { emoji: '🧀', food: { saciedade: 15, felicidade: 12 }, level: 4 }),
  W('abobora', 'Abóbora', 'comida', 6, { emoji: '🎃', food: { saciedade: 22, felicidade: 6 }, level: 5 }),
  // Pratos preparados (só na cozinha)
  W('salada', 'Saladinha colorida', 'comida', 0, { emoji: '🥗', food: { saciedade: 45, felicidade: 15 }, souvenir: true }),
  W('espetinho', 'Espetinho de frutas', 'comida', 0, { emoji: '🍢', food: { saciedade: 35, felicidade: 25 }, souvenir: true }),
  W('bolinho', 'Bolinho de aniversário', 'comida', 0, { emoji: '🧁', food: { saciedade: 20, felicidade: 40 }, souvenir: true }),
  // Papéis de parede
  W('p-creme', 'Parede creme', 'parede', 0),
  W('p-listras', 'Listras de morango', 'parede', 30),
  W('p-bolinhas', 'Bolinhas de menta', 'parede', 30),
  W('p-ceu', 'Céu com nuvens', 'parede', 40),
  W('p-folhas', 'Folhagem tropical', 'parede', 45, { level: 3 }),
  W('p-lavanda', 'Lavanda pastel', 'parede', 30),
  W('p-cinza', 'Cinza moderno', 'parede', 30),
  W('p-estrelas', 'Noite estrelada', 'parede', 60, { plus: true }),
  W('p-xadrez', 'Xadrez de piquenique', 'parede', 35),
  W('p-coracoes', 'Coraçõezinhos', 'parede', 40),
  W('p-arco-iris', 'Arco-íris pastel', 'parede', 50, { level: 2 }),
  W('p-tijolo', 'Tijolinho', 'parede', 40, { level: 2 }),
  W('p-madeira', 'Madeira de chalé', 'parede', 45, { level: 3 }),
  W('p-praia', 'Praia', 'parede', 55, { level: 4 }),
  W('p-girassois', 'Girassóis', 'parede', 45),
  W('p-galaxia', 'Galáxia', 'parede', 80, { plus: true }),
  // Pisos
  W('f-madeira', 'Madeira', 'piso', 0),
  W('f-clara', 'Madeira clara', 'piso', 25),
  W('f-carpete', 'Carpete rosinha', 'piso', 30),
  W('f-azulejo', 'Azulejo xadrez', 'piso', 35),
  W('f-grama', 'Gramado', 'piso', 35, { level: 3 }),
  W('f-marmore', 'Mármore', 'piso', 50, { plus: true }),
  W('f-areia', 'Areia da praia', 'piso', 35, { level: 2 }),
  W('f-tabuleiro', 'Tabuleiro', 'piso', 40),
  W('f-hexagono', 'Favo de mel', 'piso', 45, { level: 3 }),
  W('f-azul', 'Carpete azul', 'piso', 30),
  W('f-nuvem', 'Piso de nuvem', 'piso', 70, { plus: true }),
  W('f-ladrilho', 'Ladrilho colorido', 'piso', 50, { level: 4 }),
];

export const itemById = (id: string | null | undefined) => ITEMS.find((i) => i.id === id);

export const KIND_LABEL: Record<ItemKind, string> = {
  chapeu: 'Chapéus',
  oculos: 'Óculos',
  roupa: 'Roupas',
  acessorio: 'Acessórios',
  efeito: 'Efeitos',
  movel: 'Móveis',
  decor: 'Decoração',
  brinquedo: 'Brinquedos',
  comida: 'Comidas',
  parede: 'Papéis de parede',
  piso: 'Pisos',
};

export const WEARABLE_KINDS: ItemKind[] = ['chapeu', 'oculos', 'roupa', 'acessorio', 'efeito'];

/** Looks completos: comprar o look sai 20% mais barato (só as peças que faltam). */
export interface Look {
  id: string;
  name: string;
  emoji: string;
  items: string[];
}
export const LOOKS: Look[] = [
  { id: 'praia', name: 'Dia de praia', emoji: '🏖️', items: ['chapeu-sol-amarelo', 'sol', 'florida-azul', 'colar-flores'] },
  { id: 'inverno', name: 'Inverno quentinho', emoji: '❄️', items: ['gorro-branco', 'cachecol', 'moletom-roxo'] },
  { id: 'atleta', name: 'Atleta', emoji: '🏃', items: ['faixa-rosa', 'regata', 'pochete-preto'] },
  { id: 'abelhinha', name: 'Abelhinha', emoji: '🐝', items: ['antenas', 'abelha', 'fx-flores'] },
  { id: 'estudante', name: 'Estudante', emoji: '📚', items: ['quadrado-preto', 'listrada-azul', 'mochila'] },
  { id: 'rock', name: 'Rockstar', emoji: '🎸', items: ['fone-preto', 'sol', 'jaqueta-preto', 'fx-notas'] },
  { id: 'chef-look', name: 'Chef', emoji: '👩‍🍳', items: ['chef', 'avental', 'lenco-vermelho'] },
  { id: 'gala', name: 'Noite de gala', emoji: '🎩', items: ['cartola', 'monoculo', 'smoking', 'gravata'] },
  { id: 'fada', name: 'Fadinha', emoji: '🧚', items: ['tiara', 'tutu-lilas', 'asas-fada', 'fx-brilhos'] },
  { id: 'realeza', name: 'Realeza', emoji: '👑', items: ['coroa-rei', 'capa-roxo', 'colar-perolas', 'fx-aura-dourada'] },
  { id: 'espaco', name: 'Astronauta', emoji: '🚀', items: ['capacete', 'astronauta', 'fx-estrelas'] },
  { id: 'formando', name: 'Formatura', emoji: '🎓', items: ['formatura', 'smoking', 'medalha'] },
];
export const HOUSE_KINDS: ItemKind[] = ['movel', 'decor', 'brinquedo'];

export const SEASONS: Record<Season, { label: string; months: number[]; until: string }> = {
  natal: { label: 'Temporada de Natal', months: [10, 11], until: 'até 31 de dezembro' },
  junina: { label: 'Arraiá do Hami', months: [5, 6], until: 'até 31 de julho' },
  halloween: { label: 'Dia das Bruxinhas', months: [9], until: 'até 31 de outubro' },
};

export function inSeason(item: Item, date = new Date()) {
  return !item.season || SEASONS[item.season].months.includes(date.getMonth());
}

export function currentSeason(date = new Date()): Season | null {
  const m = date.getMonth();
  return (Object.keys(SEASONS) as Season[]).find((s) => SEASONS[s].months.includes(m)) ?? null;
}

/** Coleções temáticas: compra o estilo inteiro com desconto e já arruma a casa. */
export interface StyleSet {
  id: string;
  name: string;
  wallpaper: string;
  floor: string;
  items: { itemId: string; x: number; y: number }[];
  plus?: boolean;
}

export const STYLES: StyleSet[] = [
  {
    id: 'quarto-rosa',
    name: 'Quartinho rosa',
    wallpaper: 'p-coracoes',
    floor: 'f-clara',
    items: [
      { itemId: 'k-tapete-coracao-rosa', x: 50, y: 95 },
      { itemId: 'k-cama-rosa', x: 25, y: 71 },
      { itemId: 'k-criado-rosa', x: 50.5, y: 68 },
      { itemId: 'k-penteadeira-rosa', x: 80, y: 70 },
      { itemId: 'k-quadro-coracao-rosa', x: 17, y: 38 },
      { itemId: 'k-ursinho-rosa', x: 12, y: 97 },
      { itemId: 'k-pufe-rosa', x: 86, y: 94 },
    ],
  },
  {
    id: 'sala-azul',
    name: 'Salinha azul',
    wallpaper: 'p-cinza',
    floor: 'f-madeira',
    items: [
      { itemId: 'k-tapete-retangulo-azul', x: 50, y: 97 },
      { itemId: 'k-sofa-azul', x: 27, y: 71 },
      { itemId: 'k-quadro-dourado', x: 20, y: 38 },
      { itemId: 'k-rack-tv-branco', x: 78, y: 70 },
      { itemId: 'k-mesa-centro-madeira', x: 34, y: 87 },
      { itemId: 'k-luminaria-amarela', x: 94, y: 88 },
      { itemId: 'k-planta-grande-branca', x: 7, y: 84 },
    ],
  },
  {
    id: 'cantinho-hamster',
    name: 'Cantinho do hamster',
    wallpaper: 'p-bolinhas',
    floor: 'f-grama',
    items: [
      { itemId: 'k-tapete-verde', x: 50, y: 95 },
      { itemId: 'k-torre-rosa', x: 22, y: 71 },
      { itemId: 'k-casinha-azul', x: 78, y: 71 },
      { itemId: 'k-tubo-rosa', x: 50, y: 74 },
      { itemId: 'k-rodinha-rosa', x: 86, y: 93 },
      { itemId: 'k-almofada-rosa', x: 16, y: 95 },
      { itemId: 'k-planta-pendurada-rosa', x: 92, y: 28 },
    ],
  },
  { id: 'minimalista', name: 'Minimalista', wallpaper: 'p-creme', floor: 'f-clara', items: [{ itemId: 'luminaria', x: 82, y: 58 }, { itemId: 'planta', x: 12, y: 74 }, { itemId: 'mesa', x: 30, y: 72 }] },
  { id: 'aconchegante', name: 'Aconchegante', wallpaper: 'p-listras', floor: 'f-carpete', items: [{ itemId: 'sofa', x: 22, y: 66 }, { itemId: 'tapete', x: 50, y: 88 }, { itemId: 'vela', x: 84, y: 70 }, { itemId: 'livros', x: 72, y: 76 }] },
  { id: 'natureza', name: 'Natureza', wallpaper: 'p-bolinhas', floor: 'f-grama', items: [{ itemId: 'planta', x: 10, y: 70 }, { itemId: 'cacto', x: 86, y: 74 }, { itemId: 'flores', x: 74, y: 78 }, { itemId: 'casinha', x: 24, y: 70 }] },
  { id: 'moderno', name: 'Moderno', wallpaper: 'p-cinza', floor: 'f-azulejo', items: [{ itemId: 'luminaria', x: 86, y: 58 }, { itemId: 'quadro', x: 24, y: 30 }, { itemId: 'cadeira', x: 18, y: 72 }, { itemId: 'estante', x: 72, y: 62 }] },
  { id: 'tropical', name: 'Tropical', wallpaper: 'p-folhas', floor: 'f-madeira', items: [{ itemId: 'palmeira', x: 12, y: 66 }, { itemId: 'flores', x: 84, y: 76 }, { itemId: 'rodinha', x: 26, y: 72 }] },
  { id: 'colorido', name: 'Colorido', wallpaper: 'p-bolinhas', floor: 'f-azulejo', items: [{ itemId: 'balao', x: 84, y: 40 }, { itemId: 'bola', x: 72, y: 84 }, { itemId: 'tapete', x: 50, y: 88 }, { itemId: 'arco-iris', x: 22, y: 30 }], plus: true },
  { id: 'pastel', name: 'Pastel', wallpaper: 'p-lavanda', floor: 'f-carpete', items: [{ itemId: 'nuvem', x: 20, y: 28 }, { itemId: 'estrela', x: 80, y: 26 }, { itemId: 'ursinho', x: 82, y: 76 }, { itemId: 'caminha', x: 22, y: 76 }] },
];

/** Preço da coleção: soma do que falta, com 25% de desconto. */
export function stylePrice(style: StyleSet, owned: (id: string) => boolean): number {
  const ids = [style.wallpaper, style.floor, ...style.items.map((i) => i.itemId)];
  const missing = [...new Set(ids)].filter((id) => !owned(id));
  return Math.round(missing.reduce((s, id) => s + (itemById(id)?.price ?? 0), 0) * 0.75);
}

/** Receitas da cozinha: 3 ingredientes viram um prato que alimenta mais. */
export const RECIPES = [
  { result: 'salada', name: 'Saladinha colorida', needs: ['brocolis', 'cenoura', 'milho'] },
  { result: 'espetinho', name: 'Espetinho de frutas', needs: ['morango', 'banana', 'maca'] },
  { result: 'bolinho', name: 'Bolinho de aniversário', needs: ['banana', 'semente', 'mirtilo'] },
];

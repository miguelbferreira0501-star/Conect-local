// Destinos das viagens do Lumbi (cada um com o seu cenário). Os das arenas já liberadas são da pessoa;
// os outros podem ser comprados com sementes (os "Premium" só para quem tem o Lumbi+).
// Cada destino tem uma lembrança para colecionar (7 peças) e cartões de lembrança (24).
export interface Destination {
  id: string;
  name: string;
  /** O que o Lumbi diz antes de ir. */
  line: string;
  price: number;
  plus?: boolean;
  souvenir: { name: string; emoji: string };
}

export const DESTINATIONS: Destination[] = [
  { id: 'casinha', name: 'Bosque da Casinha', line: 'Vou dar uma volta no bosque aqui pertinho. Quem sabe acho uma pinha bonita?', price: 0, souvenir: { name: 'Pinha', emoji: '🌰' } },
  { id: 'jardim', name: 'Jardim Florido', line: 'Dizem que as flores do jardim cheiram a mel. Vou conferir!', price: 400, souvenir: { name: 'Florzinha', emoji: '🌷' } },
  { id: 'vila', name: 'Feirinha da Vila', line: 'Tem feirinha na vila hoje! Vou passear entre as barraquinhas.', price: 600, souvenir: { name: 'Lanterninha', emoji: '🏮' } },
  { id: 'floresta', name: 'Acampamento na Floresta', line: 'Barraca, fogueira e estrelas. Hoje vou acampar!', price: 1000, souvenir: { name: 'Cogumelo', emoji: '🍄' } },
  { id: 'tropical', name: 'Praia Ensolarada', line: 'Sol, areia e água fresquinha. Partiu praia!', price: 1000, souvenir: { name: 'Conchinha', emoji: '🐚' } },
  { id: 'neve', name: 'Montanha de Neve', line: 'Vou fazer um bonequinho de neve lá no alto da montanha!', price: 1500, souvenir: { name: 'Floco de neve', emoji: '❄️' } },
  { id: 'cidade', name: 'Cidade das Luzes', line: 'A cidade fica tão bonita com as luzes acesas. Vamos?', price: 1500, souvenir: { name: 'Balãozinho', emoji: '🎈' } },
  { id: 'mar', name: 'Fundo do Mar', line: 'Vou mergulhar e conhecer os peixinhos coloridos!', price: 2000, souvenir: { name: 'Flor do mar', emoji: '🌺' } },
  { id: 'sonhos', name: 'Terra dos Sonhos', line: 'Uma terra de nuvens macias… parece um sonho!', price: 2000, souvenir: { name: 'Nuvenzinha', emoji: '☁️' } },
  { id: 'castelo', name: 'Reino Encantado', line: 'Fui convidado para um chá no castelo. Que chique!', price: 2500, plus: true, souvenir: { name: 'Coroinha', emoji: '👑' } },
  { id: 'espaco', name: 'Estação Espacial', line: 'Contagem regressiva: 3, 2, 1… rumo às estrelas!', price: 3000, plus: true, souvenir: { name: 'Planetinha', emoji: '🪐' } },
  { id: 'celeste', name: 'Ilha Celeste', line: 'Uma ilha flutuando no céu. Vou de pena em pena!', price: 3000, plus: true, souvenir: { name: 'Pena dourada', emoji: '🪶' } },
  { id: 'lua', name: 'Lua', line: 'Vou visitar a Lua de novo. Será que tem queijo?', price: 0, souvenir: { name: 'Estrelinha', emoji: '⭐' } },
];

export const destById = (id: string | null | undefined) => DESTINATIONS.find((d) => d.id === id);
export const SOUVENIR_GOAL = 7;
export const CARDS_GOAL = 24;
/** Peças da lembrança: uma a cada três viagens para o destino. */
export const souvenirPieces = (cards: number) => Math.min(SOUVENIR_GOAL, Math.floor(cards / 3));

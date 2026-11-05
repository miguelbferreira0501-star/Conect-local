// Mapa do mundo do Hami: 10 lugares, 3 missões e 3 achadinhos em cada um (30 colecionáveis).
export interface Mission {
  id: string;
  title: string;
  minutes: number;
  coins: number;
  xp: number;
  energy: number;
  story: string;
}

export interface Find {
  id: string;
  name: string;
  emoji: string;
}

export interface Place {
  id: string;
  name: string;
  emoji: string;
  level: number;
  plus?: boolean;
  colors: [string, string];
  /** Posição no mapa, em % (largura, altura). */
  pos: [number, number];
  desc: string;
  missions: Mission[];
  finds: Find[];
}

const m = (id: string, title: string, minutes: number, story: string): Mission => ({
  id,
  title,
  minutes,
  coins: minutes <= 15 ? 12 : minutes <= 45 ? 25 : 45,
  xp: minutes <= 15 ? 3 : minutes <= 45 ? 6 : 10,
  energy: minutes <= 15 ? 15 : minutes <= 45 ? 25 : 35,
  story,
});

export const PLACES: Place[] = [
  {
    id: 'jardim', name: 'Jardim', emoji: '🌷', level: 1, colors: ['#D9F5C9', '#8FD3A6'], pos: [24, 82],
    desc: 'Pertinho de casa, cheio de flores e cheirinho de terra molhada.',
    missions: [
      m('regar', 'Regar as flores', 15, 'Reguei as margaridas uma por uma. Elas pareciam sorrir de volta.'),
      m('borboletas', 'Contar borboletas', 45, 'Contei 12 borboletas! Uma pousou no meu nariz e eu nem me mexi.'),
      m('horta', 'Cuidar da hortinha', 120, 'Plantei sementes de girassol. Daqui a pouco tem lanche fresquinho!'),
    ],
    finds: [{ id: 'joaninha', name: 'Joaninha', emoji: '🐞' }, { id: 'caracol', name: 'Caracol', emoji: '🐌' }, { id: 'trevo', name: 'Trevo de 4 folhas', emoji: '🍀' }],
  },
  {
    id: 'parque', name: 'Parque', emoji: '🌳', level: 1, colors: ['#CDEFD9', '#6DB98A'], pos: [62, 76],
    desc: 'Pista de caminhada, balanço e muita sombra.',
    missions: [
      m('volta', 'Dar uma volta na pista', 15, 'Dei uma volta inteira sem parar. Meu coraçãozinho ficou animado!'),
      m('piquenique', 'Fazer um piquenique', 45, 'Dividi minha cenoura com um passarinho. Ele cantou de agradecimento.'),
      m('pipa', 'Soltar pipa', 120, 'A pipa subiu tão alto que tocou uma nuvem. Ou quase.'),
    ],
    finds: [{ id: 'bolota', name: 'Bolota de carvalho', emoji: '🌰' }, { id: 'pena', name: 'Pena colorida', emoji: '🪶' }, { id: 'folha', name: 'Folha dourada', emoji: '🍂' }],
  },
  {
    id: 'praia', name: 'Praia', emoji: '🏖️', level: 2, colors: ['#FFE9B8', '#7FD0E6'], pos: [80, 56],
    desc: 'Areia quentinha, mar calmo e pôr do sol de aplaudir.',
    missions: [
      m('castelo-areia', 'Fazer um castelo de areia', 15, 'Fiz um castelo com três torres. A onda levou, mas tudo bem: foi divertido.'),
      m('conchas', 'Catar conchinhas', 45, 'Achei conchinhas de todas as cores. Guardei a mais bonita pra você.'),
      m('por-do-sol', 'Esperar o pôr do sol', 120, 'O céu ficou laranja, rosa e roxo. Todo mundo bateu palma.'),
    ],
    finds: [{ id: 'concha', name: 'Conchinha', emoji: '🐚' }, { id: 'estrela-mar', name: 'Estrela-do-mar', emoji: '⭐' }, { id: 'tartaruga', name: 'Tartaruguinha', emoji: '🐢' }],
  },
  {
    id: 'floresta', name: 'Floresta', emoji: '🌲', level: 3, colors: ['#BFE3B4', '#3F7A55'], pos: [14, 50],
    desc: 'Trilhas fresquinhas e sons de passarinho o tempo todo.',
    missions: [
      m('trilha', 'Fazer a trilha curta', 15, 'Segui as pegadas de um coelho até um riacho geladinho.'),
      m('cogumelos', 'Procurar cogumelos', 45, 'Achei cogumelos com bolinhas, mas só olhei: não se come o que não se conhece!'),
      m('cachoeira', 'Chegar à cachoeira', 120, 'A cachoeira fazia um barulho que acalma. Fiquei um tempão só ouvindo.'),
    ],
    finds: [{ id: 'cogumelo', name: 'Cogumelo de bolinha', emoji: '🍄' }, { id: 'pinha', name: 'Pinha', emoji: '🌲' }, { id: 'ourico', name: 'Ouriço amigo', emoji: '🦔' }],
  },
  {
    id: 'cafeteria', name: 'Cafeteria', emoji: '☕', level: 3, colors: ['#F3DCC2', '#B07A52'], pos: [46, 60],
    desc: 'Cheiro de bolo saindo do forno e música baixinha.',
    missions: [
      m('cha', 'Tomar um chazinho', 15, 'Pedi um chá de camomila. Esquentou a barriga e o coração.'),
      m('bolo', 'Ajudar a fazer bolo', 45, 'Ajudei a mexer a massa. Ganhei a colher pra lamber!'),
      m('livro', 'Ler um livro inteiro', 120, 'Li a história de um hamster que deu a volta ao mundo. Fiquei inspirado.'),
    ],
    finds: [{ id: 'xicara', name: 'Xicrinha', emoji: '☕' }, { id: 'croissant', name: 'Croissant', emoji: '🥐' }, { id: 'cupcake', name: 'Cupcake', emoji: '🧁' }],
  },
  {
    id: 'cidade', name: 'Cidade', emoji: '🏙️', level: 5, colors: ['#D6E4F5', '#7C93B8'], pos: [64, 38],
    desc: 'Prédios altos, bicicletas e feirinha no fim de semana.',
    missions: [
      m('feira', 'Passear na feirinha', 15, 'Na feira tinha milho, pamonha e um moço que me deu um morango.'),
      m('bike', 'Andar de bike na ciclovia', 45, 'Pedalei até o fim da ciclovia. O vento no bigode é a melhor coisa.'),
      m('mirante', 'Subir no mirante', 120, 'Lá de cima a cidade parecia uma maquete. Dei tchau pra você!'),
    ],
    finds: [{ id: 'bilhete', name: 'Bilhete de metrô', emoji: '🎫' }, { id: 'balao-cidade', name: 'Balãozinho', emoji: '🎈' }, { id: 'pombo', name: 'Pombo simpático', emoji: '🐦' }],
  },
  {
    id: 'montanhas', name: 'Montanhas', emoji: '⛰️', level: 6, colors: ['#E0E7F2', '#7E8FB0'], pos: [36, 26],
    desc: 'Ar fresquinho, neblina de manhã e vista de tirar o fôlego.',
    missions: [
      m('mirante-pedra', 'Subir até a pedra grande', 15, 'Subi devagarinho, um passo de cada vez. A vista valeu cada um.'),
      m('acampar', 'Montar acampamento', 45, 'Montei a barraca e fiz chocolate quente. Que frio gostoso!'),
      m('pico', 'Chegar ao pico', 120, 'Cheguei ao topo! Lá de cima tudo parece pequenininho, até as preocupações.'),
    ],
    finds: [{ id: 'cristal', name: 'Cristal', emoji: '💎' }, { id: 'edelvais', name: 'Florzinha da serra', emoji: '🌼' }, { id: 'cabrita', name: 'Cabritinha', emoji: '🐐' }],
  },
  {
    id: 'vila-inverno', name: 'Vila de inverno', emoji: '❄️', level: 6, colors: ['#EAF4FF', '#9CC3E8'], pos: [82, 20],
    desc: 'Casinhas com chaminé, neve fofinha e luzes amarelas.',
    missions: [
      m('boneco', 'Fazer um boneco de neve', 15, 'Fiz um boneco de neve do meu tamanho. Dei o nome de Neve-Hami.'),
      m('patins', 'Patinar no lago', 45, 'Caí três vezes e levantei quatro. Isso é o que importa!'),
      m('lareira', 'Ouvir histórias na lareira', 120, 'A vovó da vila contou histórias até eu dormir quentinho.'),
    ],
    finds: [{ id: 'floco', name: 'Floco de neve', emoji: '❄️' }, { id: 'luva', name: 'Luvinha perdida', emoji: '🧤' }, { id: 'pinguim', name: 'Pinguim', emoji: '🐧' }],
  },
  {
    id: 'castelo', name: 'Castelo', emoji: '🏰', level: 10, colors: ['#F1E1FF', '#A98DDF'], pos: [16, 14],
    desc: 'Torres altas, jardins secretos e um baile toda noite.',
    missions: [
      m('jardim-secreto', 'Achar o jardim secreto', 15, 'Atrás de uma porta de hera tinha um jardim cheio de vagalumes.'),
      m('baile', 'Dançar no baile', 45, 'Dancei a noite inteira de gravata-borboleta. Fui o rei da pista!'),
      m('torre', 'Subir na torre mais alta', 120, 'Da torre dava pra ver o mapa inteiro. Que mundo grande a gente tem!'),
    ],
    finds: [{ id: 'chave', name: 'Chave antiga', emoji: '🗝️' }, { id: 'coroa-mini', name: 'Coroinha', emoji: '👑' }, { id: 'dragao', name: 'Dragãozinho', emoji: '🐉' }],
  },
  {
    id: 'espaco', name: 'Espaço sideral', emoji: '🚀', level: 11, colors: ['#2A2F6B', '#6B4FA8'], pos: [52, 8],
    desc: 'Flutuar entre estrelas e dar tchau pra Terra.',
    missions: [
      m('flutuar', 'Flutuar sem gravidade', 15, 'Dei cambalhotas no ar! Minhas bochechas flutuaram junto.'),
      m('lua', 'Pisar na Lua', 45, 'Deixei pegadinhas de hamster na Lua. Vão ficar lá pra sempre.'),
      m('cometa', 'Pegar carona num cometa', 120, 'O cometa tinha um rabo brilhante. Fiz um pedido: que você esteja bem.'),
    ],
    finds: [{ id: 'estrelinha', name: 'Estrelinha cadente', emoji: '🌠' }, { id: 'planeta', name: 'Planetinha', emoji: '🪐' }, { id: 'alien', name: 'Amigo alienígena', emoji: '👽' }],
  },
];

export const placeById = (id: string) => PLACES.find((p) => p.id === id);
export const ALL_FINDS = PLACES.flatMap((p) => p.finds.map((f) => ({ ...f, placeId: p.id })));

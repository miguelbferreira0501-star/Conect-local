/**
 * DADOS FICTÍCIOS DE DEMONSTRAÇÃO.
 * Todas as empresas abaixo são inventadas e são marcadas com is_demo = true,
 * aparecendo na interface com a etiqueta "Exemplo". Não representam empresas reais.
 */
import type { PriceType } from '@conecta/shared';

export interface ServiceTemplate {
  name: string;
  description?: string;
  priceType: PriceType;
  min?: number; // em reais
  max?: number;
  duration?: number; // minutos
  bookable?: boolean;
  notes?: string;
  /** Tipo de agenda (padrão: o da categoria). 'day' = diária/estadia. */
  mode?: 'slot' | 'period' | 'day';
}

export interface CategoryTemplate {
  names: Array<[name: string, professional?: string]>;
  services: ServiceTemplate[];
  descriptions: string[];
  modes: { in_person: boolean; at_customer: boolean; online: boolean };
  booking: boolean;
  hours: 'commercial' | 'extended' | 'evening' | 'weekend' | 'appointment' | 'restaurant';
  priceLevels: number[];
  aspects: string[];
  phrases: { good: string[]; mid: string[]; bad: string[] };
}

export const DEMO_CITIES = {
  joinville: { ibge: 4209102, neighborhoods: ['Centro', 'América', 'Glória', 'Atiradores', 'Bucarein', 'Saguaçu', 'Costa e Silva', 'Bom Retiro', 'Iririú', 'Floresta', 'Anita Garibaldi', 'Boa Vista'], areas: [4201307, 4216206, 4208906, 4205803] },
  saopaulo: { ibge: 3550308, neighborhoods: ['Pinheiros', 'Vila Mariana', 'Moema', 'Tatuapé', 'Santana', 'Lapa', 'Perdizes', 'Mooca', 'Butantã', 'Itaim Bibi'], areas: [3518800, 3534401, 3505708, 3547809] },
  florianopolis: { ibge: 4205407, neighborhoods: ['Centro', 'Trindade', 'Campeche', 'Estreito', 'Itacorubi'], areas: [4216602, 4211900] },
  curitiba: { ibge: 4106902, neighborhoods: ['Batel', 'Água Verde', 'Centro', 'Portão', 'Bigorrilho'], areas: [] as number[] },
};

const GENERIC = {
  good: [
    'Atendimento excelente do começo ao fim. Explicaram tudo com calma e cumpriram o combinado.',
    'Muito profissionais e pontuais. O resultado ficou exatamente como eu queria.',
    'Gostei bastante, preço justo e serviço caprichado. Com certeza volto.',
    'Fui muito bem atendido e meu pet foi tratado com carinho.',
    'Responderam rápido, passaram o valor certinho e não teve surpresa no final.',
    'Serviço de qualidade, recomendo para quem procura gente séria.',
  ],
  mid: [
    'O serviço ficou bom, mas atrasaram um pouco para começar.',
    'Atendimento ok, nada de especial. O preço poderia ser um pouco melhor.',
    'Resolveram o que eu precisava, mas a comunicação poderia ser mais clara.',
    'Bom resultado, porém demorou mais do que o prometido.',
  ],
  bad: [
    'Não cumpriram o horário combinado e tive que remarcar duas vezes.',
    'O valor final ficou bem acima do que foi passado no orçamento.',
    'Atendimento fraco, senti que não deram atenção ao que eu pedi.',
    'Precisei voltar para refazer parte do serviço. Esperava mais.',
  ],
};

const h = (n: number, extra: Partial<ServiceTemplate> = {}) => ({ duration: n, bookable: true, ...extra });

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  'banho-e-tosa': {
    names: [['Banho & Tosa Bem Cuidar'], ['Pet Shop Patas Felizes'], ['Focinho Limpo Estética Animal'], ['Spa Pet Pelo Macio'], ['Mundo Pet Banho e Tosa'], ['Cheirinho de Banho Pet'], ['Tosa Arte Pet Studio']],
    services: [
      { name: 'Banho — porte pequeno', priceType: 'fixed', min: 55, ...h(60) },
      { name: 'Banho — porte médio', priceType: 'fixed', min: 70, ...h(75) },
      { name: 'Banho e tosa — porte pequeno', priceType: 'fixed', min: 85, ...h(90) },
      { name: 'Banho e tosa — porte médio', priceType: 'fixed', min: 110, ...h(120) },
      { name: 'Tosa higiênica', priceType: 'fixed', min: 40, ...h(30) },
      { name: 'Hidratação de pelos', priceType: 'from', min: 35, ...h(30) },
      { name: 'Banho de gato', priceType: 'fixed', min: 80, ...h(60), notes: 'Atendimento em horário reservado, sem cães no salão.' },
    ],
    descriptions: [
      'Banho e tosa sem gaiola e sem estresse. Você acompanha cada etapa ao vivo pelo app, com fotos do banho à secagem.',
      'Produtos hipoalergênicos, secagem em baixa temperatura e equipe treinada para pets ansiosos e idosos.',
      'Tosa na tesoura ou na máquina, do jeitinho que você pediu na ficha do seu pet.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true, hours: 'extended', priceLevels: [1, 2, 2, 3], aspects: ['atendimento', 'qualidade', 'pontualidade', 'preco'],
    phrases: {
      good: ['Meu cachorro voltou cheiroso e tranquilo, dá pra ver que tratam com carinho.', 'Mandaram fotos durante o banho, fiquei muito mais tranquila.', 'A tosa ficou exatamente como pedi na ficha. Perfeito!'],
      mid: ['A tosa ficou boa, mas atrasaram para entregar.', 'Gostei, mas o perfume era forte demais.'],
      bad: ['Meu cachorro voltou estressado e com uma irritação na pele.', 'Pedi tosa baixa e cortaram curto demais.'],
    },
  },
  passeador: {
    names: [['Passeio Feliz', 'Camila Rocha'], ['Leva Meu Cão', 'Diego Martins'], ['Caminha Comigo Dog Walker', 'Bianca Souza'], ['Patas na Rua', 'Lucas Ferreira'], ['Dog Walker Vila', 'Renata Lima'], ['Rolê Canino', 'Thiago Nunes'], ['Pé na Grama Passeios', 'Juliana Costa']],
    services: [
      { name: 'Passeio individual — 30 min', priceType: 'fixed', min: 35, ...h(30) },
      { name: 'Passeio individual — 60 min', priceType: 'fixed', min: 55, ...h(60) },
      { name: 'Passeio em grupo (até 3 cães) — 45 min', priceType: 'fixed', min: 30, ...h(45) },
      { name: 'Pacote mensal — 3x por semana', priceType: 'from', min: 380, notes: 'Combine os dias fixos; o app repete o agendamento toda semana.' },
      { name: 'Passeio para filhotes — 20 min', priceType: 'fixed', min: 30, ...h(20) },
    ],
    descriptions: [
      'Passeios com relatório: hora de saída e chegada, fotos e se fez xixi e cocô.',
      'Experiência com cães ansiosos e reativos. Guia dupla e rotas tranquilas.',
    ],
    modes: { in_person: false, at_customer: true, online: false },
    booking: true, hours: 'appointment', priceLevels: [1, 2], aspects: ['atendimento', 'pontualidade', 'qualidade'],
    phrases: {
      good: ['Super pontual e meu cachorro adora. Recebo foto em todo passeio.', 'Cuida do meu cão como se fosse dela.'],
      mid: ['Passeios bons, mas às vezes chega um pouco atrasado.'],
      bad: ['O passeio foi bem mais curto que o combinado.'],
    },
  },
  'pet-sitter': {
    names: [['Cuida Pet em Casa', 'Fernanda Alves'], ['Gato Feliz Pet Sitter', 'Marina Teixeira'], ['Lar Doce Pet', 'Paula Ribeiro'], ['Babá de Bicho', 'Rodrigo Melo'], ['Pet Sitter Zona Sul', 'Aline Gomes'], ['Miau & Au Cuidados', 'Larissa Barbosa'], ['Visita Pet', 'Gabriel Cardoso']],
    services: [
      { name: 'Visita de 1 hora', priceType: 'fixed', min: 60, ...h(60), notes: 'Alimentação, água, limpeza da caixinha, brincadeiras e fotos.' },
      { name: 'Visita de 30 minutos', priceType: 'fixed', min: 45, ...h(30) },
      { name: 'Duas visitas por dia', priceType: 'fixed', min: 100, ...h(60) },
      { name: 'Medicação', priceType: 'fixed', min: 25, ...h(20) },
      { name: 'Pernoite na sua casa', priceType: 'quote' },
    ],
    descriptions: [
      'Cuido do seu pet na sua casa enquanto você viaja. Mando fotos de cada visita e sigo a rotina dele.',
      'Especialista em gatos: respeito o tempo do bichano, limpo a caixinha e dou remédio com calma.',
    ],
    modes: { in_person: false, at_customer: true, online: false },
    booking: true, hours: 'extended', priceLevels: [1, 2], aspects: ['atendimento', 'pontualidade', 'qualidade'],
    phrases: {
      good: ['Viajei tranquila, recebi foto em todas as visitas.', 'Minha gata, que é medrosa, ficou à vontade com ela.'],
      mid: ['Cuidou bem, mas demorava a responder as mensagens.'],
      bad: ['Esqueceu de uma das visitas combinadas.'],
    },
  },
  'hospedagem-e-creche': {
    names: [['Hotelzinho Cão Feliz'], ['Creche Canina Amigos de Patas'], ['Hospedagem Lar do Pet'], ['Day Care Turma do Latido'], ['Pousada Pet Recanto'], ['Hotel Felino Sete Vidas'], ['Creche Pet Brincadeira']],
    services: [
      { name: 'Creche — dia inteiro', priceType: 'fixed', min: 70, ...h(600), notes: 'Das 8h às 18h, com atividades e soneca.' },
      { name: 'Creche — meio período', priceType: 'fixed', min: 45, ...h(300) },
      { name: 'Hospedagem — diária', priceType: 'fixed', min: 95, bookable: true, mode: 'day', notes: 'Escolha a entrada e a saída; o valor é por noite.' },
      { name: 'Hospedagem de gato — diária', priceType: 'fixed', min: 80, bookable: true, mode: 'day' },
      { name: 'Pacote creche — 10 dias', priceType: 'from', min: 600 },
    ],
    descriptions: [
      'Ambiente sem gaiolas, monitorado e com cuidadores o dia todo. Fotos da turma pelo app.',
      'Separação por porte e temperamento, área verde e cantinho de descanso.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true, hours: 'commercial', priceLevels: [2, 3], aspects: ['atendimento', 'qualidade', 'preco'],
    phrases: {
      good: ['Meu cão volta cansado e feliz da creche.', 'Fiquei uma semana fora e ele foi super bem cuidado.'],
      mid: ['Lugar bom, mas o preço subiu bastante.'],
      bad: ['Voltou com pulgas da hospedagem.'],
    },
  },
  adestramento: {
    names: [['Adestramento Amigo Fiel', 'Rafael Moura'], ['Cão Educado', 'Bruno Pereira'], ['Escola de Cães Bom Garoto'], ['Comportamento Pet', 'Carla Santos'], ['Adestra Já', 'Felipe Lima'], ['Matilha Feliz Adestramento'], ['Primeiros Passos Filhotes', 'Isabela Rocha']],
    services: [
      { name: 'Avaliação comportamental', priceType: 'fixed', min: 150, ...h(60) },
      { name: 'Aula avulsa em casa', priceType: 'fixed', min: 120, ...h(60) },
      { name: 'Pacote obediência — 8 aulas', priceType: 'from', min: 800 },
      { name: 'Socialização de filhotes', priceType: 'fixed', min: 100, ...h(60) },
      { name: 'Cão reativo — plano personalizado', priceType: 'quote' },
    ],
    descriptions: [
      'Adestramento positivo, sem punição. Aulas na sua casa com tarefas para a semana.',
      'Ajudo com puxar na guia, latidos, ansiedade de separação e xixi no lugar certo.',
    ],
    modes: { in_person: true, at_customer: true, online: false },
    booking: true, hours: 'commercial', priceLevels: [2, 3], aspects: ['atendimento', 'qualidade', 'pontualidade'],
    phrases: {
      good: ['Em três aulas meu cachorro parou de puxar a guia.', 'Paciente e explica tudo para a família.'],
      mid: ['Bom adestrador, mas o pacote é caro.'],
      bad: ['Não vi resultado depois de várias aulas.'],
    },
  },
  'pet-taxi': {
    names: [['Táxi Dog Leva e Traz', 'Marcos Silva'], ['Pet Móvel Transporte'], ['Vai de Pet Táxi', 'Sandra Moreira'], ['Táxi Dog Express'], ['Uber das Patas', 'Ricardo Gomes'], ['Pet Ride Transporte Animal'], ['Leva Meu Pet']],
    services: [
      { name: 'Corrida na cidade (ida)', priceType: 'from', min: 35, ...h(40) },
      { name: 'Ida e volta para o banho', priceType: 'fixed', min: 50, ...h(60) },
      { name: 'Transporte ao veterinário', priceType: 'from', min: 40, ...h(60) },
      { name: 'Aeroporto ou viagem', priceType: 'quote' },
    ],
    descriptions: [
      'Carro adaptado, caixa de transporte higienizada e ar-condicionado. Acompanhe a corrida pelo app.',
      'Levo seu pet ao banho, veterinário ou hotel com segurança e pontualidade.',
    ],
    modes: { in_person: false, at_customer: true, online: false },
    booking: true, hours: 'extended', priceLevels: [1, 2], aspects: ['atendimento', 'pontualidade', 'preco'],
    phrases: {
      good: ['Pontual e cuidadoso, meu cachorro viajou tranquilo.', 'Salvou meu dia, levou e trouxe do banho.'],
      mid: ['Bom serviço, mas o carro estava um pouco quente.'],
      bad: ['Atrasou bastante para buscar.'],
    },
  },
};

export const GENERIC_PHRASES = GENERIC;

export const DEMO_FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Leonardo', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius', 'Larissa', 'Marcos', 'Patrícia', 'Rodrigo', 'Sandra', 'Thiago', 'Vanessa', 'William', 'Juliana', 'Gustavo', 'Letícia', 'Fernando', 'Aline', 'Ricardo', 'Beatriz', 'Caio', 'Débora', 'Eduardo', 'Fabiana', 'Gilberto'];
export const DEMO_LAST_NAMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Lima', 'Costa', 'Ferreira', 'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Melo', 'Teixeira', 'Cardoso', 'Nunes', 'Moreira'];

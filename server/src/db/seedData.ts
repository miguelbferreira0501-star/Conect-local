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
}

export interface CategoryTemplate {
  names: Array<[name: string, professional?: string]>;
  services: ServiceTemplate[];
  descriptions: string[];
  modes: { in_person: boolean; at_customer: boolean; online: boolean };
  booking: boolean;
  hours: 'commercial' | 'extended' | 'evening' | 'weekend' | 'appointment';
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
    'Fui muito bem atendido, ambiente organizado e equipe educada.',
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
  'estetica-e-beleza': {
    names: [['Espaço Bem Cuidar'], ['Clínica Pele Leve'], ['Studio Lumina Estética'], ['Ateliê das Unhas'], ['Renova Estética Avançada'], ['Studio Camila Rocha', 'Camila Rocha'], ['Bella Forma Clínica']],
    services: [
      { name: 'Limpeza de pele profunda', priceType: 'fixed', min: 160, ...h(75) },
      { name: 'Design de sobrancelhas', priceType: 'fixed', min: 55, ...h(30) },
      { name: 'Manicure e pedicure', priceType: 'fixed', min: 70, ...h(60) },
      { name: 'Depilação a cera — pernas', priceType: 'from', min: 60, ...h(40) },
      { name: 'Massagem relaxante', priceType: 'fixed', min: 140, ...h(60) },
      { name: 'Maquiagem para eventos', priceType: 'from', min: 180, ...h(60), notes: 'Atendimento no seu endereço sob consulta.' },
      { name: 'Drenagem linfática', priceType: 'range', min: 120, max: 160, ...h(60) },
    ],
    descriptions: [
      'Cuidamos da sua pele e do seu bem-estar com profissionais formados, produtos de qualidade e ambiente tranquilo. Trabalhamos com hora marcada para você não esperar.',
      'Clínica de estética com foco em tratamentos faciais e corporais. Avaliação inicial para indicar o cuidado certo para você.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true,
    hours: 'extended',
    priceLevels: [2, 2, 3, 3],
    aspects: ['atendimento', 'qualidade', 'pontualidade', 'preco'],
    phrases: {
      good: ['Minha pele ficou ótima depois da limpeza, profissional muito cuidadosa.', 'Sobrancelha perfeita, respeitou o formato do meu rosto.', 'Ambiente limpo e cheiroso, me senti muito à vontade.'],
      mid: ['Gostei do resultado, mas a sala de espera estava cheia.'],
      bad: ['Fiquei com a pele irritada e não me deram retorno quando reclamei.'],
    },
  },
  automotivo: {
    names: [['Auto Center Confiança'], ['Oficina Pistão de Ouro'], ['Mecânica Irmãos Vieira'], ['Funilaria e Pintura Nova Cor'], ['Lava Car Brilho Total'], ['Auto Elétrica Faísca'], ['Garagem 21 Serviços Automotivos']],
    services: [
      { name: 'Revisão completa', priceType: 'from', min: 350, ...h(180) },
      { name: 'Troca de óleo e filtro', priceType: 'from', min: 180, ...h(45) },
      { name: 'Alinhamento e balanceamento', priceType: 'fixed', min: 120, ...h(60) },
      { name: 'Diagnóstico com scanner', priceType: 'fixed', min: 100, ...h(40) },
      { name: 'Troca de pastilhas de freio', priceType: 'range', min: 180, max: 400, ...h(90) },
      { name: 'Funilaria e pintura', priceType: 'quote', notes: 'Orçamento após avaliação do veículo.' },
      { name: 'Lavagem completa', priceType: 'fixed', min: 70, ...h(60) },
    ],
    descriptions: [
      'Oficina com mais de 10 anos de experiência em manutenção preventiva e corretiva. Mostramos as peças trocadas e explicamos cada item do orçamento.',
      'Equipe de mecânicos qualificados, equipamentos de diagnóstico e garantia nos serviços realizados.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true,
    hours: 'commercial',
    priceLevels: [1, 2, 2, 3],
    aspects: ['qualidade', 'preco', 'pontualidade', 'atendimento'],
    phrases: {
      good: ['Mostraram as peças antigas e explicaram tudo. Mecânico honesto é raro.', 'Carro ficou pronto no mesmo dia, preço dentro do orçado.', 'Resolveram um barulho que outras duas oficinas não acharam.'],
      mid: ['O serviço ficou bom, mas o carro demorou um dia a mais.'],
      bad: ['Cobraram por peça que depois vi que não foi trocada. Não volto.'],
    },
  },
  pet: {
    names: [['Pet Shop Patas Felizes'], ['Banho e Tosa Focinho Limpo'], ['Clínica Veterinária Bicho Bom'], ['Adestramento Amigo Fiel', 'Rafael Moura'], ['Hotelzinho Cão Feliz'], ['Mundo Pet Cuidados'], ['Vet & Companhia']],
    services: [
      { name: 'Banho — porte pequeno', priceType: 'fixed', min: 55, ...h(60) },
      { name: 'Banho e tosa — porte médio', priceType: 'fixed', min: 95, ...h(90) },
      { name: 'Tosa higiênica', priceType: 'fixed', min: 40, ...h(30) },
      { name: 'Consulta veterinária', priceType: 'fixed', min: 150, ...h(40) },
      { name: 'Vacinação', priceType: 'from', min: 90, ...h(20) },
      { name: 'Adestramento — pacote mensal', priceType: 'quote' },
      { name: 'Hospedagem — diária', priceType: 'fixed', min: 85 },
    ],
    descriptions: [
      'Cuidamos do seu pet com carinho e segurança. Produtos hipoalergênicos, secagem sem estresse e acompanhamento em tempo real por fotos.',
      'Equipe apaixonada por animais, com veterinário responsável e ambiente climatizado.',
    ],
    modes: { in_person: true, at_customer: true, online: false },
    booking: true,
    hours: 'extended',
    priceLevels: [1, 2, 2],
    aspects: ['atendimento', 'qualidade', 'pontualidade', 'preco'],
    phrases: {
      good: ['Meu cachorro voltou cheiroso e tranquilo, dá pra ver que tratam com carinho.', 'Mandaram fotos durante o banho, adorei.', 'Veterinária muito atenciosa, explicou o tratamento com paciência.'],
      mid: ['A tosa ficou boa, mas atrasaram para entregar.'],
      bad: ['Meu gato voltou estressado e com um pequeno corte na pata.'],
    },
  },
  'tatuagem-e-piercing': {
    names: [['Tinta Viva Tattoo'], ['Estúdio Agulha Fina'], ['Black Line Tattoo Studio'], ['Ink Garden Estúdio'], ['Atelier Traço Livre', 'Bruna Lima'], ['Piercing & Arte'], ['Studio Contorno']],
    services: [
      { name: 'Tatuagem fine line pequena', priceType: 'from', min: 250, ...h(90) },
      { name: 'Tatuagem média (por sessão)', priceType: 'range', min: 600, max: 1200, ...h(240) },
      { name: 'Cobertura de tatuagem', priceType: 'quote', notes: 'Avaliação presencial obrigatória.' },
      { name: 'Aplicação de piercing', priceType: 'from', min: 90, ...h(30), notes: 'Joia de titânio inclusa.' },
      { name: 'Criação de desenho exclusivo', priceType: 'quote' },
    ],
    descriptions: [
      'Estúdio com materiais descartáveis, autoclave e licença sanitária. Desenhos autorais e atendimento com hora marcada.',
      'Especialistas em traço fino, realismo e blackwork. Conversamos sobre a ideia antes de qualquer orçamento.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true,
    hours: 'evening',
    priceLevels: [2, 3, 3, 4],
    aspects: ['qualidade', 'atendimento', 'preco', 'pontualidade'],
    phrases: {
      good: ['Traço perfeito, cicatrizou super bem. Estúdio muito limpo.', 'O artista ajustou o desenho até ficar do jeito que eu imaginei.', 'Ambiente acolhedor, me deixaram bem tranquila na primeira tatuagem.'],
      mid: ['Ficou bonita, mas o valor foi mais alto do que imaginei.'],
      bad: ['A linha ficou tremida em uma parte e cobraram o retoque.'],
    },
  },
  esportes: {
    names: [['Arena Society Gol de Placa'], ['Beach Point Areia'], ['Quadras Ponto Final'], ['Centro Esportivo Vila Ativa'], ['Padel Club Ritmo'], ['Arena Rede Alta'], ['Complexo Esportivo Bola Rolando']],
    services: [
      { name: 'Aluguel de quadra society (1h)', priceType: 'from', min: 180, ...h(60) },
      { name: 'Aluguel de quadra de beach tennis (1h)', priceType: 'fixed', min: 110, ...h(60) },
      { name: 'Aula de beach tennis', priceType: 'fixed', min: 90, ...h(60) },
      { name: 'Aluguel de quadra de padel (1h)', priceType: 'fixed', min: 140, ...h(60) },
      { name: 'Pacote para festa esportiva', priceType: 'quote' },
    ],
    descriptions: [
      'Quadras cobertas e iluminadas, vestiários, estacionamento e lanchonete. Reserve o seu horário com antecedência.',
      'Espaço esportivo com gramado sintético, areia tratada e aluguel de equipamentos.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true,
    hours: 'evening',
    priceLevels: [1, 2, 2],
    aspects: ['atendimento', 'qualidade', 'preco', 'pontualidade'],
    phrases: {
      good: ['Quadra bem cuidada, iluminação ótima à noite.', 'Vestiário limpo e reserva muito fácil.', 'Areia fofinha e bem nivelada, dá gosto jogar.'],
      mid: ['Quadra boa, mas o estacionamento lota nos horários de pico.'],
      bad: ['Reservamos e quando chegamos tinha outro grupo jogando.'],
    },
  },
  limpeza: {
    names: [['Casa Limpa Serviços'], ['Brilho Total Limpezas'], ['Higieniza Já Estofados'], ['Limpeza Pós-Obra Perfeita'], ['Faxina Fácil', 'Dona Neusa Ramos'], ['Dedetizadora Lar Seguro'], ['Clean Pro Conservação']],
    services: [
      { name: 'Limpeza residencial (diária de 8h)', priceType: 'from', min: 220 },
      { name: 'Limpeza pós-obra', priceType: 'quote', notes: 'Valor conforme metragem.' },
      { name: 'Higienização de sofá', priceType: 'range', min: 150, max: 350 },
      { name: 'Higienização de colchão', priceType: 'from', min: 120 },
      { name: 'Dedetização residencial', priceType: 'from', min: 250 },
      { name: 'Limpeza de caixa d’água', priceType: 'fixed', min: 200 },
    ],
    descriptions: [
      'Equipe treinada, uniformizada e com produtos próprios. Atendemos casas, apartamentos e escritórios com agendamento flexível.',
      'Limpeza detalhada com checklist entregue ao cliente no final do serviço.',
    ],
    modes: { in_person: false, at_customer: true, online: false },
    booking: false,
    hours: 'weekend',
    priceLevels: [1, 2, 2],
    aspects: ['qualidade', 'pontualidade', 'atendimento', 'preco'],
    phrases: {
      good: ['Deixaram o apartamento impecável depois da obra.', 'Sofá parecia novo, tiraram manchas que eu achava impossíveis.', 'Chegaram no horário e trouxeram todo o material.'],
      mid: ['Limpeza boa, mas esqueceram alguns cantos do banheiro.'],
      bad: ['Faltaram no dia combinado e só avisaram depois.'],
    },
  },
  fotografia: {
    names: [['Clique Certo Fotografia'], ['Lente Viva Produções'], ['Estúdio Luz Natural'], ['Marina Torres Fotografia', 'Marina Torres'], ['Drone & Foco Audiovisual'], ['Retrato Fiel Estúdio'], ['Momentos Filmes']],
    services: [
      { name: 'Ensaio fotográfico externo', priceType: 'from', min: 450, ...h(90) },
      { name: 'Fotos de produtos (até 20 itens)', priceType: 'fixed', min: 600 },
      { name: 'Cobertura de casamento', priceType: 'quote' },
      { name: 'Filmagem de evento', priceType: 'range', min: 1500, max: 4500 },
      { name: 'Imagens aéreas com drone', priceType: 'from', min: 500 },
      { name: 'Fotos para documentos e perfil profissional', priceType: 'fixed', min: 120, ...h(30) },
    ],
    descriptions: [
      'Fotografia de pessoas, eventos e empresas. Entrega das fotos editadas em galeria on-line em até 15 dias.',
      'Produção audiovisual completa: roteiro, captação, edição e trilha licenciada.',
    ],
    modes: { in_person: true, at_customer: true, online: false },
    booking: true,
    hours: 'appointment',
    priceLevels: [2, 3, 3, 4],
    aspects: ['qualidade', 'atendimento', 'pontualidade', 'preco'],
    phrases: {
      good: ['As fotos do casamento ficaram lindas e chegaram antes do prazo.', 'Super paciente com as crianças no ensaio.', 'Vídeo da empresa ficou muito profissional.'],
      mid: ['Fotos boas, mas a entrega atrasou uma semana.'],
      bad: ['Perderam parte das fotos da festa e não deram solução.'],
    },
  },
  'espacos-para-eventos': {
    names: [['Espaço Jardim das Flores'], ['Salão de Festas Estrela'], ['Chácara Recanto Verde'], ['Villa Celebrar Eventos'], ['Espaço Kids Alegria'], ['Galpão Industrial Eventos'], ['Casa Bonita Recepções']],
    services: [
      { name: 'Locação do salão (sábado)', priceType: 'from', min: 2500 },
      { name: 'Locação do salão (dia útil)', priceType: 'from', min: 1200 },
      { name: 'Pacote festa infantil', priceType: 'range', min: 3500, max: 7000 },
      { name: 'Pacote casamento com buffet', priceType: 'quote' },
      { name: 'Visita ao espaço', priceType: 'fixed', min: 0, ...h(45), notes: 'Visita gratuita com hora marcada.' },
    ],
    descriptions: [
      'Espaço para até 200 convidados com estacionamento, cozinha equipada, área verde e acessibilidade.',
      'Ambiente versátil para aniversários, casamentos e eventos corporativos. Parceiros de buffet e decoração.',
    ],
    modes: { in_person: true, at_customer: false, online: false },
    booking: true,
    hours: 'weekend',
    priceLevels: [2, 3, 4],
    aspects: ['atendimento', 'qualidade', 'preco', 'pontualidade'],
    phrases: {
      good: ['Espaço lindo e equipe muito prestativa no dia da festa.', 'Tudo organizado, os convidados elogiaram muito.', 'Ótimo custo-benefício para o tamanho do salão.'],
      mid: ['Lugar bonito, mas o ar-condicionado não deu conta.'],
      bad: ['Cobraram taxas extras que não estavam no contrato.'],
    },
  },
  'reformas-e-manutencao': {
    names: [['Luz & Força Instalações Elétricas'], ['Hidráulica Gota Certa'], ['Reformas Casa Nova'], ['Pinturas Arco-Íris'], ['Marcenaria Veio da Madeira'], ['Eletricista Paulo Souza', 'Paulo Souza'], ['Construtora Mãos à Obra']],
    services: [
      { name: 'Visita técnica de eletricista', priceType: 'fixed', min: 120, ...h(60) },
      { name: 'Troca de disjuntor / quadro elétrico', priceType: 'range', min: 180, max: 900 },
      { name: 'Instalação de chuveiro', priceType: 'fixed', min: 150, ...h(60) },
      { name: 'Conserto de vazamento', priceType: 'from', min: 150 },
      { name: 'Pintura de apartamento', priceType: 'quote', notes: 'Orçamento por metro quadrado.' },
      { name: 'Reforma de banheiro', priceType: 'quote' },
      { name: 'Móveis planejados', priceType: 'quote' },
    ],
    descriptions: [
      'Serviços de manutenção e reforma com profissionais registrados, orçamento detalhado e garantia por escrito.',
      'Eletricista e encanador para emergências e pequenas reformas. Atendimento rápido e limpeza do local ao final.',
    ],
    modes: { in_person: false, at_customer: true, online: false },
    booking: true,
    hours: 'commercial',
    priceLevels: [1, 2, 2, 3],
    aspects: ['qualidade', 'pontualidade', 'preco', 'atendimento'],
    phrases: {
      good: ['Resolveu o problema elétrico rapidinho e deixou tudo limpo.', 'Orçamento detalhado e cumpriu o prazo da reforma.', 'Pintura impecável, protegeram todos os móveis.'],
      mid: ['O serviço ficou bom, mas a obra atrasou alguns dias.'],
      bad: ['Deixou a obra pela metade e demorou para voltar.'],
    },
  },
  'servicos-para-casa': {
    names: [['Chaveiro 24h Chave Mestra'], ['Monta Fácil Montagem de Móveis'], ['Clima Bom Ar-Condicionado'], ['Desentupidora Fluxo Livre'], ['Vidraçaria Transparente'], ['Mudanças Leva & Traz'], ['Jardim Vivo Paisagismo']],
    services: [
      { name: 'Abertura de porta', priceType: 'from', min: 90 },
      { name: 'Montagem de guarda-roupa', priceType: 'range', min: 150, max: 350 },
      { name: 'Instalação de ar-condicionado split', priceType: 'from', min: 450, ...h(180) },
      { name: 'Limpeza de ar-condicionado', priceType: 'fixed', min: 180, ...h(90) },
      { name: 'Desentupimento de pia ou ralo', priceType: 'from', min: 150 },
      { name: 'Mudança residencial', priceType: 'quote' },
      { name: 'Manutenção de jardim', priceType: 'from', min: 160 },
    ],
    descriptions: [
      'Serviços rápidos para o dia a dia da sua casa, com profissionais identificados e preço combinado antes de começar.',
      'Atendemos toda a região com equipe própria e veículos equipados.',
    ],
    modes: { in_person: false, at_customer: true, online: false },
    booking: true,
    hours: 'extended',
    priceLevels: [1, 2, 2],
    aspects: ['pontualidade', 'qualidade', 'preco', 'atendimento'],
    phrases: {
      good: ['Chegou em 30 minutos e abriu a porta sem estragar a fechadura.', 'Montaram tudo certinho e levaram as embalagens.', 'Instalação do ar ficou perfeita, sem sujeira.'],
      mid: ['Fizeram o serviço, mas chegaram bem depois do horário.'],
      bad: ['O ar voltou a pingar uma semana depois da instalação.'],
    },
  },
  informatica: {
    names: [['Conserta Cell Assistência'], ['TecnoFix Informática'], ['Doutor Notebook'], ['Rede Fácil Soluções em TI'], ['Click Assistência Técnica'], ['Pixel Reparos'], ['Help Desk em Casa', 'Lucas Andrade']],
    services: [
      { name: 'Troca de tela de celular', priceType: 'range', min: 180, max: 900, ...h(90) },
      { name: 'Troca de bateria', priceType: 'from', min: 150, ...h(60) },
      { name: 'Formatação com backup', priceType: 'fixed', min: 150, ...h(120) },
      { name: 'Limpeza interna de notebook', priceType: 'fixed', min: 130, ...h(90) },
      { name: 'Configuração de rede Wi-Fi', priceType: 'fixed', min: 160 },
      { name: 'Suporte remoto (1h)', priceType: 'fixed', min: 90, ...h(60) },
      { name: 'Diagnóstico', priceType: 'fixed', min: 0, notes: 'Gratuito se aprovar o orçamento.' },
    ],
    descriptions: [
      'Assistência técnica com peças de qualidade, garantia de 90 dias e orçamento antes de qualquer conserto.',
      'Suporte em informática para casas e pequenas empresas, presencial ou remoto.',
    ],
    modes: { in_person: true, at_customer: true, online: true },
    booking: true,
    hours: 'commercial',
    priceLevels: [1, 2, 2],
    aspects: ['qualidade', 'preco', 'pontualidade', 'atendimento'],
    phrases: {
      good: ['Trocaram a tela no mesmo dia, ficou perfeita.', 'Recuperaram minhas fotos que eu achei que tinha perdido.', 'Explicou o problema sem enrolação e cobrou o justo.'],
      mid: ['Consertaram, mas demorou mais do que o combinado.'],
      bad: ['O celular voltou com o alto-falante com defeito.'],
    },
  },
  'outros-servicos': {
    names: [['Ateliê Linha & Agulha', 'Dona Teresa'], ['Professor Particular Saber Mais', 'Prof. André Lopes'], ['Sapataria Passo Firme'], ['Contabilidade Descomplica'], ['Traduções Ponte'], ['Aulas de Violão Acorde', 'Júlia Neves'], ['Conserta Tudo Reparos']],
    services: [
      { name: 'Ajuste de roupas', priceType: 'from', min: 25 },
      { name: 'Aula particular de matemática (1h)', priceType: 'fixed', min: 90, ...h(60) },
      { name: 'Aula de violão (1h)', priceType: 'fixed', min: 100, ...h(60) },
      { name: 'Conserto de calçados', priceType: 'from', min: 35 },
      { name: 'Declaração de imposto de renda', priceType: 'from', min: 200 },
      { name: 'Tradução de documentos', priceType: 'quote' },
    ],
    descriptions: [
      'Atendimento personalizado e cuidadoso, com anos de experiência e muitos clientes fiéis na região.',
      'Serviço feito com atenção aos detalhes, prazos combinados e preço justo.',
    ],
    modes: { in_person: true, at_customer: false, online: true },
    booking: true,
    hours: 'commercial',
    priceLevels: [1, 2],
    aspects: ['atendimento', 'qualidade', 'preco', 'pontualidade'],
    phrases: {
      good: ['Fez o ajuste no vestido rapidinho e ficou perfeito.', 'Professor muito didático, meu filho melhorou as notas.', 'Resolveu meu imposto de renda sem complicação.'],
      mid: ['Bom serviço, mas tive que ligar várias vezes para saber o prazo.'],
      bad: ['O ajuste ficou torto e tive que levar em outro lugar.'],
    },
  },
};

export const GENERIC_PHRASES = GENERIC;

export const DEMO_FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Leonardo', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius', 'Larissa', 'Marcos', 'Patrícia', 'Rodrigo', 'Sandra', 'Thiago', 'Vanessa', 'William', 'Juliana', 'Gustavo', 'Letícia', 'Fernando', 'Aline', 'Ricardo', 'Beatriz', 'Caio', 'Débora', 'Eduardo', 'Fabiana', 'Gilberto'];
export const DEMO_LAST_NAMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Lima', 'Costa', 'Ferreira', 'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Melo', 'Teixeira', 'Cardoso', 'Nunes', 'Moreira'];

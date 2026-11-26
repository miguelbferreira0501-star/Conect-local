// Quizzes de autoconhecimento do Bem-estar. Não são testes clínicos e não dão diagnóstico: são para pensar
// com carinho. Cada resposta soma ponto para um perfil; o resultado tem título, explicação e uma dica para hoje.
import type { Trick } from '../components/LivePet';

export interface QuizResult {
  title: string;
  text: string;
  tip: string;
}
export interface QuizDef {
  id: string;
  title: string;
  emoji: string;
  color: string;
  intro: string;
  pose: Trick;
  questions: { q: string; a: [string, string][] }[];
  results: Record<string, QuizResult>;
}

export const QUIZZES: QuizDef[] = [
  {
    id: 'descanso',
    title: 'Qual é o seu jeito de descansar?',
    emoji: '🧩',
    color: '#FFE39A',
    intro: 'Descansar não é igual pra todo mundo. Vamos descobrir o que recarrega você de verdade.',
    pose: 'travesseiro',
    questions: [
      { q: 'Num sábado livre, você prefere…', a: [['Ficar em casa, quietinho', 'calma'], ['Encontrar os amigos', 'social'], ['Fazer algo com as mãos', 'criativo'], ['Sair, passear, se mexer', 'movimento']] },
      { q: 'Depois de um dia cansativo, o que mais ajuda?', a: [['Silêncio e um banho quente', 'calma'], ['Desabafar com alguém', 'social'], ['Desenhar, cozinhar ou tocar algo', 'criativo'], ['Uma caminhada sem pressa', 'movimento']] },
      { q: 'Qual lugar te acalma na hora?', a: [['Minha cama com coberta', 'calma'], ['Uma mesa cheia de gente querida', 'social'], ['Um cantinho só meu, com minhas coisas', 'criativo'], ['Qualquer lugar ao ar livre', 'movimento']] },
      { q: 'Férias perfeitas seriam…', a: [['Um chalé longe de tudo', 'calma'], ['Viagem com a turma', 'social'], ['Uma oficina de algo novo', 'criativo'], ['Trilhas e aventuras', 'movimento']] },
      { q: 'Quando você está sem bateria, você sente falta de…', a: [['Paz', 'calma'], ['Companhia', 'social'], ['Inspiração', 'criativo'], ['Ar fresco', 'movimento']] },
    ],
    results: {
      calma: { title: 'Você recarrega no silêncio', text: 'Momentos quietos são o seu combustível. Barulho, notificações e agenda cheia gastam sua energia mais rápido do que você imagina.', tip: 'Hoje, separe 15 minutos sem tela, só você e algo gostoso (um chá, uma música baixinha, a janela).' },
      social: { title: 'Você recarrega com gente', text: 'Uma conversa boa vale como descanso pra você. Ficar isolado demais pode deixar o seu dia mais pesado.', tip: 'Mande uma mensagem para alguém que te faz rir e marque um encontrinho, nem que seja por chamada.' },
      criativo: { title: 'Você recarrega criando', text: 'Quando as mãos estão ocupadas, a cabeça descansa. Criar algo, mesmo pequeno, tira o peso dos pensamentos.', tip: 'Faça algo com as mãos hoje: um desenho rápido, uma receita simples, uma planta nova.' },
      movimento: { title: 'Você recarrega se mexendo', text: 'Seu corpo pede movimento para a mente desligar. Ficar parado muito tempo te deixa mais cansado, não menos.', tip: 'Uma caminhada de 10 minutos depois do almoço já faz diferença. Bora?' },
    },
  },
  {
    id: 'energia',
    title: 'O que mais rouba sua energia?',
    emoji: '💭',
    color: '#CFE8FF',
    intro: 'Às vezes a gente se sente cansado sem saber por quê. Vamos procurar o ladrão de energia.',
    pose: 'curioso',
    questions: [
      { q: 'O que mais te cansa numa semana comum?', a: [['Dormir pouco ou mal', 'sono'], ['Passar horas no celular', 'tela'], ['Pular refeições', 'comida'], ['Me cobrar demais', 'cobranca']] },
      { q: 'Quando você acorda sem energia, normalmente…', a: [['Dormi tarde', 'sono'], ['Fiquei rolando o feed antes de dormir', 'tela'], ['Jantei mal ou nem jantei', 'comida'], ['Fui dormir pensando no que não fiz', 'cobranca']] },
      { q: 'No meio da tarde, você costuma…', a: [['Bocejar sem parar', 'sono'], ['Abrir o celular sem perceber', 'tela'], ['Sentir fome ou dor de cabeça', 'comida'], ['Achar que está atrasado em tudo', 'cobranca']] },
      { q: 'O que você mais gostaria de mudar?', a: [['Ter um horário de dormir', 'sono'], ['Usar menos o celular', 'tela'], ['Comer com mais calma', 'comida'], ['Ser mais gentil comigo', 'cobranca']] },
      { q: 'Uma frase que parece com você:', a: [['"Só mais cinco minutinhos…"', 'sono'], ['"Vou só dar uma olhadinha"', 'tela'], ['"Depois eu como"', 'comida'], ['"Ainda não está bom"', 'cobranca']] },
    ],
    results: {
      sono: { title: 'O seu ponto-chave é o sono', text: 'Dormir pouco ou em horários bagunçados pesa em tudo: humor, foco e paciência. Pequenos ajustes à noite mudam o dia seguinte.', tip: 'Experimente a rotina "Para dormir" do Bem-estar hoje à noite.' },
      tela: { title: 'As telas estão pesando', text: 'O celular rouba atenção aos pouquinhos, e no fim do dia parece que a energia evaporou. Não precisa largar, só dar pausas.', tip: 'Coloque a tarefa "pausa longe da tela" na sua lista de hoje.' },
      comida: { title: 'Comer com carinho muda seu dia', text: 'Pular refeições ou comer correndo derruba a energia e o humor. Seu corpo agradece quando você para pra se alimentar.', tip: 'Hoje, faça pelo menos uma refeição sentado, sem pressa e sem tela.' },
      cobranca: { title: 'A cobrança pesa mais que a tarefa', text: 'Você é exigente consigo, e isso cansa. Lembrar do que já fez é tão importante quanto planejar o que falta.', tip: 'Escreva três coisas que você fez hoje, mesmo as pequenas. Pequeno ainda é progresso.' },
    },
  },
  {
    id: 'carinho',
    title: 'Qual é a sua linguagem do carinho?',
    emoji: '💗',
    color: '#FFD6E2',
    intro: 'Cada pessoa se sente amada de um jeito. Descubra o seu (e entenda melhor quem você ama).',
    pose: 'coracao',
    questions: [
      { q: 'Você se sente mais querido quando alguém…', a: [['Diz o quanto gosta de você', 'palavras'], ['Passa um tempo só com você', 'tempo'], ['Faz algo para te ajudar', 'gestos'], ['Te dá um abraço apertado', 'abraco']] },
      { q: 'O que mais te magoaria?', a: [['Uma crítica dura', 'palavras'], ['A pessoa sempre sem tempo', 'tempo'], ['Ninguém ajudar quando você precisa', 'gestos'], ['Frieza, sem contato nenhum', 'abraco']] },
      { q: 'Para mostrar carinho, você costuma…', a: [['Mandar mensagens fofas', 'palavras'], ['Chamar para fazer algo junto', 'tempo'], ['Resolver um problema da pessoa', 'gestos'], ['Abraçar e ficar pertinho', 'abraco']] },
      { q: 'Um presente perfeito seria…', a: [['Uma carta escrita à mão', 'palavras'], ['Um dia inteiro juntos', 'tempo'], ['Alguém cuidar de uma tarefa chata por você', 'gestos'], ['Um cafuné demorado', 'abraco']] },
      { q: 'Quando você está triste, o que ajuda?', a: [['Ouvir "vai ficar tudo bem"', 'palavras'], ['Alguém ficar do seu lado', 'tempo'], ['Alguém trazer um chá', 'gestos'], ['Um colo', 'abraco']] },
    ],
    results: {
      palavras: { title: 'Palavras de carinho', text: 'Elogios sinceros e frases gentis enchem o seu coração. E críticas duras machucam mais em você do que em outras pessoas.', tip: 'Diga para alguém hoje o que você admira nele. E diga uma coisa bonita para você também.' },
      tempo: { title: 'Tempo de qualidade', text: 'Para você, amor é presença: estar junto, com atenção de verdade, sem celular no meio.', tip: 'Marque um momento sem tela com alguém querido, nem que sejam 20 minutos.' },
      gestos: { title: 'Gestos que cuidam', text: 'Você sente carinho quando alguém faz algo por você, e mostra amor ajudando os outros.', tip: 'Faça um pequeno favor para alguém hoje, e aceite ajuda quando oferecerem.' },
      abraco: { title: 'Abraço e pertinho', text: 'Contato e presença física te acalmam. Um abraço apertado pode mudar o seu dia inteiro.', tip: 'Abrace alguém de quem você gosta hoje (seu Lumbi também aceita carinho!).' },
    },
  },
  {
    id: 'estresse',
    title: 'Como você reage ao estresse?',
    emoji: '🌪️',
    color: '#E6DCFF',
    intro: 'Todo mundo tem um jeito automático de reagir quando aperta. Conhecer o seu ajuda a cuidar melhor.',
    pose: 'curioso',
    questions: [
      { q: 'Um prazo apertado aparece. Você…', a: [['Acelera e tenta fazer tudo de uma vez', 'acelera'], ['Trava e não sabe por onde começar', 'trava'], ['Liga pra alguém pra desabafar', 'fala'], ['Arruma outra coisa pra fazer', 'foge']] },
      { q: 'Seu corpo, quando você está estressado:', a: [['Fica agitado, sem parar quieto', 'acelera'], ['Fica pesado e cansado', 'trava'], ['Dá vontade de chorar', 'fala'], ['Pede distração, série, jogo', 'foge']] },
      { q: 'Uma briga acontece. Você…', a: [['Quer resolver na hora', 'acelera'], ['Fica em silêncio', 'trava'], ['Precisa conversar sobre isso', 'fala'], ['Evita o assunto', 'foge']] },
      { q: 'O que te ajuda a voltar ao normal?', a: [['Riscar coisas da lista', 'acelera'], ['Dormir e recomeçar', 'trava'], ['Ser ouvido', 'fala'], ['Me distrair um pouco', 'foge']] },
      { q: 'Quem te conhece diria que você…', a: [['Resolve tudo correndo', 'acelera'], ['Some quando está mal', 'trava'], ['Fala o que sente', 'fala'], ['Muda de assunto', 'foge']] },
    ],
    results: {
      acelera: { title: 'Você acelera', text: 'Seu jeito é agir rápido. Isso resolve muita coisa, mas pode te deixar exausto e fazer você esquecer de respirar.', tip: 'Antes da próxima tarefa, faça 1 minuto de respiração no Bem-estar. Devagar também chega.' },
      trava: { title: 'Você congela', text: 'Quando aperta, você trava. Não é preguiça: é o seu corpo pedindo pausa. O segredo é começar bem pequeno.', tip: 'Escolha a menor parte possível da tarefa e faça só ela. Uma de cada vez.' },
      fala: { title: 'Você precisa falar', text: 'Colocar pra fora ajuda você a organizar a cabeça. Guardar tudo te faz mal.', tip: 'Escreva no Diário o que está te apertando, ou chame alguém de confiança.' },
      foge: { title: 'Você se distrai', text: 'Distrair dá um alívio rápido, mas o problema volta. Tudo bem pausar, desde que você volte depois.', tip: 'Use o temporizador de foco: 10 minutos na tarefa, depois uma pausa merecida.' },
    },
  },
  {
    id: 'relogio',
    title: 'Você é da manhã ou da noite?',
    emoji: '🌙',
    color: '#DFF5D2',
    intro: 'Seu corpo tem um horário preferido. Descubra o seu e use isso a seu favor.',
    pose: 'travesseiro',
    questions: [
      { q: 'Sem despertador, você acordaria…', a: [['Bem cedinho, cheio de energia', 'cotovia'], ['Lá pelas dez, tranquilo', 'beija-flor'], ['Perto do almoço', 'coruja'], ['Depende muito do dia', 'gato']] },
      { q: 'Sua cabeça funciona melhor…', a: [['De manhã', 'cotovia'], ['No meio do dia', 'beija-flor'], ['À noite', 'coruja'], ['Em momentos curtos, com pausas', 'gato']] },
      { q: 'Uma soneca à tarde é…', a: [['Desnecessária', 'cotovia'], ['Às vezes boa', 'beija-flor'], ['Impossível, eu fico elétrico', 'coruja'], ['Sagrada', 'gato']] },
      { q: 'Festa que acaba tarde:', a: [['Eu durmo no sofá', 'cotovia'], ['Fico até o meio', 'beija-flor'], ['Sou o último a sair', 'coruja'], ['Vou e volto quando cansar', 'gato']] },
      { q: 'Seu horário mais criativo:', a: [['Logo cedo, com café', 'cotovia'], ['Depois do almoço', 'beija-flor'], ['Madrugada', 'coruja'], ['Quando bate a inspiração', 'gato']] },
    ],
    results: {
      cotovia: { title: 'Passarinho da manhã', text: 'Você rende mais cedo. Deixar o mais difícil para a manhã e desacelerar à noite faz muito bem pra você.', tip: 'Amanhã, faça a tarefa mais importante logo nas primeiras horas.' },
      'beija-flor': { title: 'Beija-flor do meio do dia', text: 'Você é flexível e funciona bem no meio do dia. Manter horários parecidos te deixa ainda melhor.', tip: 'Tente dormir e acordar no mesmo horário por três dias seguidos.' },
      coruja: { title: 'Corujinha da noite', text: 'Sua energia sobe à noite. Tudo bem, mas cuide para dormir o suficiente e não usar tela até tarde.', tip: 'Coloque um lembrete para desligar as telas 30 minutos antes de dormir.' },
      gato: { title: 'Gatinho das sonecas', text: 'Você funciona em ciclos curtos, com pausas. Trabalhar em blocos com descanso combina muito com você.', tip: 'Use o temporizador de foco em blocos de 25 minutos com pausas de 5.' },
    },
  },
  {
    id: 'autocuidado',
    title: 'Qual autocuidado combina com você?',
    emoji: '🌻',
    color: '#FFE8C7',
    intro: 'Autocuidado não é só banho de espuma. Vamos achar o tipo que faz sentido pra você.',
    pose: 'acenar',
    questions: [
      { q: 'Quando você quer se cuidar, pensa primeiro em…', a: [['Dormir bem e comer direito', 'corpo'], ['Organizar a cabeça', 'mente'], ['Ver pessoas queridas', 'social'], ['Fazer algo divertido', 'alegria']] },
      { q: 'Um domingo ideal tem…', a: [['Alongamento e comida gostosa', 'corpo'], ['Diário e chá', 'mente'], ['Almoço em família', 'social'], ['Filme, jogo ou música alta', 'alegria']] },
      { q: 'O que você mais deixa de lado?', a: [['Beber água e se mexer', 'corpo'], ['Pensar no que sente', 'mente'], ['Responder os amigos', 'social'], ['Brincar e se divertir', 'alegria']] },
      { q: 'Qual frase te descreve?', a: [['"Meu corpo é minha casa"', 'corpo'], ['"Preciso entender o que sinto"', 'mente'], ['"Ninguém é feliz sozinho"', 'social'], ['"A vida é curta pra ser séria"', 'alegria']] },
      { q: 'Um mimo para hoje seria…', a: [['Um banho demorado', 'corpo'], ['10 minutos de meditação', 'mente'], ['Uma ligação boa', 'social'], ['Dançar uma música', 'alegria']] },
    ],
    results: {
      corpo: { title: 'Autocuidado do corpo', text: 'Você se sente bem quando o corpo está bem: sono, água, comida e movimento são a sua base.', tip: 'Beba um copo de água agora e faça um alongamento de 2 minutos.' },
      mente: { title: 'Autocuidado da mente', text: 'Entender o que sente te dá paz. Escrever, meditar e organizar os pensamentos são seus melhores aliados.', tip: 'Escreva no Diário uma frase sobre como você está agora.' },
      social: { title: 'Autocuidado com gente', text: 'Para você, cuidar de si passa por estar perto de quem gosta. Isolamento te deixa murchinho.', tip: 'Chame um amigo para cuidar dos Lumbis juntos na Turma.' },
      alegria: { title: 'Autocuidado divertido', text: 'Brincar também é se cuidar! Você precisa de leveza e risada para equilibrar a rotina.', tip: 'Coloque sua música favorita e dance uma música inteira.' },
    },
  },
  {
    id: 'foco',
    title: 'O que te ajuda a focar?',
    emoji: '🎯',
    color: '#FFD9C7',
    intro: 'Cada cabeça foca de um jeito. Descubra o ambiente perfeito para a sua.',
    pose: 'estrela',
    questions: [
      { q: 'Para estudar ou trabalhar, você prefere…', a: [['Silêncio total', 'silencio'], ['Uma música de fundo', 'musica'], ['Um prazo chegando', 'prazo'], ['Alguém por perto fazendo o mesmo', 'companhia']] },
      { q: 'O que mais te distrai?', a: [['Barulho de conversa', 'silencio'], ['Silêncio demais', 'musica'], ['Ter tempo sobrando', 'prazo'], ['Ficar sozinho', 'companhia']] },
      { q: 'Uma tarefa difícil fica mais fácil quando…', a: [['Fecho a porta', 'silencio'], ['Coloco fone', 'musica'], ['Tenho uma data marcada', 'prazo'], ['Faço com outra pessoa', 'companhia']] },
      { q: 'Seu lugar favorito para render:', a: [['Biblioteca', 'silencio'], ['Café com som ambiente', 'musica'], ['Qualquer lugar na véspera', 'prazo'], ['Mesa com amigos', 'companhia']] },
      { q: 'Quando você termina algo difícil, sente…', a: [['Paz', 'silencio'], ['Ritmo', 'musica'], ['Alívio', 'prazo'], ['Vontade de comemorar com alguém', 'companhia']] },
    ],
    results: {
      silencio: { title: 'Você foca no silêncio', text: 'Ruídos tiram você do eixo. Um cantinho quieto e o celular longe fazem você render o dobro.', tip: 'Deixe o celular em outro cômodo por 25 minutos e veja a diferença.' },
      musica: { title: 'Você foca com trilha sonora', text: 'Um som de fundo organiza sua cabeça. Músicas sem letra costumam funcionar ainda melhor.', tip: 'Monte uma playlist "foco" com músicas calmas e sem letra.' },
      prazo: { title: 'Você foca com prazo', text: 'Uma data marcada liga o seu motor. O truque é criar pequenos prazos antes do prazo final.', tip: 'Divida sua próxima tarefa em partes com um horário para cada uma.' },
      companhia: { title: 'Você foca acompanhado', text: 'Ter alguém por perto te dá ritmo e responsabilidade. Estudar junto é a sua cara.', tip: 'Chame alguém para uma sessão de foco junto, mesmo por chamada de vídeo.' },
    },
  },
  {
    id: 'motivacao',
    title: 'O que te motiva de verdade?',
    emoji: '🚀',
    color: '#CFF0F0',
    intro: 'Saber o que te move ajuda a escolher metas que fazem sentido.',
    pose: 'comemora',
    questions: [
      { q: 'O que te faz levantar animado?', a: [['Uma meta pra bater', 'conquista'], ['Ver pessoas que gosto', 'conexao'], ['Aprender algo novo', 'aprender'], ['Ter o dia livre', 'liberdade']] },
      { q: 'Um elogio que você ama ouvir:', a: [['"Você conseguiu!"', 'conquista'], ['"Você é importante pra mim"', 'conexao'], ['"Como você sabe disso?"', 'aprender'], ['"Você é tão autêntico"', 'liberdade']] },
      { q: 'O que mais te desanima?', a: [['Não ver resultado', 'conquista'], ['Me sentir sozinho', 'conexao'], ['Rotina repetida', 'aprender'], ['Ser controlado', 'liberdade']] },
      { q: 'Um sonho seu tem mais a ver com…', a: [['Chegar lá', 'conquista'], ['Pessoas', 'conexao'], ['Descobrir coisas', 'aprender'], ['Fazer do meu jeito', 'liberdade']] },
      { q: 'Uma recompensa perfeita:', a: [['Uma medalha', 'conquista'], ['Uma festa com amigos', 'conexao'], ['Um curso', 'aprender'], ['Uma viagem sem roteiro', 'liberdade']] },
    ],
    results: {
      conquista: { title: 'Você é movido a conquistas', text: 'Ver progresso te dá energia. Metas pequenas e marcadas no calendário são suas melhores amigas.', tip: 'Coloque uma meta pequena para hoje e risque assim que terminar.' },
      conexao: { title: 'Você é movido a pessoas', text: 'Fazer junto e fazer por alguém dá sentido ao que você faz.', tip: 'Convide um amigo para uma missão da Turma com você.' },
      aprender: { title: 'Você é movido a curiosidade', text: 'Novidade te acende! A rotina pesa quando não tem nada novo nela.', tip: 'Aprenda uma coisinha nova hoje: uma palavra, uma receita, um fato curioso.' },
      liberdade: { title: 'Você é movido a liberdade', text: 'Você rende quando faz do seu jeito. Escolher como fazer é tão importante quanto o quê.', tip: 'Escolha a ordem das suas tarefas de hoje do jeito que você quiser.' },
    },
  },
  {
    id: 'sentimentos',
    title: 'Como você lida com o que sente?',
    emoji: '🫧',
    color: '#E3E8FF',
    intro: 'Sentir é normal. O jeito de lidar é que muda de pessoa pra pessoa.',
    pose: 'coracao',
    questions: [
      { q: 'Quando algo te chateia, você…', a: [['Guarda pra si', 'guarda'], ['Conta pra alguém', 'fala'], ['Escreve ou desenha', 'escreve'], ['Vai fazer algo pra gastar energia', 'movimento']] },
      { q: 'Chorar pra você é…', a: [['Difícil, quase nunca', 'guarda'], ['Normal, perto de quem confio', 'fala'], ['Algo que faço sozinho, com música', 'escreve'], ['Raro, prefiro me mexer', 'movimento']] },
      { q: 'Quando está feliz, você…', a: [['Curte em silêncio', 'guarda'], ['Conta pra todo mundo', 'fala'], ['Registra o momento', 'escreve'], ['Pula, dança, corre', 'movimento']] },
      { q: 'Uma emoção forte, pra você, parece…', a: [['Uma panela de pressão', 'guarda'], ['Algo que precisa de ouvido', 'fala'], ['Uma história pra contar', 'escreve'], ['Energia no corpo', 'movimento']] },
      { q: 'O que te acalma mais rápido?', a: [['Tempo sozinho', 'guarda'], ['Um abraço e uma conversa', 'fala'], ['Papel e caneta', 'escreve'], ['Respirar e andar', 'movimento']] },
    ],
    results: {
      guarda: { title: 'Você guarda pra dentro', text: 'Você é reservado com o que sente. Isso protege, mas guardar demais pesa. Pequenas saídas ajudam.', tip: 'Use o check-in de humor hoje: só escolher a carinha já é colocar pra fora um pouquinho.' },
      fala: { title: 'Você coloca pra fora falando', text: 'Conversar organiza seus sentimentos. Ter pessoas de confiança por perto é essencial pra você.', tip: 'Conte para alguém uma coisa boa e uma difícil do seu dia.' },
      escreve: { title: 'Você entende escrevendo', text: 'Escrever ou criar transforma o que você sente em algo que dá pra olhar com calma.', tip: 'Abra o Diário e escreva sem pensar muito por 3 minutos.' },
      movimento: { title: 'Você sente com o corpo', text: 'Emoções viram energia no seu corpo. Movimentar ajuda a soltar o que ficou preso.', tip: 'Faça a respiração 4-7-8 e depois uma caminhada curta.' },
    },
  },
  {
    id: 'amigo',
    title: 'Que tipo de amigo você é?',
    emoji: '🤝',
    color: '#FFE1F0',
    intro: 'Toda turma precisa de vários tipos de amigo. Qual é o seu papel?',
    pose: 'acenar',
    questions: [
      { q: 'Um amigo está triste. Você…', a: [['Dá um bom conselho', 'conselheiro'], ['Tenta fazer ele rir', 'animado'], ['Fica do lado, sem sair', 'leal'], ['Leva um docinho e um cobertor', 'cuidador']] },
      { q: 'Na turma, você é quem…', a: [['Todo mundo pede opinião', 'conselheiro'], ['Organiza os rolês', 'animado'], ['Guarda todos os segredos', 'leal'], ['Lembra dos aniversários', 'cuidador']] },
      { q: 'Uma mensagem típica sua:', a: [['"Já pensou por esse lado?"', 'conselheiro'], ['"Bora sair hoje?"', 'animado'], ['"Tô aqui pro que precisar"', 'leal'], ['"Comeu direitinho?"', 'cuidador']] },
      { q: 'Seus amigos te descrevem como…', a: [['Sábio', 'conselheiro'], ['Divertido', 'animado'], ['Confiável', 'leal'], ['Carinhoso', 'cuidador']] },
      { q: 'O que você mais valoriza numa amizade?', a: [['Sinceridade', 'conselheiro'], ['Diversão', 'animado'], ['Lealdade', 'leal'], ['Cuidado', 'cuidador']] },
    ],
    results: {
      conselheiro: { title: 'O conselheiro', text: 'Você ajuda os amigos a enxergar as coisas com clareza. Lembre que às vezes a pessoa só quer ser ouvida.', tip: 'Na próxima conversa, pergunte "você quer conselho ou só desabafar?".' },
      animado: { title: 'O animado', text: 'Você traz leveza e risada pra turma. Seus amigos ficam mais felizes perto de você.', tip: 'Chame alguém que anda sumido para um programinha leve.' },
      leal: { title: 'O leal', text: 'Você é porto seguro. Seus amigos sabem que podem contar com você em qualquer situação.', tip: 'Deixe alguém cuidar de você também: aceitar ajuda é uma forma de amizade.' },
      cuidador: { title: 'O cuidador', text: 'Você cuida de todo mundo nos detalhes. Só não esqueça de cuidar de você com o mesmo carinho.', tip: 'Faça por você hoje uma coisa que faria por um amigo querido.' },
    },
  },
  {
    id: 'lugar',
    title: 'Qual lugar é a sua paz?',
    emoji: '🏝️',
    color: '#D4F1FF',
    intro: 'Feche os olhos e imagine um lugar calmo. Vamos descobrir qual combina com você.',
    pose: 'curioso',
    questions: [
      { q: 'Um som que te acalma:', a: [['Ondas do mar', 'praia'], ['Vento nas árvores', 'montanha'], ['Chuva na janela', 'casa'], ['Movimento de um café', 'cidade']] },
      { q: 'Um cheiro gostoso:', a: [['Protetor solar e maresia', 'praia'], ['Terra molhada', 'montanha'], ['Bolo saindo do forno', 'casa'], ['Café fresquinho', 'cidade']] },
      { q: 'Uma cor que te acalma:', a: [['Azul-turquesa', 'praia'], ['Verde-musgo', 'montanha'], ['Bege e marrom', 'casa'], ['Amarelo das luzes à noite', 'cidade']] },
      { q: 'Um programa perfeito:', a: [['Ver o pôr do sol na areia', 'praia'], ['Trilha com cachoeira', 'montanha'], ['Filme com coberta', 'casa'], ['Passear numa feirinha', 'cidade']] },
      { q: 'Você se sente em paz quando…', a: [['Tem horizonte', 'praia'], ['Está longe de tudo', 'montanha'], ['Está aconchegado', 'casa'], ['Está cercado de vida', 'cidade']] },
    ],
    results: {
      praia: { title: 'A praia', text: 'Horizonte, sol e água acalmam você. Quando a cabeça aperta, você precisa de espaço e ar.', tip: 'Faça a meditação com sons de água no Bem-estar e imagine o mar.' },
      montanha: { title: 'A montanha', text: 'Natureza e silêncio são o seu refúgio. Um pouco de verde já muda o seu humor.', tip: 'Passe 10 minutos perto de plantas ou de uma janela com céu.' },
      casa: { title: 'O aconchego de casa', text: 'Seu lugar de paz é o seu cantinho. Coberta, chá e chuva lá fora: perfeito.', tip: 'Arrume um cantinho aconchegante pra você hoje (e decore a casa do seu Lumbi também!).' },
      cidade: { title: 'A cidade viva', text: 'Você se sente bem com movimento e gente ao redor. Silêncio demais te deixa inquieto.', tip: 'Saia para um café ou uma volta por um lugar movimentado e leve.' },
    },
  },
  {
    id: 'superpoder',
    title: 'Qual é o seu superpoder escondido?',
    emoji: '⭐',
    color: '#FFF1B8',
    intro: 'Todo mundo tem um. Às vezes a gente só não percebe. Vamos encontrar o seu.',
    pose: 'estrela',
    questions: [
      { q: 'Quando alguém chega triste, você…', a: [['Percebe na hora', 'empatia'], ['Ajuda a encarar o problema', 'coragem'], ['Inventa um jeito de alegrar', 'criatividade'], ['Escuta sem pressa', 'paciencia']] },
      { q: 'Num problema difícil, você…', a: [['Pensa em como os outros se sentem', 'empatia'], ['Vai pra cima', 'coragem'], ['Acha uma solução diferente', 'criatividade'], ['Espera o momento certo', 'paciencia']] },
      { q: 'O que te deixa orgulhoso de você?', a: [['Ter ajudado alguém', 'empatia'], ['Ter enfrentado um medo', 'coragem'], ['Ter criado algo', 'criatividade'], ['Ter mantido a calma', 'paciencia']] },
      { q: 'Se você fosse um bichinho, seria…', a: [['Um cachorro carinhoso', 'empatia'], ['Um leão', 'coragem'], ['Um polvo cheio de ideias', 'criatividade'], ['Uma tartaruga sábia', 'paciencia']] },
      { q: 'O mundo precisa de mais…', a: [['Gentileza', 'empatia'], ['Ousadia', 'coragem'], ['Imaginação', 'criatividade'], ['Calma', 'paciencia']] },
    ],
    results: {
      empatia: { title: 'Empatia', text: 'Você sente o que os outros sentem. É um poder lindo, só cuide para não carregar o peso de todo mundo.', tip: 'Faça uma gentileza para alguém hoje e outra para você.' },
      coragem: { title: 'Coragem', text: 'Você encara o que muita gente evita. Coragem não é não ter medo: é ir mesmo com ele.', tip: 'Faça hoje uma coisa pequena que você vem adiando.' },
      criatividade: { title: 'Criatividade', text: 'Você enxerga caminhos que ninguém viu. Suas ideias deixam o mundo mais colorido.', tip: 'Anote três ideias malucas no Diário, sem julgar nenhuma.' },
      paciencia: { title: 'Paciência', text: 'Você sabe esperar, ouvir e respeitar o tempo das coisas. Isso traz paz pra quem está perto.', tip: 'Seja paciente com você também: tudo bem ir devagar hoje.' },
    },
  },
  {
    id: 'bichinho',
    title: 'Que bichinho combina com você hoje?',
    emoji: '🐾',
    color: '#FFE6D5',
    intro: 'Um quiz bem levinho, só pra brincar. Como está o seu jeitinho hoje?',
    pose: 'late',
    questions: [
      { q: 'Hoje você acordou…', a: [['Animado e falante', 'cachorro'], ['Querendo ficar na sua', 'gato'], ['Meio sensível', 'coelho'], ['Com vontade de cantar', 'passarinho']] },
      { q: 'Um lanche agora seria…', a: [['Qualquer coisa, eu amo comer', 'cachorro'], ['Algo especial, sou exigente', 'gato'], ['Uma fruta fresquinha', 'coelho'], ['Um pãozinho com mel', 'passarinho']] },
      { q: 'Se alguém te chamar pra sair…', a: [['Já tô pronto!', 'cachorro'], ['Depende de quem for', 'gato'], ['Só se for um lugar calmo', 'coelho'], ['Bora, mas volto cedo', 'passarinho']] },
      { q: 'Seu lugar favorito hoje:', a: [['Onde tiver gente', 'cachorro'], ['Um sol na janela', 'gato'], ['Embaixo da coberta', 'coelho'], ['Ao ar livre', 'passarinho']] },
      { q: 'Uma palavra para hoje:', a: [['Alegria', 'cachorro'], ['Tranquilidade', 'gato'], ['Carinho', 'coelho'], ['Leveza', 'passarinho']] },
    ],
    results: {
      cachorro: { title: 'Cachorrinho feliz', text: 'Hoje você está cheio de energia e carinho pra dar, igualzinho ao seu Lumbi!', tip: 'Brinque com o seu Lumbi na área de Interações e espalhe essa alegria.' },
      gato: { title: 'Gatinho tranquilo', text: 'Hoje você quer seu espaço e seu tempo. E está tudo bem respeitar isso.', tip: 'Reserve um momento só seu, sem culpa.' },
      coelho: { title: 'Coelhinho sensível', text: 'Hoje você está mais delicado. Seja gentil consigo e escolha coisas leves.', tip: 'Faça o "Relaxar" do Bem-estar e vá com calma hoje.' },
      passarinho: { title: 'Passarinho livre', text: 'Hoje você quer leveza, ar livre e música. Seu dia pede movimento suave.', tip: 'Ouça uma música que você ama e dê uma voltinha.' },
    },
  },
];

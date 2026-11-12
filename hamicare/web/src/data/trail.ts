// Trilha "Hábito que fica": 21 passos curtos, um por dia, para transformar uma missão em hábito.
// Os 3 primeiros são grátis; o resto é do HamiCare+. Conteúdo educativo, sem promessa de saúde.
export interface TrailStep {
  title: string;
  /** O que aprender hoje (2 ou 3 frases). */
  learn: string;
  /** A ação bem pequena do dia. */
  doIt: string;
}

export const TRAIL_FREE = 3;

export const TRAIL: TrailStep[] = [
  { title: 'Comece ridiculamente pequeno', learn: 'Hábito novo pega quando é tão fácil que dá vergonha não fazer. Dois minutos valem mais do que uma hora que nunca acontece.', doIt: 'Escolha uma missão e faça só a versão de 2 minutos dela hoje.' },
  { title: 'Cole no que você já faz', learn: 'O cérebro aprende rápido quando o hábito novo vem logo depois de um antigo. "Depois de escovar os dentes, eu bebo um copo d’água."', doIt: 'Escreva uma frase: "Depois de ___, eu vou ___".' },
  { title: 'Deixe à vista', learn: 'O que a gente vê, a gente lembra. Garrafa na mesa, tênis perto da porta, livro no travesseiro.', doIt: 'Coloque um objeto do seu hábito num lugar que você vai ver amanhã cedo.' },
  { title: 'Não quebre a corrente duas vezes', learn: 'Errar um dia é normal. O que derruba o hábito é deixar o erro virar dois dias. Por isso existe o martelinho.', doIt: 'Combine com você: se falhar um dia, amanhã faço a versão mínima.' },
  { title: 'Comemore na hora', learn: 'Uma comemoração logo depois do hábito ensina o cérebro que aquilo foi bom. Pode ser um "isso!" baixinho.', doIt: 'Hoje, ao terminar uma missão, comemore de verdade por 3 segundos.' },
  { title: 'Torne fácil, não forte', learn: 'Força de vontade acaba no fim do dia. Ambiente arrumado não acaba. Tire os obstáculos do caminho.', doIt: 'Remova uma coisa que atrapalha seu hábito (deixe a roupa da caminhada separada, por exemplo).' },
  { title: 'Uma semana de você', learn: 'Sete dias seguindo a trilha já mudam a forma como você se vê. Você está virando a pessoa que cuida de si.', doIt: 'Olhe sua sequência e diga uma coisa que ficou mais fácil esta semana.' },
  { title: 'Identidade antes de meta', learn: '"Quero beber água" é meta. "Sou alguém que se hidrata" é identidade. Hábitos duram mais quando contam quem você é.', doIt: 'Complete a frase: "Eu sou uma pessoa que ___".' },
  { title: 'Dia ruim também conta', learn: 'Nos dias difíceis, a vitória é aparecer. Fazer pouco num dia ruim vale ouro para o hábito.', doIt: 'Escolha agora qual vai ser sua missão de "dia ruim": a menor de todas.' },
  { title: 'Junte forças', learn: 'Quem tem companhia desiste menos. Um amigo na turma faz a missão contar mais.', doIt: 'Mande seu código para alguém ou convide para a turma.' },
  { title: 'Hora certa', learn: 'Hábito gosta de horário. Fazer sempre perto do mesmo momento do dia deixa tudo automático.', doIt: 'Escolha a hora do lembrete da sua missão principal.' },
  { title: 'Menos é mais', learn: 'Muitos hábitos ao mesmo tempo cansam. Melhor três que ficam do que dez que somem.', doIt: 'Se sua lista está grande, deixe de lado uma missão por enquanto.' },
  { title: 'Perceba a diferença', learn: 'Notar como você se sente depois do hábito reforça a vontade de repetir.', doIt: 'Depois de uma missão hoje, marque no check-in como você está.' },
  { title: 'Duas semanas', learn: 'Metade da trilha. O que antes exigia esforço agora começa a vir sozinho em alguns dias.', doIt: 'Escreva no diário: qual hábito já parece natural?' },
  { title: 'Plano para os imprevistos', learn: 'Viagem, visita, cansaço: tudo bem. Ter um plano B mantém o hábito vivo.', doIt: 'Complete: "Se eu não conseguir ___, eu faço ___".' },
  { title: 'Gentileza com você', learn: 'Se cobrar demais faz desistir. Falar com você como falaria com um amigo faz continuar.', doIt: 'Diga para si uma frase gentil hoje (pode escrever no pote de gratidão).' },
  { title: 'Aumente um pouquinho', learn: 'Quando a versão mínima fica fácil, suba um degrau pequeno: 2 minutos viram 5.', doIt: 'Escolha um hábito e faça a versão um pouco maior hoje.' },
  { title: 'Seu ambiente fala', learn: 'Pessoas, lugares e o celular empurram você para algum lado. Deixe o empurrão a seu favor.', doIt: 'Mude uma coisa no seu espaço que lembre você de se cuidar.' },
  { title: 'Olhe para trás', learn: 'Ver o caminho feito dá energia para seguir. Compare com o primeiro dia da trilha.', doIt: 'Abra a Evolução e veja quantos dias ativos você já tem.' },
  { title: 'Ensine alguém', learn: 'Explicar o que aprendeu deixa o aprendizado mais firme.', doIt: 'Conte para alguém uma dica desta trilha.' },
  { title: 'Hábito que fica', learn: 'Você chegou ao fim. O hábito agora é seu: não precisa ser perfeito, só precisa continuar voltando.', doIt: 'Escolha o próximo hábito que você quer cultivar com o Hami.' },
];

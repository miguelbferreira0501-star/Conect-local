// Lugares do Brasil para onde o xodó vai passear. Cada passeio vira um cartão-postal.
export interface Place {
  id: string;
  name: string;
  uf: string;
  emoji: string;
  colors: [string, string];
  story: string;
  souvenir?: string;
}

export const PLACES: Place[] = [
  { id: 'lencois', name: 'Lençóis Maranhenses', uf: 'MA', emoji: '🏜️', colors: ['#F7E3B5', '#7CC6D9'], story: 'Pulei de duna em duna e nadei numa lagoa azulzinha. A água era de chuva, sabia?' },
  { id: 'chapada', name: 'Chapada Diamantina', uf: 'BA', emoji: '⛰️', colors: ['#F2B880', '#8C6BB1'], story: 'Subi o Morro do Pai Inácio. Lá de cima tudo parece pequenininho, até as preocupações.' },
  { id: 'iguacu', name: 'Cataratas do Iguaçu', uf: 'PR', emoji: '💦', colors: ['#9ED8C3', '#3E8EBD'], story: 'Tanta água junta! Fiquei molhadinho e vi um arco-íris no meio da névoa.' },
  { id: 'pantanal', name: 'Pantanal', uf: 'MS', emoji: '🐊', colors: ['#C9DE8A', '#4E9A6B'], story: 'Vi um tuiuiú e fiquei um tempão só olhando. Ele não tinha pressa nenhuma.' },
  { id: 'noronha', name: 'Fernando de Noronha', uf: 'PE', emoji: '🐢', colors: ['#8EE3E0', '#2F7FB8'], story: 'Nadei do lado de uma tartaruga. Ela respira bem devagar, igual a gente treina.', souvenir: 'concha' },
  { id: 'serra', name: 'Serra Gaúcha', uf: 'RS', emoji: '🍇', colors: ['#D9C2E8', '#6B5A9E'], story: 'Fiquei olhando a neblina descer na serra, quentinho, enrolado num cobertor.', souvenir: 'cuia' },
  { id: 'amazonia', name: 'Encontro das Águas', uf: 'AM', emoji: '🌳', colors: ['#B5DDA4', '#3F6B4E'], story: 'Vi um rio escuro e um rio claro correndo lado a lado sem se misturar. Cada um no seu tempo.', souvenir: 'folha' },
  { id: 'pelourinho', name: 'Pelourinho', uf: 'BA', emoji: '🥁', colors: ['#FFD07A', '#E0607E'], story: 'As casinhas coloridas e o som dos tambores me deram vontade de dançar.' },
  { id: 'pao', name: 'Pão de Açúcar', uf: 'RJ', emoji: '🚡', colors: ['#FFC3A0', '#4A90C2'], story: 'Subi no bondinho e vi o mar inteirinho. Dei tchau pra você lá de cima!' },
  { id: 'jalapao', name: 'Jalapão', uf: 'TO', emoji: '🏞️', colors: ['#F6D28B', '#D07A3E'], story: 'Boiei num fervedouro: a água empurra a gente pra cima. Não dá pra afundar!', souvenir: 'capim' },
  { id: 'bonito', name: 'Bonito', uf: 'MS', emoji: '🐠', colors: ['#A8E6CF', '#1F8A9E'], story: 'A água é tão transparente que parecia que os peixes estavam voando.' },
  { id: 'joinville', name: 'Joinville', uf: 'SC', emoji: '🌸', colors: ['#FFD1DC', '#7FB77E'], story: 'Passeei entre as flores e vi gente dançando na rua. A cidade estava em festa.' },
  { id: 'ouropreto', name: 'Ouro Preto', uf: 'MG', emoji: '⛪', colors: ['#F3D9A4', '#8A6A4F'], story: 'Comi pão de queijo quentinho subindo as ladeiras de pedra. Que delícia.' },
  { id: 'jeri', name: 'Jericoacoara', uf: 'CE', emoji: '🌅', colors: ['#FFC48C', '#E8606D'], story: 'Aplaudi o pôr do sol na duna junto com um monte de gente. Lembrei de você.' },
];

export const placeById = (id: string) => PLACES.find((p) => p.id === id);

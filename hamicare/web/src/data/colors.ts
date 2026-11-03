// Cores do bichinho, com nomes de frutas e coisas do Brasil.
// São cores de ilustração: funcionam no tema claro e no escuro.
export type PetColor = 'pitanga' | 'maracuja' | 'acai' | 'mate' | 'ceu';

export interface PetPalette {
  label: string;
  body: string;
  shade: string;
  cheek: string;
  leaf: string;
}

export const PET_COLORS: Record<PetColor, PetPalette> = {
  pitanga: { label: 'Pitanga', body: '#FF9A85', shade: '#EC7563', cheek: '#FF5E7E', leaf: '#4FA36B' },
  maracuja: { label: 'Maracujá', body: '#FFD660', shade: '#EDB43B', cheek: '#FF8A7A', leaf: '#4FA36B' },
  acai: { label: 'Açaí', body: '#B39AE6', shade: '#8F72CC', cheek: '#FF8FB4', leaf: '#4FA36B' },
  mate: { label: 'Erva-mate', body: '#93D6A9', shade: '#6DB98A', cheek: '#FF9AA8', leaf: '#2F8A55' },
  ceu: { label: 'Céu', body: '#93CCF5', shade: '#69ABDF', cheek: '#FF9AB0', leaf: '#4FA36B' },
};

export const COLOR_ORDER: PetColor[] = ['maracuja', 'pitanga', 'acai', 'mate', 'ceu'];

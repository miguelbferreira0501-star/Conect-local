// Acabamento de cada parede: lambri (meia-parede), rodapé, moldura do teto e a cortina da janela.
export interface WallTrim {
  /** Cor do lambri (meia-parede de baixo). null = parede inteira com o papel. */
  wainscot: string | null;
  /** Rodapé e friso. */
  trim: string;
  curtain: string;
  curtain2: string;
  /** Janela: clássica (retangular), arco (redonda em cima) ou vigia (redonda). */
  window: 'classica' | 'arco' | 'vigia';
}

const W = (wainscot: string | null, trim: string, curtain: string, curtain2: string, window: WallTrim['window'] = 'classica'): WallTrim => ({ wainscot, trim, curtain, curtain2, window });

export const WALL_TRIM: Record<string, WallTrim> = {
  'p-creme': W('#FFFFFF', '#E9C7A6', '#FF9FC2', '#FFD6E4'),
  'p-listras': W('#FFFFFF', '#F4B6C8', '#FF86AC', '#FFE3EA', 'arco'),
  'p-bolinhas': W('#FFFFFF', '#9ED7BA', '#6FD8C0', '#E9FAF1'),
  'p-ceu': W(null, '#9CCBEB', '#FFFFFF', '#DDF0FF', 'arco'),
  'p-folhas': W('#F2FAF2', '#8FC9A0', '#7CC39A', '#E6F7E9'),
  'p-lavanda': W('#FFFFFF', '#C9B5F0', '#B399F0', '#EFE6FF', 'arco'),
  'p-cinza': W('#FFFFFF', '#C3C8D2', '#7FB8F0', '#E6F1FB'),
  'p-estrelas': W('#3A3F7A', '#5A5FA6', '#FFD34D', '#FFF0B3', 'vigia'),
  'p-xadrez': W('#FFFFFF', '#F4A9BC', '#FF6F91', '#FFE3EA'),
  'p-coracoes': W('#FFFFFF', '#F4A9BC', '#FF86AC', '#FFF0F4', 'arco'),
  'p-arco-iris': W('#FFFFFF', '#E9C7A6', '#A57CF0', '#FFE7C7', 'arco'),
  'p-tijolo': W(null, '#A8644A', '#F2C14E', '#FFF1C2'),
  'p-madeira': W(null, '#8E5E3C', '#E2547A', '#FFD6E0'),
  'p-praia': W(null, '#E8C98E', '#FFFFFF', '#BFE3FF', 'vigia'),
  'p-girassois': W('#FFFFFF', '#E8C35A', '#FFD34D', '#FFF7D6'),
  'p-galaxia': W('#2C2660', '#5A4FA6', '#B399F0', '#E6D2FF', 'vigia'),
  // Arenas
  'p-jardim': W('#FFFFFF', '#9ED08A', '#FF9FC2', '#FFF0F5', 'arco'),
  'p-vila': W('#B98251', '#8E5E3C', '#F0525F', '#FFF1D6'),
  'p-floresta': W('#8E5E3C', '#6A4229', '#7CC39A', '#E6F7E9', 'arco'),
  'p-tropical': W('#FFFFFF', '#E8C98E', '#FF8FB1', '#FFF0C2'),
  'p-chale': W(null, '#5E3A22', '#D7263D', '#F7E3C8'),
  'p-cidade': W('#2E3654', '#5A6390', '#FF6FD8', '#FFE3F7'),
  'p-mar': W('#2F7FB8', '#1F5E8C', '#FFFFFF', '#BFE9F5', 'vigia'),
  'p-sonhos': W('#FFFFFF', '#E8B3E0', '#FFB3D9', '#FFF0FA', 'arco'),
  'p-castelo': W('#B9AFD0', '#8E83AE', '#B3263D', '#F6C445', 'arco'),
  'p-espaco': W('#2A2F66', '#5A5FA6', '#A57CF0', '#E6D2FF', 'vigia'),
  'p-celeste': W('#FFFFFF', '#F2C94C', '#FFF3C9', '#FFFFFF', 'arco'),
};

export const trimOf = (wallpaper: string) => WALL_TRIM[wallpaper] ?? WALL_TRIM['p-creme'];

/** Altura da parede (o resto é chão), em % da altura do cômodo. */
export const WALL_H = 60;

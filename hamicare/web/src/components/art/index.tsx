// Ilustrações próprias do HamiCare no lugar dos emojis.
// Os dados continuam usando o emoji como chave (ex.: '🪥'); a tela desenha a ilustração.
import type { CSSProperties } from 'react';
import type { Draw } from './kit';
import { HABITS } from './habits';
import { HOME } from './home';
import { FOOD } from './food';
import { WORLD } from './world';

const norm = (e: string) => e.replace(/️/g, '');

export const ART: Record<string, Draw> = {};
for (const set of [HABITS, HOME, FOOD, WORLD]) for (const [k, v] of Object.entries(set)) ART[norm(k)] = v;

export const hasArt = (e?: string | null) => !!e && !!ART[norm(e)];

interface GlyphProps {
  e?: string | null;
  /** Tamanho em px (ou "fill" para ocupar a largura do pai, como os móveis da casa). */
  size?: number | 'fill';
  className?: string;
  style?: CSSProperties;
  label?: string;
}

/** Desenha a ilustração do emoji; se ainda não houver desenho, mostra o próprio emoji. */
export function Glyph({ e, size = 32, className = '', style, label }: GlyphProps) {
  if (!e) return null;
  const draw = ART[norm(e)];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  if (!draw) {
    return (
      <span className={`glyph-emoji ${className}`} style={{ fontSize: size === 'fill' ? undefined : size * 0.84, lineHeight: 1, ...style }} {...a11y}>
        {e}
      </span>
    );
  }
  const dim = size === 'fill' ? { width: '100%' } : { width: size, height: size };
  return (
    <svg viewBox="0 0 64 64" {...dim} className={`glyph ${className}`} style={{ display: 'inline-block', flexShrink: 0, overflow: 'visible', ...style }} focusable="false" {...a11y}>
      {draw()}
    </svg>
  );
}

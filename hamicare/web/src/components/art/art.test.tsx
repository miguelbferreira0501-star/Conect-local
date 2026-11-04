import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ART, Glyph, hasArt } from './index';
import { ITEMS, LOOKS } from '../../data/items';
import { LIBRARY, TASK_EMOJIS, CATEGORIES } from '../../data/tasks';
import { FOOD_PRESETS, MEALS } from '../../data/foods';
import { PLACES } from '../../data/world';
import { GOALS, INCENTIVES, JOURNEY_TEXT, LIKES, MOODS, TRAITS } from '../../data/lines';
import { SLEEP_ROUTINE } from '../../data/wellbeing';
import { ACHIEVEMENTS } from '../../logic/progress';
import { REACTIONS } from '../../shared/moderation';
import { SEASONS } from '../Season';

describe('ilustrações no lugar dos emojis', () => {
  it('todo emoji que o app mostra tem desenho próprio', () => {
    const used = [
      ...ITEMS.filter((i) => i.emoji).map((i) => i.emoji!),
      ...LOOKS.map((l) => l.emoji),
      ...LIBRARY.map((t) => t.emoji),
      ...TASK_EMOJIS,
      ...Object.values(CATEGORIES).map((c) => c.emoji),
      ...FOOD_PRESETS.map((f) => f.emoji),
      ...MEALS.map((m) => m.emoji),
      ...PLACES.flatMap((p) => [p.emoji, ...p.finds.map((f) => f.emoji)]),
      ...Object.values(GOALS).map((g) => g.emoji),
      ...Object.values(INCENTIVES).map((g) => g.emoji),
      ...Object.values(JOURNEY_TEXT).map((g) => g.emoji),
      ...Object.values(TRAITS).map((g) => g.emoji),
      ...LIKES.map((l) => l.emoji),
      ...MOODS.map((m) => m.emoji),
      ...SLEEP_ROUTINE.map((r) => r.emoji),
      ...ACHIEVEMENTS.map((a) => a.emoji),
      ...REACTIONS.map((r) => r.emoji),
      ...SEASONS.map((s) => s.emoji),
    ];
    const missing = [...new Set(used)].filter((e) => !hasArt(e));
    expect(missing).toEqual([]);
  });

  it('cada desenho vira um SVG sem erro e sem emoji dentro', () => {
    for (const k of Object.keys(ART)) {
      const html = renderToStaticMarkup(<Glyph e={k} size={40} />);
      expect(html.startsWith('<svg'), k).toBe(true);
      expect(html.includes('NaN'), k).toBe(false);
      expect(/[\u{1F300}-\u{1FAFF}]/u.test(html.replace(/aria-label="[^"]*"/g, '')), k).toBe(false);
    }
  });

  it('sem desenho, mostra o próprio emoji (nunca some)', () => {
    expect(renderToStaticMarkup(<Glyph e="🦕" size={20} />)).toContain('🦕');
  });
});

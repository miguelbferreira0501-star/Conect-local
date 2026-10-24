import type { CategoryDTO } from '@conecta/shared';
import { query } from '../db/pool';

export const categoriesRepo = {
  list: () =>
    query<CategoryDTO & { keywords: string[] }>(
      `SELECT id, slug, name, short_name AS "shortName", icon, description, keywords
       FROM categories WHERE active ORDER BY sort_order, name`,
    ),
};

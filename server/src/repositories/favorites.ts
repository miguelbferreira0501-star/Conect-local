import { query, type Db } from '../db/pool';

export const favoritesRepo = {
  ids: async (db: Db) => (await query<{ business_id: string }>(`SELECT business_id FROM favorites`, [], db)).map((r) => r.business_id),
  isFavorite: async (db: Db, businessId: string) =>
    (await query(`SELECT 1 FROM favorites WHERE business_id = $1`, [businessId], db)).length > 0,
  add: (db: Db, businessId: string) =>
    query(`INSERT INTO favorites (user_id, business_id) VALUES (app.current_user_id(), $1) ON CONFLICT DO NOTHING`, [businessId], db),
  remove: (db: Db, businessId: string) => query(`DELETE FROM favorites WHERE business_id = $1`, [businessId], db),
};

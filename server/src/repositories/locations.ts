import type { CityDTO, StateDTO } from '@conecta/shared';
import { query, type Db } from '../db/pool';

const cityCols = `ibge, name, uf, lat, lon, timezone`;

export const locationsRepo = {
  states: () => query<StateDTO>(`SELECT uf, name, region FROM states ORDER BY name`),

  citiesByUf: (uf: string) =>
    query<{ ibge: number; name: string }>(`SELECT ibge, name FROM cities WHERE uf = $1 ORDER BY name`, [uf.toUpperCase()]),

  city: async (ibge: number, db?: Db) =>
    (await query<CityDTO>(`SELECT ${cityCols} FROM cities WHERE ibge = $1`, [ibge], db))[0] ?? null,

  /** Município mais próximo de uma coordenada (sem serviço externo de geocodificação). */
  nearest: async (lat: number, lon: number) =>
    (
      await query<CityDTO & { distance_km: number }>(
        `SELECT ${cityCols},
           6371 * 2 * asin(sqrt(power(sin(radians(lat - $1) / 2), 2) + cos(radians($1)) * cos(radians(lat)) * power(sin(radians(lon - $2) / 2), 2))) AS distance_km
         FROM cities
         ORDER BY distance_km LIMIT 1`,
        [lat, lon],
      )
    )[0] ?? null,

  /** Cidades próximas que já têm empresas ativas (para sugerir quando a busca não encontra nada). */
  nearbyWithBusinesses: (city: CityDTO, limit = 5) =>
    query<{ ibge: number; name: string; uf: string; distanceKm: number; businesses: number }>(
      `SELECT c.ibge, c.name, c.uf, count(b.id)::int AS businesses,
         round((6371 * 2 * asin(sqrt(power(sin(radians(c.lat - $2) / 2), 2) + cos(radians($2)) * cos(radians(c.lat)) * power(sin(radians(c.lon - $3) / 2), 2))))::numeric, 0)::int AS "distanceKm"
       FROM cities c JOIN businesses b ON b.city_ibge = c.ibge AND b.status = 'active'
       WHERE c.ibge <> $1
       GROUP BY c.ibge
       ORDER BY "distanceKm" LIMIT $4`,
      [city.ibge, city.lat, city.lon, limit],
    ),
};

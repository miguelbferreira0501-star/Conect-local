/**
 * Importa estados e os 5.571 municípios brasileiros (códigos IBGE, coordenadas
 * e fuso horário) a partir de server/data/*.csv.
 * Fonte: https://github.com/kelvins/municipios-brasileiros (dados do IBGE).
 * Os dados ficam no banco: o app não depende de uma API externa a cada acesso.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../../data');

function parseCsv(file: string): Record<string, string>[] {
  const [header, ...lines] = readFileSync(join(dataDir, file), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const cols = header.split(',');
  return lines.map((line) => {
    const values = line.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, values[i]]));
  });
}

export async function loadLocations(client: pg.Client) {
  const states = parseCsv('estados.csv');
  const codeToUf = new Map(states.map((s) => [s.codigo_uf, s.uf]));
  await client.query('BEGIN');
  try {
    for (const s of states) {
      await client.query(
        `INSERT INTO states (code, uf, name, region) VALUES ($1,$2,$3,$4)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region`,
        [Number(s.codigo_uf), s.uf, s.nome, s.regiao],
      );
    }
    const cities = parseCsv('municipios.csv');
    const chunk = 500;
    for (let i = 0; i < cities.length; i += chunk) {
      const rows = cities.slice(i, i + chunk);
      const params: unknown[] = [];
      const values = rows.map((c, j) => {
        params.push(Number(c.codigo_ibge), c.nome, codeToUf.get(c.codigo_uf), Number(c.latitude), Number(c.longitude), c.capital === '1', Number(c.ddd) || null, c.fuso_horario || 'America/Sao_Paulo');
        const b = j * 8;
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`;
      });
      await client.query(
        `INSERT INTO cities (ibge, name, uf, lat, lon, capital, ddd, timezone) VALUES ${values.join(',')}
         ON CONFLICT (ibge) DO UPDATE SET name = EXCLUDED.name, lat = EXCLUDED.lat, lon = EXCLUDED.lon, timezone = EXCLUDED.timezone`,
        params,
      );
    }
    await client.query('COMMIT');
    console.log(`✔ localidades: ${states.length} UFs e ${cities.length} municípios`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

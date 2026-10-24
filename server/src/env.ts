import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  /** Conexão usada pela aplicação: papel SEM privilégios de dono (RLS aplicada). */
  DATABASE_URL: z.string().url().default('postgres://conecta_app:conecta_app@localhost:5432/conecta'),
  /** Conexão do dono do esquema: usada só para migrações e seed. */
  DATABASE_OWNER_URL: z.string().url().default('postgres://conecta:conecta@localhost:5432/conecta'),
  DB_APP_ROLE: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('conecta_app'),
  /** Modo demonstração: dados de exemplo identificados na interface. */
  DEMO_MODE: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  /** Origens permitidas para requisições que alteram dados (separadas por vírgula). */
  APP_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3001'),
  /** Pasta com o front-end compilado (servido em produção pelo mesmo processo). */
  WEB_DIST: z.string().default('../web/dist'),
  SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;

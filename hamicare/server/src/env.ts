import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  /** Conexão da API: papel SEM privilégios de dono (RLS aplicada). */
  DATABASE_URL: z.string().url().default('postgres://hamicare_app:hamicare_app@localhost:5432/hamicare'),
  /** Conexão do dono do esquema: só migrações. */
  DATABASE_OWNER_URL: z.string().url().default('postgres://hamicare:hamicare@localhost:5432/hamicare'),
  DB_APP_ROLE: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('hamicare_app'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  APP_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3002'),
  SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(60),
  ADMIN_EMAILS: z.string().optional(),
  WEB_DIST: z.string().default('../web/dist'),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:contato@hamicare.app'),
});

export const env = schema.parse(process.env);

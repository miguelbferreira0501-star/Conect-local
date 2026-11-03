import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  /** Conexão da API: papel SEM privilégios de dono (RLS aplicada). */
  DATABASE_URL: z.string().url().optional(),
  /** Senha do papel da API: com ela, o deploy cria o papel e monta DATABASE_URL a partir da URL do dono. */
  DB_APP_PASSWORD: z.string().min(12).optional(),
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

const parsed = schema.parse(process.env);

function appUrl(): string {
  if (parsed.DATABASE_URL) return parsed.DATABASE_URL;
  if (parsed.DB_APP_PASSWORD) {
    const u = new URL(parsed.DATABASE_OWNER_URL);
    u.username = parsed.DB_APP_ROLE;
    u.password = parsed.DB_APP_PASSWORD;
    return u.toString();
  }
  return 'postgres://hamicare_app:hamicare_app@localhost:5432/hamicare';
}

export const env = { ...parsed, DATABASE_URL: appUrl() };

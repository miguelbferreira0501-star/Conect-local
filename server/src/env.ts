import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  /** Conexão usada pela aplicação: papel SEM privilégios de dono (RLS aplicada). */
  /** Opcional: se ausente e DB_APP_PASSWORD existir, é montada a partir de DATABASE_OWNER_URL. */
  DATABASE_URL: z.string().url().optional(),
  /** Conexão do dono do esquema: usada só para migrações e seed. */
  DATABASE_OWNER_URL: z.string().url().default('postgres://conecta:conecta@localhost:5432/conecta'),
  DB_APP_ROLE: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('conecta_app'),
  /** Senha do papel da aplicação. Usada para criá-lo automaticamente (db:deploy) e montar DATABASE_URL. */
  DB_APP_PASSWORD: z.string().min(12).optional(),
  /** Modo demonstração: dados de exemplo identificados na interface. */
  DEMO_MODE: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  /** Origens permitidas para requisições que alteram dados (separadas por vírgula). */
  APP_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3001'),
  /** Pasta com o front-end compilado (servido em produção pelo mesmo processo). */
  WEB_DIST: z.string().default('../web/dist'),
  /** App Android (Play Store): nome do pacote e impressões SHA-256 do certificado (separadas por vírgula). */
  ANDROID_PACKAGE_NAME: z.string().regex(/^[a-zA-Z][\w.]*$/).optional(),
  ANDROID_CERT_SHA256: z.string().optional(),
  SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
});

// Variáveis vazias (ex.: deixadas em branco no painel da hospedagem) contam como não definidas.
const rawEnv = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v.trim() !== ''));
const parsed = envSchema.parse(rawEnv);

function appDatabaseUrl(): string {
  if (parsed.DATABASE_URL) return parsed.DATABASE_URL;
  if (parsed.DB_APP_PASSWORD) {
    const u = new URL(parsed.DATABASE_OWNER_URL);
    u.username = parsed.DB_APP_ROLE;
    u.password = parsed.DB_APP_PASSWORD;
    return u.toString();
  }
  return 'postgres://conecta_app:conecta_app@localhost:5432/conecta';
}

export const env = { ...parsed, DATABASE_URL: appDatabaseUrl() };
export type Env = typeof env;

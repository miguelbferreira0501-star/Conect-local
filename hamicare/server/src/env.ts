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
  /**
   * E-mails (troca de senha). Dois jeitos:
   * - Resend (com domínio próprio): RESEND_API_KEY.
   * - Brevo (sem domínio, funciona no plano grátis do Render): BREVO_API_KEY + MAIL_FROM com o e-mail verificado no Brevo.
   * - SMTP, ex.: Gmail com "senha de app" (sem domínio; o plano grátis do Render bloqueia SMTP): SMTP_USER e SMTP_PASS.
   * Sem nenhum, nada sai: em teste e no computador, o e-mail aparece no terminal.
   */
  RESEND_API_KEY: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(465),
  SMTP_USER: z.string().optional(),
  /** A senha de app do Gmail vem em blocos com espaços ("abcd efgh ..."): os espaços são tirados. */
  SMTP_PASS: z.string().optional().transform((v) => v?.replace(/\s+/g, '')),
  /** Remetente. Em branco: "HamiCare <SMTP_USER>" ou o endereço padrão. */
  MAIL_FROM: z.string().optional(),
  /** Endereço público do app, usado nos links dos e-mails. No Render, vem sozinho de RENDER_EXTERNAL_URL. */
  APP_URL: z.string().url().optional(),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
  /**
   * App Android na Google Play (Trusted Web Activity): o nome do pacote (ex.: com.hamicare.app) e as
   * impressões digitais SHA-256 das chaves que assinam o app (a do Play App Signing e a de envio),
   * separadas por vírgula. Com elas, o app abre em tela cheia, sem a barra do navegador.
   */
  ANDROID_PACKAGE_NAME: z.string().regex(/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/).optional(),
  ANDROID_CERT_SHA256: z.string().optional(),
  /**
   * Guardiões do Hami (dar HamiCare+ para quem não pode pagar): pagamento pelo Mercado Pago (Pix e cartão).
   * MP_ACCESS_TOKEN: "Access token" de produção da sua aplicação no Mercado Pago (Suas integrações → Credenciais).
   * MP_WEBHOOK_SECRET: "Assinatura secreta" das notificações (Webhooks), para conferir que o aviso veio do Mercado Pago.
   * Sem token, o botão de ser Guardião fica "em breve". GUARDIAN_TEST_PAY=true liga um pagamento de mentira
   * (só fora de produção) para testar a fila e o mural.
   */
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  GUARDIAN_TEST_PAY: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});

// Campo deixado em branco no painel da hospedagem conta como "não informado".
const parsed = schema.parse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '')));

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

/** Nunca vem do cabeçalho da requisição: um Host falso não pode desviar o link de troca de senha. */
function publicUrl(): string {
  const url = parsed.APP_URL ?? parsed.RENDER_EXTERNAL_URL ?? parsed.APP_ORIGINS.split(',')[0]?.trim() ?? 'http://localhost:5173';
  return url.replace(/\/+$/, '');
}

const mailFrom = parsed.MAIL_FROM ?? (parsed.SMTP_USER && !parsed.RESEND_API_KEY && !parsed.BREVO_API_KEY ? `HamiCare <${parsed.SMTP_USER}>` : 'HamiCare <nao-responda@hamicare.app>');

export const env = { ...parsed, DATABASE_URL: appUrl(), APP_URL: publicUrl(), MAIL_FROM: mailFrom };

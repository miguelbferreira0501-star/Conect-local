import type { Context } from 'hono';

export type AppEnv = { Variables: { userId: string | null } };
export type Ctx = Context<AppEnv>;

export function clientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'local';
}

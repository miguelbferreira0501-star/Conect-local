// Área administrativa protegida: só quem tem papel de admin (conferido no banco).
import { Hono } from 'hono';
import { z } from 'zod';
import type pg from 'pg';
import { withUser } from '../db';
import { forbidden, invalid, notFound } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import { gameConfig, resetGameConfigCache } from './game';
import { DEFAULT_GAME, chestPool, validateGameConfig, type GameConfig } from '../../../web/src/shared/game';
import { itemById } from '../../../web/src/data/items';

export const admin = new Hono<AppEnv>();
admin.use('*', requireAuth);

async function asAdmin<T>(c: { get: (k: 'userId') => string | null }, fn: (db: pg.PoolClient) => Promise<T>): Promise<T> {
  return withUser(c.get('userId'), async (db) => {
    if (!(await db.query('SELECT app.is_admin() AS ok')).rows[0].ok) throw forbidden();
    return fn(db);
  });
}

admin.get('/stats', (c) => asAdmin(c, async (db) => c.json({ stats: (await db.query('SELECT app.admin_stats() AS s')).rows[0].s })));

admin.get('/users', (c) =>
  asAdmin(c, async (db) => {
    const q = `%${(c.req.query('q') ?? '').trim().toLowerCase()}%`;
    const users = (
      await db.query(
        `SELECT id, email, name, age_group AS "ageGroup", role, premium_until AS "premiumUntil", banned_at IS NOT NULL AS banned,
           to_char(created_at, 'YYYY-MM-DD') AS "createdAt", to_char(last_seen_at, 'YYYY-MM-DD') AS "lastSeen"
         FROM users WHERE lower(email) LIKE $1 OR lower(name) LIKE $1 ORDER BY created_at DESC LIMIT 50`,
        [q],
      )
    ).rows;
    return c.json({ users });
  }),
);

admin.post('/users/:id/premium', (c) =>
  asAdmin(c, async (db) => {
    const body = z.object({ until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Data inválida.');
    const ok = (await db.query('SELECT app.admin_set_premium($1, $2) AS ok', [c.req.param('id'), body.data.until])).rows[0].ok;
    if (!ok) throw notFound('Usuário não encontrado.');
    return c.json({ ok: true });
  }),
);

admin.post('/users/:id/ban', (c) =>
  asAdmin(c, async (db) => {
    const body = z.object({ banned: z.boolean() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Pedido inválido.');
    const ok = (await db.query('SELECT app.admin_set_ban($1, $2) AS ok', [c.req.param('id'), body.data.banned])).rows[0].ok;
    if (!ok) throw invalid('Não foi possível alterar esta conta.');
    return c.json({ ok: true });
  }),
);

/** Denúncias abertas, com o conteúdo denunciado para revisão. */
admin.get('/reports', (c) =>
  asAdmin(c, async (db) => {
    const reports = (
      await db.query(
        `SELECT r.target_type AS "type", r.target_id AS "targetId", count(*)::int AS total, array_agg(DISTINCT r.reason) AS reasons,
           min(r.created_at) AS since,
           CASE r.target_type WHEN 'post' THEN (SELECT p.text FROM posts p WHERE p.id = r.target_id)
             WHEN 'comment' THEN (SELECT x.text FROM comments x WHERE x.id = r.target_id) ELSE NULL END AS content,
           CASE r.target_type WHEN 'post' THEN (SELECT p.image IS NOT NULL FROM posts p WHERE p.id = r.target_id) ELSE false END AS "hasImage",
           CASE r.target_type WHEN 'post' THEN (SELECT p.hidden FROM posts p WHERE p.id = r.target_id)
             WHEN 'comment' THEN (SELECT x.hidden FROM comments x WHERE x.id = r.target_id) ELSE false END AS hidden,
           (SELECT u.name || ' (' || u.email || ')' FROM users u WHERE u.id = max(r.target_user::text)::uuid) AS "targetUser"
         FROM reports r WHERE r.status = 'aberta'
         GROUP BY r.target_type, r.target_id ORDER BY count(*) DESC, min(r.created_at) LIMIT 100`,
      )
    ).rows;
    return c.json({ reports });
  }),
);

admin.post('/reports/resolve', (c) =>
  asAdmin(c, async (db) => {
    const body = z.object({ type: z.enum(['post', 'comment', 'user']), targetId: z.string().uuid(), action: z.enum(['remover', 'manter']) }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Pedido inválido.');
    const { type, targetId, action } = body.data;
    const hidden = action === 'remover';
    if (type === 'post') await db.query('UPDATE posts SET hidden = $2 WHERE id = $1', [targetId, hidden]);
    if (type === 'comment') await db.query('UPDATE comments SET hidden = $2 WHERE id = $1', [targetId, hidden]);
    if (type === 'user' && hidden) await db.query('SELECT app.admin_set_ban($1, true)', [targetId]);
    await db.query(
      `UPDATE reports SET status = $3, resolved_at = now(), resolved_by = app.current_user_id() WHERE target_type = $1 AND target_id = $2 AND status = 'aberta'`,
      [type, targetId, hidden ? 'removida' : 'mantida'],
    );
    await db.query('INSERT INTO moderation_log (actor, action, target) VALUES (app.current_user_id(), $1, $2)', [`denuncia:${action}`, `${type}:${targetId}`]);
    return c.json({ ok: true });
  }),
);

admin.get('/events', (c) =>
  asAdmin(c, async (db) => {
    const events = (await db.query(`SELECT id, title, description, starts_on AS "startsOn", ends_on AS "endsOn", reward_coins AS "rewardCoins", item_id AS "itemId", (SELECT count(*) FROM event_claims x WHERE x.event_id = e.id) AS claims FROM events e ORDER BY starts_on DESC LIMIT 50`)).rows;
    return c.json({ events });
  }),
);

admin.post('/events', (c) =>
  asAdmin(c, async (db) => {
    const body = z
      .object({ title: z.string().trim().min(1).max(60), description: z.string().max(300).default(''), startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), rewardCoins: z.number().int().min(0).max(500), itemId: z.string().max(40).nullable().default(null) })
      .safeParse(await c.req.json().catch(() => ({})));
    if (!body.success || body.data.endsOn < body.data.startsOn) throw invalid('Evento inválido.');
    const b = body.data;
    const { rows } = await db.query('INSERT INTO events (title, description, starts_on, ends_on, reward_coins, item_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, app.current_user_id()) RETURNING id', [b.title, b.description, b.startsOn, b.endsOn, b.rewardCoins, b.itemId]);
    return c.json({ id: rows[0].id }, 201);
  }),
);

admin.delete('/events/:id', (c) =>
  asAdmin(c, async (db) => {
    await db.query('DELETE FROM events WHERE id = $1', [c.req.param('id')]);
    return c.json({ ok: true });
  }),
);

// ---------- Configuração do jogo (versões) ----------

const POOL = chestPool();

/** Versão em uso, a configuração padrão e o histórico de versões. */
admin.get('/game-config', (c) =>
  asAdmin(c, async (db) => {
    const versions = (
      await db.query(`SELECT g.version, (extract(epoch from g.created_at) * 1000)::bigint AS at, COALESCE(p.name, u.name) AS author, g.config->>'note' AS note
        FROM game_config g LEFT JOIN users u ON u.id = g.created_by LEFT JOIN profiles p ON p.user_id = g.created_by ORDER BY g.version DESC LIMIT 30`)
    ).rows.map((r) => ({ ...r, at: Number(r.at) }));
    return c.json({ current: await gameConfig(), defaults: DEFAULT_GAME, versions });
  }),
);

/** Salva uma versão nova (o servidor confere tudo antes; nada muda se houver erro). */
admin.post('/game-config', (c) =>
  asAdmin(c, async (db) => {
    const body = z.object({ config: z.record(z.unknown()), note: z.string().max(120).default('') }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Configuração inválida.');
    const cfg = { ...DEFAULT_GAME, ...body.data.config } as GameConfig;
    const errors = validateGameConfig(cfg, POOL, (id) => !!itemById(id));
    if (errors.length) return c.json({ error: 'invalido', message: 'A configuração tem problemas.', errors }, 422);
    const next = (await db.query('SELECT COALESCE(max(version), 1) + 1 AS v FROM game_config')).rows[0].v;
    await db.query('INSERT INTO game_config (version, config, created_by) VALUES ($1, $2, app.current_user_id())', [next, { ...cfg, version: next, note: body.data.note }]);
    await db.query('INSERT INTO moderation_log (actor, action, target) VALUES (app.current_user_id(), $1, $2)', ['jogo:config', `versao:${next}`]);
    resetGameConfigCache();
    return c.json({ version: next }, 201);
  }),
);

/** Volta para uma versão antiga (vira uma versão nova, para ficar no histórico). */
admin.post('/game-config/:version/restore', (c) =>
  asAdmin(c, async (db) => {
    const v = Number(c.req.param('version'));
    const row = Number.isInteger(v) ? (await db.query('SELECT config FROM game_config WHERE version = $1', [v])).rows[0] : null;
    if (!row) throw notFound('Versão não encontrada.');
    const next = (await db.query('SELECT COALESCE(max(version), 1) + 1 AS n FROM game_config')).rows[0].n;
    await db.query('INSERT INTO game_config (version, config, created_by) VALUES ($1, $2, app.current_user_id())', [next, { ...row.config, version: next, note: `Volta para a versão ${v}` }]);
    await db.query('INSERT INTO moderation_log (actor, action, target) VALUES (app.current_user_id(), $1, $2)', ['jogo:voltar', `versao:${v}`]);
    resetGameConfigCache();
    return c.json({ version: next }, 201);
  }),
);

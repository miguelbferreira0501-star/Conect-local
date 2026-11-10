// Amigos, feed só de gentileza, presentes e desafios em grupo. Toda leitura passa pelas
// políticas RLS (só amigos veem posts; bloqueio corta tudo). Peso, diário e humor nunca entram aqui.
import { randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import type pg from 'pg';
import { withUser } from '../db';
import { AppError, forbidden, invalid, notFound } from '../lib/errors';
import { type AppEnv, requireAuth } from '../auth';
import { checkKindness, PRESET_COMMENTS, REACTIONS, REACTION_IDS, REASON_TEXT } from '../../../web/src/shared/moderation';
import { notifyFriend } from '../push';
import { ITEMS } from '../../../web/src/data/items';
import { arenaOf } from '../../../web/src/shared/game';
import { TEAM_MAX_PLUS, TEAM_MISSIONS_MAX, dayComplete, isTeamMission, teamStreak, type TeamCheckins } from '../../../web/src/shared/team';
import { codeKey, isServerKey } from '../../../web/src/shared/friendCode';
import { gameConfig } from './game';

export const social = new Hono<AppEnv>();
social.use('*', requireAuth);

type Me = { id: string; ageGroup: 'ate12' | '13a17' | '18mais' };

/** Roda com a identidade da pessoa e aplica as regras de idade da parte social. */
async function asMe<T>(c: { get: (k: 'userId') => string | null }, fn: (db: pg.PoolClient, me: Me) => Promise<T>): Promise<T> {
  return withUser(c.get('userId'), async (db) => {
    const u = (await db.query('SELECT id, age_group FROM users WHERE id = app.current_user_id()')).rows[0];
    if (!u) throw forbidden();
    if (u.age_group === 'ate12') throw forbidden('Amigos e feed ficam desligados para menores de 13 anos.');
    return fn(db, { id: u.id, ageGroup: u.age_group });
  });
}

/** Nome de quem está agindo (para os avisos aos amigos). */
async function myName(db: pg.PoolClient): Promise<string> {
  return (await db.query('SELECT name FROM profiles WHERE user_id = app.current_user_id()')).rows[0]?.name ?? 'Um amigo';
}
/** Avisos para amigos saem depois, sem segurar a resposta nem derrubar nada se falharem. */
const later = (fn: () => Promise<unknown>) => void setTimeout(() => fn().catch(() => {}), 0);

const uuid = z.string().uuid();
const pid = (v: string) => {
  const r = uuid.safeParse(v);
  if (!r.success) throw notFound();
  return r.data;
};

const PROFILE_COLS = `p.user_id AS id, p.name, p.code, p.pet, p.house, p.level, p.teen, p.accepts_requests AS "acceptsRequests", p.bio, p.streak, p.badges, p.arena, p.ranked, (extract(epoch from p.updated_at) * 1000)::bigint AS "updatedAt"`;
const POST_COLS = `id, author_id AS "authorId", group_id AS "groupId", kind, text, pet, house, image, (extract(epoch from created_at) * 1000)::bigint AS "createdAt"`;
const cleanPost = <T extends Record<string, unknown>>(p: T) => ({ ...p, pet: p.pet ?? undefined, house: p.house ?? undefined, image: p.image ?? undefined, groupId: p.groupId ?? undefined });

const outfit = z.object({ chapeu: z.string().max(40).nullable(), oculos: z.string().max(40).nullable(), roupa: z.string().max(40).nullable(), acessorio: z.string().max(40).nullable(), efeito: z.string().max(40).nullable().optional() });
const petSchema = z.object({ name: z.string().max(20), fur: z.string().max(20), phase: z.number().int().min(0).max(3), outfit });
const houseSchema = z.object({
  wallpaper: z.string().max(30),
  floor: z.string().max(30),
  items: z.array(z.object({ uid: z.string().max(30), itemId: z.string().max(40), x: z.number(), y: z.number(), z: z.number() })).max(80),
});

function kind(text: string) {
  const r = checkKindness(text);
  if (!r.ok) throw invalid(REASON_TEXT[r.reason]);
  return r.text;
}

// ---------- Perfil ----------

social.get('/me', (c) =>
  asMe(c, async (db) => {
    const p = (await db.query(`SELECT ${PROFILE_COLS} FROM profiles p WHERE p.user_id = app.current_user_id()`)).rows[0];
    return c.json({ profile: p ?? null });
  }),
);

social.put('/profile', (c) =>
  asMe(c, async (db, me) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(40),
        pet: petSchema,
        house: houseSchema,
        level: z.number().int().min(1).max(999),
        acceptsRequests: z.boolean(),
        bio: z.string().max(120).default(''),
        streak: z.number().int().min(0).max(9999).default(0),
        badges: z.number().int().min(0).max(999).default(0),
        arena: z.number().int().min(1).max(99).default(1),
        ranked: z.boolean().default(true),
      })
      .safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Perfil inválido.');
    const b = body.data;
    kind(b.name);
    kind(b.pet.name);
    const bio = b.bio.trim() ? kind(b.bio) : '';
    const existing = (await db.query('SELECT code FROM profiles WHERE user_id = $1', [me.id])).rows[0];
    let code = existing?.code as string | undefined;
    for (let i = 0; !code && i < 5; i++) {
      const candidate = `HAMI-${randomBytes(4).toString('hex').toUpperCase().slice(0, 6)}`;
      const taken = (await db.query('SELECT 1 FROM app.find_by_code($1)', [candidate])).rowCount;
      if (!taken) code = candidate;
    }
    await db.query(
      `INSERT INTO profiles (user_id, code, name, pet, house, level, teen, accepts_requests, bio, streak, badges, arena, ranked) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (user_id) DO UPDATE SET name = $3, pet = $4, house = $5, level = $6, teen = $7, accepts_requests = $8, bio = $9, streak = $10, badges = $11, arena = $12, ranked = $13, updated_at = now()`,
      [me.id, code, b.name, b.pet, b.house, b.level, me.ageGroup !== '18mais', b.acceptsRequests, bio, b.streak, b.badges, b.arena, b.ranked],
    );
    const p = (await db.query(`SELECT ${PROFILE_COLS} FROM profiles p WHERE p.user_id = $1`, [me.id])).rows[0];
    return c.json({ profile: p });
  }),
);

social.get('/code/:code', (c) =>
  asMe(c, async (db) => {
    // Aceita do jeito que a pessoa digitar (sem "HAMI-", minúsculo, com espaço, O no lugar de 0).
    const key = codeKey(c.req.param('code'));
    if (!isServerKey(key)) return c.json({ profile: null });
    const p = (await db.query(`SELECT ${PROFILE_COLS} FROM app.find_by_code($1) p`, [`HAMI-${key}`])).rows[0];
    return c.json({ profile: p ?? null });
  }),
);

// ---------- Amizades e bloqueios ----------

social.post('/friends/:id/request', (c) =>
  asMe(c, async (db) => {
    const target = pid(c.req.param('id'));
    const result = (await db.query('SELECT app.request_friend($1) AS r', [target])).rows[0].r;
    if (result === 'ok') {
      const name = await myName(db);
      later(() => notifyFriend(target, `${name} quer ser seu amigo no HamiCare 🐹`));
    }
    return c.json({ result });
  }),
);
social.post('/friends/:id/accept', (c) =>
  asMe(c, async (db) => {
    const r = await db.query(`UPDATE friendships SET status = 'aceita' WHERE requester = $1 AND addressee = app.current_user_id()`, [pid(c.req.param('id'))]);
    if (!r.rowCount) throw notFound('Pedido não encontrado.');
    return c.json({ ok: true });
  }),
);
social.post('/friends/:id/decline', (c) =>
  asMe(c, async (db) => {
    await db.query('DELETE FROM friendships WHERE requester = $1 AND addressee = app.current_user_id()', [pid(c.req.param('id'))]);
    return c.json({ ok: true });
  }),
);
social.delete('/friends/:id', (c) =>
  asMe(c, async (db) => {
    const other = pid(c.req.param('id'));
    await db.query('DELETE FROM friendships WHERE (requester = $1 AND addressee = app.current_user_id()) OR (addressee = $1 AND requester = app.current_user_id())', [other]);
    return c.json({ ok: true });
  }),
);
social.post('/blocks/:id', (c) =>
  asMe(c, async (db) => {
    const other = pid(c.req.param('id'));
    await db.query('INSERT INTO blocks (blocker, blocked) VALUES (app.current_user_id(), $1) ON CONFLICT DO NOTHING', [other]);
    await db.query('DELETE FROM friendships WHERE (requester = $1 AND addressee = app.current_user_id()) OR (addressee = $1 AND requester = app.current_user_id())', [other]);
    return c.json({ ok: true });
  }),
);
social.delete('/blocks/:id', (c) =>
  asMe(c, async (db) => {
    await db.query('DELETE FROM blocks WHERE blocker = app.current_user_id() AND blocked = $1', [pid(c.req.param('id'))]);
    return c.json({ ok: true });
  }),
);

social.get('/friends', (c) =>
  asMe(c, async (db, me) => {
    const rows = (
      await db.query(
        `SELECT f.requester, f.addressee, f.status, ${PROFILE_COLS} FROM friendships f
         JOIN profiles p ON p.user_id = CASE WHEN f.requester = $1 THEN f.addressee ELSE f.requester END`,
        [me.id],
      )
    ).rows;
    const strip = ({ requester: _r, addressee: _a, status: _s, ...p }: Record<string, unknown>) => p;
    const blocked = (await db.query('SELECT blocked AS id FROM blocks WHERE blocker = app.current_user_id()')).rows.map((b) => ({
      id: b.id,
      name: 'Pessoa bloqueada',
      code: '',
      pet: { name: 'Hami', fur: 'nuvem', phase: 0, outfit: { chapeu: null, oculos: null, roupa: null, acessorio: null } },
      house: { wallpaper: 'p-creme', floor: 'f-madeira', items: [] },
      level: 1,
      teen: false,
      acceptsRequests: false,
      updatedAt: 0,
    }));
    return c.json({
      friends: rows.filter((r) => r.status === 'aceita').map(strip),
      incoming: rows.filter((r) => r.status === 'pendente' && r.addressee === me.id).map(strip),
      outgoing: rows.filter((r) => r.status === 'pendente' && r.requester === me.id).map(strip),
      blocked,
    });
  }),
);

// ---------- Feed ----------

/** Monta um feed (posts + reações + comentários + perfis) a partir de uma consulta de posts. */
async function loadFeed(db: pg.PoolClient, me: Me, where: string, params: unknown[]) {
  const posts = (await db.query(`SELECT ${POST_COLS} FROM posts WHERE NOT hidden AND ${where} ORDER BY created_at DESC LIMIT 60`, params)).rows.map((r: { id: string; authorId: string }) => cleanPost(r));
  const ids = posts.map((p) => p.id);
  const reactions = ids.length ? (await db.query('SELECT post_id, user_id, kind FROM reactions WHERE post_id = ANY($1)', [ids])).rows : [];
  const comments = ids.length
    ? (await db.query(`SELECT id, post_id, author_id, text, (extract(epoch from created_at) * 1000)::bigint AS created FROM comments WHERE post_id = ANY($1) AND NOT hidden ORDER BY created_at`, [ids])).rows
    : [];
  const author = new Map(posts.map((p) => [p.id, p.authorId]));
  const key = (postId: string) => `${author.get(postId)}:${postId}`;
  const people = [...new Set([me.id, ...posts.map((p) => p.authorId), ...comments.map((x) => x.author_id)])];
  const profiles = Object.fromEntries((await db.query(`SELECT ${PROFILE_COLS} FROM profiles p WHERE p.user_id = ANY($1)`, [people])).rows.map((p) => [p.id, p]));
  return {
    posts,
    profiles,
    reactions: reactions.map((r) => ({ postKey: key(r.post_id), authorId: r.user_id, kind: r.kind })),
    comments: comments.map((x) => ({ id: x.id, postKey: key(x.post_id), authorId: x.author_id, text: x.text, createdAt: x.created })),
  };
}

social.get('/feed', (c) => asMe(c, async (db, me) => c.json(await loadFeed(db, me, 'group_id IS NULL', []))));

// ---------- Perfil de outra pessoa (estilo rede social) ----------

social.get('/profiles/:id', (c) =>
  asMe(c, async (db, me) => {
    const id = pid(c.req.param('id'));
    const profile = (await db.query(`SELECT ${PROFILE_COLS} FROM profiles p WHERE p.user_id = $1`, [id])).rows[0];
    if (!profile) throw notFound('Perfil não encontrado.');
    const isFriend = id === me.id || (await db.query('SELECT app.are_friends(app.current_user_id(), $1) AS f', [id])).rows[0].f;
    // Os posts seguem as regras do banco: só aparecem para amigos.
    const posts = (await db.query(`SELECT ${POST_COLS} FROM posts WHERE author_id = $1 AND group_id IS NULL AND NOT hidden ORDER BY created_at DESC LIMIT 30`, [id])).rows.map(cleanPost);
    const friendsCount = (await db.query('SELECT app.friend_count($1) AS n', [id])).rows[0].n;
    return c.json({ profile, posts, friendsCount, isFriend });
  }),
);

// ---------- Visitas com reação ----------

/** Deixa uma reação na casa de um amigo (uma por dia; as regras do banco só deixam entre amigos). */
social.post('/visits/:id', (c) =>
  asMe(c, async (db) => {
    const body = z.object({ reaction: z.string().refine((x) => REACTION_IDS.includes(x)) }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Reação inválida.');
    const host = pid(c.req.param('id'));
    if (!(await db.query('SELECT app.are_friends(app.current_user_id(), $1) AS f', [host])).rows[0].f) throw forbidden('Só dá para reagir na casa de amigos.');
    const r = await db.query('INSERT INTO visits (visitor, host, reaction) VALUES (app.current_user_id(), $1, $2) ON CONFLICT DO NOTHING', [host, body.data.reaction]);
    if (r.rowCount) {
      const name = await myName(db);
      const re = REACTIONS.find((x) => x.id === body.data.reaction)!;
      later(() => notifyFriend(host, `${name} passou na sua casa e deixou ${re.emoji} ${re.label.toLowerCase()}!`));
    }
    return c.json({ result: r.rowCount ? 'ok' : 'limite' });
  }),
);

/** Quem visitou a sua casa (as mais recentes). */
social.get('/visits', (c) =>
  asMe(c, async (db) => {
    const rows = (await db.query('SELECT visitor AS "userId", name, pet, reaction, (extract(epoch from created_at) * 1000)::bigint AS at FROM app.my_visits(30)')).rows;
    return c.json({ visits: rows.map((r) => ({ ...r, at: Number(r.at) })) });
  }),
);

// ---------- Ranking só entre amigos ----------

social.get('/ranking', (c) =>
  asMe(c, async (db, me) => {
    if (me.ageGroup === 'ate12') return c.json({ rows: [], optedOut: false });
    const mine = (await db.query('SELECT ranked FROM profiles WHERE user_id = app.current_user_id()')).rows[0];
    if (mine && !mine.ranked) return c.json({ rows: [], optedOut: true });
    const cfg = await gameConfig();
    const rows = (await db.query('SELECT * FROM app.friend_ranking()')).rows.map((r) => ({
      userId: r.user_id,
      name: r.name,
      pet: r.pet,
      dias: r.dias,
      missoes: r.missoes,
      conquistas: r.conquistas,
      colecoes: r.colecoes,
      arenas: arenaOf(r.max_level, cfg).n,
      me: r.user_id === me.id,
    }));
    return c.json({ rows, optedOut: false });
  }),
);

// ---------- Turma (até 4 amigos, missões em comum) ----------

const dayParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Dia pedido pelo app (o dia da pessoa), se estiver perto do dia do servidor; senão, o dia do servidor. */
async function teamDay(db: pg.PoolClient, raw: unknown): Promise<string> {
  const d = dayParam.safeParse(raw);
  const r = (await db.query("SELECT to_char(current_date, 'YYYY-MM-DD') AS today, $1::date BETWEEN current_date - 1 AND current_date + 1 AS near", [d.success ? d.data : '2000-01-01'])).rows[0];
  return d.success && r.near ? d.data : r.today;
}

async function loadTeam(db: pg.PoolClient, day: string) {
  const t = (await db.query('SELECT t.id, t.owner_id AS "ownerId", t.name, t.missions FROM teams t JOIN team_members m ON m.team_id = t.id WHERE m.user_id = app.current_user_id()')).rows[0];
  if (!t) return null;
  const members = (await db.query(`SELECT ${PROFILE_COLS} FROM team_members tm JOIN profiles p ON p.user_id = tm.user_id WHERE tm.team_id = $1 ORDER BY tm.joined_at`, [t.id])).rows;
  const ids = (await db.query('SELECT user_id FROM team_members WHERE team_id = $1 ORDER BY joined_at', [t.id])).rows.map((r) => r.user_id as string);
  const rows = (await db.query("SELECT user_id, to_char(day, 'YYYY-MM-DD') AS day, mission FROM team_checkins WHERE team_id = $1 AND day >= $2::date - 60", [t.id, day])).rows;
  const byDay = new Map<string, TeamCheckins>();
  for (const r of rows) {
    const m = byDay.get(r.day) ?? {};
    (m[r.user_id] ??= []).push(r.mission);
    byDay.set(r.day, m);
  }
  const complete = new Set([...byDay.entries()].filter(([, c]) => dayComplete(t.missions, ids, c)).map(([d]) => d));
  const max = (await db.query('SELECT app.team_max($1) AS n', [t.id])).rows[0].n as number;
  return { ...t, max, memberIds: ids, members, today: { date: day, checkins: byDay.get(day) ?? {}, complete: complete.has(day) }, streak: teamStreak(complete, day), completeDays: complete.size };
}

/** Avisa a turma: dia completo (todos) ou "falta só você" (quem ainda não fez), uma vez por dia cada. */
async function teamNotices(db: pg.PoolClient, team: NonNullable<Awaited<ReturnType<typeof loadTeam>>>, actor: string) {
  const day = team.today.date;
  const once = async (userId: string, kind: string) => (await db.query('INSERT INTO team_notices (team_id, user_id, day, kind) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [team.id, userId, day, kind])).rowCount;
  if (team.today.complete) {
    for (const m of team.memberIds) if (m !== actor && (await once(m, 'completo'))) later(() => notifyFriend(m, `A turma ${team.name} completou as missões de hoje! 🎉 Seu prêmio está esperando.`));
    return;
  }
  const pending = team.memberIds.filter((m: string) => !team.missions.every((ms: string) => (team.today.checkins[m] ?? []).includes(ms)));
  if (pending.length === 1 && pending[0] !== actor && (await once(pending[0], 'falta'))) {
    later(() => notifyFriend(pending[0], `A turma ${team.name} está quase lá: só falta a sua parte hoje 💛`));
  }
}

social.get('/team', (c) =>
  asMe(c, async (db) => {
    return c.json({ team: await loadTeam(db, await teamDay(db, c.req.query('day'))) });
  }),
);

const teamMissions = z.array(z.string()).min(1).max(TEAM_MISSIONS_MAX).refine((l) => l.every(isTeamMission) && new Set(l).size === l.length);

function teamError(e: unknown): never {
  const code = (e as { code?: string }).code;
  if (code === '23505') throw new AppError(409, 'ja_em_turma', 'Alguém já está em outra turma. Cada pessoa fica em uma turma por vez.');
  if (code === '23514') throw new AppError(409, 'turma_cheia', 'A turma está cheia. Sem Plus, cabem 4 pessoas; com HamiCare+, até 8.');
  if (code === '42501') throw forbidden('Só dá para chamar amigos para a turma.');
  throw e;
}

social.post('/team', (c) =>
  asMe(c, async (db, me) => {
    const body = z
      .object({ name: z.string().trim().min(1).max(40), missions: teamMissions, members: z.array(z.string().uuid()).max(TEAM_MAX_PLUS - 1).default([]) })
      .safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Turma inválida.');
    const name = kind(body.data.name);
    try {
      const { rows } = await db.query('INSERT INTO teams (owner_id, name, missions) VALUES ($1, $2, $3) RETURNING id', [me.id, name, body.data.missions]);
      await db.query('INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)', [rows[0].id, me.id]);
      for (const u of [...new Set(body.data.members)].filter((u) => u !== me.id)) await db.query('INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)', [rows[0].id, u]);
    } catch (e) {
      teamError(e);
    }
    const team = await loadTeam(db, await teamDay(db, c.req.query('day')));
    for (const m of team!.memberIds) if (m !== me.id) later(() => notifyFriend(m, `Você entrou na turma ${team!.name}! Façam as missões juntos 🐹`));
    return c.json({ team }, 201);
  }),
);

social.put('/team', (c) =>
  asMe(c, async (db) => {
    const body = z.object({ name: z.string().trim().min(1).max(40).optional(), missions: teamMissions.optional() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Turma inválida.');
    const t = (await db.query('SELECT team_id FROM team_members WHERE user_id = app.current_user_id()')).rows[0];
    if (!t) throw notFound('Você não está em uma turma.');
    const r = await db.query('UPDATE teams SET name = COALESCE($2, name), missions = COALESCE($3, missions) WHERE id = $1', [t.team_id, body.data.name ? kind(body.data.name) : null, body.data.missions ?? null]);
    if (!r.rowCount) throw forbidden('Só quem criou a turma muda as missões.');
    return c.json({ team: await loadTeam(db, await teamDay(db, c.req.query('day'))) });
  }),
);

social.post('/team/members', (c) =>
  asMe(c, async (db) => {
    const body = z.object({ userId: z.string().uuid() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Pessoa inválida.');
    const t = (await db.query('SELECT team_id FROM team_members WHERE user_id = app.current_user_id()')).rows[0];
    if (!t) throw notFound('Você não está em uma turma.');
    try {
      const r = await db.query('INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)', [t.team_id, body.data.userId]);
      if (!r.rowCount) throw forbidden('Só quem criou a turma chama pessoas.');
    } catch (e) {
      if ((e as { code?: string }).code === '42501' && !(await db.query('SELECT app.team_owner($1) = app.current_user_id() AS own', [t.team_id])).rows[0].own) throw forbidden('Só quem criou a turma chama pessoas.');
      teamError(e);
    }
    const team = await loadTeam(db, await teamDay(db, c.req.query('day')));
    later(() => notifyFriend(body.data.userId, `Você entrou na turma ${team!.name}! Façam as missões juntos 🐹`));
    return c.json({ team });
  }),
);

/** Sair da turma (você) ou tirar alguém (quem criou). Se quem criou sai, a turma acaba. */
social.delete('/team/members/:id', (c) =>
  asMe(c, async (db, me) => {
    const who = pid(c.req.param('id'));
    const t = (await db.query('SELECT t.id, t.owner_id FROM teams t JOIN team_members m ON m.team_id = t.id WHERE m.user_id = app.current_user_id()')).rows[0];
    if (!t) throw notFound('Você não está em uma turma.');
    if (who === me.id && t.owner_id === me.id) await db.query('DELETE FROM teams WHERE id = $1', [t.id]);
    else {
      const r = await db.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [t.id, who]);
      if (!r.rowCount) throw forbidden('Só quem criou a turma tira pessoas.');
    }
    return c.json({ team: await loadTeam(db, await teamDay(db, c.req.query('day'))) });
  }),
);

/** Marca (ou desmarca) a sua parte numa missão da turma. */
social.post('/team/checkin', (c) =>
  asMe(c, async (db, me) => {
    const body = z.object({ mission: z.string().max(40), day: dayParam, done: z.boolean().default(true) }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Missão inválida.');
    const t = (await db.query('SELECT team_id FROM team_members WHERE user_id = app.current_user_id()')).rows[0];
    if (!t) throw notFound('Você não está em uma turma.');
    const day = await teamDay(db, body.data.day);
    if (body.data.done) {
      try {
        await db.query('INSERT INTO team_checkins (team_id, user_id, day, mission) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [t.team_id, me.id, day, body.data.mission]);
      } catch (e) {
        if ((e as { code?: string }).code === '42501') throw invalid('Essa missão não é da turma.');
        throw e;
      }
    } else {
      await db.query('DELETE FROM team_checkins WHERE team_id = $1 AND user_id = $2 AND day = $3 AND mission = $4', [t.team_id, me.id, day, body.data.mission]);
    }
    const team = (await loadTeam(db, day))!;
    if (body.data.done) await teamNotices(db, team, me.id);
    return c.json({ team });
  }),
);

// ---------- Grupos ----------

const GROUP_COLS = `g.id, g.owner_id AS "ownerId", g.name, g.emoji, g.color, (extract(epoch from g.created_at) * 1000)::bigint AS "createdAt"`;
const MAX_MEMBERS = 30;

async function groupsOf(db: pg.PoolClient, onlyId?: string) {
  const groups = (await db.query(`SELECT ${GROUP_COLS} FROM groups g WHERE app.in_group(g.id) ${onlyId ? 'AND g.id = $1' : ''} ORDER BY g.created_at DESC`, onlyId ? [onlyId] : [])).rows;
  if (!groups.length) return [];
  const members = (await db.query('SELECT group_id, user_id FROM group_members WHERE group_id = ANY($1) ORDER BY joined_at', [groups.map((g) => g.id)])).rows;
  return groups.map((g) => ({ ...g, members: members.filter((m) => m.group_id === g.id).map((m) => m.user_id) }));
}

social.get('/groups', (c) =>
  asMe(c, async (db) => {
    const groups = await groupsOf(db);
    const people = [...new Set(groups.flatMap((g) => g.members))];
    const profiles = people.length ? Object.fromEntries((await db.query(`SELECT ${PROFILE_COLS} FROM profiles p WHERE p.user_id = ANY($1)`, [people])).rows.map((p) => [p.id, p])) : {};
    return c.json({ groups, profiles });
  }),
);

social.post('/groups', (c) =>
  asMe(c, async (db, me) => {
    const body = z
      .object({ name: z.string().trim().min(1).max(40), emoji: z.string().min(1).max(16), color: z.string().max(20).default('morango'), members: z.array(z.string().uuid()).max(MAX_MEMBERS - 1).default([]) })
      .safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Grupo inválido.');
    const b = body.data;
    const name = kind(b.name);
    const { rows } = await db.query('INSERT INTO groups (owner_id, name, emoji, color) VALUES ($1, $2, $3, $4) RETURNING id', [me.id, name, b.emoji, b.color]);
    const id = rows[0].id as string;
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [id, me.id]);
    // Só amigos entram (a política do banco confere de novo).
    for (const u of new Set(b.members)) {
      const ok = (await db.query('SELECT app.are_friends(app.current_user_id(), $1) AS f', [u])).rows[0].f;
      if (ok) await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, u]);
    }
    return c.json({ group: (await groupsOf(db, id))[0] }, 201);
  }),
);

social.post('/groups/:id/members', (c) =>
  asMe(c, async (db) => {
    const id = pid(c.req.param('id'));
    const body = z.object({ userId: z.string().uuid() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Pessoa inválida.');
    const count = (await db.query('SELECT count(*)::int AS n FROM group_members WHERE group_id = $1', [id])).rows[0].n;
    if (count >= MAX_MEMBERS) throw invalid(`Um grupo tem até ${MAX_MEMBERS} pessoas.`);
    try {
      await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, body.data.userId]);
    } catch (e) {
      if ((e as { code?: string }).code === '42501' || (e as { code?: string }).code === '23503') throw forbidden('Só quem criou o grupo adiciona, e só amigos.');
      throw e;
    }
    return c.json({ ok: true });
  }),
);

social.delete('/groups/:id/members/:user', (c) =>
  asMe(c, async (db, me) => {
    const id = pid(c.req.param('id'));
    const user = pid(c.req.param('user'));
    const owner = (await db.query('SELECT app.group_owner($1) AS o', [id])).rows[0].o;
    // Quem criou e sai: o grupo acaba (os posts do grupo vão junto).
    if (owner === me.id && user === me.id) await db.query('DELETE FROM groups WHERE id = $1', [id]);
    else await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [id, user]);
    return c.json({ ok: true });
  }),
);

social.get('/groups/:id/feed', (c) =>
  asMe(c, async (db, me) => {
    const id = pid(c.req.param('id'));
    if (!(await db.query('SELECT app.in_group($1) AS g', [id])).rows[0].g) throw notFound('Grupo não encontrado.');
    return c.json(await loadFeed(db, me, 'group_id = $1', [id]));
  }),
);

social.post('/posts', (c) =>
  asMe(c, async (db, me) => {
    const body = z
      .object({
        kind: z.enum(['foto', 'atividade', 'conquista', 'decoracao', 'momento']),
        text: z.string().max(200).default(''),
        pet: petSchema.extend({ mood: z.string().max(20) }).optional(),
        house: houseSchema.optional(),
        image: z.string().max(400_000).optional(),
        groupId: z.string().uuid().optional(),
      })
      .safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Post inválido.');
    const b = body.data;
    const text = b.text.trim() ? kind(b.text) : '';
    if (b.image && me.ageGroup !== '18mais') throw forbidden('Fotos reais ficam disponíveis a partir dos 18 anos.');
    if (b.image && !b.image.startsWith('data:image/jpeg;base64,')) throw invalid('Formato de foto inválido.');
    try {
      const { rows } = await db.query('INSERT INTO posts (author_id, kind, text, pet, house, image, group_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [me.id, b.kind, text, b.pet ?? null, b.house ?? null, b.image ?? null, b.groupId ?? null]);
      return c.json({ id: rows[0].id }, 201);
    } catch (e) {
      if ((e as { code?: string }).code === '42501' || (e as { code?: string }).code === '23503') throw forbidden('Você não está nesse grupo.');
      throw e;
    }
  }),
);

social.delete('/posts/:id', (c) =>
  asMe(c, async (db) => {
    await db.query('DELETE FROM posts WHERE id = $1 AND author_id = app.current_user_id()', [pid(c.req.param('id'))]);
    return c.json({ ok: true });
  }),
);

social.put('/reactions', (c) =>
  asMe(c, async (db, me) => {
    const body = z.object({ postId: z.string().uuid(), kind: z.string().nullable() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success || (body.data.kind && !REACTION_IDS.includes(body.data.kind))) throw invalid('Reação inválida.');
    const { postId, kind: k } = body.data;
    if (!k) await db.query('DELETE FROM reactions WHERE post_id = $1 AND user_id = $2', [postId, me.id]);
    else {
      try {
        await db.query('INSERT INTO reactions (post_id, user_id, kind) VALUES ($1, $2, $3) ON CONFLICT (post_id, user_id) DO UPDATE SET kind = EXCLUDED.kind', [postId, me.id, k]);
      } catch (e) {
        if ((e as { code?: string }).code === '42501') throw notFound('Post não encontrado.');
        throw e;
      }
    }
    return c.json({ ok: true });
  }),
);

social.post('/comments', (c) =>
  asMe(c, async (db, me) => {
    const body = z.object({ postId: z.string().uuid(), text: z.string() }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Comentário inválido.');
    // Menores de 18 comentam só com elogios prontos.
    if (me.ageGroup !== '18mais' && !PRESET_COMMENTS.includes(body.data.text)) throw invalid('Para menores de 18, os comentários são os elogios prontos.');
    const text = kind(body.data.text);
    try {
      const { rows } = await db.query('INSERT INTO comments (post_id, author_id, text) VALUES ($1, $2, $3) RETURNING id', [body.data.postId, me.id, text]);
      return c.json({ id: rows[0].id }, 201);
    } catch (e) {
      if ((e as { code?: string }).code === '42501' || (e as { code?: string }).code === '23503') throw notFound('Post não encontrado.');
      throw e;
    }
  }),
);

social.delete('/comments/:id', (c) =>
  asMe(c, async (db) => {
    await db.query('DELETE FROM comments WHERE id = $1 AND author_id = app.current_user_id()', [pid(c.req.param('id'))]);
    return c.json({ ok: true });
  }),
);

social.post('/comments/:id/hide', (c) =>
  asMe(c, async (db) => {
    const r = (await db.query('SELECT app.hide_comment($1) AS ok', [pid(c.req.param('id'))])).rows[0];
    if (!r?.ok) throw forbidden('Só quem postou pode esconder comentários.');
    return c.json({ ok: true });
  }),
);

// ---------- Denúncias ----------

social.post('/reports', (c) =>
  asMe(c, async (db, me) => {
    const body = z.object({ type: z.enum(['post', 'comment', 'user']), id: z.string().uuid(), userId: z.string().uuid().optional(), reason: z.string().max(200).default('') }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) throw invalid('Denúncia inválida.');
    const b = body.data;
    await db.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, target_user, reason) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING`,
      [me.id, b.type, b.id, b.userId ?? null, b.reason || 'sem motivo'],
    );
    if (b.type !== 'user') await db.query('SELECT app.auto_hide($1, $2)', [b.type, b.id]);
    return c.json({ ok: true }, 201);
  }),
);

// ---------- Presentes ----------

const GIFTABLE = new Set(['vibe', ...ITEMS.filter((i) => !i.souvenir && i.price > 0).map((i) => i.id)]);

social.get('/gifts', (c) =>
  asMe(c, async (db) => {
    const gifts = (
      await db.query(
        `SELECT id, from_id AS "from", to_id AS "to", item_id AS "itemId", note, claimed_at IS NOT NULL AS claimed, (extract(epoch from created_at) * 1000)::bigint AS "createdAt"
         FROM gifts WHERE to_id = app.current_user_id() ORDER BY created_at DESC LIMIT 100`,
      )
    ).rows;
    return c.json({ gifts });
  }),
);

social.post('/gifts', (c) =>
  asMe(c, async (db, me) => {
    const body = z.object({ to: z.string().uuid(), itemId: z.string(), note: z.string().max(80).default('') }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success || !GIFTABLE.has(body.data.itemId)) throw invalid('Presente inválido.');
    const note = body.data.note.trim() ? kind(body.data.note) : '';
    try {
      await db.query('INSERT INTO gifts (from_id, to_id, item_id, note) VALUES ($1, $2, $3, $4)', [me.id, body.data.to, body.data.itemId, note]);
    } catch (e) {
      if ((e as { code?: string }).code === '42501') throw forbidden('Presentes só para amigos.');
      throw e;
    }
    const name = await myName(db);
    const to = body.data.to;
    later(() => notifyFriend(to, body.data.itemId === 'vibe' ? `${name} mandou uma vibe boa pra você 💛` : `${name} te mandou um presente 🎁`));
    return c.json({ ok: true }, 201);
  }),
);

social.post('/gifts/:id/claim', (c) =>
  asMe(c, async (db) => {
    const g = (
      await db.query(
        `UPDATE gifts SET claimed_at = now() WHERE id = $1 AND to_id = app.current_user_id() AND claimed_at IS NULL
         RETURNING id, from_id AS "from", to_id AS "to", item_id AS "itemId", note, true AS claimed, (extract(epoch from created_at) * 1000)::bigint AS "createdAt"`,
        [pid(c.req.param('id'))],
      )
    ).rows[0];
    // O presente entra também no inventário do jogo (para baús e coleções).
    if (g && GIFTABLE.has(g.itemId)) {
      await db.query(
        "INSERT INTO game_inventory (user_id, item_id, qty, origin) VALUES (app.current_user_id(), $1, 1, 'presente') ON CONFLICT (user_id, item_id) DO UPDATE SET qty = game_inventory.qty + 1",
        [g.itemId],
      );
    }
    return c.json({ gift: g ?? null });
  }),
);

// ---------- Desafios em grupo ----------

social.get('/challenges', (c) =>
  asMe(c, async (db) => {
    const list = (await db.query(`SELECT id, owner_id AS "ownerId", title, emoji, target, ends_at AS "endsAt" FROM challenges WHERE ends_at >= current_date - 7 ORDER BY created_at DESC LIMIT 30`)).rows;
    const ids = list.map((x) => x.id);
    const members = ids.length ? (await db.query('SELECT challenge_id, user_id FROM challenge_members WHERE challenge_id = ANY($1)', [ids])).rows : [];
    const checks = ids.length ? (await db.query(`SELECT challenge_id, user_id, to_char(day, 'YYYY-MM-DD') AS day FROM challenge_checkins WHERE challenge_id = ANY($1)`, [ids])).rows : [];
    return c.json({
      challenges: list.map((ch) => {
        const m = members.filter((x) => x.challenge_id === ch.id).map((x) => x.user_id);
        const checkins: Record<string, string[]> = {};
        for (const u of m) checkins[u] = checks.filter((x) => x.challenge_id === ch.id && x.user_id === u).map((x) => x.day);
        return { ...ch, members: m, checkins };
      }),
    });
  }),
);

social.post('/challenges', (c) =>
  asMe(c, async (db, me) => {
    const body = z.object({ title: z.string().trim().min(1).max(50), emoji: z.string().max(8), target: z.number().int().min(1).max(30), days: z.number().int().min(1).max(60) }).safeParse(await c.req.json().catch(() => ({})));
    if (!body.success || body.data.target > body.data.days) throw invalid('Desafio inválido.');
    const title = kind(body.data.title);
    const { rows } = await db.query(`INSERT INTO challenges (owner_id, title, emoji, target, ends_at) VALUES ($1, $2, $3, $4, current_date + $5::int) RETURNING id`, [me.id, title, body.data.emoji, body.data.target, body.data.days]);
    await db.query('INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2)', [rows[0].id, me.id]);
    return c.json({ id: rows[0].id }, 201);
  }),
);

social.post('/challenges/:id/checkin', (c) =>
  asMe(c, async (db, me) => {
    const id = pid(c.req.param('id'));
    const visible = (await db.query('SELECT ends_at >= current_date AS open FROM challenges WHERE id = $1', [id])).rows[0];
    if (!visible) throw notFound('Desafio não encontrado.');
    if (!visible.open) throw new AppError(409, 'encerrado', 'Esse desafio já terminou.');
    await db.query('INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, me.id]);
    await db.query('INSERT INTO challenge_checkins (challenge_id, user_id, day) VALUES ($1, $2, current_date) ON CONFLICT DO NOTHING', [id, me.id]);
    return c.json({ ok: true });
  }),
);

social.delete('/challenges/:id/membership', (c) =>
  asMe(c, async (db, me) => {
    await db.query('DELETE FROM challenge_members WHERE challenge_id = $1 AND user_id = $2', [pid(c.req.param('id')), me.id]);
    return c.json({ ok: true });
  }),
);

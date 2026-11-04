import { describe, expect, it } from 'vitest';
import { pool } from '../src/db';
import { befriend, call, newUser, setupDatabase, withProfile } from './helpers';

setupDatabase();

/** Consulta direto no banco com o papel da API e a identidade de um usuário. */
async function as<T>(userId: string, sql: string, params: unknown[] = []): Promise<T[]> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const r = await c.query(sql, params);
    await c.query('ROLLBACK');
    return r.rows;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}



describe('políticas RLS no banco', () => {
  it('backup (diário, peso) só o dono lê', async () => {
    const ana = await newUser('Ana');
    const bia = await newUser('Bia');
    await call('PUT', '/state', { state: { v: 2, body: { logs: [{ kg: 70 }] } }, clientUpdatedAt: 1 }, ana.cookie);
    expect(await as(bia.id, 'SELECT * FROM user_state')).toHaveLength(0);
    expect(await as(ana.id, 'SELECT * FROM user_state')).toHaveLength(1);
    expect(await as(bia.id, 'SELECT * FROM users')).toHaveLength(1);
  });

  it('ninguém se dá Plus nem muda o próprio papel', async () => {
    const ana = await newUser('Ana');
    await expect(as(ana.id, "UPDATE users SET premium_until = '2099-01-01' WHERE id = $1", [ana.id])).rejects.toThrow(/permission denied/);
    await expect(as(ana.id, "UPDATE users SET role = 'admin' WHERE id = $1", [ana.id])).rejects.toThrow(/permission denied/);
    await expect(as(ana.id, 'SELECT app.admin_set_premium($1, $2)', [ana.id, '2099-01-01'])).rejects.toThrow(/sem permissão/);
  });

  it('pedido de amizade só pela função (respeita bloqueio e privacidade)', async () => {
    const ana = await newUser('Ana');
    const bia = await newUser('Bia');
    await expect(as(ana.id, "INSERT INTO friendships (requester, addressee, status) VALUES ($1, $2, 'aceita')", [ana.id, bia.id])).rejects.toThrow(/permission denied|row-level security/);
  });

  it('posts de não-amigos e perfis de estranhos ficam invisíveis', async () => {
    const ana = await withProfile('Ana');
    const bia = await withProfile('Bia');
    const caio = await withProfile('Caio');
    await befriend(ana, bia);
    await call('POST', '/social/posts', { kind: 'momento', text: 'oi' }, ana.cookie);
    expect(await as(bia.id, 'SELECT * FROM posts')).toHaveLength(1);
    expect(await as(caio.id, 'SELECT * FROM posts')).toHaveLength(0);
    expect((await as(caio.id, 'SELECT * FROM profiles')).map((p: any) => p.name)).toEqual(['Caio']);
    // Ninguém escreve post em nome de outra pessoa
    await expect(as(caio.id, "INSERT INTO posts (author_id, kind, text) VALUES ($1, 'momento', 'falso')", [ana.id])).rejects.toThrow(/row-level security/);
  });
});

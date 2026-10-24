import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { LoginInput, ProfileUpdateInput, RegisterInput, UserDTO } from '@conecta/shared';
import { withUser } from '../db/pool';
import { env } from '../env';
import { AppError } from '../lib/errors';
import { hashToken } from '../middleware/auth';
import { usersRepo } from '../repositories/users';

const BCRYPT_COST = 11;
// Hash fixo para comparar mesmo quando o e-mail não existe (tempo de resposta semelhante).
const DUMMY_HASH = bcrypt.hashSync('nao-existe-' + randomBytes(8).toString('hex'), BCRYPT_COST);

async function newSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.SESSION_DAYS * 86_400_000);
  await withUser(userId, async (db) => {
    await usersRepo.createSession(db, hashToken(token), userId, expiresAt);
    await usersRepo.deleteExpiredSessions(db);
  });
  return { token, expiresAt };
}

export async function register(input: RegisterInput) {
  if (await usersRepo.emailExists(input.email)) {
    throw new AppError(409, 'email_taken', 'Já existe uma conta com este e-mail. Tente entrar.', { email: 'Já existe uma conta com este e-mail.' });
  }
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await withUser(id, (db) => usersRepo.create(db, { id, name: input.name, email: input.email, passwordHash }));
  return { user, session: await newSession(id) };
}

export async function login(input: LoginInput) {
  const cred = await usersRepo.findCredentials(input.email);
  const ok = await bcrypt.compare(input.password, cred?.password_hash ?? DUMMY_HASH);
  if (!cred || !ok) throw new AppError(401, 'invalid_credentials', 'E-mail ou senha incorretos.');
  const user = await withUser(cred.id, (db) => usersRepo.me(db));
  return { user: user as UserDTO, session: await newSession(cred.id) };
}

export async function logout(userId: string, token: string) {
  await withUser(userId, (db) => usersRepo.deleteSession(db, hashToken(token)));
}

export const me = (userId: string) => withUser(userId, (db) => usersRepo.me(db));

export const updateProfile = (userId: string, input: ProfileUpdateInput) =>
  withUser(userId, (db) => usersRepo.update(db, { name: input.name, phone: input.phone, cityIbge: input.cityIbge }));

/** Exclusão definitiva da conta e dos dados pessoais (LGPD). Exige a senha. */
export async function deleteAccount(userId: string, password: string) {
  await withUser(userId, async (db) => {
    const hash = await usersRepo.passwordHash(db);
    if (!hash || !(await bcrypt.compare(password, hash))) {
      throw new AppError(401, 'invalid_password', 'Senha incorreta.', { password: 'Senha incorreta.' });
    }
    await usersRepo.deleteMe(db);
  });
}

// Escolhe onde a parte social roda: página publicada no Claude (link de teste) ou servidor.
import { useEffect, useState } from 'react';
import { capability } from '../platform';
import { levelOf } from '../../logic/progress';
import { isMinor } from '../../logic/evolution';
import { streakOf } from '../../logic/streak';
import { addDays, dayKey } from '../util';
import { currentArena, homeArenaOf } from '../store';
import type { State } from '../../types';
import { createArtifactSocial } from './artifact';
import { createApiSocial, serverAvailable } from './api';
import type { Profile, RankStats, SocialApi } from './types';

let pending: Promise<SocialApi | null> | null = null;

export function getSocial(): Promise<SocialApi | null> {
  if (!pending) {
    pending = (async () => {
      const [db, user] = await Promise.all([capability('db'), capability('user')]);
      if (db && user) {
        const id = await user.id();
        if (id) return createArtifactSocial(db, id);
      }
      if (await serverAvailable()) return createApiSocial();
      return null;
    })().catch(() => null);
  }
  return pending;
}

/** Reinicia a escolha (por exemplo, depois de entrar na conta). */
const resetListeners = new Set<() => void>();
/** Entrou ou saiu da conta: quem usa a parte social pergunta de novo. */
export function resetSocial() {
  pending = null;
  lastSent = '';
  resetListeners.forEach((l) => l());
}

export function useSocial(): { api: SocialApi | null; loading: boolean } {
  const [api, setApi] = useState<SocialApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    resetListeners.add(bump);
    return () => {
      resetListeners.delete(bump);
    };
  }, []);
  useEffect(() => {
    let alive = true;
    getSocial().then((a) => {
      if (!alive) return;
      setApi(a);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [version]);
  return { api, loading };
}

/** O que vai para o perfil público: nunca peso, calorias, diário ou humor. */
export function publicProfileOf(s: State): Omit<Profile, 'id' | 'code' | 'updatedAt'> {
  return {
    name: s.profile.name || 'Alguém',
    pet: { name: s.pet.name.trim() || 'Hami', fur: s.pet.fur, phase: s.pet.phase, outfit: s.pet.outfit },
    house: s.house,
    level: levelOf(s.xp),
    teen: s.profile.ageGroup === '13a17',
    acceptsRequests: s.privacy.requests === 'todos',
    bio: s.bio,
    streak: streakOf(s.days, dayKey(new Date()), s.createdAt).count,
    badges: Object.keys(s.achievements).length,
    arena: homeArenaOf(s),
    ranked: s.privacy.ranking !== false,
    stats: rankStatsOf(s),
  };
}

/** Números do ranking entre amigos: constância, missões, conquistas, coleções e arenas. Nunca peso. */
export function rankStatsOf(s: State, today = dayKey(new Date())): RankStats {
  const from30 = addDays(today, -29);
  const from7 = addDays(today, -6);
  const entries = Object.entries(s.days).filter(([k]) => k <= today);
  return {
    dias: entries.filter(([k, d]) => k >= from30 && Object.keys(d.done).length > 0).length,
    missoes: entries.filter(([k]) => k >= from7).reduce((n, [, d]) => n + Object.keys(d.done).length, 0),
    conquistas: Object.keys(s.achievements).length,
    colecoes: Object.keys(s.game.paid).filter((r) => r.startsWith('colecao:')).length,
    arenas: currentArena(s),
  };
}

export const socialBlocked = (s: State) => s.profile.ageGroup === 'ate12';
export const teenMode = (s: State) => isMinor(s.profile.ageGroup);

let lastSent = '';
/** Atualiza o perfil público quando algo visível muda (nome, roupa, casa, nível).
 *  Se o servidor recusar (por exemplo, um nome que não passa no filtro), devolve o motivo. */
export async function syncProfile(s: State): Promise<string | null> {
  if (!s.onboarded || socialBlocked(s)) return null;
  const api = await getSocial();
  if (!api) return null;
  const p = publicProfileOf(s);
  const sig = JSON.stringify(p);
  if (sig === lastSent) return null;
  lastSent = sig;
  try {
    await api.saveProfile(p);
    return null;
  } catch (e) {
    lastSent = '';
    return e instanceof Error && e.message ? e.message : 'Não deu certo agora.';
  }
}

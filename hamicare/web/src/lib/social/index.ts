// Escolhe onde a parte social roda: página publicada no Claude (link de teste) ou servidor.
import { useEffect, useState } from 'react';
import { capability } from '../platform';
import { levelOf } from '../../logic/progress';
import { isMinor } from '../../logic/evolution';
import type { State } from '../../types';
import { createArtifactSocial } from './artifact';
import { createApiSocial, serverAvailable } from './api';
import type { Profile, SocialApi } from './types';

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
export function resetSocial() {
  pending = null;
}

export function useSocial(): { api: SocialApi | null; loading: boolean } {
  const [api, setApi] = useState<SocialApi | null>(null);
  const [loading, setLoading] = useState(true);
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
  }, []);
  return { api, loading };
}

/** O que vai para o perfil público: nunca peso, diário ou humor. */
export function publicProfileOf(s: State): Omit<Profile, 'id' | 'code' | 'updatedAt'> {
  return {
    name: s.profile.name || 'Alguém',
    pet: { name: s.pet.name, fur: s.pet.fur, phase: s.pet.phase, outfit: s.pet.outfit },
    house: s.house,
    level: levelOf(s.xp),
    teen: s.profile.ageGroup === '13a17',
    acceptsRequests: s.privacy.requests === 'todos',
  };
}

export const socialBlocked = (s: State) => s.profile.ageGroup === 'ate12';
export const teenMode = (s: State) => isMinor(s.profile.ageGroup);

let lastSent = '';
/** Atualiza o perfil público quando algo visível muda (nome, roupa, casa, nível). */
export async function syncProfile(s: State) {
  if (!s.onboarded || socialBlocked(s)) return;
  const api = await getSocial();
  if (!api) return;
  const p = publicProfileOf(s);
  const sig = JSON.stringify(p);
  if (sig === lastSent) return;
  lastSent = sig;
  try {
    await api.saveProfile(p);
  } catch {
    lastSent = '';
  }
}

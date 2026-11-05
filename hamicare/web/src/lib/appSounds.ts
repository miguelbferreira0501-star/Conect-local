// Liga os efeitos sonoros ao app: opção dos Ajustes, toques de botão e os sons que vêm das mudanças
// do estado (missão feita ou desfeita, sementes ganhas, compra, roupa nova, casa arrumada, foto).
import { configureSound, installSound, play, type SoundId } from './sound';
import { getState, todayKey, watchState } from './store';
import type { State } from '../types';

export const VOLUME = { baixo: 0.45, medio: 0.8, alto: 1.15 } as const;

let gestureAt = -1e9;
/** Só toca som de mudança de estado logo depois de um toque da pessoa (não na sincronização). */
const byPerson = () => performance.now() - gestureAt < 2500;

/** O que mudou e merece som, do mais importante para o menos. Só um toca por vez. */
export function soundForChange(s: State, prev: State, today = todayKey()): SoundId | null {
  if (!prev.onboarded && s.onboarded) return 'magia';
  const done = Object.keys(s.days[today]?.done ?? {}).length;
  const before = Object.keys(prev.days[today]?.done ?? {}).length;
  if (done > before) return 'tarefa';
  if (done < before) return 'desfazer';
  if (s.coins < prev.coins) return 'compra';
  if (JSON.stringify(s.pet.outfit) !== JSON.stringify(prev.pet.outfit) || s.pet.fur !== prev.pet.fur) return 'vestir';
  if (s.house !== prev.house && (s.house.items.length !== prev.house.items.length || s.house.wallpaper !== prev.house.wallpaper || s.house.floor !== prev.house.floor)) return 'colocar';
  if (s.photos.length > prev.photos.length) return 'foto';
  if (s.journal.length > prev.journal.length || s.jar.length > prev.jar.length) return 'enviar';
  if (s.coins > prev.coins) return 'semente';
  return null;
}

let installed = false;
export function installAppSounds() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  configureSound({
    enabled: () => getState().settings.sound !== false,
    volume: () => VOLUME[getState().settings.volume ?? 'medio'] ?? VOLUME.medio,
  });
  installSound();
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => (gestureAt = performance.now()), { capture: true, passive: true });
  watchState((s, prev) => {
    if (!byPerson()) return;
    const id = soundForChange(s, prev);
    if (id) play(id);
  });
}

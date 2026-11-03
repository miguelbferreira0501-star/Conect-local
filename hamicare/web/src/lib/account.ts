// Conta no servidor do HamiCare: login, backup automático, Plus e push.
import { useEffect, useState } from 'react';
import { http, resetServerCheck } from './social/api';
import { resetSocial } from './social';
import { getState, grantPremium, replaceState, setChangeHook } from './store';
import { LEGAL_INFO } from '../shared/legal';
import type { State } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  ageGroup: 'ate12' | '13a17' | '18mais';
  role: 'user' | 'admin';
  premiumUntil: string | null;
  trialUsed: boolean;
}

let reachable: Promise<boolean> | null = null;
/** Existe servidor do HamiCare neste endereço? (Não existe na página de teste nem no arquivo local.) */
export function serverReachable(): Promise<boolean> {
  if (location.protocol === 'file:' || (window as unknown as { claude?: unknown }).claude) return Promise.resolve(false);
  if (!reachable) reachable = http<{ app: string }>('GET', '/health').then((r) => r.app === 'hamicare').catch(() => false);
  return reachable;
}

let current: User | null = null;
const listeners = new Set<(u: User | null) => void>();
function setUser(u: User | null) {
  current = u;
  listeners.forEach((l) => l(u));
  resetSocial();
  resetServerCheck();
  if (u) grantPremium(u.premiumUntil);
}

export function useAccount() {
  const [user, setU] = useState<User | null>(current);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(false);
  useEffect(() => {
    listeners.add(setU);
    serverReachable().then(async (ok) => {
      setOnline(ok);
      if (ok && !current) {
        const r = await http<{ user: User | null }>('GET', '/auth/me').catch(() => ({ user: null }));
        if (r.user) {
          setUser(r.user);
          startSync();
        }
      }
      setReady(true);
    });
    return () => {
      listeners.delete(setU);
    };
  }, []);
  return { user, ready, online };
}

export async function register(input: { name: string; email: string; password: string; ageGroup: User['ageGroup']; guardianConsent: boolean }) {
  const r = await http<{ user: User }>('POST', '/auth/register', { ...input, acceptTerms: true, healthConsent: true, termsVersion: LEGAL_INFO.atualizado });
  setUser(r.user);
  return firstSync();
}

export async function login(email: string, password: string) {
  const r = await http<{ user: User }>('POST', '/auth/login', { email, password });
  setUser(r.user);
  return firstSync();
}

/** Esqueci minha senha: o servidor manda o link se a conta existir (a resposta é sempre igual). */
export async function requestReset(email: string) {
  await http('POST', '/auth/forgot', { email });
}

export async function checkReset(token: string): Promise<boolean> {
  return http<{ valid: boolean }>('POST', '/auth/reset/check', { token }).then((r) => r.valid);
}

/** Troca a senha com o link do e-mail e já entra na conta. */
export async function finishReset(token: string, password: string) {
  const r = await http<{ user: User }>('POST', '/auth/reset', { token, password });
  setUser(r.user);
  return firstSync();
}

export async function logout() {
  stopSync();
  await http('POST', '/auth/logout').catch(() => {});
  setUser(null);
}

export async function deleteAccount(password: string) {
  await http('DELETE', '/account', { password });
  stopSync();
  setUser(null);
}

export async function startTrialOnServer(): Promise<string | null> {
  const r = await http<{ premiumUntil: string }>('POST', '/plus/trial');
  grantPremium(r.premiumUntil);
  if (current) current = { ...current, premiumUntil: r.premiumUntil, trialUsed: true };
  return r.premiumUntil;
}

// ---------- Backup automático ----------

export type SyncChoice = { server: State; local: State } | null;
let pendingChoice: ((c: SyncChoice) => void) | null = null;
export function onSyncChoice(fn: (c: SyncChoice) => void) {
  pendingChoice = fn;
  return () => {
    pendingChoice = null;
  };
}

/** Na primeira entrada: se a nuvem e o aparelho têm progresso, a pessoa escolhe qual manter. */
async function firstSync(): Promise<'nuvem' | 'aparelho' | 'escolher'> {
  const r = await http<{ state: State | null }>('GET', '/state');
  const local = getState();
  if (r.state && !local.onboarded) {
    replaceState(r.state, { silent: true });
    startSync();
    return 'nuvem';
  }
  // Mesmo Hami (criado neste aparelho ou vindo do mesmo backup): fica a versão mais nova, sem perguntar.
  if (r.state && local.onboarded && sameOrigin(r.state, local)) {
    if ((r.state.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      replaceState(r.state, { silent: true });
      startSync();
      return 'nuvem';
    }
  } else if (r.state && local.onboarded && JSON.stringify(r.state.pet) !== JSON.stringify(local.pet)) {
    pendingChoice?.({ server: r.state, local });
    return 'escolher';
  }
  startSync();
  await pushNow();
  return 'aparelho';
}

/** Os dois lados nasceram do mesmo começo (mesma semente e mesmo dia de criação)? */
function sameOrigin(a: State, b: State) {
  return a.seed === b.seed && a.createdAt === b.createdAt && a.pet?.name === b.pet?.name;
}

export async function resolveChoice(keep: 'nuvem' | 'aparelho', server: State) {
  if (keep === 'nuvem') replaceState(server, { silent: true });
  startSync();
  await pushNow();
}

let timer: number | undefined;
async function pushNow() {
  const s = getState();
  if (!s.onboarded) return;
  await http('PUT', '/state', { state: s, clientUpdatedAt: s.updatedAt }).catch(() => {});
}

function startSync() {
  setChangeHook(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(pushNow, 3000);
  });
}

function stopSync() {
  setChangeHook(null);
  window.clearTimeout(timer);
}

// ---------- Push (app instalado) ----------

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Liga o push no servidor: assina o navegador e envia horário e tipos de lembrete. */
export async function syncPush(s: State): Promise<'ok' | 'sem-suporte' | 'sem-permissao' | 'sem-conta'> {
  if (!current) return 'sem-conta';
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (!reg || !('PushManager' in window)) return 'sem-suporte';
  try {
    if (s.settings.notif.enabled) {
      if (Notification.permission !== 'granted') return 'sem-permissao';
      const { publicKey } = await http<{ publicKey: string }>('GET', '/push/key');
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      await http('POST', '/push/subscribe', sub.toJSON());
    }
    await http('PUT', '/push/prefs', { enabled: s.settings.notif.enabled, time: s.settings.notif.time, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, kinds: s.settings.notif.kinds });
    return 'ok';
  } catch {
    return 'sem-suporte';
  }
}

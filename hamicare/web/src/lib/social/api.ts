// Parte social e conta usando o servidor do HamiCare (hamicare/server).
import type { ReactionId } from '../../shared/moderation';
import type { CommentResult, Feed, FriendState, Gift, GroupChallenge, Profile, ReportTarget, SocialApi } from './types';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function http<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'hamicare' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'erro', data?.message ?? 'Não deu certo agora. Tente de novo.');
  return data as T;
}

let health: Promise<boolean> | null = null;
/** Existe servidor do HamiCare neste endereço e a pessoa está logada? */
export function serverAvailable(): Promise<boolean> {
  if (location.protocol === 'file:') return Promise.resolve(false);
  if (!health) {
    health = http<{ user: unknown }>('GET', '/auth/me')
      .then((r) => !!r.user)
      .catch(() => false);
  }
  return health;
}
export function resetServerCheck() {
  health = null;
}

const id = (postKey: string) => postKey.split(':').pop()!;

export function createApiSocial(): SocialApi {
  return {
    kind: 'servidor',
    me: () => http<{ profile: Profile | null }>('GET', '/social/me').then((r) => r.profile),
    saveProfile: (p) => http<{ profile: Profile }>('PUT', '/social/profile', p).then((r) => r.profile),
    findByCode: (code) => http<{ profile: Profile | null }>('GET', `/social/code/${encodeURIComponent(code.trim())}`).then((r) => r.profile),
    request: (userId) => http<{ result: 'ok' | 'fechado' | 'bloqueado' }>('POST', `/social/friends/${userId}/request`).then((r) => r.result),
    accept: (userId) => http('POST', `/social/friends/${userId}/accept`),
    decline: (userId) => http('POST', `/social/friends/${userId}/decline`),
    remove: (userId) => http('DELETE', `/social/friends/${userId}`),
    block: (userId) => http('POST', `/social/blocks/${userId}`),
    unblock: (userId) => http('DELETE', `/social/blocks/${userId}`),
    friends: () => http<FriendState>('GET', '/social/friends'),
    feed: () => http<Feed>('GET', '/social/feed'),
    post: (p) => http('POST', '/social/posts', p),
    deletePost: (postId) => http('DELETE', `/social/posts/${postId}`),
    hideComment: (_postId, commentId) => http('POST', `/social/comments/${commentId}/hide`),
    react: (postKey, kind: ReactionId | null) => http('PUT', '/social/reactions', { postId: id(postKey), kind }),
    comment: async (postKey, text): Promise<CommentResult> => {
      try {
        await http('POST', '/social/comments', { postId: id(postKey), text });
        return { ok: true };
      } catch (e) {
        if (e instanceof ApiError && e.status === 422) return { ok: false, reason: e.message };
        throw e;
      }
    },
    deleteComment: (commentId) => http('DELETE', `/social/comments/${commentId}`),
    report: (target: ReportTarget, reason) => http('POST', '/social/reports', { ...target, id: target.type === 'post' ? id(target.id) : target.id, reason }),
    gifts: () => http<{ gifts: Gift[] }>('GET', '/social/gifts').then((r) => r.gifts),
    sendGift: (to, itemId, note) => http('POST', '/social/gifts', { to, itemId, note }),
    claimGift: (giftId) => http<{ gift: Gift | null }>('POST', `/social/gifts/${giftId}/claim`).then((r) => r.gift),
    challenges: () => http<{ challenges: GroupChallenge[] }>('GET', '/social/challenges').then((r) => r.challenges),
    createChallenge: (c) => http('POST', '/social/challenges', c),
    checkin: (cid) => http('POST', `/social/challenges/${cid}/checkin`),
    leaveChallenge: (cid) => http('DELETE', `/social/challenges/${cid}/membership`),
  };
}

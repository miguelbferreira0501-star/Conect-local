// Parte social usando o armazenamento compartilhado da página publicada no Claude (capacidades
// `db` e `user`). Cada pessoa escreve só nos próprios documentos (regras {self}); a lista de
// amigos, o feed e os comentários são montados juntando os documentos de todo mundo.
// Limite assumido: na página de teste, quem tem acesso ao link consegue ler os dados
// compartilhados. Peso, diário e humor nunca entram aqui.
import { checkKindness, REASON_TEXT, type ReactionId } from '../../shared/moderation';
import { addDays, hashStr, uid } from '../util';
import { todayKey } from '../store';
import type { Comment, Feed, FriendState, Gift, GroupChallenge, Post, Profile, Reaction, ReportTarget, SocialApi } from './types';
import { postKey } from './types';

/** Regras de acesso declaradas na publicação (ver scripts/artifact.mjs). */
export const DB_RULES = [
  ...['profiles', 'friends', 'posts', 'social', 'challenges'].flatMap((p) => [
    { path: p, read: 'view', write: 'owner' },
    { path: `${p}/{self}`, write: 'interact' },
  ]),
  { path: 'reports', read: 'admin', write: 'self' },
  { path: 'reports/{self}', read: 'view', write: 'interact' },
];

type Db = {
  doc: (p: string) => { get: () => Promise<{ exists: boolean; data: () => any }>; set: (d: object) => Promise<void> };
  collection: (p: string) => { get: () => Promise<{ docs: { id: string; exists: boolean; data: () => any }[] }> };
};

interface FriendsDoc {
  list: string[];
  blocked: string[];
}
interface PostsDoc {
  items: Post[];
  hidden: string[];
}
interface SocialDoc {
  reactions: Record<string, ReactionId>;
  comments: Comment[];
  gifts: Gift[];
  claimed: string[];
  joined: string[];
  checkins: Record<string, string[]>;
}
interface ChallengesDoc {
  items: Omit<GroupChallenge, 'members' | 'checkins'>[];
}

export const codeFor = (id: string) => `HAMI-${hashStr(id).toString(36).toUpperCase().padStart(6, '0').slice(-6)}`;

export function createArtifactSocial(db: Db, myId: string): SocialApi {
  const read = async <T>(path: string, fallback: T): Promise<T> => {
    const snap = await db.doc(path).get();
    return snap.exists ? { ...fallback, ...(snap.data() as T) } : fallback;
  };
  const all = async <T>(col: string): Promise<Record<string, T>> => {
    const snap = await db.collection(col).get();
    const out: Record<string, T> = {};
    for (const d of snap.docs) if (d.exists) out[d.id] = d.data() as T;
    return out;
  };
  const write = (path: string, data: object) => db.doc(path).set(JSON.parse(JSON.stringify(data)));
  const emptySocial = (): SocialDoc => ({ reactions: {}, comments: [], gifts: [], claimed: [], joined: [], checkins: {} });
  const mySocial = () => read<SocialDoc>(`social/${myId}`, emptySocial());
  const myFriends = () => read<FriendsDoc>(`friends/${myId}`, { list: [], blocked: [] });

  async function state() {
    const [profiles, friendDocs] = await Promise.all([all<Profile>('profiles'), all<FriendsDoc>('friends')]);
    const mine = friendDocs[myId] ?? { list: [], blocked: [] };
    const listsMe = (id: string) => (friendDocs[id]?.list ?? []).includes(myId);
    const blockedMe = (id: string) => (friendDocs[id]?.blocked ?? []).includes(myId);
    const ok = (id: string) => profiles[id] && !mine.blocked?.includes(id) && !blockedMe(id);
    const friends = Object.keys(profiles).filter((id) => id !== myId && ok(id) && mine.list.includes(id) && listsMe(id));
    return { profiles, friendDocs, mine, friends, listsMe, ok };
  }

  const api: SocialApi = {
    kind: 'pagina',
    async me() {
      const p = await read<Profile | null>(`profiles/${myId}`, null);
      return p ? { ...p, id: myId } : null;
    },
    async saveProfile(p) {
      const profile: Profile = { ...p, id: myId, code: codeFor(myId), updatedAt: Date.now() };
      await write(`profiles/${myId}`, profile);
      return profile;
    },
    async findByCode(code) {
      const clean = code.trim().toUpperCase().replace(/^HAMI-?/, '');
      const profiles = await all<Profile>('profiles');
      const hit = Object.entries(profiles).find(([id]) => codeFor(id).endsWith(clean) && clean.length >= 4);
      return hit && hit[0] !== myId ? { ...hit[1], id: hit[0] } : null;
    },
    async request(userId) {
      const [target, theirs, mine] = await Promise.all([read<Profile | null>(`profiles/${userId}`, null), read<FriendsDoc>(`friends/${userId}`, { list: [], blocked: [] }), myFriends()]);
      if (!target || theirs.blocked.includes(myId)) return 'bloqueado';
      if (!target.acceptsRequests && !theirs.list.includes(myId)) return 'fechado';
      if (!mine.list.includes(userId)) await write(`friends/${myId}`, { ...mine, list: [...mine.list, userId], blocked: mine.blocked.filter((b) => b !== userId) });
      return 'ok';
    },
    async accept(userId) {
      await api.request(userId);
    },
    async decline(userId) {
      const mine = await myFriends();
      await write(`friends/${myId}`, { ...mine, list: mine.list.filter((x) => x !== userId), blocked: [...new Set([...mine.blocked, userId])] });
      // "Recusar" bloqueia só o pedido; dá pra desfazer em Bloqueados.
    },
    async remove(userId) {
      const mine = await myFriends();
      await write(`friends/${myId}`, { ...mine, list: mine.list.filter((x) => x !== userId) });
    },
    async block(userId) {
      const mine = await myFriends();
      await write(`friends/${myId}`, { list: mine.list.filter((x) => x !== userId), blocked: [...new Set([...mine.blocked, userId])] });
    },
    async unblock(userId) {
      const mine = await myFriends();
      await write(`friends/${myId}`, { ...mine, blocked: mine.blocked.filter((x) => x !== userId) });
    },
    async friends(): Promise<FriendState> {
      const { profiles, mine, friends, listsMe, ok } = await state();
      const withId = (id: string) => ({ ...profiles[id], id });
      return {
        friends: friends.map(withId),
        incoming: Object.keys(profiles).filter((id) => id !== myId && ok(id) && listsMe(id) && !mine.list.includes(id)).map(withId),
        outgoing: mine.list.filter((id) => profiles[id] && !friends.includes(id)).map(withId),
        blocked: (mine.blocked ?? []).filter((id) => profiles[id]).map(withId),
      };
    },
    async feed(): Promise<Feed> {
      const [{ profiles, friends }, postDocs, socialDocs] = await Promise.all([state(), all<PostsDoc>('posts'), all<SocialDoc>('social')]);
      const visible = new Set([myId, ...friends]);
      const hidden = new Set<string>();
      const posts: Post[] = [];
      for (const [author, doc] of Object.entries(postDocs)) {
        if (!visible.has(author)) continue;
        (doc.hidden ?? []).forEach((h) => hidden.add(h));
        for (const p of doc.items ?? []) posts.push({ ...p, authorId: author });
      }
      posts.sort((a, b) => b.createdAt - a.createdAt);
      const keys = new Set(posts.map(postKey));
      const reactions: Reaction[] = [];
      const comments: Comment[] = [];
      for (const [author, doc] of Object.entries(socialDocs)) {
        if (!visible.has(author)) continue;
        for (const [k, kind] of Object.entries(doc.reactions ?? {})) if (keys.has(k)) reactions.push({ postKey: k, authorId: author, kind });
        for (const c of doc.comments ?? []) if (keys.has(c.postKey) && !hidden.has(c.id) && checkKindness(c.text).ok) comments.push({ ...c, authorId: author });
      }
      comments.sort((a, b) => a.createdAt - b.createdAt);
      const prof: Record<string, Profile> = {};
      for (const id of visible) if (profiles[id]) prof[id] = { ...profiles[id], id };
      return { posts: posts.slice(0, 60), profiles: prof, reactions, comments };
    },
    async post(p) {
      const doc = await read<PostsDoc>(`posts/${myId}`, { items: [], hidden: [] });
      const item: Post = { ...p, id: uid(), authorId: myId, createdAt: Date.now() };
      // Mantém o documento abaixo do limite de 256 KB: tira as fotos reais mais antigas primeiro.
      const items = [item, ...doc.items].slice(0, 40);
      for (let i = items.length - 1; i >= 0 && JSON.stringify(items).length > 230_000; i--) {
        if (items[i].image) items[i] = { ...items[i], image: undefined };
      }
      if (JSON.stringify(items).length > 240_000) throw new Error('grande demais');
      await write(`posts/${myId}`, { ...doc, items });
    },
    async deletePost(id) {
      const doc = await read<PostsDoc>(`posts/${myId}`, { items: [], hidden: [] });
      await write(`posts/${myId}`, { ...doc, items: doc.items.filter((p) => p.id !== id) });
    },
    async hideComment(_postId, commentId) {
      const doc = await read<PostsDoc>(`posts/${myId}`, { items: [], hidden: [] });
      await write(`posts/${myId}`, { ...doc, hidden: [...new Set([...(doc.hidden ?? []), commentId])].slice(-300) });
    },
    async react(key, kind) {
      const doc = await mySocial();
      const reactions = { ...doc.reactions };
      if (kind) reactions[key] = kind;
      else delete reactions[key];
      await write(`social/${myId}`, { ...doc, reactions });
    },
    async comment(key, text) {
      const check = checkKindness(text);
      if (!check.ok) return { ok: false, reason: REASON_TEXT[check.reason] };
      const doc = await mySocial();
      const c: Comment = { id: uid(), postKey: key, authorId: myId, text: check.text, createdAt: Date.now() };
      await write(`social/${myId}`, { ...doc, comments: [...doc.comments, c].slice(-200) });
      return { ok: true };
    },
    async deleteComment(id) {
      const doc = await mySocial();
      await write(`social/${myId}`, { ...doc, comments: doc.comments.filter((c) => c.id !== id) });
    },
    async report(target: ReportTarget, reason) {
      const doc = await read<{ items: object[] }>(`reports/${myId}`, { items: [] });
      await write(`reports/${myId}`, { items: [...doc.items, { ...target, reason, at: Date.now() }].slice(-100) });
    },
    async gifts() {
      const [socialDocs, mine] = await Promise.all([all<SocialDoc>('social'), mySocial()]);
      const out: Gift[] = [];
      for (const [from, doc] of Object.entries(socialDocs)) for (const g of doc.gifts ?? []) if (g.to === myId) out.push({ ...g, from, claimed: mine.claimed.includes(g.id) });
      return out.sort((a, b) => b.createdAt - a.createdAt);
    },
    async sendGift(to, itemId, note) {
      const doc = await mySocial();
      const g: Gift = { id: uid(), from: myId, to, itemId, note: note.slice(0, 80), createdAt: Date.now(), claimed: false };
      await write(`social/${myId}`, { ...doc, gifts: [...doc.gifts, g].slice(-100) });
    },
    async claimGift(id) {
      const gift = (await api.gifts()).find((g) => g.id === id && !g.claimed);
      if (!gift) return null;
      const doc = await mySocial();
      await write(`social/${myId}`, { ...doc, claimed: [...doc.claimed, id].slice(-300) });
      return gift;
    },
    async challenges() {
      const [{ friends }, chDocs, socialDocs] = await Promise.all([state(), all<ChallengesDoc>('challenges'), all<SocialDoc>('social')]);
      const out: GroupChallenge[] = [];
      for (const [owner, doc] of Object.entries(chDocs)) {
        for (const c of doc.items ?? []) {
          const id = `${owner}:${c.id}`;
          const members = Object.entries(socialDocs).filter(([, d]) => (d.joined ?? []).includes(id)).map(([u]) => u);
          // Aparece para quem participa e, como convite, para os amigos de quem criou.
          if (!members.includes(myId) && owner !== myId && !friends.includes(owner)) continue;
          const checkins: Record<string, string[]> = {};
          for (const m of members) checkins[m] = socialDocs[m]?.checkins?.[id] ?? [];
          out.push({ ...c, id, ownerId: owner, members, checkins });
        }
      }
      return out;
    },
    async createChallenge(c) {
      const doc = await read<ChallengesDoc>(`challenges/${myId}`, { items: [] });
      const id = uid();
      await write(`challenges/${myId}`, { items: [...doc.items, { id, ownerId: myId, title: c.title.slice(0, 50), emoji: c.emoji, target: c.target, endsAt: addDays(todayKey(), c.days) }].slice(-20) });
      const s = await mySocial();
      await write(`social/${myId}`, { ...s, joined: [...s.joined, `${myId}:${id}`] });
    },
    async checkin(id) {
      const s = await mySocial();
      const today = todayKey();
      const list = s.checkins[id] ?? [];
      const joined = s.joined.includes(id) ? s.joined : [...s.joined, id];
      if (!list.includes(today)) await write(`social/${myId}`, { ...s, joined, checkins: { ...s.checkins, [id]: [...list, today] } });
    },
    async leaveChallenge(id) {
      const s = await mySocial();
      await write(`social/${myId}`, { ...s, joined: s.joined.filter((j) => j !== id) });
    },
  };
  return api;
}

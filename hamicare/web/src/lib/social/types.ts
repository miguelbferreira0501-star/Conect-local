// Contrato da parte social. Duas implementações: servidor do HamiCare (produção) e
// armazenamento compartilhado da página publicada no Claude (link de teste).
import type { House, Outfit, PetMood } from '../../types';
import type { ReactionId } from '../../shared/moderation';

/** O que os amigos veem do Hami: nunca o peso. */
export interface PublicPet {
  name: string;
  fur: string;
  phase: number;
  outfit: Outfit;
}

export interface Profile {
  id: string;
  name: string;
  code: string;
  pet: PublicPet;
  house: House;
  level: number;
  /** 13 a 17: só elogios prontos, sem foto real. */
  teen: boolean;
  acceptsRequests: boolean;
  /** Bio curta (passa pelo filtro de gentileza). */
  bio?: string;
  /** Contadores públicos: só coisas boas. */
  streak?: number;
  badges?: number;
  updatedAt: number;
}

/** Perfil aberto de alguém, no estilo rede social. */
export interface UserPage {
  profile: Profile;
  /** Posts do feed geral (só aparecem para amigos). */
  posts: Post[];
  friendsCount: number;
  isFriend: boolean;
}

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  emoji: string;
  color: string;
  members: string[];
  createdAt: number;
}

export type PostKind = 'foto' | 'atividade' | 'conquista' | 'decoracao' | 'momento';

export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  text: string;
  pet?: PublicPet & { mood: PetMood };
  house?: House;
  /** Foto real (JPEG em data URL), só para 18+. */
  image?: string;
  /** Post do mural de um grupo (não aparece no feed geral). */
  groupId?: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  postKey: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Reaction {
  postKey: string;
  authorId: string;
  kind: ReactionId;
}

export interface Gift {
  id: string;
  from: string;
  to: string;
  itemId: string;
  note: string;
  createdAt: number;
  claimed: boolean;
}

export interface GroupChallenge {
  id: string;
  ownerId: string;
  title: string;
  emoji: string;
  /** Meta em dias, dentro do prazo. */
  target: number;
  endsAt: string;
  members: string[];
  checkins: Record<string, string[]>;
}

export interface FriendState {
  friends: Profile[];
  incoming: Profile[];
  outgoing: Profile[];
  blocked: Profile[];
}

export interface Feed {
  posts: Post[];
  profiles: Record<string, Profile>;
  reactions: Reaction[];
  comments: Comment[];
}

export type ReportTarget = { type: 'post' | 'comment' | 'user'; id: string; userId: string };
export type CommentResult = { ok: true } | { ok: false; reason: string };

export const postKey = (p: Pick<Post, 'authorId' | 'id'>) => `${p.authorId}:${p.id}`;

export interface SocialApi {
  kind: 'pagina' | 'servidor';
  /** Seu perfil público (null se não houver identidade aqui). */
  me(): Promise<Profile | null>;
  saveProfile(p: Omit<Profile, 'id' | 'code' | 'updatedAt'>): Promise<Profile>;
  findByCode(code: string): Promise<Profile | null>;
  request(userId: string): Promise<'ok' | 'fechado' | 'bloqueado'>;
  accept(userId: string): Promise<void>;
  decline(userId: string): Promise<void>;
  remove(userId: string): Promise<void>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  friends(): Promise<FriendState>;
  feed(): Promise<Feed>;
  post(p: Omit<Post, 'id' | 'authorId' | 'createdAt'>): Promise<void>;
  deletePost(id: string): Promise<void>;
  /** Esconde um comentário de um post seu (moderação de quem postou). */
  hideComment(postId: string, commentId: string): Promise<void>;
  react(postKey: string, kind: ReactionId | null): Promise<void>;
  comment(postKey: string, text: string): Promise<CommentResult>;
  deleteComment(id: string): Promise<void>;
  report(target: ReportTarget, reason: string): Promise<void>;
  gifts(): Promise<Gift[]>;
  sendGift(to: string, itemId: string, note: string): Promise<void>;
  claimGift(id: string): Promise<Gift | null>;
  /** Perfil de alguém (null se não der para ver). */
  profile(userId: string): Promise<UserPage | null>;
  groups(): Promise<{ groups: Group[]; profiles: Record<string, Profile> }>;
  createGroup(g: { name: string; emoji: string; color: string; members: string[] }): Promise<Group>;
  addToGroup(groupId: string, userId: string): Promise<void>;
  /** Sair (ou, para quem criou, tirar alguém). Quem criou e sai apaga o grupo. */
  leaveGroup(groupId: string, userId: string): Promise<void>;
  groupFeed(groupId: string): Promise<Feed>;
  challenges(): Promise<GroupChallenge[]>;
  createChallenge(c: { title: string; emoji: string; target: number; days: number }): Promise<void>;
  checkin(id: string): Promise<void>;
  leaveChallenge(id: string): Promise<void>;
}

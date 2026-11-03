// Peças do feed: avatar com anel, post estilo rede social (toque duplo = carinho) e o compositor.
import { useEffect, useRef, useState } from 'react';
import { Camera, Flag, Home as HomeIcon, MessageCircle, MoreHorizontal, Send, ShieldBan, Trash2, X } from 'lucide-react';
import { Hamster } from '../../components/Hamster';
import { Room } from '../../components/Room';
import { Sheet, toast } from '../../components/ui';
import { periodOf } from '../../data/lines';
import { PRESET_COMMENTS, REACTIONS, checkKindness, REASON_TEXT, type ReactionId } from '../../shared/moderation';
import { logEvent, useApp } from '../../lib/store';
import { hashStr, prefersReducedMotion } from '../../lib/util';
import { shrinkPhoto } from '../../lib/platform';
import { publicProfileOf, teenMode } from '../../lib/social';
import { postKey, type Feed, type Post, type PublicPet, type SocialApi } from '../../lib/social/types';
import type { Photo, Task } from '../../types';

export type ShareDraft = { kind: 'foto'; photo: Photo } | { kind: 'atividade'; task: Task } | null;

const PASTEL = ['#FFD6E4', '#D9ECFF', '#DFF5D2', '#EBDDFF', '#FFE9C2', '#D4F3EE'];
export const pastelOf = (id: string) => PASTEL[hashStr(id) % PASTEL.length];

/** Rosto do Hami da pessoa num círculo, com anel colorido (como os "stories"). */
export function Avatar({ pet, id, size = 48, ring = false, label }: { pet: PublicPet; id: string; size?: number; ring?: boolean; label?: string }) {
  const k = 1.45;
  return (
    <span className={`avatar ${ring ? 'avatar-ring' : ''}`} style={{ width: size + (ring ? 8 : 0), height: size + (ring ? 8 : 0) }} role="img" aria-label={label ?? pet.name}>
      <span className="avatar-in" style={{ width: size, height: size, background: pastelOf(id) }}>
        <span className="absolute" style={{ left: size / 2 - (k * size) / 2, top: size / 2 - 0.66 * k * size }}>
          <Hamster fur={pet.fur} phase={pet.phase} outfit={pet.outfit} size={k * size} idle={false} neutral label="" />
        </span>
      </span>
    </span>
  );
}

const KIND_STICKER: Record<Post['kind'], string> = { atividade: '✅', foto: '📸', decoracao: '🏡', conquista: '🏆', momento: '💛' };

/** A "foto" do post: foto real, casa ou o Hami num fundo colorido. */
export function PostMedia({ post, square }: { post: Post; square?: boolean }) {
  if (post.image) return <img src={post.image} alt={post.text || 'Foto compartilhada'} className={`post-media object-cover ${square ? 'aspect-square' : 'max-h-[420px]'}`} />;
  if (post.house)
    return (
      <div className="post-media overflow-hidden">
        <Room house={post.house} period={periodOf()} height={square ? 120 : 230}>
          {post.pet && <Hamster fur={post.pet.fur} phase={post.pet.phase} outfit={post.pet.outfit} mood={post.pet.mood} size={square ? 60 : 110} idle={false} neutral />}
        </Room>
      </div>
    );
  return (
    <div className={`post-media post-pet ${square ? 'aspect-square' : 'aspect-[5/4]'}`} style={{ background: `linear-gradient(160deg, ${pastelOf(post.id)}, #ffffff)` }}>
      <span className="post-sticker" aria-hidden="true">
        {KIND_STICKER[post.kind]}
      </span>
      {post.pet && <Hamster fur={post.pet.fur} phase={post.pet.phase} outfit={post.pet.outfit} mood={post.pet.mood} size={square ? 90 : 190} idle={false} neutral />}
    </div>
  );
}

export function timeAgo(ms: number): string {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d} d` : new Date(ms).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

export function PostCard({ post, feed, api, reload, myId, onOpenProfile }: { post: Post; feed: Feed; api: SocialApi; reload: () => void; myId: string; onOpenProfile?: (id: string) => void }) {
  const s = useApp();
  const author = feed.profiles[post.authorId];
  const key = postKey(post);
  const mine = post.authorId === myId;
  const reactions = feed.reactions.filter((r) => r.postKey === key);
  const myReaction = reactions.find((r) => r.authorId === myId)?.kind;
  const comments = feed.comments.filter((c) => c.postKey === key);
  const [menu, setMenu] = useState(false);
  const [text, setText] = useState('');
  const [all, setAll] = useState(false);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const teen = teenMode(s);

  async function react(kind: ReactionId | null) {
    await api.react(key, kind);
    if (kind && !mine) logEvent('vibe');
    reload();
  }
  async function send(t: string) {
    const r = await api.comment(key, t);
    if (!r.ok) return toast(r.reason);
    setText('');
    reload();
  }
  function tapMedia() {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!prefersReducedMotion()) setBurst(now);
      if (myReaction !== 'carinho') react('carinho');
    }
    lastTap.current = now;
  }

  const shown = all ? comments : comments.slice(-2);
  return (
    <article className="post">
      <header className="flex items-center gap-3 px-4 pt-3">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onOpenProfile?.(post.authorId)} aria-label={`Abrir perfil de ${author?.name ?? 'amigo'}`}>
          {author && <Avatar pet={author.pet} id={author.id} size={40} ring />}
          <span className="min-w-0">
            <span className="block truncate font-extrabold leading-tight">{author?.name ?? 'Amigo'}</span>
            <span className="block text-[12px] text-muted">
              {author?.pet.name} · {timeAgo(post.createdAt)}
            </span>
          </span>
        </button>
        <button className="icon-btn !h-9 !w-9" aria-label="Mais opções" onClick={() => setMenu(true)}>
          <MoreHorizontal size={18} />
        </button>
      </header>
      <div className="relative mt-3 select-none" onClick={tapMedia}>
        <PostMedia post={post} />
        {burst > 0 && (
          <span key={burst} className="like-burst" aria-hidden="true">
            💛
          </span>
        )}
      </div>
      <div className="grid gap-2 px-4 pb-4 pt-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Reações">
          {REACTIONS.map((r) => {
            const n = reactions.filter((x) => x.kind === r.id).length;
            return (
              <button key={r.id} className={`react-btn ${myReaction === r.id ? 'is-on' : ''}`} aria-pressed={myReaction === r.id} aria-label={r.label} onClick={() => react(myReaction === r.id ? null : r.id)}>
                {r.emoji}
                {n > 0 && <span className="tabular-nums">{n}</span>}
              </button>
            );
          })}
          <span className="ml-auto flex items-center gap-1 text-[13px] font-bold text-muted">
            <MessageCircle size={16} /> {comments.length}
          </span>
        </div>
        {post.text && (
          <p className="whitespace-pre-wrap text-[15px] leading-snug">
            <b>{author?.name ?? 'Amigo'}</b> {post.text}
          </p>
        )}
        {comments.length > 2 && !all && (
          <button className="text-left text-[13px] font-bold text-muted" onClick={() => setAll(true)}>
            Ver todos os {comments.length} comentários
          </button>
        )}
        {shown.length > 0 && (
          <ul className="grid gap-1">
            {shown.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-[14px]">
                <span className="min-w-0 flex-1">
                  <button className="font-extrabold" onClick={() => onOpenProfile?.(c.authorId)}>
                    {feed.profiles[c.authorId]?.name ?? 'Amigo'}
                  </button>{' '}
                  {c.text}
                </span>
                {(c.authorId === myId || mine) && (
                  <button
                    className="text-muted"
                    aria-label="Remover comentário"
                    onClick={async () => {
                      if (c.authorId === myId) await api.deleteComment(c.id);
                      else await api.hideComment(post.id, c.id);
                      reload();
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PRESET_COMMENTS.slice(0, 6).map((p) => (
            <button key={p} className="chip chip-plain shrink-0 !text-[13px]" onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>
        {!teen && (
          <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), text.trim() && send(text))}>
            <label className="sr-only" htmlFor={`c-${key}`}>
              Comentário gentil
            </label>
            <input id={`c-${key}`} className="field !min-h-[42px] min-w-0 flex-1 !py-2" maxLength={200} placeholder="Escreva algo gentil…" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="icon-btn !h-[42px] !w-[42px]" type="submit" aria-label="Enviar" disabled={!text.trim()}>
              <Send size={17} />
            </button>
          </form>
        )}
        {text && !checkKindness(text).ok && <p className="text-[13px] text-danger">{(() => { const r = checkKindness(text); return r.ok ? '' : REASON_TEXT[r.reason]; })()}</p>}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Opções do post">
        <div className="grid gap-2 pt-1">
          {mine ? (
            <button className="opt" onClick={async () => (await api.deletePost(post.id), setMenu(false), reload())}>
              <Trash2 size={18} /> Apagar post
            </button>
          ) : (
            <>
              <button className="opt" onClick={async () => (await api.report({ type: 'post', id: key, userId: post.authorId }, 'conteudo'), setMenu(false), toast('Denúncia enviada. Obrigado por cuidar da comunidade.'))}>
                <Flag size={18} /> Denunciar post
              </button>
              <button className="opt" onClick={async () => (await api.block(post.authorId), setMenu(false), toast('Pessoa bloqueada.'), reload())}>
                <ShieldBan size={18} /> Bloquear {author?.name ?? 'pessoa'}
              </button>
            </>
          )}
          {comments
            .filter((c) => c.authorId !== myId)
            .map((c) => (
              <button key={c.id} className="opt text-[14px]" onClick={async () => (await api.report({ type: 'comment', id: c.id, userId: c.authorId }, 'comentario'), await api.hideComment(post.id, c.id).catch(() => {}), setMenu(false), toast('Comentário denunciado.'), reload())}>
                <Flag size={16} /> Denunciar: “{c.text.slice(0, 30)}”
              </button>
            ))}
        </div>
      </Sheet>
    </article>
  );
}

export function Composer({ open, api, draft, onClose, onPosted, groupId, groupName }: { open: boolean; api: SocialApi; draft: ShareDraft; onClose: () => void; onPosted: () => void; groupId?: string; groupName?: string }) {
  const s = useApp();
  const teen = teenMode(s);
  const [text, setText] = useState('');
  const [withHouse, setWithHouse] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setText(draft?.kind === 'atividade' ? `Concluí: ${draft.task.emoji} ${draft.task.title}` : draft?.kind === 'foto' ? draft.photo.caption : '');
    setImage(null);
    setWithHouse(false);
  }, [open, draft]);

  const pet = draft?.kind === 'foto' ? { name: s.pet.name, fur: draft.photo.snap.fur, phase: draft.photo.snap.phase, outfit: draft.photo.snap.outfit, mood: draft.photo.snap.mood } : { ...publicProfileOf(s).pet, mood: 'animado' as const };
  const check = text.trim() ? checkKindness(text) : ({ ok: true } as const);

  async function publish() {
    if (!check.ok) return toast(REASON_TEXT[check.reason]);
    setBusy(true);
    try {
      await api.post({ kind: draft?.kind === 'atividade' ? 'atividade' : image ? 'momento' : withHouse ? 'decoracao' : 'foto', text: text.trim(), pet, house: withHouse ? s.house : undefined, image: image ?? undefined, groupId });
      toast(groupName ? `Postado no grupo ${groupName}!` : 'Compartilhado com seus amigos!');
      onPosted();
      onClose();
    } catch {
      toast('Não deu pra compartilhar agora.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={groupName ? `Postar em ${groupName}` : 'Compartilhar'}>
      <div className="grid gap-3 pt-1">
        {image ? (
          <div className="relative">
            <img src={image} alt="Sua foto" className="max-h-[260px] w-full rounded-2xl object-cover" />
            <button className="icon-btn absolute right-2 top-2" aria-label="Tirar foto" onClick={() => setImage(null)}>
              <X size={18} />
            </button>
          </div>
        ) : withHouse ? (
          <Room house={s.house} period={periodOf()} height={180}>
            <Hamster fur={pet.fur} phase={pet.phase} outfit={pet.outfit} mood={pet.mood} size={96} idle={false} neutral />
          </Room>
        ) : (
          <div className="grid place-items-center rounded-2xl bg-surface2 py-2">
            <Hamster fur={pet.fur} phase={pet.phase} outfit={pet.outfit} mood={pet.mood} size={140} idle={false} neutral />
          </div>
        )}
        <label className="sr-only" htmlFor="post-text">
          Texto do post
        </label>
        <textarea id="post-text" className="field min-h-[80px] resize-none" maxLength={200} placeholder="Conte o que você conquistou (só coisas boas!)" value={text} onChange={(e) => setText(e.target.value)} />
        {!check.ok && <p className="text-[13px] text-danger">{REASON_TEXT[check.reason]}</p>}
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${withHouse ? 'chip-accent' : 'chip-plain'}`} onClick={() => (setWithHouse(!withHouse), setImage(null))}>
            <HomeIcon size={14} /> Mostrar minha casa
          </button>
          {!teen && s.privacy.sharePhotos && (
            <button className="chip chip-plain" onClick={() => file.current?.click()}>
              <Camera size={14} /> Foto real
            </button>
          )}
          <input
            ref={file}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const data = await shrinkPhoto(f).catch(() => null);
              if (data) setImage(data);
              else toast('Não deu pra usar essa foto.');
              e.target.value = '';
            }}
          />
        </div>
        {teen && <p className="text-[12px] text-muted">Para menores de 18, o feed mostra só o Hami e a casa, sem fotos reais.</p>}
        <p className="text-[12px] text-muted">{groupName ? 'Só quem está no grupo vê.' : 'Só seus amigos veem.'} Peso, calorias, diário e humor nunca são compartilhados.</p>
        <button className="btn btn-primary" disabled={busy || !check.ok} onClick={publish}>
          Publicar
        </button>
      </div>
    </Sheet>
  );
}


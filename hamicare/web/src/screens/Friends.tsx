import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Copy, Flag, Gift as GiftIcon, Home as HomeIcon, MoreHorizontal, Plus, Send, ShieldBan, Trash2, UserPlus, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Room } from '../components/Room';
import { Empty, Modal, Seg, Sheet, toast } from '../components/ui';
import { itemById } from '../data/items';
import { periodOf } from '../data/lines';
import { PRESET_COMMENTS, REACTIONS, checkKindness, REASON_TEXT, type ReactionId } from '../shared/moderation';
import { logEvent, payGift, receiveGift, todayKey, useApp } from '../lib/store';
import { copyText, formatDay } from '../lib/util';
import { shrinkPhoto } from '../lib/platform';
import { publicProfileOf, socialBlocked, syncProfile, teenMode, useSocial } from '../lib/social';
import { postKey, type Feed, type FriendState, type Gift, type GroupChallenge, type Post, type Profile, type SocialApi } from '../lib/social/types';
import type { Photo, Task } from '../types';

export type ShareDraft = { kind: 'foto'; photo: Photo } | { kind: 'atividade'; task: Task } | null;

type Tab = 'feed' | 'amigos' | 'desafios' | 'presentes';

export function Friends({ share, onShareDone, giftItem, onGiftDone, account }: { share: ShareDraft; onShareDone: () => void; giftItem: string | null; onGiftDone: () => void; account: React.ReactNode }) {
  const s = useApp();
  const { api, loading } = useSocial();
  const [tab, setTab] = useState<Tab>('feed');
  const [me, setMe] = useState<Profile | null>(null);
  const [fs, setFs] = useState<FriendState | null>(null);

  const refreshFriends = useCallback(async () => {
    if (!api) return;
    try {
      await syncProfile(s);
      const [p, f] = await Promise.all([api.me(), api.friends()]);
      setMe(p);
      setFs(f);
    } catch {
      toast('Não deu pra carregar os amigos agora.');
    }
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  if (socialBlocked(s)) {
    return (
      <Shell>
        <Empty>Para menores de 13 anos, amigos e feed ficam desligados. O resto do HamiCare funciona normalmente.</Empty>
      </Shell>
    );
  }
  if (loading) return <Shell><p className="text-center text-muted">Carregando…</p></Shell>;
  if (!api) {
    return (
      <Shell>
        <div className="card grid justify-items-center gap-3 p-5 text-center">
          <Hamster fur={s.pet.fur} phase={s.pet.phase} outfit={s.pet.outfit} size={120} neutral />
          <p className="font-display text-[20px] font-bold">Entre na sua conta para ter amigos</p>
          <p className="text-[15px] text-muted">Com conta, você ganha um código para adicionar amigos, visitar casas, mandar presentes e ver o feed só de gentileza. Seu progresso também fica salvo na nuvem.</p>
        </div>
        {account}
      </Shell>
    );
  }

  return (
    <Shell>
      <MyCode me={me} api={api} onAdded={refreshFriends} />
      {api.kind === 'pagina' && <p className="text-[12px] text-muted">Versão de teste: amigos são pessoas com acesso a este link. No app final, tudo passa pelo servidor do HamiCare.</p>}
      <Seg value={tab} onChange={setTab} label="Seções" options={[{ id: 'feed', label: 'Feed' }, { id: 'amigos', label: `Amigos${fs?.incoming.length ? ` (${fs.incoming.length})` : ''}` }, { id: 'desafios', label: 'Desafios' }, { id: 'presentes', label: 'Presentes' }]} />
      {tab === 'feed' && <FeedTab api={api} share={share} onShareDone={onShareDone} friends={fs} myId={me?.id ?? ''} />}
      {tab === 'amigos' && <FriendsTab api={api} fs={fs} refresh={refreshFriends} />}
      {tab === 'desafios' && <ChallengesTab api={api} profiles={fs ? Object.fromEntries([...fs.friends, ...(me ? [me] : [])].map((p) => [p.id, p])) : {}} myId={me?.id ?? ''} />}
      {tab === 'presentes' && <GiftsTab api={api} />}
      <GiftSheet api={api} itemId={giftItem} friends={fs?.friends ?? []} onClose={onGiftDone} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <header>
        <p className="eyebrow">Só vale gentileza por aqui</p>
        <h1 className="font-display text-[30px] font-bold leading-tight">Amigos</h1>
      </header>
      {children}
    </div>
  );
}

function MyCode({ me, api, onAdded }: { me: Profile | null; api: SocialApi; onAdded: () => void }) {
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Profile | null | 'nada'>(null);
  return (
    <section className="card grid gap-3 p-4" aria-label="Adicionar amigos">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-muted">Seu código</p>
          <p className="select-all font-display text-[24px] font-bold tracking-wide">{me?.code ?? '…'}</p>
        </div>
        {me && (
          <button className="btn btn-soft btn-sm" onClick={async () => toast((await copyText(me.code)) ? 'Código copiado' : `Seu código é ${me.code}`)}>
            <Copy size={16} /> Copiar
          </button>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const p = await api.findByCode(code);
          setFound(p ?? 'nada');
        }}
      >
        <label className="sr-only" htmlFor="friend-code">
          Código do amigo
        </label>
        <input id="friend-code" className="field min-w-0 flex-1 uppercase" placeholder="Código do amigo (HAMI-…)" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn btn-primary shrink-0" type="submit" disabled={code.trim().length < 4} aria-label="Procurar">
          <UserPlus size={18} />
        </button>
      </form>
      {found === 'nada' && <p className="text-[14px] text-muted">Não achamos ninguém com esse código. Confira as letras.</p>}
      {found && found !== 'nada' && (
        <div className="flex items-center gap-3 rounded-2xl bg-surface2 p-3">
          <Hamster fur={found.pet.fur} phase={found.pet.phase} outfit={found.pet.outfit} size={60} idle={false} neutral />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{found.name}</p>
            <p className="text-[13px] text-muted">
              {found.pet.name} · nível {found.level}
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              const r = await api.request(found.id);
              toast(r === 'ok' ? 'Pedido enviado!' : r === 'fechado' ? 'Essa pessoa não está aceitando pedidos agora.' : 'Não foi possível adicionar.');
              setFound(null);
              setCode('');
              onAdded();
            }}
          >
            Pedir amizade
          </button>
        </div>
      )}
    </section>
  );
}

// ---------- Feed ----------

function FeedTab({ api, share, onShareDone, friends, myId }: { api: SocialApi; share: ShareDraft; onShareDone: () => void; friends: FriendState | null; myId: string }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [composer, setComposer] = useState(false);
  const load = useCallback(() => api.feed().then(setFeed).catch(() => toast('Não deu pra carregar o feed.')), [api]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (share) setComposer(true);
  }, [share]);

  return (
    <div className="grid gap-3">
      <button className="btn btn-primary" onClick={() => setComposer(true)}>
        <Plus size={18} /> Compartilhar um momento
      </button>
      {!feed ? (
        <p className="text-center text-muted">Carregando…</p>
      ) : feed.posts.length ? (
        feed.posts.map((p) => <PostCard key={postKey(p)} post={p} feed={feed} api={api} reload={load} myId={myId} />)
      ) : (
        <Empty>{friends?.friends.length ? 'Ainda não tem posts. Que tal ser a primeira pessoa?' : 'Adicione amigos pelo código para ver o feed deles aqui.'}</Empty>
      )}
      <Composer
        open={composer}
        api={api}
        draft={share}
        onClose={() => {
          setComposer(false);
          onShareDone();
        }}
        onPosted={load}
      />
    </div>
  );
}

function PostCard({ post, feed, api, reload, myId }: { post: Post; feed: Feed; api: SocialApi; reload: () => void; myId: string }) {
  const s = useApp();
  const author = feed.profiles[post.authorId];
  const key = postKey(post);
  const mine = post.authorId === myId;
  const reactions = feed.reactions.filter((r) => r.postKey === key);
  const myReaction = reactions.find((r) => r.authorId === myId)?.kind;
  const comments = feed.comments.filter((c) => c.postKey === key);
  const [menu, setMenu] = useState(false);
  const [text, setText] = useState('');
  const teen = teenMode(s);

  async function react(kind: ReactionId) {
    await api.react(key, myReaction === kind ? null : kind);
    if (myReaction !== kind && !mine) logEvent('vibe');
    reload();
  }
  async function send(t: string) {
    const r = await api.comment(key, t);
    if (!r.ok) return toast(r.reason);
    setText('');
    reload();
  }

  return (
    <article className="card grid gap-3 p-4">
      <header className="flex items-center gap-3">
        {author && <Hamster fur={author.pet.fur} phase={author.pet.phase} outfit={author.pet.outfit} size={44} idle={false} neutral />}
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">{author?.name ?? 'Amigo'}</p>
          <p className="text-[12px] text-muted">{new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button className="icon-btn !h-9 !w-9" aria-label="Mais opções" onClick={() => setMenu(true)}>
          <MoreHorizontal size={18} />
        </button>
      </header>
      {post.text && <p className="whitespace-pre-wrap text-[16px]">{post.text}</p>}
      {post.image && <img src={post.image} alt={post.text || 'Foto compartilhada'} className="max-h-[360px] w-full rounded-2xl object-cover" />}
      {post.house && !post.image && (
        <Room house={post.house} period={periodOf()} height={190}>
          {post.pet && <Hamster fur={post.pet.fur} phase={post.pet.phase} outfit={post.pet.outfit} mood={post.pet.mood} size={100} idle={false} neutral />}
        </Room>
      )}
      {post.pet && !post.house && !post.image && (
        <div className="grid place-items-center rounded-2xl bg-surface2 py-2">
          <Hamster fur={post.pet.fur} phase={post.pet.phase} outfit={post.pet.outfit} mood={post.pet.mood} size={160} idle={false} neutral />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reações">
        {REACTIONS.map((r) => {
          const n = reactions.filter((x) => x.kind === r.id).length;
          return (
            <button key={r.id} className={`chip ${myReaction === r.id ? 'chip-accent' : 'chip-plain'}`} aria-pressed={myReaction === r.id} aria-label={r.label} onClick={() => react(r.id)}>
              {r.emoji} {n > 0 && <span className="tabular-nums">{n}</span>}
            </button>
          );
        })}
      </div>
      {comments.length > 0 && (
        <ul className="grid gap-1.5">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 rounded-2xl bg-surface2 px-3 py-2 text-[14px]">
              <span className="min-w-0 flex-1">
                <b>{feed.profiles[c.authorId]?.name ?? 'Amigo'}</b> {c.text}
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
          <button key={p} className="chip chip-plain shrink-0" onClick={() => send(p)}>
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
          {comments.filter((c) => c.authorId !== myId).map((c) => (
            <button key={c.id} className="opt text-[14px]" onClick={async () => (await api.report({ type: 'comment', id: c.id, userId: c.authorId }, 'comentario'), await api.hideComment(post.id, c.id).catch(() => {}), setMenu(false), toast('Comentário denunciado.'), reload())}>
              <Flag size={16} /> Denunciar: “{c.text.slice(0, 30)}”
            </button>
          ))}
        </div>
      </Sheet>
    </article>
  );
}

function Composer({ open, api, draft, onClose, onPosted }: { open: boolean; api: SocialApi; draft: ShareDraft; onClose: () => void; onPosted: () => void }) {
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
      await api.post({ kind: draft?.kind === 'atividade' ? 'atividade' : image ? 'momento' : withHouse ? 'decoracao' : 'foto', text: text.trim(), pet, house: withHouse ? s.house : undefined, image: image ?? undefined });
      toast('Compartilhado com seus amigos!');
      onPosted();
      onClose();
    } catch {
      toast('Não deu pra compartilhar agora.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Compartilhar">
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
        <p className="text-[12px] text-muted">Só seus amigos veem. Peso, diário e humor nunca são compartilhados.</p>
        <button className="btn btn-primary" disabled={busy || !check.ok} onClick={publish}>
          Publicar
        </button>
      </div>
    </Sheet>
  );
}

// ---------- Amigos ----------

function FriendsTab({ api, fs, refresh }: { api: SocialApi; fs: FriendState | null; refresh: () => void }) {
  const [visit, setVisit] = useState<Profile | null>(null);
  if (!fs) return <p className="text-center text-muted">Carregando…</p>;
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    await fn();
    toast(msg);
    refresh();
  };
  return (
    <div className="grid gap-4">
      {fs.incoming.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-display text-[19px] font-bold">Pedidos de amizade</h2>
          {fs.incoming.map((p) => (
            <PersonRow key={p.id} p={p}>
              <button className="btn btn-primary btn-sm" onClick={() => act(() => api.accept(p.id), `Agora vocês são amigos!`)}>
                Aceitar
              </button>
              <button className="icon-btn" aria-label="Recusar" onClick={() => act(() => api.decline(p.id), 'Pedido recusado')}>
                <X size={16} />
              </button>
            </PersonRow>
          ))}
        </section>
      )}
      <section className="grid gap-2">
        <h2 className="font-display text-[19px] font-bold">Seus amigos ({fs.friends.length})</h2>
        {fs.friends.length ? (
          fs.friends.map((p) => (
            <PersonRow key={p.id} p={p}>
              <button className="btn btn-soft btn-sm" onClick={() => setVisit(p)}>
                Visitar
              </button>
              <button
                className="icon-btn"
                aria-label={`Mandar vibe boa para ${p.name}`}
                onClick={async () => {
                  await api.sendGift(p.id, 'vibe', 'Mandei uma vibe boa pra você 💛');
                  logEvent('vibe');
                  toast(`Vibe boa enviada para ${p.name}!`);
                }}
              >
                💛
              </button>
            </PersonRow>
          ))
        ) : (
          <Empty>Mande seu código para alguém ou peça o código de um amigo.</Empty>
        )}
      </section>
      {fs.outgoing.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-display text-[17px] font-bold text-muted">Esperando resposta</h2>
          {fs.outgoing.map((p) => (
            <PersonRow key={p.id} p={p}>
              <button className="btn btn-ghost btn-sm" onClick={() => act(() => api.remove(p.id), 'Pedido cancelado')}>
                Cancelar
              </button>
            </PersonRow>
          ))}
        </section>
      )}
      {fs.blocked.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-display text-[17px] font-bold text-muted">Bloqueados</h2>
          {fs.blocked.map((p) => (
            <PersonRow key={p.id} p={p}>
              <button className="btn btn-ghost btn-sm" onClick={() => act(() => api.unblock(p.id), 'Desbloqueado')}>
                Desbloquear
              </button>
            </PersonRow>
          ))}
        </section>
      )}
      <Modal open={!!visit} onClose={() => setVisit(null)} label="Visita">
        {visit && (
          <div className="grid gap-3 p-4">
            <p className="font-display text-[22px] font-bold">Casa de {visit.name}</p>
            <Room house={visit.house} period={periodOf()} height={240}>
              <Hamster fur={visit.pet.fur} phase={visit.pet.phase} outfit={visit.pet.outfit} size={120} neutral label={visit.pet.name} />
            </Room>
            <p className="text-[14px] text-muted">
              {visit.pet.name} · nível {visit.level}
            </p>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={() => setVisit(null)}>
                Que casa linda!
              </button>
              <button className="btn btn-ghost" onClick={() => (act(() => api.remove(visit.id), 'Amizade desfeita'), setVisit(null))}>
                Desfazer amizade
              </button>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm flex-1" onClick={() => (api.report({ type: 'user', id: visit.id, userId: visit.id }, 'perfil'), toast('Denúncia enviada.'))}>
                <Flag size={14} /> Denunciar
              </button>
              <button className="btn btn-ghost btn-sm flex-1" onClick={() => (act(() => api.block(visit.id), 'Pessoa bloqueada'), setVisit(null))}>
                <ShieldBan size={14} /> Bloquear
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PersonRow({ p, children }: { p: Profile; children: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <Hamster fur={p.pet.fur} phase={p.pet.phase} outfit={p.pet.outfit} size={50} idle={false} neutral />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{p.name}</p>
        <p className="truncate text-[13px] text-muted">
          {p.pet.name} · nível {p.level}
        </p>
      </div>
      {children}
    </div>
  );
}

// ---------- Desafios em grupo ----------

function ChallengesTab({ api, profiles, myId }: { api: SocialApi; profiles: Record<string, Profile>; myId: string }) {
  const [list, setList] = useState<GroupChallenge[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: 'Caminhar', emoji: '🚶', target: 5, days: 7 });
  const load = useCallback(() => api.challenges().then(setList).catch(() => setList([])), [api]);
  useEffect(() => {
    load();
  }, [load]);
  const today = todayKey();
  return (
    <div className="grid gap-3">
      <button className="btn btn-primary" onClick={() => setCreating(true)}>
        <Plus size={18} /> Criar desafio com amigos
      </button>
      {!list ? (
        <p className="text-center text-muted">Carregando…</p>
      ) : list.length ? (
        list.map((c) => {
          const inIt = c.members.includes(myId);
          const done = (c.checkins[myId] ?? []).includes(today);
          return (
            <article key={c.id} className="card grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="text-[30px]">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{c.title}</p>
                  <p className="text-[13px] text-muted">
                    {c.target} dias até {formatDay(c.endsAt, { day: 'numeric', month: 'short' })} · criado por {profiles[c.ownerId]?.name ?? 'amigo'}
                  </p>
                </div>
              </div>
              <ul className="grid gap-1.5">
                {c.members.map((m) => {
                  const n = (c.checkins[m] ?? []).length;
                  return (
                    <li key={m} className="flex items-center gap-2 text-[14px]">
                      <span className="w-24 truncate font-bold">{m === myId ? 'Você' : profiles[m]?.name ?? 'Amigo'}</span>
                      <div className="bar bar-thin flex-1">
                        <div className="bar-fill bar-leaf" style={{ transform: `scaleX(${Math.min(1, n / c.target)})` }} />
                      </div>
                      <span className="tabular-nums text-muted">
                        {n}/{c.target}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {inIt ? (
                <div className="flex gap-2">
                  <button className="btn btn-leaf btn-sm flex-1" disabled={done} onClick={async () => (await api.checkin(c.id), toast('Dia marcado!'), load())}>
                    {done ? 'Hoje já marcado ✓' : 'Marquei hoje'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={async () => (await api.leaveChallenge(c.id), load())}>
                    Sair
                  </button>
                </div>
              ) : (
                <button className="btn btn-soft btn-sm" onClick={async () => (await api.checkin(c.id), toast('Você entrou no desafio!'), load())}>
                  Entrar e marcar hoje
                </button>
              )}
            </article>
          );
        })
      ) : (
        <Empty>Crie um desafio leve, como "caminhar 5 dias nesta semana". Seus amigos veem e entram.</Empty>
      )}
      <p className="text-[12px] text-muted">Desafios contam dias, nunca peso ou medidas.</p>
      <Sheet open={creating} onClose={() => setCreating(false)} title="Novo desafio em grupo">
        <form
          className="grid gap-3 pt-1"
          onSubmit={async (e) => {
            e.preventDefault();
            const check = checkKindness(form.title);
            if (!check.ok) return toast(REASON_TEXT[check.reason]);
            await api.createChallenge(form);
            setCreating(false);
            toast('Desafio criado! Seus amigos já podem entrar.');
            load();
          }}
        >
          <div className="flex flex-wrap gap-2">
            {['🚶', '💧', '🧘', '📚', '🛏️', '🍎', '🚲', '💃'].map((em) => (
              <button type="button" key={em} className="mood-opt" aria-pressed={form.emoji === em} aria-label={em} onClick={() => setForm({ ...form, emoji: em })}>
                <span className="text-[22px]">{em}</span>
              </button>
            ))}
          </div>
          <label className="grid gap-1" htmlFor="ch-title">
            <span className="text-[14px] font-extrabold">O que vamos fazer?</span>
            <input id="ch-title" className="field" maxLength={50} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1" htmlFor="ch-target">
              <span className="text-[14px] font-extrabold">Meta (dias)</span>
              <input id="ch-target" className="field" type="number" min={1} max={30} value={form.target} onChange={(e) => setForm({ ...form, target: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} />
            </label>
            <label className="grid gap-1" htmlFor="ch-days">
              <span className="text-[14px] font-extrabold">Prazo (dias)</span>
              <input id="ch-days" className="field" type="number" min={1} max={60} value={form.days} onChange={(e) => setForm({ ...form, days: Math.max(1, Math.min(60, Number(e.target.value) || 7)) })} />
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={!form.title.trim() || form.target > form.days}>
            Criar desafio
          </button>
        </form>
      </Sheet>
    </div>
  );
}

// ---------- Presentes ----------

function GiftsTab({ api }: { api: SocialApi }) {
  const [list, setList] = useState<Gift[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const [g, f] = await Promise.all([api.gifts(), api.friends()]);
    setList(g);
    setNames(Object.fromEntries([...f.friends, ...f.incoming, ...f.outgoing].map((p) => [p.id, p.name])));
  }, [api]);
  useEffect(() => {
    load().catch(() => setList([]));
  }, [load]);
  if (!list) return <p className="text-center text-muted">Carregando…</p>;
  if (!list.length) return <Empty>Presentes e vibes boas de amigos aparecem aqui. Na Loja, toque em "Presentear um amigo".</Empty>;
  return (
    <ul className="grid gap-2">
      {list.map((g) => {
        const item = itemById(g.itemId);
        return (
          <li key={g.id} className="card flex items-center gap-3 p-3">
            <span className="text-[30px]">{g.itemId === 'vibe' ? '💛' : item?.emoji ?? '🎁'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">{g.itemId === 'vibe' ? 'Vibe boa' : item?.name ?? 'Presente'}</p>
              <p className="text-[13px] text-muted">
                de {names[g.from] ?? 'um amigo'} · {g.note}
              </p>
            </div>
            {g.itemId !== 'vibe' &&
              (g.claimed ? (
                <span className="chip chip-leaf">Recebido</span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    const got = await api.claimGift(g.id);
                    if (got) {
                      receiveGift(got.itemId);
                      toast(`${item?.name ?? 'Presente'} foi para o seu inventário!`);
                    }
                    load();
                  }}
                >
                  <GiftIcon size={16} /> Abrir
                </button>
              ))}
          </li>
        );
      })}
    </ul>
  );
}

function GiftSheet({ api, itemId, friends, onClose }: { api: SocialApi; itemId: string | null; friends: Profile[]; onClose: () => void }) {
  const s = useApp();
  const item = itemById(itemId);
  const [to, setTo] = useState<string | null>(null);
  return (
    <Sheet open={!!itemId} onClose={onClose} title="Presentear">
      {item && (
        <div className="grid gap-3 pt-1">
          <p className="text-[16px]">
            Mandar <b>{item.name}</b> por {item.price} sementes. Você tem {s.coins}.
          </p>
          {friends.length ? (
            friends.map((p) => (
              <button key={p.id} className="opt" aria-pressed={to === p.id} onClick={() => setTo(p.id)}>
                <Hamster fur={p.pet.fur} phase={p.pet.phase} outfit={p.pet.outfit} size={40} idle={false} neutral /> {p.name}
              </button>
            ))
          ) : (
            <Empty>Adicione amigos primeiro, na aba Amigos.</Empty>
          )}
          <button
            className="btn btn-primary"
            disabled={!to || s.coins < item.price}
            onClick={async () => {
              if (!to || !payGift(item.id)) return toast('Faltam sementes.');
              try {
                await api.sendGift(to, item.id, 'Um presentinho pra você 🎁');
                logEvent('vibe');
                toast('Presente enviado!');
              } catch {
                toast('Não deu pra enviar agora.');
              }
              onClose();
            }}
          >
            Enviar presente
          </button>
        </div>
      )}
    </Sheet>
  );
}


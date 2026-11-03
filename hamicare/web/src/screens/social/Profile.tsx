// Perfis no estilo rede social: o meu (com bio editável) e o de amigos (grade de posts, casa e ações).
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Copy, Flag, Grid3x3, Home as HomeIcon, Lock, Pencil, ShieldBan, UserPlus } from 'lucide-react';
import { Hamster } from '../../components/Hamster';
import { Room } from '../../components/Room';
import { Modal, Sheet, toast } from '../../components/ui';
import { periodOf } from '../../data/lines';
import { checkKindness, REASON_TEXT } from '../../shared/moderation';
import { logEvent, setBio, useApp } from '../../lib/store';
import { copyText } from '../../lib/util';
import { syncProfile } from '../../lib/social';
import { postKey, type Feed, type Post, type Profile, type SocialApi, type UserPage } from '../../lib/social/types';
import { Avatar, PostCard, PostMedia } from './Post';

function Counter({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="grid justify-items-center">
      <span className="font-display text-[21px] font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[12px] font-bold text-muted">{label}</span>
    </div>
  );
}

/** Topo da aba Amigos: o meu perfil, com código, bio e contadores. */
export function MyHeader({ me, api, postsCount, friendsCount, onAdd }: { me: Profile | null; api: SocialApi; postsCount: number; friendsCount: number; onAdd: () => void }) {
  const s = useApp();
  const [edit, setEdit] = useState(false);
  const [bio, setBioText] = useState(s.bio);
  const check = bio.trim() ? checkKindness(bio) : ({ ok: true } as const);
  if (!me) return <div className="card h-40 animate-pulse" />;
  return (
    <section className="profile-head" aria-label="Seu perfil">
      <div className="flex items-center gap-4">
        <Avatar pet={me.pet} id={me.id} size={78} ring label={`Hami de ${me.name}`} />
        <div className="grid flex-1 grid-cols-3 gap-1">
          <Counter value={postsCount} label="posts" />
          <Counter value={friendsCount} label="amigos" />
          <Counter value={`🔥${me.streak ?? 0}`} label="ofensiva" />
        </div>
      </div>
      <div className="grid gap-0.5">
        <p className="font-display text-[19px] font-bold leading-tight">{me.name}</p>
        <p className="text-[13px] font-bold text-muted">
          {me.code} · {me.pet.name} · nível {me.level}
        </p>
        <p className="whitespace-pre-wrap text-[14.5px]">{me.bio || <span className="text-muted">Escreva uma bio curtinha e gentil.</span>}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => (setBioText(s.bio), setEdit(true))}>
          <Pencil size={15} /> Editar
        </button>
        <button className="btn btn-ghost btn-sm" onClick={async () => toast((await copyText(me.code)) ? 'Código copiado' : `Seu código é ${me.code}`)}>
          <Copy size={15} /> Código
        </button>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <UserPlus size={15} /> Adicionar
        </button>
      </div>
      <Sheet open={edit} onClose={() => setEdit(false)} title="Editar perfil">
        <form
          className="grid gap-3 pt-1"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!check.ok) return toast(REASON_TEXT[check.reason]);
            setBio(bio);
            setEdit(false);
            await syncProfile({ ...s, bio: bio.trim() });
            toast('Perfil atualizado');
          }}
        >
          <label className="grid gap-1" htmlFor="bio">
            <span className="text-[14px] font-extrabold">Bio</span>
            <textarea id="bio" className="field min-h-[80px] resize-none" maxLength={120} placeholder="Ex.: Um dia de cada vez 🌻" value={bio} onChange={(e) => setBioText(e.target.value)} />
          </label>
          {!check.ok && <p className="text-[13px] text-danger">{REASON_TEXT[check.reason]}</p>}
          <p className="text-[12px] text-muted">
            {bio.length}/120 · Seu perfil mostra só coisas boas: nome, Hami, nível, ofensiva e conquistas. Peso, calorias, diário e humor nunca aparecem.
          </p>
          <button className="btn btn-primary" type="submit" disabled={!check.ok}>
            Salvar
          </button>
        </form>
      </Sheet>
      {api.kind === 'pagina' && <p className="text-[11.5px] text-muted">Versão de teste: amigos são pessoas com acesso a este link.</p>}
    </section>
  );
}

/** Perfil de alguém, em tela cheia. */
export function ProfilePage({ userId, api, myId, onClose, onChanged }: { userId: string; api: SocialApi; myId: string; onClose: () => void; onChanged?: () => void }) {
  const [page, setPage] = useState<UserPage | null | 'nada'>(null);
  const [tab, setTab] = useState<'posts' | 'casa'>('posts');
  const [open, setOpen] = useState<Post | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [menu, setMenu] = useState(false);
  const load = useCallback(async () => {
    try {
      const p = await api.profile(userId);
      setPage(p ?? 'nada');
      if (p?.isFriend) setFeed(await api.feed());
    } catch {
      setPage('nada');
    }
  }, [api, userId]);
  useEffect(() => {
    load();
  }, [load]);

  const me = userId === myId;
  const p = page && page !== 'nada' ? page.profile : null;
  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label={p ? `Perfil de ${p.name}` : 'Perfil'}>
      <div className="mx-auto grid max-w-[480px] gap-4">
        <div className="flex items-center gap-2">
          <button className="icon-btn" onClick={onClose} aria-label="Voltar">
            <ChevronLeft size={20} />
          </button>
          <p className="min-w-0 flex-1 truncate font-display text-[20px] font-bold">{p?.code ?? 'Perfil'}</p>
          {p && !me && (
            <button className="icon-btn" aria-label="Mais opções" onClick={() => setMenu(true)}>
              <Flag size={17} />
            </button>
          )}
        </div>
        {page === null && <p className="text-center text-muted">Carregando…</p>}
        {page === 'nada' && <p className="rounded-2xl bg-surface2 p-4 text-center text-muted">Não dá para ver este perfil.</p>}
        {page && page !== 'nada' && p && (
          <>
            <section className="profile-head">
              <div className="flex items-center gap-4">
                <Avatar pet={p.pet} id={p.id} size={86} ring label={`Hami de ${p.name}`} />
                <div className="grid flex-1 grid-cols-3 gap-1">
                  <Counter value={page.isFriend ? page.posts.length : '–'} label="posts" />
                  <Counter value={page.friendsCount} label="amigos" />
                  <Counter value={`🔥${p.streak ?? 0}`} label="ofensiva" />
                </div>
              </div>
              <div className="grid gap-0.5">
                <p className="font-display text-[20px] font-bold leading-tight">{p.name}</p>
                <p className="text-[13px] font-bold text-muted">
                  {p.pet.name} · nível {p.level} · 🏅 {p.badges ?? 0} conquistas
                </p>
                {p.bio && <p className="whitespace-pre-wrap text-[14.5px]">{p.bio}</p>}
              </div>
              {!me &&
                (page.isFriend ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        await api.sendGift(p.id, 'vibe', 'Mandei uma vibe boa pra você 💛');
                        logEvent('vibe');
                        toast(`Vibe boa enviada para ${p.name}!`);
                      }}
                    >
                      💛 Mandar vibe
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab('casa')}>
                      <HomeIcon size={15} /> Visitar casa
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const r = await api.request(p.id);
                      toast(r === 'ok' ? 'Pedido enviado!' : r === 'fechado' ? 'Essa pessoa não está aceitando pedidos agora.' : 'Não foi possível adicionar.');
                      onChanged?.();
                    }}
                  >
                    <UserPlus size={15} /> Pedir amizade
                  </button>
                ))}
            </section>
            <div className="profile-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'posts'} onClick={() => setTab('posts')}>
                <Grid3x3 size={18} /> Posts
              </button>
              <button role="tab" aria-selected={tab === 'casa'} onClick={() => setTab('casa')}>
                <HomeIcon size={18} /> Casa
              </button>
            </div>
            {tab === 'casa' ? (
              <Room house={p.house} period={periodOf()} height={260}>
                <Hamster fur={p.pet.fur} phase={p.pet.phase} outfit={p.pet.outfit} size={120} neutral label={p.pet.name} />
              </Room>
            ) : !page.isFriend && !me ? (
              <div className="grid justify-items-center gap-2 rounded-3xl bg-surface2 p-6 text-center">
                <Lock className="text-muted" />
                <p className="font-bold">Os posts aparecem para os amigos</p>
                <p className="text-[14px] text-muted">Peça amizade para ver o que {p.name} compartilha.</p>
              </div>
            ) : page.posts.length ? (
              <div className="grid grid-cols-3 gap-1">
                {page.posts.map((post) => (
                  <button key={post.id} className="grid-tile" onClick={() => setOpen(post)} aria-label={post.text || 'Abrir post'}>
                    <PostMedia post={post} square />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-surface2 p-4 text-center text-muted">Nenhum post ainda.</p>
            )}
          </>
        )}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} label="Post">
        {open && feed && (
          <PostCard post={open} feed={feed.posts.some((x) => postKey(x) === postKey(open)) ? feed : { ...feed, profiles: { ...feed.profiles, ...(p ? { [p.id]: p } : {}) } }} api={api} reload={load} myId={myId} />
        )}
      </Modal>
      <Sheet open={menu} onClose={() => setMenu(false)} title="Opções">
        {p && (
          <div className="grid gap-2 pt-1">
            {page && page !== 'nada' && page.isFriend && (
              <button className="opt" onClick={async () => (await api.remove(p.id), setMenu(false), toast('Amizade desfeita'), onChanged?.(), load())}>
                Desfazer amizade
              </button>
            )}
            <button className="opt" onClick={async () => (await api.report({ type: 'user', id: p.id, userId: p.id }, 'perfil'), setMenu(false), toast('Denúncia enviada.'))}>
              <Flag size={18} /> Denunciar perfil
            </button>
            <button className="opt" onClick={async () => (await api.block(p.id), setMenu(false), toast('Pessoa bloqueada.'), onChanged?.(), onClose())}>
              <ShieldBan size={18} /> Bloquear {p.name}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

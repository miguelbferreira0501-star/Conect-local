import { useCallback, useEffect, useState } from 'react';
import { Gift as GiftIcon, Plus, UserPlus, X } from 'lucide-react';
import { Hamster } from '../components/Hamster';
import { Empty, Sheet, toast } from '../components/ui';
import { itemById } from '../data/items';
import { checkKindness, REASON_TEXT } from '../shared/moderation';
import { logEvent, payGift, receiveGift, todayKey, useApp } from '../lib/store';
import { formatDay } from '../lib/util';
import { socialBlocked, syncProfile, useSocial } from '../lib/social';
import { RankingTab, VisitsCard } from './social/Ranking';
import { TeamTab } from './social/Team';
import { postKey, type Feed, type FriendState, type Gift, type GroupChallenge, type Profile, type SocialApi } from '../lib/social/types';
import { Avatar, Composer, PostCard, type ShareDraft } from './social/Post';
import { MyHeader, ProfilePage } from './social/Profile';
import { GroupsTab } from './social/Groups';
import { Glyph } from '../components/art';

export type { ShareDraft };

export type FriendsTab = 'feed' | 'turma' | 'grupos' | 'amigos' | 'desafios' | 'ranking' | 'presentes';
type Tab = FriendsTab;

export function Friends({ share, onShareDone, giftItem, onGiftDone, account, initialTab }: { share: ShareDraft; onShareDone: () => void; giftItem: string | null; onGiftDone: () => void; account: React.ReactNode; initialTab?: Tab }) {
  const s = useApp();
  const { api, loading } = useSocial();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'feed');
  const [me, setMe] = useState<Profile | null>(null);
  const [fs, setFs] = useState<FriendState | null>(null);
  const [myPosts, setMyPosts] = useState(0);
  const [adding, setAdding] = useState(false);
  const [profile, setProfile] = useState<string | null>(null);

  const refreshFriends = useCallback(async () => {
    if (!api) return;
    try {
      await syncProfile(s);
      const [p, f] = await Promise.all([api.me(), api.friends()]);
      setMe(p);
      setFs(f);
      if (p) api.profile(p.id).then((pg) => setMyPosts(pg?.posts.length ?? 0)).catch(() => {});
    } catch {
      toast('Não deu pra carregar os amigos agora.');
    }
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  useEffect(() => {
    if (share) setTab('feed');
  }, [share]);

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
          <p className="text-[15px] text-muted">Com conta, você ganha um perfil, um código para adicionar amigos, grupos, visitas, presentes e o feed só de gentileza. Seu progresso também fica salvo na nuvem.</p>
        </div>
        {account}
      </Shell>
    );
  }

  const myId = me?.id ?? '';
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'feed', icon: '🏡', label: 'Feed' },
    { id: 'turma', icon: 'art:turma', label: 'Turma' },
    { id: 'grupos', icon: '👥', label: 'Grupos' },
    { id: 'amigos', icon: '🐹', label: `Amigos${fs?.incoming.length ? ` (${fs.incoming.length})` : ''}` },
    { id: 'desafios', icon: '🎯', label: 'Desafios' },
    { id: 'ranking', icon: '🏆', label: 'Ranking' },
    { id: 'presentes', icon: '🎁', label: 'Presentes' },
  ];
  return (
    <Shell>
      <MyHeader me={me} api={api} postsCount={myPosts} friendsCount={fs?.friends.length ?? 0} onAdd={() => setAdding(true)} />
      <div className="tabs-scroll" role="tablist" aria-label="Seções">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`chip ${tab === t.id ? 'chip-accent' : 'chip-plain'}`} onClick={() => setTab(t.id)}>
            <Glyph e={t.icon} size={20} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'feed' && <FeedTab api={api} share={share} onShareDone={onShareDone} friends={fs} myId={myId} onOpenProfile={setProfile} onAdd={() => setAdding(true)} />}
      {tab === 'grupos' && <GroupsTab api={api} friends={fs?.friends ?? []} myId={myId} onOpenProfile={setProfile} />}
      {tab === 'amigos' && <FriendsTab api={api} fs={fs} refresh={refreshFriends} onOpenProfile={setProfile} />}
      {tab === 'desafios' && <ChallengesTab api={api} profiles={fs ? Object.fromEntries([...fs.friends, ...(me ? [me] : [])].map((p) => [p.id, p])) : {}} myId={myId} />}
      {tab === 'presentes' && <GiftsTab api={api} />}
      {tab === 'ranking' && <RankingTab api={api} onOpenProfile={setProfile} />}
      {tab === 'turma' && <TeamTab api={api} friends={fs?.friends ?? []} onOpenProfile={setProfile} />}
      <GiftSheet api={api} itemId={giftItem} friends={fs?.friends ?? []} onClose={onGiftDone} />
      <AddFriend open={adding} api={api} onClose={() => setAdding(false)} onAdded={refreshFriends} onOpenProfile={setProfile} />
      {profile && <ProfilePage userId={profile} api={api} myId={myId} onClose={() => setProfile(null)} onChanged={refreshFriends} />}
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

function AddFriend({ open, api, onClose, onAdded, onOpenProfile }: { open: boolean; api: SocialApi; onClose: () => void; onAdded: () => void; onOpenProfile: (id: string) => void }) {
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Profile | null | 'nada'>(null);
  useEffect(() => {
    if (!open) (setCode(''), setFound(null));
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Adicionar amigo">
      <div className="grid gap-3 pt-1">
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
            <Avatar pet={found.pet} id={found.id} size={52} ring />
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
                onAdded();
                onClose();
                if (r === 'ok') onOpenProfile(found.id);
              }}
            >
              Pedir amizade
            </button>
          </div>
        )}
        <p className="text-[13px] text-muted">Peça o código para a pessoa (ele aparece no perfil dela, em Amigos).</p>
      </div>
    </Sheet>
  );
}

// ---------- Feed ----------

function FeedTab({ api, share, onShareDone, friends, myId, onOpenProfile, onAdd }: { api: SocialApi; share: ShareDraft; onShareDone: () => void; friends: FriendState | null; myId: string; onOpenProfile: (id: string) => void; onAdd: () => void }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [composer, setComposer] = useState(false);
  const load = useCallback(() => api.feed().then(setFeed).catch(() => toast('Não deu pra carregar o feed.')), [api]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (share) setComposer(true);
  }, [share]);
  const recent = new Set((feed?.posts ?? []).filter((p) => Date.now() - p.createdAt < 24 * 3_600_000).map((p) => p.authorId));
  const people = [...(friends?.friends ?? [])].sort((a, b) => Number(recent.has(b.id)) - Number(recent.has(a.id)));

  return (
    <div className="grid gap-3">
      <div className="stories" aria-label="Amigos">
        <button className="story" onClick={() => setComposer(true)} aria-label="Compartilhar um momento">
          <span className="story-add">
            <Plus size={22} />
          </span>
          <span className="story-name">Postar</span>
        </button>
        {people.map((p) => (
          <button key={p.id} className="story" onClick={() => onOpenProfile(p.id)} aria-label={`Perfil de ${p.name}`}>
            <span className={recent.has(p.id) ? '' : 'opacity-70 grayscale-[0.4]'}>
              <Avatar pet={p.pet} id={p.id} size={58} ring={recent.has(p.id)} />
            </span>
            <span className="story-name">{p.name}</span>
          </button>
        ))}
        {!people.length && (
          <button className="story" onClick={onAdd} aria-label="Adicionar amigo">
            <span className="story-add">
              <UserPlus size={20} />
            </span>
            <span className="story-name">Adicionar</span>
          </button>
        )}
      </div>
      {!feed ? (
        <p className="text-center text-muted">Carregando…</p>
      ) : feed.posts.length ? (
        feed.posts.map((p) => <PostCard key={postKey(p)} post={p} feed={feed} api={api} reload={load} myId={myId} onOpenProfile={onOpenProfile} />)
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

// ---------- Amigos ----------

function FriendsTab({ api, fs, refresh, onOpenProfile }: { api: SocialApi; fs: FriendState | null; refresh: () => void; onOpenProfile: (id: string) => void }) {
  if (!fs) return <p className="text-center text-muted">Carregando…</p>;
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    await fn();
    toast(msg);
    refresh();
  };
  return (
    <div className="grid gap-4">
      <VisitsCard api={api} onOpenProfile={onOpenProfile} />
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
              <button className="btn btn-soft btn-sm" onClick={() => onOpenProfile(p.id)}>
                Perfil
              </button>
              <button
                className="icon-btn"
                aria-label={`Mandar vibe boa para ${p.name}`}
                onClick={async () => {
                  await api.sendGift(p.id, 'vibe', 'Mandei uma vibe boa pra você!');
                  logEvent('vibe');
                  toast(`Vibe boa enviada para ${p.name}!`);
                }}
              >
                <Glyph e="💛" size={24} />
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
    </div>
  );
}

function PersonRow({ p, children }: { p: Profile; children: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <Avatar pet={p.pet} id={p.id} size={46} />
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
                <Glyph e={c.emoji} size={40} />
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
                <Glyph e={em} size={30} />
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
            <Glyph e={g.itemId === 'vibe' ? '💛' : item?.art ?? item?.emoji ?? '🎁'} size={40} />
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
                await api.sendGift(to, item.id, 'Um presentinho pra você!');
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


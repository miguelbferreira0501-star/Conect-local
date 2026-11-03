// Grupos com amigos: cada grupo tem membros, mural próprio e convite pelo dono.
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, LogOut, Plus, UserPlus } from 'lucide-react';
import { Empty, Sheet, toast } from '../../components/ui';
import { checkKindness, REASON_TEXT } from '../../shared/moderation';
import { postKey, type Feed, type Group, type Profile, type SocialApi } from '../../lib/social/types';
import { Avatar, Composer, PostCard } from './Post';

const GROUP_EMOJIS = ['🌻', '🚶', '💧', '🧘', '📚', '🍎', '🏃', '💪', '🎨', '🌙', '🐹', '💛'];
export const GROUP_COLORS: Record<string, [string, string]> = {
  morango: ['#FF9AB8', '#E5487A'],
  lavanda: ['#C6B2FF', '#8A63D2'],
  menta: ['#9BE6C6', '#1F8F66'],
  ceu: ['#A8D4FF', '#2F7FD0'],
  pessego: ['#FFC09A', '#D8642F'],
  girassol: ['#FFE08A', '#E0A92A'],
};

function Faces({ ids, profiles, size = 30 }: { ids: string[]; profiles: Record<string, Profile>; size?: number }) {
  return (
    <span className="flex">
      {ids.slice(0, 5).map((id, i) =>
        profiles[id] ? (
          <span key={id} style={{ marginLeft: i ? -size * 0.3 : 0 }}>
            <Avatar pet={profiles[id].pet} id={id} size={size} label={profiles[id].name} />
          </span>
        ) : null,
      )}
      {ids.length > 5 && <span className="grid place-items-center rounded-full bg-surface2 px-2 text-[12px] font-extrabold">+{ids.length - 5}</span>}
    </span>
  );
}

export function GroupsTab({ api, friends, myId, onOpenProfile }: { api: SocialApi; friends: Profile[]; myId: string; onOpenProfile: (id: string) => void }) {
  const [data, setData] = useState<{ groups: Group[]; profiles: Record<string, Profile> } | null>(null);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => api.groups().then(setData).catch(() => setData({ groups: [], profiles: {} })), [api]);
  useEffect(() => {
    load();
  }, [load]);
  const group = data?.groups.find((g) => g.id === open);

  return (
    <div className="grid gap-3">
      <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!friends.length}>
        <Plus size={18} /> Criar grupo com amigos
      </button>
      {!friends.length && <p className="text-center text-[13px] text-muted">Adicione amigos primeiro para montar um grupo.</p>}
      {!data ? (
        <p className="text-center text-muted">Carregando…</p>
      ) : data.groups.length ? (
        data.groups.map((g) => {
          const [a, b] = GROUP_COLORS[g.color] ?? GROUP_COLORS.morango;
          return (
            <button key={g.id} className="group-card" style={{ ['--g1' as string]: a, ['--g2' as string]: b }} onClick={() => setOpen(g.id)}>
              <span className="group-emoji" aria-hidden="true">
                {g.emoji}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-display text-[19px] font-bold leading-tight">{g.name}</span>
                <span className="block text-[13px] font-bold opacity-90">
                  {g.members.length} {g.members.length === 1 ? 'pessoa' : 'pessoas'}
                  {g.ownerId === myId ? ' · você criou' : ''}
                </span>
              </span>
              <Faces ids={g.members} profiles={data.profiles} size={28} />
            </button>
          );
        })
      ) : (
        <Empty>Monte um grupo com amigos (a turma da caminhada, da água, da leitura…) para postarem juntos num mural só de vocês.</Empty>
      )}
      <CreateGroup open={creating} api={api} friends={friends} onClose={() => setCreating(false)} onCreated={(id) => (load(), setOpen(id))} />
      {group && data && <GroupPage group={group} profiles={data.profiles} api={api} myId={myId} friends={friends} onClose={() => setOpen(null)} onChanged={load} onOpenProfile={onOpenProfile} />}
    </div>
  );
}

function CreateGroup({ open, api, friends, onClose, onCreated }: { open: boolean; api: SocialApi; friends: Profile[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌻');
  const [color, setColor] = useState('morango');
  const [members, setMembers] = useState<string[]>([]);
  const check = name.trim() ? checkKindness(name) : ({ ok: true } as const);
  useEffect(() => {
    if (open) (setName(''), setMembers([]), setEmoji('🌻'), setColor('morango'));
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Novo grupo">
      <form
        className="grid gap-3 pt-1"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!check.ok) return toast(REASON_TEXT[check.reason]);
          try {
            const g = await api.createGroup({ name: name.trim(), emoji, color, members });
            toast('Grupo criado!');
            onClose();
            onCreated(g.id);
          } catch (err) {
            toast((err as Error).message || 'Não deu pra criar o grupo agora.');
          }
        }}
      >
        <label className="grid gap-1" htmlFor="g-name">
          <span className="text-[14px] font-extrabold">Nome do grupo</span>
          <input id="g-name" className="field" maxLength={40} placeholder="Ex.: Turma da caminhada" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {!check.ok && <p className="text-[13px] text-danger">{REASON_TEXT[check.reason]}</p>}
        <div className="grid gap-1">
          <span className="text-[14px] font-extrabold">Ícone</span>
          <div className="grid grid-cols-6 gap-1.5">
            {GROUP_EMOJIS.map((em) => (
              <button type="button" key={em} className="mood-opt !min-w-0" aria-pressed={emoji === em} aria-label={em} onClick={() => setEmoji(em)}>
                <span className="text-[22px]">{em}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-1">
          <span className="text-[14px] font-extrabold">Cor</span>
          <div className="flex gap-2">
            {Object.entries(GROUP_COLORS).map(([id, [a, b]]) => (
              <button type="button" key={id} className={`accent-swatch ${color === id ? 'is-on' : ''}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-label={`Cor ${id}`} aria-pressed={color === id} onClick={() => setColor(id)} />
            ))}
          </div>
        </div>
        <div className="grid gap-1.5">
          <span className="text-[14px] font-extrabold">Quem entra ({members.length})</span>
          {friends.map((f) => (
            <label key={f.id} className="flex items-center gap-3 rounded-2xl bg-surface2 px-3 py-2" htmlFor={`gm-${f.id}`}>
              <Avatar pet={f.pet} id={f.id} size={36} />
              <span className="min-w-0 flex-1 truncate font-bold">{f.name}</span>
              <input id={`gm-${f.id}`} type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={members.includes(f.id)} onChange={(e) => setMembers(e.target.checked ? [...members, f.id] : members.filter((m) => m !== f.id))} />
            </label>
          ))}
        </div>
        <button className="btn btn-primary" type="submit" disabled={!name.trim() || !check.ok}>
          Criar grupo
        </button>
      </form>
    </Sheet>
  );
}

function GroupPage({ group, profiles, api, myId, friends, onClose, onChanged, onOpenProfile }: { group: Group; profiles: Record<string, Profile>; api: SocialApi; myId: string; friends: Profile[]; onClose: () => void; onChanged: () => void; onOpenProfile: (id: string) => void }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [composer, setComposer] = useState(false);
  const [invite, setInvite] = useState(false);
  const owner = group.ownerId === myId;
  const [a, b] = GROUP_COLORS[group.color] ?? GROUP_COLORS.morango;
  const load = useCallback(() => api.groupFeed(group.id).then(setFeed).catch(() => setFeed({ posts: [], profiles: {}, reactions: [], comments: [] })), [api, group.id]);
  useEffect(() => {
    load();
  }, [load]);
  const outside = friends.filter((f) => !group.members.includes(f.id));

  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label={`Grupo ${group.name}`}>
      <div className="mx-auto grid max-w-[480px] gap-4">
        <div className="group-banner" style={{ ['--g1' as string]: a, ['--g2' as string]: b }}>
          <div className="flex items-center justify-between">
            <button className="icon-btn !bg-white/30 !text-white" onClick={onClose} aria-label="Voltar">
              <ChevronLeft size={20} />
            </button>
            <button
              className="icon-btn !bg-white/30 !text-white"
              aria-label={owner ? 'Apagar grupo' : 'Sair do grupo'}
              onClick={async () => {
                if (!confirm(owner ? 'Você criou este grupo. Sair apaga o grupo para todo mundo. Continuar?' : 'Sair do grupo?')) return;
                await api.leaveGroup(group.id, myId);
                toast(owner ? 'Grupo apagado' : 'Você saiu do grupo');
                onChanged();
                onClose();
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
          <span className="text-[54px] leading-none" aria-hidden="true">
            {group.emoji}
          </span>
          <p className="font-display text-[26px] font-bold leading-tight">{group.name}</p>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) =>
              profiles[m] ? (
                <button key={m} className="grid justify-items-center gap-0.5" onClick={() => m !== myId && onOpenProfile(m)} aria-label={`Perfil de ${profiles[m].name}`}>
                  <Avatar pet={profiles[m].pet} id={m} size={40} ring />
                  <span className="max-w-[56px] truncate text-[11px] font-extrabold">{m === myId ? 'Você' : profiles[m].name}</span>
                </button>
              ) : null,
            )}
            {owner && outside.length > 0 && (
              <button className="grid justify-items-center gap-0.5" onClick={() => setInvite(true)} aria-label="Convidar amigo">
                <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-white/80">
                  <UserPlus size={18} />
                </span>
                <span className="text-[11px] font-extrabold">Convidar</span>
              </button>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setComposer(true)}>
          <Plus size={18} /> Postar no mural
        </button>
        {!feed ? (
          <p className="text-center text-muted">Carregando…</p>
        ) : feed.posts.length ? (
          feed.posts.map((p) => <PostCard key={postKey(p)} post={p} feed={{ ...feed, profiles: { ...profiles, ...feed.profiles } }} api={api} reload={load} myId={myId} onOpenProfile={(id) => id !== myId && onOpenProfile(id)} />)
        ) : (
          <Empty>O mural está vazio. Que tal chamar a turma para a primeira missão juntos?</Empty>
        )}
        <p className="text-center text-[12px] text-muted">Só quem está no grupo vê o mural. Aqui também só vale gentileza.</p>
      </div>
      <Composer open={composer} api={api} draft={null} groupId={group.id} groupName={group.name} onClose={() => setComposer(false)} onPosted={load} />
      <Sheet open={invite} onClose={() => setInvite(false)} title="Convidar para o grupo">
        <div className="grid gap-2 pt-1">
          {outside.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-surface2 px-3 py-2">
              <Avatar pet={f.pet} id={f.id} size={36} />
              <span className="min-w-0 flex-1 truncate font-bold">{f.name}</span>
              <button
                className="btn btn-soft btn-sm"
                onClick={async () => {
                  try {
                    await api.addToGroup(group.id, f.id);
                    toast(`${f.name} entrou no grupo!`);
                    onChanged();
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

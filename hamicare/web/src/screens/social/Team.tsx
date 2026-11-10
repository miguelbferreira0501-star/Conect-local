// Turma: você e até 3 amigos, com os Hamis juntos e missões em comum.
// Uma missão só conta quando todos fazem; quando todos fazem tudo, o dia fecha e cada um ganha o prêmio.
// Marcar a missão pessoal (em Missões) já marca a parte da turma.
import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronRight, Flame, LogOut, Plus, UserMinus } from 'lucide-react';
import { ArenaScene } from '../../components/ArenaScene';
import { Hamster } from '../../components/Hamster';
import { Glyph } from '../../components/art';
import { Seed, toast } from '../../components/ui';
import { libById } from '../../data/tasks';
import { gameCfg } from '../../lib/game';
import { useSocial } from '../../lib/social';
import { claimTeamReward, dayOf, homeArenaOf, isPremium, teamRewardClaimed, todayKey, toggleTask, useApp } from '../../lib/store';
import { TEAM_MAX, TEAM_MAX_PLUS, TEAM_MISSIONS, TEAM_MISSIONS_MAX, missionDoneByAll } from '../../shared/team';
import type { Profile, SocialApi, Team } from '../../lib/social/types';
import { Avatar } from './Post';

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Não deu certo agora.');

/** Carrega a turma de hoje e marca sozinho as missões que a pessoa já fez nas missões pessoais. */
export function useTeam(api: SocialApi | null) {
  const s = useApp();
  const today = todayKey();
  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  const [myId, setMyId] = useState('');
  const reload = useCallback(async () => {
    if (!api) return;
    try {
      const [me, t] = await Promise.all([api.me(), api.team(today)]);
      setMyId(me?.id ?? '');
      setTeam(t);
    } catch {
      setTeam(null);
    }
  }, [api, today]);
  useEffect(() => {
    reload();
  }, [reload]);
  const personal = Object.keys(dayOf(s, today).done).join(',');
  useEffect(() => {
    if (!api || !team || !myId) return;
    const mine = team.today.checkins[myId] ?? [];
    const toMark = team.missions.filter((m) => personal.split(',').includes(m) && !mine.includes(m));
    if (!toMark.length) return;
    (async () => {
      let t: Team | null = team;
      for (const m of toMark) t = await api.teamCheckin(m, today, true).catch(() => t);
      setTeam(t);
    })();
  }, [api, team?.id, myId, personal]); // eslint-disable-line react-hooks/exhaustive-deps
  return { team, setTeam, myId, reload, today };
}

const missionLabel = (id: string) => libById(id)?.title ?? id;
const missionEmoji = (id: string) => libById(id)?.emoji ?? '⭐';
const doneCount = (team: Team, id: string) => team.missions.filter((m) => (team.today.checkins[id] ?? []).includes(m)).length;

/** Os Hamis da turma juntos, cada um com o que já fez hoje. */
export function TeamHamis({ team, size = 84, arena }: { team: Team; size?: number; arena: string }) {
  return (
    <ArenaScene arena={arena} height={size * 2.3}>
      <div className="team-row">
        {team.members.map((p) => {
          const n = doneCount(team, p.id);
          const all = n === team.missions.length;
          return (
            <div key={p.id} className="team-pet">
              <Hamster fur={p.pet.fur} phase={p.pet.phase} outfit={p.pet.outfit} size={size} idle={false} neutral mood={all ? 'animado' : 'feliz'} label={p.pet.name} />
              <span className={`team-tag ${all ? 'is-done' : ''}`}>
                {all ? <Check size={12} /> : `${n}/${team.missions.length}`} {p.name}
              </span>
            </div>
          );
        })}
      </div>
    </ArenaScene>
  );
}

/** Cartão do Início: os Hamis da turma e quanto falta hoje. */
export function TeamHomeCard({ onOpen }: { onOpen: () => void }) {
  const s = useApp();
  const { api } = useSocial();
  const { team } = useTeam(api);
  if (!team) return null;
  const doneAll = team.missions.filter((m) => missionDoneByAll(m, team.memberIds, team.today.checkins)).length;
  const arena = gameCfg().arenas.find((a) => a.n === homeArenaOf(s))?.id ?? 'casinha';
  return (
    <button className="card team-home grid gap-2 overflow-hidden p-0 text-left" onClick={onOpen} aria-label={`Turma ${team.name}: ${doneAll} de ${team.missions.length} missões completas hoje`}>
      <TeamHamis team={team} size={team.members.length > 3 ? 56 : 64} arena={arena} />
      <div className="flex items-center gap-2 px-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Turma {team.name}</p>
          <p className="font-bold leading-tight">{team.today.complete ? 'Dia completo! 🎉' : `${doneAll} de ${team.missions.length} missões completas por todos`}</p>
        </div>
        {team.streak > 0 && (
          <span className="chip chip-fire shrink-0">
            <Flame size={14} /> {team.streak}
          </span>
        )}
        <ChevronRight size={18} className="shrink-0 text-muted" />
      </div>
    </button>
  );
}

export function TeamTab({ api, friends, onOpenProfile }: { api: SocialApi; friends: Profile[]; onOpenProfile: (id: string) => void }) {
  const s = useApp();
  const { team, setTeam, myId, today } = useTeam(api);
  const [busy, setBusy] = useState(false);
  const arena = gameCfg().arenas.find((a) => a.n === homeArenaOf(s))?.id ?? 'casinha';
  const cfg = gameCfg();

  const run = async (fn: () => Promise<Team | null>, ok?: string) => {
    setBusy(true);
    try {
      setTeam(await fn());
      if (ok) toast(ok);
    } catch (e) {
      toast(errText(e));
    } finally {
      setBusy(false);
    }
  };

  if (team === undefined) return <p className="text-center text-muted">Carregando…</p>;
  if (!team) return <CreateTeam api={api} friends={friends} onCreated={setTeam} />;

  const isOwner = team.ownerId === myId;
  const mine = team.today.checkins[myId] ?? [];
  const claimed = teamRewardClaimed(s, team.id, today);
  const outside = friends.filter((f) => !team.memberIds.includes(f.id));

  function toggle(mission: string) {
    const done = !mine.includes(mission);
    // Marcar aqui também marca a missão pessoal (se ela estiver na sua lista de hoje).
    if (done && s.tasks.some((t) => t.id === mission) && !(mission in dayOf(s, today).done)) toggleTask(mission);
    run(() => api.teamCheckin(mission, today, done));
  }

  return (
    <div className="grid gap-4">
      <section className="card grid gap-3 overflow-hidden p-0" aria-label={`Turma ${team.name}`}>
        <TeamHamis team={team} size={team.members.length > 3 ? 64 : 76} arena={arena} />
        <div className="flex items-center gap-2 px-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[21px] font-bold leading-tight">{team.name}</p>
            <p className="text-[13px] text-muted">
              {team.members.length} de {team.max ?? TEAM_MAX} · {team.completeDays} {team.completeDays === 1 ? 'dia completo' : 'dias completos'}
            </p>
          </div>
          <span className={`chip ${team.streak ? 'chip-fire' : 'chip-plain'} shrink-0`}>
            <Flame size={14} /> {team.streak} {team.streak === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <p className="mx-4 rounded-2xl bg-surface2 px-3 py-2 text-[13px] font-semibold">Uma missão só conta quando todo mundo da turma faz. Quando todos fazem tudo, o dia fecha e cada um ganha o prêmio.</p>
        <ul className="grid gap-2 px-4 pb-4">
          {team.missions.map((m) => {
            const all = missionDoneByAll(m, team.memberIds, team.today.checkins);
            const me = mine.includes(m);
            return (
              <li key={m} className={`team-mission ${all ? 'is-all' : ''}`}>
                <Glyph e={missionEmoji(m)} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{missionLabel(m)}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {team.members.map((p) => (
                      <span key={p.id} className={`team-dot ${(team.today.checkins[p.id] ?? []).includes(m) ? 'is-on' : ''}`} title={p.name}>
                        <Avatar pet={p.pet} id={p.id} size={22} />
                      </span>
                    ))}
                    <span className="ml-1 text-[12px] font-bold text-muted">{all ? 'Todos fizeram!' : `${team.memberIds.filter((u) => (team.today.checkins[u] ?? []).includes(m)).length} de ${team.memberIds.length}`}</span>
                  </div>
                </div>
                <button className={`btn btn-sm shrink-0 ${me ? 'btn-soft' : 'btn-primary'}`} disabled={busy} onClick={() => toggle(m)} aria-pressed={me}>
                  {me ? (
                    <>
                      <Check size={15} /> Fiz
                    </>
                  ) : (
                    'Fiz!'
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {team.today.complete && (
        <section className="team-prize" aria-live="polite">
          <Glyph e="🎉" size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[19px] font-bold leading-tight">Dia completo!</p>
            <p className="text-[14px] font-semibold opacity-90">A turma toda fez tudo hoje.</p>
          </div>
          {claimed ? (
            <span className="chip chip-plain shrink-0">
              <Check size={14} /> Pego
            </span>
          ) : (
            <button className="btn btn-sm shrink-0 bg-white text-[#2b2240]" onClick={() => claimTeamReward(team.id, today) && toast(`+${cfg.team.coins} sementes da turma!`)}>
              <Seed size={15} /> +{cfg.team.coins}
            </button>
          )}
        </section>
      )}
      {team.members.length < 2 && <p className="rounded-2xl bg-gold-soft p-3 text-[14px] font-semibold">Chame pelo menos um amigo: a turma começa a contar com 2 pessoas.</p>}

      <section className="grid gap-2" aria-label="Pessoas da turma">
        <h2 className="section-label px-1">Quem está na turma</h2>
        {team.members.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-3">
            <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => p.id !== myId && onOpenProfile(p.id)}>
              <Avatar pet={p.pet} id={p.id} size={40} />
              <span className="min-w-0 flex-1 truncate font-bold">
                {p.id === myId ? 'Você' : p.name}
                {p.id === team.ownerId && <span className="ml-1 text-[12px] font-bold text-muted">· criou</span>}
              </span>
            </button>
            {isOwner && p.id !== myId && (
              <button className="icon-btn" aria-label={`Tirar ${p.name} da turma`} disabled={busy} onClick={() => run(() => api.leaveTeam(p.id, today), `${p.name} saiu da turma.`)}>
                <UserMinus size={16} />
              </button>
            )}
          </div>
        ))}
        {isOwner && team.members.length >= (team.max ?? TEAM_MAX) && (team.max ?? TEAM_MAX) < TEAM_MAX_PLUS && (
          <p className="px-1 text-[13px] font-bold text-muted">Turma cheia. Com HamiCare+, a turma cabe até {TEAM_MAX_PLUS} pessoas.</p>
        )}
        {isOwner && team.members.length < (team.max ?? TEAM_MAX) && outside.length > 0 && (
          <div className="grid gap-2">
            <p className="px-1 text-[13px] font-bold text-muted">Chamar mais amigos ({(team.max ?? TEAM_MAX) - team.members.length} vagas)</p>
            {outside.slice(0, 8).map((f) => (
              <div key={f.id} className="card flex items-center gap-3 p-3">
                <Avatar pet={f.pet} id={f.id} size={36} />
                <span className="min-w-0 flex-1 truncate font-bold">{f.name}</span>
                <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => run(() => api.addTeamMember(f.id, today), `${f.name} entrou na turma!`)}>
                  <Plus size={15} /> Chamar
                </button>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-ghost btn-sm justify-self-start" disabled={busy} onClick={() => run(() => api.leaveTeam(myId, today), isOwner ? 'A turma foi desfeita.' : 'Você saiu da turma.')}>
          <LogOut size={15} /> {isOwner ? 'Desfazer a turma' : 'Sair da turma'}
        </button>
      </section>
    </div>
  );
}

function CreateTeam({ api, friends, onCreated }: { api: SocialApi; friends: Profile[]; onCreated: (t: Team) => void }) {
  const s = useApp();
  const teamCap = isPremium(s) ? TEAM_MAX_PLUS : TEAM_MAX;
  const [name, setName] = useState(`Turma do ${s.pet.name}`);
  const [members, setMembers] = useState<string[]>([]);
  const [missions, setMissions] = useState<string[]>(['agua', 'caminhada']);
  const [busy, setBusy] = useState(false);
  const toggleIn = (list: string[], id: string, max: number) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : list);

  async function create() {
    setBusy(true);
    try {
      onCreated(await api.createTeam({ name: name.trim() || 'Turma', missions, members }, todayKey()));
      toast('Turma criada!');
    } catch (e) {
      toast(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="card grid justify-items-center gap-2 p-5 text-center">
        <Glyph e="art:turma" size={72} />
        <h2 className="font-display text-[22px] font-bold leading-tight">Monte a sua turma</h2>
        <p className="text-[14px] text-muted">Você e até {teamCap - 1} amigos, com os Hamis juntos.{teamCap < TEAM_MAX_PLUS ? ` Com HamiCare+, até ${TEAM_MAX_PLUS - 1} amigos.` : ''} Vocês escolhem missões em comum, e cada missão só conta quando todo mundo faz.</p>
      </section>
      <label className="grid gap-1 text-[14px] font-bold" htmlFor="team-name">
        Nome da turma
        <input id="team-name" className="field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <section className="grid gap-2">
        <h2 className="section-label px-1">Amigos ({members.length} de {teamCap - 1})</h2>
        {friends.length ? (
          friends.map((f) => {
            const on = members.includes(f.id);
            return (
              <button key={f.id} className={`opt ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => setMembers(toggleIn(members, f.id, teamCap - 1))}>
                <Avatar pet={f.pet} id={f.id} size={36} />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                {on && <Check size={18} className="text-accent" />}
              </button>
            );
          })
        ) : (
          <p className="text-[14px] text-muted">Adicione amigos primeiro (aba Amigos) para chamar para a turma.</p>
        )}
      </section>
      <section className="grid gap-2">
        <h2 className="section-label px-1">Missões em comum ({missions.length} de {TEAM_MISSIONS_MAX})</h2>
        <div className="flex flex-wrap gap-2">
          {TEAM_MISSIONS.map((m) => (
            <button key={m} className={`chip ${missions.includes(m) ? 'chip-accent' : 'chip-plain'}`} aria-pressed={missions.includes(m)} onClick={() => setMissions(toggleIn(missions, m, TEAM_MISSIONS_MAX))}>
              <Glyph e={missionEmoji(m)} size={18} /> {missionLabel(m)}
            </button>
          ))}
        </div>
      </section>
      <button className="btn btn-primary" disabled={busy || !members.length || !missions.length} onClick={create}>
        Criar turma
      </button>
      {!members.length && friends.length > 0 && <p className="-mt-2 text-center text-[13px] text-muted">Escolha pelo menos um amigo.</p>}
    </div>
  );
}

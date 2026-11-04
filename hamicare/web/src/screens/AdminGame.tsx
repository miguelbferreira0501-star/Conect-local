// Painel de administração › Jogo: edita níveis, XP, limites, arenas, baús e chances, raridades,
// proteção contra azar, coleções e temporada. Confere tudo antes de salvar, simula a economia
// com os 4 perfis e guarda cada mudança como uma versão nova (dá para voltar).
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { RotateCcw, Save, FlaskConical } from 'lucide-react';
import { toast } from '../components/ui';
import { http, ApiError } from '../lib/social/api';
import { setGameCfg } from '../lib/game';
import { itemById } from '../data/items';
import { CHEST_ORDER, DEFAULT_GAME, RARITY_ORDER, chestPool, validateGameConfig, type ChestId, type GameConfig, type Rarity } from '../shared/game';
import { PERSONAS, simulateMany, type SimResult } from '../shared/game/simulate';

interface Version {
  version: number;
  at: number;
  author: string | null;
  note: string | null;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const POOL = chestPool();
const RLABEL: Record<Rarity, string> = { comum: 'Comum', incomum: 'Incomum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário' };

function Num({ label, value, onChange, step = 1, min = 0 }: { label: string; value: number | undefined; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <label className="grid gap-0.5 text-[12px] font-bold text-muted">
      {label}
      <input className="field !min-h-[40px] !px-2 !py-1 text-[15px] text-ink" type="number" inputMode="decimal" step={step} min={min} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
    </label>
  );
}

function Part({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="card admin-part" open={open}>
      <summary className="cursor-pointer p-4 font-display text-[18px] font-bold">{title}</summary>
      <div className="grid gap-3 px-4 pb-4">{children}</div>
    </details>
  );
}

export function AdminGame() {
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [note, setNote] = useState('');
  const [sim, setSim] = useState<SimResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const load = () =>
    http<{ current: GameConfig; versions: Version[] }>('GET', '/admin/game-config')
      .then((r) => (setCfg(clone(r.current)), setVersions(r.versions)))
      .catch((e) => toast(e instanceof ApiError ? e.message : 'Não deu certo agora.'));
  useEffect(() => {
    load();
  }, []);

  const errors = useMemo(() => (cfg ? validateGameConfig(cfg, POOL, (id) => !!itemById(id)) : []), [cfg]);
  if (!cfg) return <p className="text-muted">Carregando…</p>;

  const edit = (fn: (c: GameConfig) => void) => {
    const next = clone(cfg);
    fn(next);
    setCfg(next);
    setSim(null);
  };

  async function save() {
    setBusy(true);
    setServerErrors([]);
    try {
      const r = await http<{ version: number }>('POST', '/admin/game-config', { config: cfg, note });
      toast(`Versão ${r.version} salva. O app de todo mundo passa a usar em até 1 minuto.`);
      setGameCfg({ ...DEFAULT_GAME, ...cfg! });
      setNote('');
      load();
    } catch (e) {
      const errs = ((e as ApiError).details as { errors?: string[] } | undefined)?.errors;
      if (errs) setServerErrors(errs);
      toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');
    } finally {
      setBusy(false);
    }
  }

  async function restore(v: number) {
    try {
      await http('POST', `/admin/game-config/${v}/restore`);
      toast(`Voltou para a versão ${v}.`);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');
    }
  }

  function simulate() {
    setSim(PERSONAS.map((p) => simulateMany(p, cfg!, POOL, 365, 8)));
  }

  return (
    <div className="grid gap-3">
      <p className="text-[14px] text-muted">Mudanças valem para todo mundo. O servidor confere tudo antes de salvar e cada versão fica guardada para voltar se precisar.</p>

      <Part title="Níveis e XP" open>
        <label className="grid gap-0.5 text-[12px] font-bold text-muted">
          XP de cada nível para o próximo (separe por vírgula)
          <input className="field text-[15px] text-ink" value={cfg.levels.first.join(', ')} onChange={(e) => edit((c) => (c.levels.first = e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x))))} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Num label="Crescimento depois" step={0.01} value={cfg.levels.growth} onChange={(v) => edit((c) => (c.levels.growth = v))} />
          <Num label="Prêmio nível: base" value={cfg.levelUp.base} onChange={(v) => edit((c) => (c.levelUp.base = v))} />
          <Num label="+ por nível" value={cfg.levelUp.perLevel} onChange={(v) => edit((c) => (c.levelUp.perLevel = v))} />
        </div>
        <p className="text-[13px] font-bold">Missão leve, normal e puxada</p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Num key={`xp${i}`} label={`XP ${['leve', 'normal', 'puxada'][i]}`} value={cfg.task.xp[i]} onChange={(v) => edit((c) => (c.task.xp[i] = v))} />
          ))}
          {[0, 1, 2].map((i) => (
            <Num key={`c${i}`} label={`Sementes ${['leve', 'normal', 'puxada'][i]}`} value={cfg.task.coins[i]} onChange={(v) => edit((c) => (c.task.coins[i] = v))} />
          ))}
        </div>
        <p className="text-[13px] font-bold">Limites do dia (protegem contra exagero)</p>
        <div className="grid grid-cols-3 gap-2">
          <Num label="XP no dia" value={cfg.caps.day.xp} onChange={(v) => edit((c) => (c.caps.day.xp = v))} />
          <Num label="Sementes no dia" value={cfg.caps.day.coins} onChange={(v) => edit((c) => (c.caps.day.coins = v))} />
          <Num label="Missões que contam" value={cfg.caps.tasks} onChange={(v) => edit((c) => (c.caps.tasks = v))} />
          {Object.keys(cfg.caps.category).map((k) => (
            <Num key={k} label={`XP de ${k}`} value={cfg.caps.category[k as keyof typeof cfg.caps.category]} onChange={(v) => edit((c) => (c.caps.category[k as keyof typeof cfg.caps.category] = v))} />
          ))}
          <Num label="XP por conquista" value={cfg.achievementXp} onChange={(v) => edit((c) => (c.achievementXp = v))} />
        </div>
      </Part>

      <Part title={`Arenas (${cfg.arenas.length})`}>
        {cfg.arenas.map((a, i) => (
          <div key={a.n} className="grid gap-2 rounded-2xl bg-surface2 p-3">
            <div className="flex items-center gap-2">
              <span className="font-black">{a.n}.</span>
              <input aria-label={`Nome da arena ${a.n}`} className="field !min-h-[40px] flex-1 !py-1 text-[15px]" value={a.name} onChange={(e) => edit((c) => (c.arenas[i].name = e.target.value))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Num label="Abre no nível" value={a.level} onChange={(v) => edit((c) => (c.arenas[i].level = v))} />
              <Num label="Sementes" value={a.reward.coins} onChange={(v) => edit((c) => (c.arenas[i].reward.coins = v))} />
              <label className="grid gap-0.5 text-[12px] font-bold text-muted">
                Baú grátis
                <select className="field !min-h-[40px] !px-2 !py-1 text-[15px] text-ink" value={a.reward.chest ?? ''} onChange={(e) => edit((c) => (c.arenas[i].reward.chest = (e.target.value || undefined) as ChestId | undefined))}>
                  <option value="">Nenhum</option>
                  {CHEST_ORDER.map((ch) => (
                    <option key={ch} value={ch}>
                      {cfg.chests[ch].name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </Part>

      <Part title="Baús e chances">
        {CHEST_ORDER.map((ch) => {
          const sum = RARITY_ORDER.reduce((n, r) => n + (cfg.chests[ch].odds[r] || 0), 0);
          return (
            <div key={ch} className="grid gap-2 rounded-2xl bg-surface2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{cfg.chests[ch].name}</p>
                <span className={`chip ${Math.abs(sum - 100) < 0.01 ? 'chip-plain' : 'chip-accent'}`}>Soma {Math.round(sum * 10) / 10}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Num label="Preço" value={cfg.chests[ch].price} onChange={(v) => edit((c) => (c.chests[ch].price = v))} />
                {RARITY_ORDER.map((r) => (
                  <Num key={r} label={`${RLABEL[r]} %`} step={0.1} value={cfg.chests[ch].odds[r]} onChange={(v) => edit((c) => (c.chests[ch].odds[r] = v))} />
                ))}
              </div>
            </div>
          );
        })}
      </Part>

      <Part title="Raridades, repetidos e Oficina">
        {RARITY_ORDER.map((r) => (
          <div key={r} className="grid grid-cols-3 items-end gap-2">
            <p className="pb-2 font-bold">{RLABEL[r]}</p>
            <Num label="Repetido rende" value={cfg.rarities[r].fragments} onChange={(v) => edit((c) => (c.rarities[r].fragments = v))} />
            <Num label="Fabricar custa" value={cfg.rarities[r].craft} onChange={(v) => edit((c) => (c.rarities[r].craft = v))} />
          </div>
        ))}
        <p className="text-[13px] font-bold">Proteção contra azar</p>
        <div className="grid grid-cols-2 gap-2">
          <Num label="Raro garantido em (baús)" value={cfg.pity.rareAfter} onChange={(v) => edit((c) => (c.pity.rareAfter = v))} />
          <Num label="Chance sobe a partir de" value={cfg.pity.softFrom} onChange={(v) => edit((c) => (c.pity.softFrom = v))} />
          <Num label="Sobe por baú (pontos)" value={cfg.pity.softStep} onChange={(v) => edit((c) => (c.pity.softStep = v))} />
          <Num label="Lendário garantido em" value={cfg.pity.legendaryAfter} onChange={(v) => edit((c) => (c.pity.legendaryAfter = v))} />
        </div>
      </Part>

      <Part title={`Coleções (${cfg.collections.length})`}>
        {cfg.collections.map((col, i) => (
          <div key={col.id} className="grid gap-2 rounded-2xl bg-surface2 p-3">
            <input aria-label={`Nome da coleção ${col.id}`} className="field !min-h-[40px] !py-1 text-[15px]" value={col.name} onChange={(e) => edit((c) => (c.collections[i].name = e.target.value))} />
            <label className="grid gap-0.5 text-[12px] font-bold text-muted">
              Peças (códigos separados por vírgula)
              <input className="field !min-h-[40px] !py-1 text-[14px] text-ink" value={col.items.join(', ')} onChange={(e) => edit((c) => (c.collections[i].items = e.target.value.split(',').map((x) => x.trim()).filter(Boolean)))} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Num label="Sementes" value={col.reward.coins} onChange={(v) => edit((c) => (c.collections[i].reward.coins = v))} />
              <Num label="XP" value={col.reward.xp} onChange={(v) => edit((c) => (c.collections[i].reward.xp = v))} />
            </div>
          </div>
        ))}
      </Part>

      <Part title="Temporada (trilha grátis)">
        {cfg.season.tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-4 items-end gap-2">
            <Num label={`${i + 1}º: dias`} value={t.days} onChange={(v) => edit((c) => (c.season.tiers[i].days = v))} />
            <Num label="Sementes" value={t.coins} onChange={(v) => edit((c) => (c.season.tiers[i].coins = v || undefined))} />
            <Num label="Fragmentos" value={t.fragments} onChange={(v) => edit((c) => (c.season.tiers[i].fragments = v || undefined))} />
            <label className="grid gap-0.5 text-[12px] font-bold text-muted">
              Baú
              <select className="field !min-h-[40px] !px-1 !py-1 text-[14px] text-ink" value={t.chest ?? ''} onChange={(e) => edit((c) => (c.season.tiers[i].chest = (e.target.value || undefined) as ChestId | undefined))}>
                <option value="">—</option>
                {CHEST_ORDER.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </Part>

      {(errors.length > 0 || serverErrors.length > 0) && (
        <section className="card grid gap-1 p-4 ring-2 ring-[var(--danger)]" aria-live="polite">
          <p className="font-bold">Arrume antes de salvar:</p>
          <ul className="list-disc pl-5 text-[14px]">
            {[...new Set([...errors, ...serverErrors])].slice(0, 12).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card grid gap-2 p-4">
        <button className="btn btn-soft" onClick={simulate} disabled={errors.length > 0}>
          <FlaskConical size={18} /> Simular 1 ano com os 4 perfis
        </button>
        {sim && (
          <div className="overflow-x-auto">
            <table className="admin-sim w-full text-[13px]">
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Nível 5</th>
                  <th>Última arena</th>
                  <th>Sementes/sem.</th>
                </tr>
              </thead>
              <tbody>
                {sim.map((r) => {
                  const last = cfg.arenas[cfg.arenas.length - 1].level;
                  const d5 = r.levelDay[5];
                  const dl = r.levelDay[last];
                  return (
                    <tr key={r.persona}>
                      <td>{PERSONAS.find((p) => p.id === r.persona)?.label.split(' (')[0]}</td>
                      <td>{d5 == null ? '—' : `dia ${d5}`}</td>
                      <td>{dl == null ? `arena ${r.finalArena} em 1 ano` : `dia ${dl}`}</td>
                      <td>{r.coinsPerWeek}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <input aria-label="O que mudou" className="field" maxLength={120} placeholder="O que mudou (ex.: baú de prata mais barato)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-primary" onClick={save} disabled={busy || errors.length > 0}>
          <Save size={18} /> Salvar nova versão
        </button>
      </section>

      <Part title="Versões">
        {versions.length ? (
          versions.map((v) => (
            <div key={v.version} className="flex items-center gap-2 rounded-2xl bg-surface2 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold">Versão {v.version}</p>
                <p className="truncate text-[12px] text-muted">
                  {new Date(v.at).toLocaleString('pt-BR')} · {v.author ?? 'admin'}
                  {v.note ? ` · ${v.note}` : ''}
                </p>
              </div>
              {v.version !== versions[0].version && (
                <button className="btn btn-ghost btn-sm" onClick={() => restore(v.version)}>
                  <RotateCcw size={15} /> Voltar
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-[14px] text-muted">Ainda usando a configuração padrão.</p>
        )}
      </Part>
    </div>
  );
}

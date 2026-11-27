// Ofensiva em dupla: você e um amigo mantêm uma sequência juntos. O dia conta quando os dois fazem
// pelo menos 1 tarefa. Os dois Lumbis aparecem juntinhos; se o amigo ainda não fez, dá para cutucar.
import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Heart } from "lucide-react";
import { Hamster } from "./Hamster";
import { Sheet, toast } from "./ui";
import { burstConfetti } from "../lib/confetti";
import { play } from "../lib/sound";
import { useSocial } from "../lib/social";
import { dayOf, todayKey, useApp } from "../lib/store";
import { DUO_MILESTONES } from "../shared/duo";
import type { Duo, Profile, SocialApi } from "../lib/social/types";

const errText = (e: unknown) =>
  e instanceof Error && e.message ? e.message : "Não deu certo agora.";
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

const listeners = new Set<(d: Duo | null) => void>();
const share = (d: Duo | null) => listeners.forEach((l) => l(d));

/** Fica no App: quando a pessoa faz (ou desfaz) a primeira tarefa do dia, marca a parte dela na dupla. */
export function DuoSync() {
  const s = useApp();
  const { api } = useSocial();
  const today = todayKey();
  const did = Object.keys(dayOf(s, today).done).length > 0;
  const sent = useRef<string>("");
  useEffect(() => {
    if (!api || !s.onboarded) return;
    const key = `${today}:${did}`;
    if (sent.current === key) return;
    let alive = true;
    (async () => {
      try {
        const d = await api.duo(today);
        if (!alive || !d || d.status !== "ativa") return;
        sent.current = key;
        if (d.today.me === did) return;
        share(await api.duoCheckin(today, did));
      } catch {
        /* sem internet: tenta de novo na próxima tarefa */
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, today, did, s.onboarded]);
  return null;
}

function useDuo(api: SocialApi | null) {
  const today = todayKey();
  const [duo, setDuo] = useState<Duo | null | undefined>(undefined);
  const reload = useCallback(async () => {
    if (!api) return;
    try {
      setDuo(await api.duo(today));
    } catch {
      setDuo(null);
    }
  }, [api, today]);
  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    listeners.add(setDuo);
    return () => void listeners.delete(setDuo);
  }, []);
  return { duo, setDuo, today };
}

/** Os dois Lumbis juntinhos, com um coração no meio. */
function Pair({
  me,
  partner,
  size = 92,
  glow,
}: {
  me: {
    fur: string;
    phase: number;
    outfit: Profile["pet"]["outfit"];
    name: string;
  };
  partner: Profile["pet"];
  size?: number;
  glow?: boolean;
}) {
  return (
    <div className={`dp-pair ${glow ? "is-on" : ""}`} aria-hidden="true">
      <span className="dp-pet">
        <Hamster
          fur={me.fur}
          phase={me.phase}
          outfit={me.outfit}
          size={size}
          idle={false}
          neutral
          mood={glow ? "risada" : "feliz"}
          label=""
        />
      </span>
      <span className="dp-heart">
        <Heart size={22} fill="currentColor" />
      </span>
      <span className="dp-pet is-flip">
        <Hamster
          fur={partner.fur}
          phase={partner.phase}
          outfit={partner.outfit}
          size={size}
          idle={false}
          neutral
          mood={glow ? "risada" : "feliz"}
          label=""
        />
      </span>
    </div>
  );
}

/** Cartão da aba Lumbi: chamar um amigo, aceitar o convite ou ver a ofensiva de vocês. */
export function DuoCard({
  api,
  friends,
}: {
  api: SocialApi;
  friends: Profile[];
}) {
  const s = useApp();
  const { duo, setDuo, today } = useDuo(api);
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const mine = {
    fur: s.pet.fur,
    phase: s.pet.phase,
    outfit: s.pet.outfit,
    name: s.pet.name,
  };

  const run = async (fn: () => Promise<Duo | null | void>, ok?: string) => {
    setBusy(true);
    try {
      const d = await fn();
      setDuo(d ?? null);
      if (ok) toast(ok);
    } catch (e) {
      toast(errText(e));
    } finally {
      setBusy(false);
    }
  };

  // Marco novo (3, 7, 14, 30… dias): festa uma vez só.
  useEffect(() => {
    if (!duo || duo.status !== "ativa" || !duo.today.me || !duo.today.partner)
      return;
    if (!(DUO_MILESTONES as readonly number[]).includes(duo.streak)) return;
    const key = `lumbi-dupla-marco:${duo.id}:${duo.streak}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* sem armazenamento: comemora mesmo assim */
    }
    play("conquista");
    burstConfetti(card.current, 34);
    toast(`${dias(duo.streak)} de ofensiva em dupla! 🔥`);
  }, [duo]);

  if (duo === undefined) return null;

  if (!duo) {
    return (
      <div className="dp dp-empty" ref={card}>
        <div className="dp-top">
          <span className="dp-flame" aria-hidden="true">
            <Flame size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <b>Ofensiva em dupla</b>
            <small>
              Você e um amigo fazem 1 tarefa por dia. A sequência é dos dois!
            </small>
          </div>
        </div>
        <button
          className="dp-btn"
          onClick={() =>
            friends.length
              ? setPick(true)
              : toast("Adicione um amigo primeiro (botão + lá em cima).")
          }
        >
          Chamar um amigo
        </button>
        <Sheet
          open={pick}
          onClose={() => setPick(false)}
          title="Ofensiva em dupla com…"
        >
          <div className="grid gap-2">
            {friends.map((f) => (
              <button
                key={f.id}
                className="dp-friend"
                disabled={busy}
                onClick={() => {
                  setPick(false);
                  run(
                    () => api.inviteDuo(f.id, today),
                    `Convite enviado para ${f.name}!`,
                  );
                }}
              >
                <Hamster
                  fur={f.pet.fur}
                  phase={f.pet.phase}
                  outfit={f.pet.outfit}
                  size={52}
                  idle={false}
                  neutral
                  label=""
                />
                <span className="min-w-0 flex-1 text-left">
                  <b>{f.name}</b>
                  <small>{f.pet.name}</small>
                </span>
                <span className="dp-chip">Chamar</span>
              </button>
            ))}
          </div>
        </Sheet>
      </div>
    );
  }

  const p = duo.partner;
  if (duo.status === "convite") {
    return (
      <div className="dp" ref={card}>
        <Pair me={mine} partner={p.pet} size={76} />
        {duo.invitedByMe ? (
          <>
            <p className="dp-say">
              Esperando {p.name} aceitar a ofensiva em dupla…
            </p>
            <button
              className="dp-link"
              disabled={busy}
              onClick={() => run(() => api.leaveDuo(), "Convite cancelado.")}
            >
              Cancelar convite
            </button>
          </>
        ) : (
          <>
            <p className="dp-say">
              <b>{p.name}</b> quer fazer uma ofensiva em dupla com você! Cada um
              faz 1 tarefa por dia.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="dp-btn is-ghost"
                disabled={busy}
                onClick={() => run(() => api.leaveDuo())}
              >
                Agora não
              </button>
              <button
                className="dp-btn"
                disabled={busy}
                onClick={() =>
                  run(() => api.acceptDuo(today), "Dupla formada! 🔥")
                }
              >
                Topo!
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const both = duo.today.me && duo.today.partner;
  const say = both
    ? `Vocês dois fizeram hoje! 🔥`
    : duo.today.me
      ? `Você já fez a sua parte. Falta ${p.name}!`
      : duo.today.partner
        ? `${p.name} já fez. Falta você: faça 1 tarefa!`
        : `Hoje cada um faz 1 tarefa para a ofensiva continuar.`;
  return (
    <div className={`dp is-on ${both ? "is-done" : ""}`} ref={card}>
      <div className="dp-head">
        <div className="min-w-0 flex-1">
          <p className="dp-eyebrow">Ofensiva em dupla</p>
          <p className="dp-names">
            {s.profile.name || "Você"} & {p.name}
          </p>
        </div>
        <span className="dp-count" aria-label={`${dias(duo.streak)} seguidos`}>
          <Flame size={20} />
          {duo.streak}
        </span>
      </div>
      <Pair me={mine} partner={p.pet} glow={both} />
      <p className="dp-say">{say}</p>
      <div className="dp-week" aria-label="Últimos 7 dias">
        {duo.week.map((w) => {
          const full = w.me && w.partner;
          const half = !full && (w.me || w.partner);
          return (
            <span
              key={w.date}
              className={`dp-day ${full ? "is-full" : half ? "is-half" : ""} ${w.date === duo.today.date ? "is-today" : ""}`}
            >
              <i>{full ? <Flame size={14} /> : null}</i>
              <small>{WEEK[new Date(`${w.date}T12:00:00`).getDay()]}</small>
            </span>
          );
        })}
      </div>
      {!duo.today.partner && (
        <button
          className="dp-btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await api.nudgeDuo(today);
              play("latido");
              toast(
                r === "ok"
                  ? `Cutucada enviada para ${p.name}! 🐾`
                  : r === "limite"
                    ? "Você já cutucou hoje. Amanhã dá de novo!"
                    : `${p.name} já fez hoje!`,
              );
            } catch (e) {
              toast(errText(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Cutucar {p.name}
        </button>
      )}
      <div className="dp-foot">
        <span>Recorde: {dias(duo.best)}</span>
        <button
          className="dp-link"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                `Desfazer a ofensiva em dupla com ${p.name}? A sequência de vocês volta para zero.`,
              )
            )
              run(() => api.leaveDuo(), "Dupla desfeita.");
          }}
        >
          Desfazer dupla
        </button>
      </div>
    </div>
  );
}

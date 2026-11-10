// Guardiões do Hami: quem pode pagar dá HamiCare+ para quem não pode agora (ideia do Finch, do nosso jeito).
// - Pedir ajuda: entra na fila; quando um Guardião paga, o Plus liga sozinho (ordem de chegada).
// - Ser Guardião (só adultos, só no site): Aliado (1 pessoa), Protetor (3) ou Super-herói (você escolhe o valor),
//   por 1 mês ou 1 ano, pagamento único (Pix ou cartão), nome no mural e 100 sementes por pessoa ajudada.
import { useCallback, useEffect, useState } from 'react';
import { Glyph } from './art';
import { Seed, Sheet, toast } from './ui';
import { play } from '../lib/sound';
import { useApp } from '../lib/store';
import { useAccount } from '../lib/account';
import { askHelp, becomeGuardian, canBuyHere, cancelHelp, guardianMe, guardianWall, markTwa, payTest, type GuardianMe, type GuardianWall } from '../lib/guardian';
import { brl, guardianBonus, guardianQuote, SEAT_CENTS, TIERS, type GuardianPeriod, type GuardianTier } from '../shared/guardian';

let opener: (() => void) | null = null;
/** Abre a tela dos Guardiões de qualquer lugar do app. */
export function openGuardian() {
  opener?.();
}

const HASH = /^#guardiao=(ok|pendente|falhou|teste:([0-9a-f-]{36}))$/;

export function GuardianHost() {
  const [open, setOpen] = useState(false);
  const [testOrder, setTestOrder] = useState<string | null>(null);
  useEffect(() => {
    opener = () => setOpen(true);
    markTwa();
    // Volta do pagamento (ou pagamento de teste): abre a tela com o aviso certo.
    const onHash = () => {
      const m = location.hash.match(HASH);
      if (!m) return;
      try {
        history.replaceState(null, '', '#inicio');
      } catch {
        /* ok */
      }
      setOpen(true);
      if (m[1] === 'ok') {
        play('conquista');
        toast('Obrigado, Guardião! Seu presente já está ajudando alguém 💜');
      } else if (m[1] === 'pendente') toast('Pagamento em análise. Assim que confirmar, as vagas vão para a fila.');
      else if (m[1] === 'falhou') toast('O pagamento não foi concluído. Nada foi cobrado.');
      else if (m[2]) setTestOrder(m[2]);
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => {
      opener = null;
      window.removeEventListener('hashchange', onHash);
    };
  }, []);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Guardiões do Hami">
      {open && <GuardianBody testOrder={testOrder} onTestDone={() => setTestOrder(null)} />}
    </Sheet>
  );
}

function GuardianBody({ testOrder, onTestDone }: { testOrder: string | null; onTestDone: () => void }) {
  const s = useApp();
  const { user, online, ready } = useAccount();
  const [wall, setWall] = useState<GuardianWall | null>(null);
  const [me, setMe] = useState<GuardianMe | null>(null);
  const kid = s.profile.ageGroup === 'ate12';
  const adult = (user?.ageGroup ?? s.profile.ageGroup) === '18mais';
  const load = useCallback(async () => {
    guardianWall().then(setWall).catch(() => setWall(null));
    if (user) guardianMe().then(setMe).catch(() => setMe(null));
  }, [user]);
  useEffect(() => {
    if (ready && online) load();
  }, [ready, online, load]);

  if (kid) return <p className="pb-4 text-center text-[15px] text-muted">O HamiCare+ é para quem tem 13 anos ou mais. Tudo o que importa para cuidar do Hami é grátis.</p>;

  return (
    <div className="grid gap-4 pb-3">
      <section className="gd-hero">
        <Glyph e="🛡️" size={64} />
        <div className="min-w-0">
          <p className="gd-hero-title">Ninguém fica sem cuidado</p>
          <p className="gd-hero-sub">Quem pode dá HamiCare+ de presente para quem não pode pagar agora.</p>
        </div>
      </section>
      {wall && (
        <div className="gd-stats">
          <span>
            <b>{wall.stats.helped}</b> pessoas ajudadas
          </span>
          <span>
            <b>{wall.stats.waiting}</b> na fila
          </span>
          <span>
            <b>{wall.stats.guardians}</b> Guardiões
          </span>
        </div>
      )}
      {!online ? (
        <p className="rounded-2xl bg-surface-2 p-3 text-[14px] text-muted">Os Guardiões funcionam no app do HamiCare com conta (backup ligado). Nesta versão de teste, dá só para conhecer.</p>
      ) : !user ? (
        <p className="rounded-2xl bg-surface-2 p-3 text-[14px] text-muted">Entre na sua conta (Ajustes → Conta) para pedir ajuda ou ser Guardião.</p>
      ) : (
        <>
          <HelpCard me={me} onChange={load} />
          {adult && canBuyHere() && <BecomeCard paymentsOn={!!wall?.paymentsOn} testOrder={testOrder} onTestDone={() => (onTestDone(), load())} defaultName={s.profile.name} />}
        </>
      )}
      <Wall wall={wall} />
    </div>
  );
}

function HelpCard({ me, onChange }: { me: GuardianMe | null; onChange: () => void }) {
  const s = useApp();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const req = me?.request;
  const plusOn = !!s.premium.until && s.premium.until >= new Date().toISOString().slice(0, 10);
  if (req?.status === 'atendido' && plusOn) {
    return (
      <section className="gd-card gd-got">
        <Glyph e="💌" size={40} />
        <p className="text-[15px] font-bold leading-snug">
          Um Guardião te deu {req.months === 12 ? '1 ano' : `${req.months ?? 1} ${req.months === 1 || !req.months ? 'mês' : 'meses'}`} de HamiCare+ 💜 Aproveite: alguém acredita em você.
        </p>
      </section>
    );
  }
  if (plusOn) return null;
  return (
    <section className="gd-card">
      <h3 className="gd-title">Precisa de ajuda?</h3>
      {req?.status === 'esperando' ? (
        <>
          <p className="text-[14px] text-muted">Você está na fila. Quando um Guardião ajudar, o HamiCare+ liga sozinho e você recebe um aviso aqui.</p>
          <button
            className="btn btn-ghost btn-sm justify-self-start"
            onClick={async () => {
              await cancelHelp().catch(() => {});
              onChange();
            }}
          >
            Sair da fila
          </button>
        </>
      ) : (
        <>
          <p className="text-[14px] text-muted">Se agora não dá para pagar, peça um HamiCare+ de presente. Não precisa explicar nada.</p>
          <textarea className="field min-h-[70px]" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Se quiser, conte em poucas palavras (opcional)" aria-label="Por que você precisa (opcional)" />
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await askHelp(reason.trim() || undefined);
                play(r.status === 'atendido' ? 'conquista' : 'pronto');
                toast(r.status === 'atendido' ? 'Um Guardião já estava esperando por você: HamiCare+ ligado! 💜' : 'Pronto! Você entrou na fila dos Guardiões.');
                setReason('');
                onChange();
              } catch (e) {
                toast((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Pedir um HamiCare+ de presente
          </button>
        </>
      )}
    </section>
  );
}

function BecomeCard({ paymentsOn, testOrder, onTestDone, defaultName }: { paymentsOn: boolean; testOrder: string | null; onTestDone: () => void; defaultName: string }) {
  const [period, setPeriod] = useState<GuardianPeriod>('mes');
  const [tier, setTier] = useState<GuardianTier>('aliado');
  const [hero, setHero] = useState('50');
  const [name, setName] = useState(defaultName.slice(0, 40));
  const [anon, setAnon] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const heroCents = Math.round(Number(hero.replace(',', '.')) * 100);
  const q = guardianQuote(tier, period, heroCents);
  return (
    <section className="gd-card">
      <h3 className="gd-title">Seja um Guardião</h3>
      <div className="seg" role="group" aria-label="Por quanto tempo">
        {(['mes', 'ano'] as const).map((p) => (
          <button key={p} aria-pressed={period === p} onClick={() => setPeriod(p)}>
            {p === 'mes' ? '1 mês' : '1 ano'}
          </button>
        ))}
      </div>
      <div className="gd-tiers" role="radiogroup" aria-label="Nível">
        {(Object.keys(TIERS) as GuardianTier[]).map((t) => {
          const tq = t === 'heroi' ? null : guardianQuote(t, period);
          return (
            <button key={t} role="radio" aria-checked={tier === t} className={`gd-tier ${tier === t ? 'is-on' : ''}`} onClick={() => setTier(t)}>
              <Glyph e={t === 'heroi' ? '🦸' : t === 'protetor' ? '🛡️' : '💜'} size={34} />
              <b>{TIERS[t].name}</b>
              <span>{TIERS[t].about}</span>
              <em>{tq ? brl(tq.cents) : 'Valor livre'}</em>
            </button>
          );
        })}
      </div>
      {tier === 'heroi' && (
        <label className="grid gap-1 text-[14px] font-bold">
          Quanto você quer dar? (R$)
          <input className="field" inputMode="decimal" value={hero} onChange={(e) => setHero(e.target.value.replace(/[^\d,.]/g, ''))} aria-label="Valor em reais" />
          <span className="text-[12.5px] font-semibold text-muted">
            {q ? `Ajuda ${q.seats} ${q.seats === 1 ? 'pessoa' : 'pessoas'} por ${period === 'ano' ? '1 ano' : '1 mês'}.` : `Mínimo de ${brl(SEAT_CENTS[period])} (1 pessoa).`}
          </span>
        </label>
      )}
      <label className="grid gap-1 text-[14px] font-bold">
        Nome no mural
        <input className="field" value={anon ? '' : name} disabled={anon} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Seu nome ou apelido" />
      </label>
      <label className="flex items-center gap-2 text-[14px] font-semibold">
        <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Aparecer como "Guardião anônimo"
      </label>
      <label className="grid gap-1 text-[14px] font-bold">
        Recadinho para quem vai receber (opcional)
        <input className="field" value={msg} maxLength={140} onChange={(e) => setMsg(e.target.value)} placeholder="Ex.: Você não está sozinho 💜" />
      </label>
      {q && (
        <p className="flex flex-wrap items-center gap-1 text-[13px] font-bold text-muted">
          {q.seats} {q.seats === 1 ? 'pessoa ganha' : 'pessoas ganham'} HamiCare+ por {q.months === 12 ? '1 ano' : '1 mês'} · você ganha <Seed size={12} /> {guardianBonus(q.seats)}
        </p>
      )}
      <button
        className="btn btn-primary"
        disabled={!q || busy || !paymentsOn}
        onClick={async () => {
          if (!q) return;
          setBusy(true);
          try {
            const r = await becomeGuardian({ tier, period, heroCents: tier === 'heroi' ? heroCents : undefined, displayName: anon ? undefined : name.trim() || undefined, message: msg.trim() || undefined });
            if (r.provider === 'teste') location.hash = `guardiao=teste:${r.orderId}`;
            else location.href = r.checkoutUrl;
          } catch (e) {
            toast((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {paymentsOn ? (q ? `Ser Guardião · ${brl(q.cents)}` : 'Escolha um valor') : 'Abre em breve'}
      </button>
      <p className="text-[12px] text-muted">Pagamento único pelo Mercado Pago (Pix ou cartão). Não renova sozinho. As vagas vão para quem pediu ajuda, na ordem da fila.</p>
      {testOrder && (
        <div className="gd-test">
          <p className="text-[14px] font-bold">Pagamento de teste (ambiente de desenvolvimento): confirmar este pedido?</p>
          <button
            className="btn btn-leaf btn-sm"
            onClick={async () => {
              await payTest(testOrder).catch((e) => toast((e as Error).message));
              play('conquista');
              toast('Obrigado, Guardião! (teste)');
              onTestDone();
            }}
          >
            Confirmar pagamento de teste
          </button>
        </div>
      )}
    </section>
  );
}

function Wall({ wall }: { wall: GuardianWall | null }) {
  if (!wall?.wall.length) {
    return (
      <section className="gd-card">
        <h3 className="gd-title">Mural dos Guardiões</h3>
        <p className="text-[14px] text-muted">Os primeiros Guardiões vão aparecer aqui.</p>
      </section>
    );
  }
  return (
    <section className="gd-card">
      <h3 className="gd-title">Mural dos Guardiões</h3>
      <ul className="gd-wall">
        {wall.wall.map((g, i) => (
          <li key={i}>
            <Glyph e={g.tier === 'heroi' ? '🦸' : g.tier === 'protetor' ? '🛡️' : '💜'} size={30} />
            <div className="min-w-0">
              <p className="text-[14.5px] font-extrabold">{g.name}</p>
              <p className="text-[12.5px] font-semibold text-muted">
                {TIERS[g.tier].name} · ajudou {g.seats} {g.seats === 1 ? 'pessoa' : 'pessoas'} por {g.months === 12 ? '1 ano' : '1 mês'}
              </p>
              {g.message && <p className="mt-1 text-[13.5px] italic">“{g.message}”</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

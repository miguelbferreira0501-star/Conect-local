import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { api } from '@/lib/api';
import { disablePush, enablePush, pushState, type PushState } from '@/lib/push';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const COPY = {
  tutor: { title: 'Receba os avisos do seu pet', text: 'Pet ao Vivo, horário confirmado, lembrete na véspera e a hora de voltar, direto no celular.' },
  business: { title: 'Avise-me de novos pedidos', text: 'Receba no celular cada agendamento, orçamento e pedido de pacote assim que chegar.' },
  booking: { title: 'Quer saber quando confirmarem?', text: 'Ative as notificações e acompanhe a confirmação e o Pet ao Vivo pelo celular.' },
} as const;

/** Cartão para ligar as notificações. Some quando já estão ligadas ou quando a pessoa fecha. */
export function PushPrompt({ variant }: { variant: keyof typeof COPY }) {
  const toast = useToast();
  const key = `cl_push_dismissed_${variant}`;
  const [state, setState] = useState<PushState | null>(null);
  const [hidden, setHidden] = useState(() => storage.get(key, false));
  const [busy, setBusy] = useState(false);
  useEffect(() => { pushState().then(setState).catch(() => setState('unsupported')); }, []);
  if (hidden || state === null || state === 'on' || state === 'unsupported') return null;
  const c = COPY[variant];
  const enable = async () => {
    setBusy(true);
    try {
      const s = await enablePush();
      setState(s);
      if (s === 'on') toast('Notificações ativadas!');
      else if (s === 'denied') toast('As notificações estão bloqueadas. Libere nas configurações do navegador ou do app.', 'error');
    } catch {
      toast('Não foi possível ativar agora. Tente de novo.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card flex items-start gap-3 p-4" data-testid="push-prompt">
      <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{c.title}</p>
        <p className="text-sm text-muted">{state === 'denied' ? 'As notificações estão bloqueadas neste aparelho. Libere nas configurações do navegador ou do app para receber os avisos.' : c.text}</p>
        {state !== 'denied' && <Button size="sm" className="mt-2" loading={busy} onClick={enable}>Ativar notificações</Button>}
      </div>
      <button aria-label="Fechar" className="rounded p-1 text-muted hover:bg-white/10" onClick={() => { storage.set(key, true); setHidden(true); }}><X className="h-4 w-4" /></button>
    </section>
  );
}

/** Linha do perfil: liga/desliga as notificações deste aparelho e manda um teste. */
export function PushSettingsItem() {
  const toast = useToast();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { pushState().then(setState).catch(() => setState('unsupported')); }, []);
  if (state === null || state === 'unsupported') return null;
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); } };
  return (
    <li className="flex min-h-[60px] items-center gap-3 px-4 py-2">
      <BellRing className="h-5 w-5 text-brand-fg" aria-hidden="true" />
      <span className="flex-1">
        <span className="block font-medium">Notificações neste aparelho</span>
        <span className="text-sm text-muted">{state === 'on' ? 'Ativadas' : state === 'denied' ? 'Bloqueadas nas configurações do aparelho' : 'Desativadas'}</span>
      </span>
      {state === 'on' ? (
        <span className="flex gap-1">
          <Button size="sm" variant="ghost" loading={busy} onClick={() => run(async () => { const r = await api.post<{ sent: number }>('/me/push/test', {}); toast(r.sent ? 'Teste enviado.' : 'Nenhum aparelho recebeu.'); })}>Testar</Button>
          <Button size="sm" variant="secondary" loading={busy} onClick={() => run(async () => { await disablePush(); setState('off'); toast('Notificações desativadas.'); })}>Desativar</Button>
        </span>
      ) : state === 'off' ? (
        <Button size="sm" loading={busy} onClick={() => run(async () => setState(await enablePush()))}>Ativar</Button>
      ) : null}
    </li>
  );
}

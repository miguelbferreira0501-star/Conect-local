import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { toast } from '../components/ui';
import { http, ApiError } from '../lib/social/api';
import { useAccount } from '../lib/account';
import { addCoins, receiveGift } from '../lib/store';

interface EventRow {
  id: string;
  title: string;
  description: string;
  endsOn: string;
  rewardCoins: number;
  itemId: string | null;
  claimed: boolean;
}

/** Eventos e missões especiais criados pela administração (precisa de conta). */
export function EventsBanner() {
  const { user } = useAccount();
  const [events, setEvents] = useState<EventRow[]>([]);
  useEffect(() => {
    if (!user) return setEvents([]);
    http<{ events: EventRow[] }>('GET', '/events').then((r) => setEvents(r.events)).catch(() => setEvents([]));
  }, [user]);
  const open = events.filter((e) => !e.claimed);
  if (!open.length) return null;
  return (
    <section className="grid gap-2" aria-label="Eventos">
      {open.map((ev) => (
        <div key={ev.id} className="card flex items-center gap-3 border-2 border-accent p-4">
          <PartyPopper className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">{ev.title}</p>
            <p className="text-[13px] text-muted">{ev.description}</p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              try {
                const r = await http<{ reward: { coins: number; itemId: string | null } }>('POST', `/events/${ev.id}/claim`);
                addCoins(r.reward.coins);
                if (r.reward.itemId) receiveGift(r.reward.itemId);
                toast(`+${r.reward.coins} sementes!`);
                setEvents((list) => list.map((x) => (x.id === ev.id ? { ...x, claimed: true } : x)));
              } catch (e) {
                toast(e instanceof ApiError ? e.message : 'Não deu certo agora.');
              }
            }}
          >
            🌻 {ev.rewardCoins}
          </button>
        </div>
      ))}
    </section>
  );
}

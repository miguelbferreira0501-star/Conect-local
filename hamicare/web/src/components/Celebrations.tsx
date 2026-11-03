import { Modal, Seed } from './ui';
import { Pet } from './Pet';
import { placeById } from '../data/places';
import { itemById } from '../data/items';
import { STAGES, useApp, type Postcard } from '../lib/store';
import { formatDay } from '../lib/util';

export function PostcardView({ card, reward }: { card: Postcard; reward?: boolean }) {
  const s = useApp();
  const place = placeById(card.placeId);
  if (!place) return null;
  const souvenir = itemById(card.souvenir);
  return (
    <div>
      <div
        className="relative flex h-44 items-end justify-between overflow-hidden rounded-t-[28px] p-5"
        style={{ background: `linear-gradient(160deg, ${place.colors[0]}, ${place.colors[1]})` }}
      >
        <div className="min-w-0 text-[#1e2b24]">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] opacity-70">Cartão-postal · {place.uf}</p>
          <p className="font-display text-[26px] font-bold leading-tight">{place.name}</p>
        </div>
        <span className="text-[64px] leading-none" role="img" aria-label={place.name}>
          {place.emoji}
        </span>
        <span className="absolute right-4 top-4 rounded-md border-2 border-dashed border-white/70 px-2 py-1 text-[11px] font-extrabold text-white">
          {formatDay(card.date).split(',')[1]?.trim() ?? ''}
        </span>
      </div>
      <div className="grid gap-3 p-5">
        <p className="text-[17px] leading-relaxed text-ink">
          {s.userName ? `${s.userName}, ` : ''}
          {place.story}
        </p>
        <p className="font-display text-[18px] font-semibold text-muted">Com carinho, {s.petName}</p>
        {reward && (
          <div className="flex flex-wrap gap-2">
            <span className="chip chip-gold">
              <Seed /> +15 sementinhas
            </span>
            {souvenir && <span className="chip chip-leaf">{souvenir.emoji} Lembrancinha: {souvenir.name}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function PostcardModal({ card, onClose }: { card: Postcard | null; onClose: () => void }) {
  return (
    <Modal open={!!card} onClose={onClose} label="Cartão-postal">
      {card && (
        <>
          <PostcardView card={card} reward />
          <div className="px-5 pb-5">
            <button className="btn btn-primary w-full" onClick={onClose}>
              Guardar no álbum
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export function EvolveModal({ stage, onClose }: { stage: number | null; onClose: () => void }) {
  const s = useApp();
  return (
    <Modal open={stage !== null} onClose={onClose} label="Seu xodó cresceu">
      {stage !== null && (
        <div className="grid justify-items-center gap-2 p-6 text-center">
          <p className="eyebrow">Fase nova</p>
          <div className="evolve-pop">
            <Pet color={s.petColor} stage={stage} mood="animado" hat={s.hat} acc={s.acc} size={190} />
          </div>
          <h2 className="font-display text-[28px] font-bold leading-tight">{s.petName} agora é {STAGES[stage].name}!</h2>
          <p className="text-muted">Foram os seus cuidados que fizeram isso. Cada um deles.</p>
          <button className="btn btn-primary mt-2 w-full" onClick={onClose}>
            Que lindo!
          </button>
        </div>
      )}
    </Modal>
  );
}

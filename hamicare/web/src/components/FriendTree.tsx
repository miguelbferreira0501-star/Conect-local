// Árvore dos amigos (estilo Finch): o seu Hami no meio da árvore, cada amigo num galho e placas "???"
// nos lugares vazios. Embaixo, o prêmio do próximo amigo e o menu de adicionar (convite, código e QR).
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Gift, Plus, QrCode, ScanLine, Search, Share2 } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { Hamster } from './Hamster';
import { Seed, Sheet, toast } from './ui';
import { Avatar } from '../screens/social/Post';
import { friendRewardClaimed, useApp } from '../lib/store';
import { FRIEND_LADDER } from '../shared/game';
import { inviteLink, shareInvite } from '../lib/social/invite';
import type { Profile } from '../lib/social/types';

/** Lugares dos galhos (em % da cena): os 5 primeiros amigos. */
const SLOTS = [
  { x: 18, y: 36 },
  { x: 82, y: 33 },
  { x: 22, y: 62 },
  { x: 80, y: 60 },
  { x: 50, y: 15 },
];

function Sign() {
  return (
    <svg viewBox="0 0 80 74" width="72" height="66" aria-hidden="true">
      <ellipse cx="40" cy="70" rx="16" ry="4" fill="#000" opacity="0.18" />
      <rect x="35" y="16" width="10" height="54" rx="3" fill="#6B4A2E" />
      <rect x="6" y="14" width="68" height="15" rx="4" fill="#8C6440" transform="rotate(-4 40 21)" />
      <rect x="6" y="28" width="68" height="15" rx="4" fill="#7A5535" transform="rotate(-4 40 35)" />
      <text x="40" y="35" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="17" fill="#B9B2C4" transform="rotate(-4 40 30)">
        ???
      </text>
    </svg>
  );
}

function Scenery() {
  return (
    <svg className="ft-bg" viewBox="0 0 390 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ft-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#27304f" />
          <stop offset="1" stopColor="#3a4868" />
        </linearGradient>
      </defs>
      <rect width="390" height="460" fill="url(#ft-sky)" />
      {[
        [40, 40], [120, 22], [250, 30], [330, 60], [80, 90], [300, 110], [190, 50],
      ].map(([x, y], i) => (
        <circle key={i} className="ft-star" style={{ animationDelay: `${i * 0.4}s` }} cx={x} cy={y} r={i % 2 ? 1.6 : 2.2} fill="#FFF6D8" />
      ))}
      <circle cx="338" cy="44" r="16" fill="#FFF3C4" />
      <circle cx="331" cy="40" r="15" fill="#2c3554" />
      {/* tronco */}
      <path d="M160 470 C170 400 168 380 150 352 L240 352 C222 380 220 400 230 470 Z" fill="#3a2a1d" />
      {/* copa: fundo, meio e frente */}
      <g fill="#1d3a20">
        <circle cx="60" cy="210" r="90" /><circle cx="330" cy="205" r="95" /><circle cx="195" cy="120" r="105" /><circle cx="120" cy="140" r="80" /><circle cx="280" cy="140" r="80" />
      </g>
      <g fill="#2a4f2b">
        <circle cx="40" cy="300" r="85" /><circle cx="350" cy="290" r="90" /><circle cx="195" cy="210" r="110" /><circle cx="100" cy="230" r="80" /><circle cx="300" cy="225" r="85" />
      </g>
      <g fill="#36622f">
        <circle cx="70" cy="370" r="80" /><circle cx="320" cy="365" r="85" /><circle cx="195" cy="330" r="90" /><circle cx="130" cy="290" r="60" /><circle cx="265" cy="290" r="62" />
      </g>
      {/* galho do meio, onde mora o seu Hami */}
      <ellipse cx="195" cy="300" rx="84" ry="30" fill="#2f5a2c" />
      {/* brilhinhos nas folhas */}
      <g fill="#4f8a43" opacity="0.55">
        <circle cx="150" cy="200" r="14" /><circle cx="250" cy="180" r="10" /><circle cx="90" cy="300" r="12" /><circle cx="310" cy="320" r="11" />
      </g>
    </svg>
  );
}

export function FriendTree({ me, friends, onAdd, onOpenProfile }: { me: Profile | null; friends: Profile[]; onAdd: () => void; onOpenProfile: (id: string) => void }) {
  const s = useApp();
  const shown = friends.slice(0, SLOTS.length);
  const next = FRIEND_LADDER.findIndex((_, i) => !friendRewardClaimed(s, i + 1));
  return (
    <div className="grid gap-3">
      <section className="ft" aria-label="Árvore dos amigos">
        <Scenery />
        {SLOTS.map((p, i) => {
          const f = shown[i];
          return (
            <div key={i} className="ft-slot" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {f ? (
                <button className="ft-friend" onClick={() => onOpenProfile(f.id)} aria-label={`Perfil de ${f.name}`}>
                  <Avatar pet={f.pet} id={f.id} size={58} ring />
                  <b>{f.pet.name}</b>
                  <small>{f.name}</small>
                </button>
              ) : (
                <button className="ft-sign" onClick={onAdd} aria-label="Lugar vazio: adicionar amigo">
                  <Sign />
                </button>
              )}
            </div>
          );
        })}
        {friends.length > SLOTS.length && <span className="ft-more">+{friends.length - SLOTS.length} amigos</span>}
        <div className="ft-me">
          <Hamster fur={s.pet.fur} phase={s.pet.phase} outfit={s.pet.outfit} size={92} idle={false} label={s.pet.name} />
          <b>{s.pet.name}</b>
          <small>{me?.name ?? s.profile.name}</small>
        </div>
        <button className="ft-add" onClick={onAdd}>
          <span className="ft-add-plus">
            <Plus size={18} strokeWidth={3.5} />
          </span>
          Adicionar amigo
        </button>
      </section>
      {next >= 0 && (
        <button className="ft-reward" onClick={onAdd}>
          <span className="ft-reward-ico">
            <Gift size={30} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <small>Prêmio do {next + 1}º amigo</small>
            <b>
              Convide amigos e ganhe <Seed size={14} /> {FRIEND_LADDER[next]} sementes!
            </b>
          </span>
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}

/** Menu verde de adicionar: convidar (com prêmio), digitar código ou QR code. */
export function AddFriendMenu({ open, me, server, onClose, onCode }: { open: boolean; me: Profile | null; server: boolean; onClose: () => void; onCode: () => void }) {
  const [qr, setQr] = useState(false);
  return (
    <>
      <Sheet open={open && !qr} onClose={onClose} title="Adicionar amigos" className="sheet-green">
        <div className="grid gap-3 pb-2 pt-1">
          <button
            className="am-card am-wide"
            onClick={async () => {
              if (!me) return;
              const msg = await shareInvite(me.code, server);
              if (msg) toast(msg);
            }}
          >
            <Gift size={34} className="text-[#d9443f]" />
            <b>Convide seus amigos</b>
            <small>Ganhe sementes quando eles entrarem!</small>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="am-card" onClick={onCode}>
              <Search size={30} className="text-[#5b8bd6]" />
              <b>Digitar código</b>
            </button>
            <button className="am-card" onClick={() => setQr(true)} disabled={!me}>
              <QrCode size={30} className="text-[#5d5a6e]" />
              <b>QR code</b>
            </button>
          </div>
          {me && (
            <p className="text-center text-[13px] font-bold text-white/85">
              Seu código: <span className="tracking-wide">{me.code}</span>
            </p>
          )}
        </div>
      </Sheet>
      <QrSheet open={open && qr} me={me} server={server} onClose={() => setQr(false)} onScanned={() => (setQr(false), onClose())} />
    </>
  );
}

function QrSheet({ open, me, server, onClose, onScanned }: { open: boolean; me: Profile | null; server: boolean; onClose: () => void; onScanned: () => void }) {
  const [scan, setScan] = useState(false);
  const svg = useMemo(() => {
    if (!me) return '';
    const q = qrcode(0, 'M');
    q.addData(server ? inviteLink(me.code) : me.code);
    q.make();
    return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }, [me, server]);
  useEffect(() => {
    if (!open) setScan(false);
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="QR code" className="sheet-green">
      <div className="grid justify-items-center gap-3 pb-2 pt-1 text-center">
        {scan ? (
          <Scanner onDone={onScanned} onCancel={() => setScan(false)} />
        ) : (
          <>
            <div className="am-qr" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label={`QR code do seu convite (${me?.code ?? ''})`} />
            <p className="font-display text-[20px] font-bold tracking-wide text-white">{me?.code}</p>
            <p className="max-w-[300px] text-[14px] font-bold text-white/85">Peça para o seu amigo apontar a câmera do celular para este código. O convite abre direto no HamiCare.</p>
            <button className="am-card am-row" onClick={() => setScan(true)}>
              <ScanLine size={24} className="text-[#5d5a6e]" />
              <b>Ler o QR de um amigo</b>
            </button>
            <button className="am-card am-row" onClick={async () => me && toast((await shareInvite(me.code, server)) || 'Convite enviado!')}>
              <Share2 size={22} className="text-[#5d5a6e]" />
              <b>Mandar o convite</b>
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Lê o QR de um amigo com a câmera (onde o navegador tem leitor de QR). */
function Scanner({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [msg, setMsg] = useState('Abrindo a câmera…');
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  useEffect(() => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) {
      setMsg('Este celular não lê QR aqui dentro. Use a câmera do próprio celular: o convite abre o HamiCare sozinho.');
      return;
    }
    if (!video) return;
    let stream: MediaStream | null = null;
    let stop = false;
    const det = new BD({ formats: ['qr_code'] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        await video.play();
        setMsg('Aponte para o QR code do seu amigo.');
        while (!stop) {
          const codes = await det.detect(video).catch(() => []);
          const raw = codes[0]?.rawValue;
          const m = raw?.match(/#amigo=([\w-]{4,20})/i) ?? raw?.match(/^(HAMI-[\w]{6})$/i);
          if (m) {
            location.hash = `amigo=${m[1]}`;
            onDone();
            return;
          }
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch {
        setMsg('Não deu para abrir a câmera. Confira a permissão ou use a câmera do próprio celular.');
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [video, onDone]);
  return (
    <div className="grid w-full justify-items-center gap-3">
      <video ref={setVideo} className="am-video" muted playsInline />
      <p className="max-w-[300px] text-[14px] font-bold text-white/90">{msg}</p>
      <button className="am-card am-row" onClick={onCancel}>
        <b>Voltar</b>
      </button>
    </div>
  );
}

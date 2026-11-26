// Casinha dos amigos: um prédio de casinhas de cachorro de madeira, com o seu Lumbi na casinha do meio e
// cada amigo morando num cantinho (almofada, túnel, cestinho, plataformas). Os cantinhos vazios mostram
// uma carinha tracejada com "+" para convidar. Embaixo, o prêmio do próximo amigo e o menu de adicionar.
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

/** Cantinhos do prédio (em % da cena): os 5 primeiros amigos. */
const SLOTS = [
  { x: 22, y: 74 },
  { x: 79, y: 70 },
  { x: 24, y: 40 },
  { x: 80, y: 40 },
  { x: 58, y: 18 },
];

/** Cantinho vazio: carinha de cachorro tracejada com "+". */
function Sign() {
  return (
    <svg viewBox="0 0 80 70" width="68" height="60" aria-hidden="true">
      <path d="M20 22c-8-4-14 2-13 12 1 7 5 10 8 9M60 22c8-4 14 2 13 12-1 7-5 10-8 9" fill="rgba(255,255,255,0.6)" stroke="#B07A52" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
      <ellipse cx="40" cy="38" rx="24" ry="22" fill="rgba(255,255,255,0.6)" stroke="#B07A52" strokeWidth="2.5" strokeDasharray="5 4" />
      <path d="M40 30v16M32 38h16" stroke="#B07A52" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Scenery() {
  return (
    <svg className="ft-bg" viewBox="0 0 390 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* parede pêssego com bolinhas e varal de bandeirinhas */}
      <rect width="390" height="460" fill="#F8E7D3" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={(i % 6) * 70 + (Math.floor(i / 6) % 2 ? 35 : 0) + 12} cy={Math.floor(i / 6) * 70 + 70} r="5" fill="#F1D6BC" />
      ))}
      <path d="M-10 26 Q195 62 400 26" fill="none" stroke="#B88A62" strokeWidth="2" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 10 + i * 36;
        const y = 26 + 36 * (1 - ((x - 195) / 205) ** 2) * 0.55;
        return <path key={i} d={`M${x - 12} ${y} L${x + 12} ${y} L${x} ${y + 20} Z`} fill={['#FF9FBF', '#FFD66B', '#8FD3B0', '#9EC4FF'][i % 4]} />;
      })}
      {/* chão verdinho */}
      <rect y="372" width="390" height="88" fill="#9CC98A" />
      <rect y="372" width="390" height="8" fill="#B4DAA2" />
      {/* base de madeira */}
      <rect x="44" y="378" width="302" height="26" rx="10" fill="#8C5E3C" />
      <rect x="44" y="374" width="302" height="12" rx="6" fill="#B07A52" />
      {/* postes de sisal */}
      <rect x="183" y="112" width="24" height="268" rx="6" fill="#E3C79C" />
      <rect x="290" y="208" width="18" height="170" rx="5" fill="#E3C79C" />
      <rect x="82" y="208" width="18" height="170" rx="5" fill="#E3C79C" />
      {[130, 160, 190, 220, 250].map((y) => (
        <path key={y} d={`M183 ${y} l24 8`} stroke="#CDAA78" strokeWidth="3" />
      ))}
      {/* plataforma de cima com almofadinha */}
      <ellipse cx="226" cy="118" rx="82" ry="15" fill="#8C5E3C" />
      <ellipse cx="226" cy="112" rx="82" ry="14" fill="#C98F5E" />
      <ellipse cx="226" cy="104" rx="46" ry="10" fill="#FFB9CF" />
      {/* plataformas dos lados com cestinho e almofada */}
      <ellipse cx="94" cy="214" rx="58" ry="12" fill="#8C5E3C" />
      <ellipse cx="94" cy="209" rx="58" ry="11" fill="#C98F5E" />
      <path d="M58 204 Q94 236 130 204 Z" fill="#D9A46C" />
      <ellipse cx="300" cy="214" rx="58" ry="12" fill="#8C5E3C" />
      <ellipse cx="300" cy="209" rx="58" ry="11" fill="#C98F5E" />
      <ellipse cx="300" cy="200" rx="36" ry="9" fill="#A9D8FF" />
      {/* casinha do meio (onde mora o seu Lumbi) */}
      <rect x="132" y="250" width="126" height="104" rx="10" fill="#F2A65A" />
      <rect x="132" y="250" width="126" height="16" fill="#E58E3E" />
      <path d="M118 258 L195 196 L272 258 Z" fill="#C0583F" />
      <path d="M118 258 L195 196 L272 258" fill="none" stroke="#9C4430" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M160 354 v-44 a35 35 0 0 1 70 0 v44 Z" fill="#6B3E22" />
      <path d="M195 236 a8 8 0 1 0 0.1 0" fill="#FFE7A8" />
      {/* escadinha */}
      <g stroke="#9C6A42" strokeWidth="5" strokeLinecap="round">
        <path d="M118 372 L148 270" />
        <path d="M140 376 L170 274" />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${122 + k * 7} ${356 - k * 24} l22 4`} />
        ))}
      </g>
      {/* almofada no chão (esquerda) e túnel (direita) */}
      <ellipse cx="86" cy="366" rx="52" ry="16" fill="#F7D9A8" />
      <ellipse cx="86" cy="360" rx="44" ry="12" fill="#FFE9C4" />
      <rect x="262" y="300" width="92" height="74" rx="20" fill="#7FB07A" />
      <ellipse cx="308" cy="336" rx="30" ry="27" fill="#4E7A4A" />
      <ellipse cx="308" cy="300" rx="46" ry="12" fill="#97C48F" />
      {/* bolinha de lã pendurada */}
      <path d="M150 118 v52" stroke="#B88A62" strokeWidth="2" />
      <circle cx="150" cy="178" r="10" fill="#B7E0A8" />
      <path d="M143 172 q7 6 14 0 M142 180 q8 5 16 0" stroke="#8CC57A" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function FriendTree({ me, friends, onAdd, onOpenProfile }: { me: Profile | null; friends: Profile[]; onAdd: () => void; onOpenProfile: (id: string) => void }) {
  const s = useApp();
  const shown = friends.slice(0, SLOTS.length);
  const next = FRIEND_LADDER.findIndex((_, i) => !friendRewardClaimed(s, i + 1));
  return (
    <div className="grid gap-3">
      <section className="ft ft-house" aria-label="Casinha dos amigos">
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
          Convide amigos para se mudarem!
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
            <p className="max-w-[300px] text-[14px] font-bold text-white/85">Peça para o seu amigo apontar a câmera do celular para este código. O convite abre direto no Lumbi.</p>
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
      setMsg('Este celular não lê QR aqui dentro. Use a câmera do próprio celular: o convite abre o Lumbi sozinho.');
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

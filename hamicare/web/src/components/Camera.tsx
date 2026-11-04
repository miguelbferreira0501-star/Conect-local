// Câmera dentro do app para a "foto real" do feed: ver, tirar, refazer e usar.
// Também deixa escolher da galeria. Alguns visualizadores (como a página de teste
// dentro do app do Claude) bloqueiam câmera e galeria: aí o app explica em vez de ficar parado.
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Camera as CameraIcon, ImagePlus, RefreshCw, X } from 'lucide-react';
import { claudeRuntime, shrinkPhoto } from '../lib/platform';

const MAX = 720;
const QUALITY = 0.62;

type Status = 'abrindo' | 'ao-vivo' | 'foto' | 'bloqueada' | 'sem-camera';

/** Guarda o quadro atual do vídeo como JPEG pequeno (mesmo tamanho das fotos da galeria). */
function grab(video: HTMLVideoElement, mirror: boolean): string {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const k = Math.min(1, MAX / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  const ctx = canvas.getContext('2d')!;
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

export function CameraSheet({ open, onClose, onPhoto }: { open: boolean; onClose: () => void; onPhoto: (dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>('abrindo');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [shot, setShot] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const inPreview = !!claudeRuntime();

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;
    setStatus('abrindo');
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('sem-camera');
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stop();
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {});
        }
        setStatus('ao-vivo');
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException)?.name;
        setStatus(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'sem-camera' : 'bloqueada');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, facing, shot, stop]);

  // Fecha a câmera de verdade ao sair (a luzinha do celular apaga).
  useEffect(() => {
    if (!open) {
      stop();
      setShot(null);
    }
    return stop;
  }, [open, stop]);

  if (!open) return null;

  function take() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    setShot(grab(v, facing === 'user'));
    setFlash(Date.now());
    stop();
    setStatus('foto');
  }

  async function fromGallery(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const data = await shrinkPhoto(f, MAX, QUALITY).catch(() => null);
    if (data) {
      setShot(data);
      stop();
      setStatus('foto');
    }
  }

  const gallery = (
    <label className="cam-btn cam-gallery" aria-label="Escolher da galeria">
      <input type="file" accept="image/*" className="sr-only" onChange={fromGallery} />
      <ImagePlus size={22} />
    </label>
  );

  // Vai direto para o <body>: dentro da gaveta (que se mexe) a tela cheia ficaria cortada.
  return createPortal(
    <div className="camera" role="dialog" aria-modal="true" aria-label="Tirar foto">
      <div className="camera-top">
        <button className="cam-btn" onClick={onClose} aria-label="Fechar câmera">
          <X size={22} />
        </button>
        <p className="font-display text-[18px] font-bold text-white">{shot ? 'Ficou boa?' : 'Foto real'}</p>
        <span className="w-11" />
      </div>

      <div className="camera-view">
        {shot ? (
          <img src={shot} alt="Sua foto" className="camera-media" />
        ) : (
          <video ref={video} className={`camera-media ${facing === 'user' ? 'is-mirror' : ''}`} playsInline muted autoPlay />
        )}
        {flash > 0 && <span key={flash} className="camera-flash" aria-hidden="true" />}
        {!shot && status === 'abrindo' && <p className="camera-msg">Abrindo a câmera…</p>}
        {!shot && (status === 'bloqueada' || status === 'sem-camera') && (
          <div className="camera-msg grid gap-3">
            <p className="font-display text-[20px] font-bold">{status === 'sem-camera' ? 'Não achamos uma câmera aqui' : 'A câmera não abriu'}</p>
            <p className="text-[14px] opacity-90">
              {inPreview
                ? 'Nesta versão de teste, dentro do app do Claude, o celular não deixa abrir a câmera. No HamiCare publicado (no navegador ou instalado na tela inicial), ela funciona.'
                : status === 'sem-camera'
                  ? 'Você pode escolher uma foto da galeria.'
                  : 'Libere a câmera para o HamiCare nas permissões do navegador (o cadeado ao lado do endereço) ou escolha uma foto da galeria.'}
            </p>
            <label className="btn btn-primary">
              <input type="file" accept="image/*" className="sr-only" onChange={fromGallery} />
              <ImagePlus size={18} /> Escolher da galeria
            </label>
          </div>
        )}
      </div>

      <div className="camera-bar">
        {shot ? (
          <>
            <button className="btn btn-ghost flex-1 !bg-white/15 !text-white" onClick={() => setShot(null)}>
              <RefreshCw size={18} /> Tirar outra
            </button>
            <button className="btn btn-primary flex-1" onClick={() => (onPhoto(shot), onClose())}>
              Usar esta foto
            </button>
          </>
        ) : (
          <>
            {gallery}
            <button className="cam-shutter" onClick={take} disabled={status !== 'ao-vivo'} aria-label="Tirar foto">
              <CameraIcon size={28} />
            </button>
            <button className="cam-btn" onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')} disabled={status !== 'ao-vivo'} aria-label="Virar a câmera">
              <RefreshCw size={22} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

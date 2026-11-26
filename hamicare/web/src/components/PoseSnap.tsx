// Câmera do Início: tira uma "foto" do Lumbi numa pose diferente a cada clique (as 20 poses), num
// porta-retratos com o nome e a data. Dá para guardar a foto ou mandar para alguém.
import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Sheet, toast } from './ui';
import { POSES, randomPose, type PoseName } from './Poses';
import { useApp } from '../lib/store';
import { play } from '../lib/sound';

const ALL = Object.keys(POSES) as PoseName[];
const FRAMES = ['#FFE3EC', '#E3F0FF', '#FFF3C4', '#E6F7E9', '#EEE6FF'];

async function snapshot(pose: PoseName, name: string, bg: string): Promise<Blob | null> {
  const c = document.createElement('canvas');
  c.width = 720;
  c.height = 860;
  const g = c.getContext('2d');
  if (!g) return null;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 720, 860);
  g.fillStyle = bg;
  g.fillRect(40, 40, 640, 640);
  const img = new Image();
  img.src = POSES[pose];
  await img.decode().catch(() => {});
  const k = Math.min(520 / img.width, 520 / img.height);
  g.drawImage(img, 360 - (img.width * k) / 2, 360 - (img.height * k) / 2, img.width * k, img.height * k);
  g.fillStyle = '#3b2f4a';
  g.font = '800 44px Nunito, sans-serif';
  g.textAlign = 'center';
  g.fillText(name, 360, 760);
  g.font = '700 28px Nunito, sans-serif';
  g.fillStyle = '#8a7f98';
  g.fillText(new Date().toLocaleDateString('pt-BR'), 360, 810);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

export function PoseSnap({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [pose, setPose] = useState<PoseName>(() => randomPose());
  const [flash, setFlash] = useState(0);
  const [frame, setFrame] = useState(0);
  const again = () => {
    let p = pose;
    while (p === pose) p = ALL[Math.floor(Math.random() * ALL.length)];
    setPose(p);
    setFrame((f) => (f + 1) % FRAMES.length);
    setFlash((f) => f + 1);
    play('foto');
  };
  const save = async () => {
    const blob = await snapshot(pose, s.pet.name, FRAMES[frame]);
    if (!blob) return;
    const file = new File([blob], `${s.pet.name}.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: s.pet.name }).catch(() => {});
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    toast('Foto guardada!');
  };
  return (
    <Sheet open={open} onClose={onClose} title={`Foto do ${s.pet.name}`}>
      <div className="snap">
        <div className="snap-photo" style={{ background: FRAMES[frame] }}>
          {flash > 0 && <span key={flash} className="snap-flash" aria-hidden="true" />}
          <img key={pose} src={POSES[pose]} alt={`${s.pet.name} posando`} draggable={false} />
        </div>
        <p className="snap-cap">
          <b>{s.pet.name}</b>
          <small>{new Date().toLocaleDateString('pt-BR')}</small>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-ghost" onClick={again}>
            <RefreshCw size={18} /> Outra pose
          </button>
          <button className="btn btn-primary" onClick={save}>
            <Download size={18} /> Guardar
          </button>
        </div>
      </div>
    </Sheet>
  );
}

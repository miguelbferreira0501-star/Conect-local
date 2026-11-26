// Câmera do Início: o Lumbi de verdade (vivo, com a roupa dele) faz uma ação diferente a cada clique e
// "posa" para a foto. Guardar transforma o desenho dele numa foto com porta-retratos, nome e data.
import { useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Sheet, toast } from './ui';
import { PetAct, type Trick } from './LivePet';
import { useApp } from '../lib/store';
import { play } from '../lib/sound';

const SNAP_ACTS: Trick[] = ['acenar', 'coracao', 'estrela', 'danca', 'musica', 'comemora', 'curioso', 'travesseiro'];
const FRAMES = ['#FFE3EC', '#E3F0FF', '#FFF3C4', '#E6F7E9', '#EEE6FF'];

/** Desenho SVG do Lumbi → imagem (as partes dele viram dados dentro do SVG para o navegador conseguir desenhar). */
async function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const box = svg.getBoundingClientRect();
  clone.setAttribute('width', String(box.width * 3));
  clone.setAttribute('height', String(box.height * 3));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const imgs = Array.from(clone.querySelectorAll('image'));
  await Promise.all(
    imgs.map(async (el) => {
      const href = el.getAttribute('href') ?? el.getAttribute('xlink:href');
      if (!href || href.startsWith('data:')) return;
      const blob = await fetch(href).then((r) => r.blob());
      const data = await new Promise<string>((ok) => {
        const fr = new FileReader();
        fr.onload = () => ok(String(fr.result));
        fr.readAsDataURL(blob);
      });
      el.setAttribute('href', data);
    }),
  );
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();
  return img;
}

export function PoseSnap({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [k, setK] = useState(0);
  const [flash, setFlash] = useState(0);
  const photo = useRef<HTMLDivElement>(null);
  const t = SNAP_ACTS[k % SNAP_ACTS.length];
  const bg = FRAMES[k % FRAMES.length];
  const again = () => {
    setK((x) => x + 1);
    setFlash((f) => f + 1);
    play('foto');
  };
  const save = async () => {
    const svg = photo.current?.querySelector('svg');
    if (!svg) return;
    try {
      const pet = await svgToImage(svg as SVGSVGElement);
      const c = document.createElement('canvas');
      c.width = 720;
      c.height = 860;
      const g = c.getContext('2d')!;
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 720, 860);
      g.fillStyle = bg;
      g.fillRect(40, 40, 640, 640);
      g.drawImage(pet, 110, 90, 500, 500);
      g.fillStyle = '#3b2f4a';
      g.font = '800 44px Nunito, sans-serif';
      g.textAlign = 'center';
      g.fillText(s.pet.name, 360, 760);
      g.font = '700 28px Nunito, sans-serif';
      g.fillStyle = '#8a7f98';
      g.fillText(new Date().toLocaleDateString('pt-BR'), 360, 810);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
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
    } catch {
      toast('Não deu para guardar a foto agora.');
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={`Foto do ${s.pet.name}`}>
      <div className="snap">
        <div className="snap-photo" style={{ background: bg }} ref={photo}>
          {flash > 0 && <span key={flash} className="snap-flash" aria-hidden="true" />}
          <PetAct t={t} size={230} every={3600} quiet />
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

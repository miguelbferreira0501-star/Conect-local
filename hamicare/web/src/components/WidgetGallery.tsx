// Galeria de widgets (como a de apps de pet): cada widget com a prévia já com os seus números,
// coroa nos do Lumbi+ e o botão para colocar na tela inicial do celular (Android pede confirmação).
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Crown, Plus } from 'lucide-react';
import { toast } from './ui';
import { openUi } from '../lib/bus';
import { isNativeApp, nativePlatform } from '../lib/native';
import { isPremium, useApp } from '../lib/store';
import { pinWidget, widgetData, type WidgetData } from '../lib/widget';

const img = (k: string) => new URL(`../assets/widgets/${k}.webp`, import.meta.url).href;

interface Def {
  kind: string;
  label: string;
  size: 'p' | 'm' | 'g';
  plus?: boolean;
  preview: (d: WidgetData) => React.ReactNode;
}

const cups = (d: WidgetData) => (
  <span className="wg-cups">
    {Array.from({ length: 8 }, (_, i) => (
      <i key={i} className={i < (d.cupsGoal <= 8 ? d.cups : Math.floor((d.cups * 8) / d.cupsGoal)) ? 'is-on' : ''} />
    ))}
  </span>
);

const SECTIONS: { title: string; items: Def[] }[] = [
  {
    title: 'Mais usados',
    items: [
      { kind: 'agua_m', label: 'Água de hoje', size: 'm', preview: (d) => <><b className="wg-t wg-blue">Água de hoje<br /><big>{d.cups}/{d.cupsGoal}</big></b>{cups(d)}</> },
      { kind: 'agua_p', label: 'Copos de água', size: 'p', preview: (d) => <b className="wg-t wg-blue"><big>{d.cups}/{d.cupsGoal}</big></b> },
      { kind: 'tarefas_g', label: 'Tarefas de hoje', size: 'g', preview: (d) => (
        <>
          <b className="wg-pill">Feito hoje {d.done}/{d.total}</b>
          <span className="wg-rows">
            {(d.tasks.length ? d.tasks : [{ t: 'Nenhuma tarefa hoje', d: false }]).slice(0, 4).map((t, i) => (
              <span key={i} className={t.d ? 'is-done' : ''}>
                <i />
                {t.t}
              </span>
            ))}
          </span>
        </>
      ) },
      { kind: 'meta_p', label: 'Meta do dia', size: 'p', preview: (d) => <><span className="wg-ring" style={{ ['--p' as string]: `${d.pct}%` }} /><b className="wg-pct">{d.pct}%</b></> },
    ],
  },
  {
    title: 'Progresso',
    items: [
      { kind: 'semana_m', label: 'Esta semana', size: 'm', preview: (d) => (
        <>
          <b className="wg-t wg-green wg-right">Esta semana · {d.week.filter((w) => w.d).length}/7</b>
          <span className="wg-week">
            {d.week.map((w, i) => (
              <span key={i}>
                <small>{w.l}</small>
                <i className={w.d ? 'is-on' : ''} />
              </span>
            ))}
          </span>
        </>
      ) },
      { kind: 'mov_m', label: 'Bora se mexer', size: 'm', preview: (d) => <b className="wg-t wg-blue wg-half">Bora se mexer!<small>{d.move}</small></b> },
    ],
  },
  {
    title: 'Companhia do Lumbi',
    items: [
      { kind: 'dias_m', label: 'Dias juntos', size: 'm', preview: (d) => <b className="wg-heart-m"><big>{d.together}</big>dias juntos</b> },
      { kind: 'dias_p', label: 'Dias juntos', size: 'p', preview: (d) => <b className="wg-heart-p"><big>{d.together}</big>dias juntos</b> },
      { kind: 'amigo_g', label: 'Melhor amigo', size: 'g', plus: true, preview: (d) => <span className="wg-love"><b>{d.name} · seu melhor amigo ♥</b><i style={{ width: `${d.love}%` }} /></span> },
      { kind: 'passeio_g', label: 'Passeio', size: 'g', plus: true, preview: (d) => <b className="wg-bubble">{d.line}</b> },
    ],
  },
  {
    title: 'Para o coração',
    items: [
      { kind: 'afirm_m', label: 'Afirmação do dia', size: 'm', preview: (d) => <b className="wg-affirm">{d.affirm}</b> },
      { kind: 'bolhas_m', label: 'Estoure bolhas', size: 'm', plus: true, preview: () => null },
      { kind: 'moeda_p', label: 'Moeda da sorte', size: 'p', plus: true, preview: () => <small className="wg-coin">Toque para jogar</small> },
    ],
  },
];

export function WidgetGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const d = useMemo(() => widgetData(s), [s]);
  if (!open) return null;
  const kid = s.profile.ageGroup === 'ate12';
  const premium = isPremium(s) || kid;
  const android = isNativeApp() && nativePlatform() === 'android';

  const add = async (w: Def) => {
    if (w.plus && !premium) {
      onClose();
      openUi('plus');
      return;
    }
    if (!isNativeApp()) return toast('Os widgets funcionam no app instalado pela loja.');
    if (android && (await pinWidget(w.kind))) return toast('Confirme no aviso do celular para colocar na tela inicial.');
    toast(nativePlatform() === 'ios' ? 'Segure a tela inicial, toque em + e procure por Lumbi.' : `Segure a tela inicial, toque em Widgets e procure "${'Lumbi: ' + w.label.toLowerCase()}".`);
  };

  return createPortal(
    <div className="wg" role="dialog" aria-modal="true" aria-label="Widgets">
      <header className="wg-head">
        <button className="wg-back" onClick={onClose} aria-label="Voltar">
          <ChevronLeft size={26} strokeWidth={3} />
        </button>
        <h1>Widgets</h1>
        <span />
      </header>
      <p className="wg-intro">Escolha um e coloque o {s.pet.name} na tela do seu celular. Os números se atualizam sozinhos.</p>
      {SECTIONS.map((sec) => (
        <section key={sec.title} className="wg-sec">
          <h2>{sec.title}</h2>
          <div className="wg-grid">
            {sec.items.map((w) => (
                <button key={w.kind} className={`wg-card is-${w.size}`} onClick={() => add(w)}>
                  <span className="wg-art" style={{ backgroundImage: `url(${img(w.kind)})` }}>
                    {w.preview(d)}
                    {w.plus && !premium && (
                      <span className="wg-crown" aria-label="Lumbi+">
                        <Crown size={14} />
                      </span>
                    )}
                    <span className="wg-add" aria-hidden="true">
                      <Plus size={16} strokeWidth={3} />
                    </span>
                  </span>
                  <span className="wg-label">{w.label}</span>
                </button>
              ))}
          </div>
        </section>
      ))}
      {!premium && (
        <button className="wg-plus" onClick={() => (onClose(), openUi('plus'))}>
          <Crown size={18} /> Desbloqueie todos os widgets
        </button>
      )}
    </div>,
    document.body,
  );
}

// Efeitos em volta do Hami no Início: o clima da situação do dia (neve, calor, chuva, trovão…) e
// os detalhes da atividade (bolinha quicando, bolhas subindo, notas de música, brilhinhos).
import type { Activity, Condition } from '../lib/hamiDay';

const Flake = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <g stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round">
      <path d="M10 1 V19 M2.2 5.5 L17.8 14.5 M2.2 14.5 L17.8 5.5" />
    </g>
  </svg>
);

const Cloud = ({ dark = false }: { dark?: boolean }) => (
  <svg width="74" height="40" viewBox="0 0 74 40" aria-hidden="true">
    <path d="M14 36 Q2 36 3 26 Q4 17 14 18 Q16 6 30 7 Q40 0 50 8 Q64 6 66 19 Q73 21 71 29 Q69 36 60 36 Z" fill={dark ? '#7D86A8' : '#FFFFFF'} />
    <path d="M14 36 Q2 36 3 26 Q8 31 18 30 Q40 33 70 27 Q69 36 60 36 Z" fill={dark ? '#6A7294' : '#E6EEF8'} />
  </svg>
);

/** Efeitos da situação do dia (enquanto ele ainda não melhorou). */
export function ConditionFx({ cond }: { cond: Condition }) {
  switch (cond) {
    case 'frio':
      return (
        <div className="hfx" aria-hidden="true">
          {[8, 30, 62, 84, 46, 18, 74].map((x, i) => (
            <span key={i} className="hfx-snow" style={{ left: `${x}%`, animationDelay: `${i * 0.55}s`, animationDuration: `${3.2 + (i % 3) * 0.7}s` }}>
              <Flake size={12 + (i % 3) * 4} />
            </span>
          ))}
          <span className="hfx-shiver hfx-shiver-l" />
          <span className="hfx-shiver hfx-shiver-r" />
        </div>
      );
    case 'calor':
      return (
        <div className="hfx" aria-hidden="true">
          <span className="hfx-sun" />
          {[14, 82, 26, 72].map((x, i) => (
            <span key={i} className="hfx-heat" style={{ left: `${x}%`, animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
      );
    case 'chuva':
      return (
        <div className="hfx" aria-hidden="true">
          <span className="hfx-cloud">
            <Cloud />
            {[14, 30, 46, 62].map((x, i) => (
              <i key={i} style={{ left: `${x}px`, animationDelay: `${i * 0.18}s` }} />
            ))}
          </span>
        </div>
      );
    case 'medo':
      return (
        <div className="hfx" aria-hidden="true">
          <span className="hfx-cloud hfx-storm">
            <Cloud dark />
            <svg className="hfx-bolt" width="22" height="30" viewBox="0 0 22 30">
              <path d="M13 0 L2 17 H10 L7 30 L20 11 H12 Z" fill="#FFD34D" />
            </svg>
          </span>
          <span className="hfx-shiver hfx-shiver-l" />
          <span className="hfx-shiver hfx-shiver-r" />
        </div>
      );
    case 'gripado':
      return (
        <div className="hfx" aria-hidden="true">
          <span className="hfx-sneeze">Atchim!</span>
        </div>
      );
    case 'tedio':
      return (
        <div className="hfx" aria-hidden="true">
          <span className="hfx-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
      );
    case 'saudade':
      return (
        <div className="hfx" aria-hidden="true">
          {[18, 80, 34].map((x, i) => (
            <span key={i} className="hfx-heart" style={{ left: `${x}%`, animationDelay: `${i * 1.1}s` }} />
          ))}
        </div>
      );
    case 'terra':
      return (
        <div className="hfx" aria-hidden="true">
          {[20, 78, 60].map((x, i) => (
            <span key={i} className="hfx-dust" style={{ left: `${x}%`, animationDelay: `${i * 0.8}s` }} />
          ))}
        </div>
      );
  }
}

/** Detalhes da atividade (o objeto que ele segura já vem desenhado no próprio Hami). */
export function ActivityFx({ act }: { act: Activity }) {
  switch (act) {
    case 'bolinha':
      return (
        <div className="hfx" aria-hidden="true">
          <span className="hfx-ball" />
        </div>
      );
    case 'bolhas':
      return (
        <div className="hfx" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="hfx-bubble" style={{ animationDelay: `${i * 0.7}s`, width: 10 + (i % 3) * 6, height: 10 + (i % 3) * 6 }} />
          ))}
        </div>
      );
    case 'musica':
      return (
        <div className="hfx" aria-hidden="true">
          {['♪', '♫', '♪'].map((n, i) => (
            <span key={i} className="hfx-note" style={{ left: `${i % 2 ? 80 : 14}%`, animationDelay: `${i * 0.9}s` }}>
              {n}
            </span>
          ))}
        </div>
      );
    case 'meditando':
      return (
        <div className="hfx" aria-hidden="true">
          {[12, 86, 24, 76].map((x, i) => (
            <span key={i} className="hfx-spark" style={{ left: `${x}%`, top: `${20 + (i % 2) * 30}%`, animationDelay: `${i * 0.6}s` }} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

/** Animação do corpo inteiro para cada situação ou atividade. */
export function bodyFxClass(cond: Condition | null, act: Activity | null): string {
  if (cond === 'frio' || cond === 'medo') return 'fx-shiver';
  if (cond === 'gripado') return 'fx-sneeze';
  if (cond === 'calor') return 'fx-melt';
  if (cond === 'tedio') return 'fx-sigh';
  if (cond === 'saudade' || cond === 'chuva') return 'fx-sob';
  if (cond) return '';
  if (act === 'musica') return 'fx-sway';
  if (act === 'exercicio' || act === 'bolinha') return 'fx-bounce';
  if (act === 'meditando') return 'fx-float';
  return '';
}

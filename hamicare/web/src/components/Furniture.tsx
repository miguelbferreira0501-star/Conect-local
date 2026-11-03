// Móveis desenhados em SVG (os que não existem como emoji). Cores de ilustração.

export function Furniture({ id }: { id: string }) {
  switch (id) {
    case 'rodinha':
      return (
        <svg viewBox="0 0 100 100" className="block h-auto w-full" aria-hidden="true">
          <path d="M30 96 L50 52 L70 96" stroke="#9AA6B8" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="48" r="40" fill="none" stroke="#7FB8F0" strokeWidth="8" />
          <circle cx="50" cy="48" r="40" fill="none" stroke="#B9DAF7" strokeWidth="2" strokeDasharray="4 6" />
          {[0, 45, 90, 135].map((a) => (
            <path key={a} d={`M50 48 L${50 + Math.cos((a * Math.PI) / 180) * 38} ${48 + Math.sin((a * Math.PI) / 180) * 38}`} stroke="#7FB8F0" strokeWidth="2.5" />
          ))}
          <circle cx="50" cy="48" r="6" fill="#5B9BD9" />
        </svg>
      );
    case 'caminha':
      return (
        <svg viewBox="0 0 100 60" className="block h-auto w-full" aria-hidden="true">
          <ellipse cx="50" cy="40" rx="48" ry="18" fill="#E58FAE" />
          <ellipse cx="50" cy="34" rx="38" ry="12" fill="#FFD6E4" />
          <ellipse cx="34" cy="31" rx="12" ry="6" fill="#FFFFFF" />
        </svg>
      );
    case 'casinha':
      return (
        <svg viewBox="0 0 100 90" className="block h-auto w-full" aria-hidden="true">
          <path d="M10 42 L50 6 L90 42 Z" fill="#C0694A" />
          <rect x="18" y="40" width="64" height="48" rx="4" fill="#E8B07C" />
          <path d="M40 88 L40 64 Q50 52 60 64 L60 88 Z" fill="#7A4A30" />
          <circle cx="68" cy="56" r="7" fill="#FFF3D6" stroke="#7A4A30" strokeWidth="2" />
        </svg>
      );
    case 'mesa':
      return (
        <svg viewBox="0 0 100 70" className="block h-auto w-full" aria-hidden="true">
          <rect x="6" y="16" width="88" height="10" rx="5" fill="#C98A5B" />
          <rect x="16" y="26" width="8" height="42" rx="3" fill="#A86E44" />
          <rect x="76" y="26" width="8" height="42" rx="3" fill="#A86E44" />
          <circle cx="62" cy="10" r="7" fill="#FF8FB4" />
          <rect x="58" y="10" width="8" height="7" fill="#7FCBA9" />
        </svg>
      );
    case 'luminaria':
      return (
        <svg viewBox="0 0 40 120" className="block h-auto w-full" aria-hidden="true">
          <ellipse cx="20" cy="22" rx="18" ry="8" fill="#FFE9A8" opacity="0.6" />
          <path d="M6 28 L12 6 L28 6 L34 28 Z" fill="#FFD27A" />
          <rect x="18" y="28" width="4" height="84" fill="#7C6A5A" />
          <ellipse cx="20" cy="114" rx="14" ry="5" fill="#7C6A5A" />
        </svg>
      );
    case 'tapete':
      return (
        <svg viewBox="0 0 100 30" className="block h-auto w-full" aria-hidden="true">
          <ellipse cx="50" cy="15" rx="49" ry="14" fill="#F7A8B8" />
          <ellipse cx="50" cy="15" rx="38" ry="10" fill="#FFD3DC" />
          <ellipse cx="50" cy="15" rx="24" ry="6" fill="#F7A8B8" />
        </svg>
      );
    case 'estante':
      return (
        <svg viewBox="0 0 70 100" className="block h-auto w-full" aria-hidden="true">
          <rect x="2" y="2" width="66" height="96" rx="4" fill="#B98258" />
          {[30, 62, 94].map((y) => <rect key={y} x="6" y={y - 4} width="58" height="4" fill="#8E5E3C" />)}
          {[['#FF8FB4', 10], ['#7FB8F0', 18], ['#FFD27A', 26], ['#93D6A9', 42], ['#B39AE6', 50]].map(([c, x], i) => (
            <rect key={i} x={x as number} y={i < 3 ? 8 : 40} width="7" height="18" rx="1.5" fill={c as string} />
          ))}
          <circle cx="40" cy="80" r="8" fill="#7FCBA9" />
        </svg>
      );
    default:
      return null;
  }
}

/** Enfeites que atravessam o topo da parede (pisca-pisca, bandeirinhas). */
export function Garland({ id }: { id: string }) {
  if (id === 'bandeirinhas') {
    const colors = ['#E2547A', '#F2C14E', '#3D9BD8', '#4FA36B', '#B39AE6'];
    return (
      <svg className="pointer-events-none absolute inset-x-0 top-0 h-10 w-full" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 6 Q150 26 300 6" stroke="#8A6A4F" strokeWidth="1.5" fill="none" />
        {Array.from({ length: 13 }, (_, i) => {
          const x = 12 + i * 23;
          const y = 6 + 10 * (1 - Math.pow((x - 150) / 150, 2));
          return <path key={i} d={`M${x - 8} ${y} L${x + 8} ${y} L${x} ${y + 14} Z`} fill={colors[i % colors.length]} />;
        })}
      </svg>
    );
  }
  const colors = ['#FF5E7E', '#FFD660', '#6CCB92', '#7FB8F0'];
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-9 w-full" viewBox="0 0 300 36" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 8 Q75 22 150 8 Q225 22 300 8" stroke="#3E4A43" strokeWidth="1.2" fill="none" />
      {Array.from({ length: 16 }, (_, i) => {
        const x = 10 + i * 18.6;
        const y = 8 + 12.6 * Math.sin(((x % 150) / 150) * Math.PI);
        return <circle key={i} className="bulb" style={{ animationDelay: `${(i % 4) * 0.35}s` }} cx={x} cy={y + 5} r="4" fill={colors[i % colors.length]} />;
      })}
    </svg>
  );
}

/** Fundo da parede e do piso: padrões em CSS (cores de ilustração). */
export const WALLPAPER_CSS: Record<string, string> = {
  'p-creme': 'linear-gradient(180deg,#FFF4E2,#FFEBD2)',
  'p-listras': 'repeating-linear-gradient(90deg,#FFE3EA 0 22px,#FFF2F5 22px 44px)',
  'p-bolinhas': 'radial-gradient(circle at 12px 12px,#BFEBD5 5px,transparent 6px) 0 0/28px 28px,#E9FAF1',
  'p-ceu': 'radial-gradient(ellipse 60px 24px at 30% 30%,#FFFFFF 60%,transparent 62%),radial-gradient(ellipse 70px 26px at 75% 50%,#FFFFFF 60%,transparent 62%),linear-gradient(180deg,#A9D8FA,#DDF0FF)',
  'p-folhas': 'radial-gradient(ellipse 18px 40px at 20% 30%,#7CC39A 60%,transparent 62%),radial-gradient(ellipse 18px 40px at 70% 60%,#5FAE84 60%,transparent 62%),radial-gradient(ellipse 14px 32px at 45% 20%,#8FD3A6 60%,transparent 62%),linear-gradient(180deg,#E6F7E9,#D2F0DA)',
  'p-lavanda': 'linear-gradient(180deg,#EFE6FF,#E2D5FA)',
  'p-cinza': 'repeating-linear-gradient(90deg,#E6E8EC 0 2px,#F2F3F6 2px 40px)',
  'p-estrelas': 'radial-gradient(circle at 20% 30%,#FFF6C2 1.5px,transparent 2px) 0 0/40px 40px,radial-gradient(circle at 70% 70%,#FFFFFF 1px,transparent 2px) 0 0/30px 30px,linear-gradient(180deg,#24295C,#423A7E)',
};

export const FLOOR_CSS: Record<string, string> = {
  'f-madeira': 'repeating-linear-gradient(90deg,#D8B48C 0 46px,#C79F75 46px 48px)',
  'f-clara': 'repeating-linear-gradient(90deg,#EFDCC3 0 46px,#E2CBAE 46px 48px)',
  'f-carpete': 'radial-gradient(circle at 3px 3px,#F7BFCB 1px,transparent 1.5px) 0 0/8px 8px,#FBD3DC',
  'f-azulejo': 'conic-gradient(#FFFFFF 25%,#D9E7F5 0 50%,#FFFFFF 0 75%,#D9E7F5 0) 0 0/36px 36px',
  'f-grama': 'repeating-linear-gradient(80deg,#8FD08A 0 6px,#7FC47A 6px 12px)',
  'f-marmore': 'linear-gradient(135deg,#F4F4F6 0%,#E3E4EA 40%,#F7F7F9 60%,#DCDDE4 100%)',
};

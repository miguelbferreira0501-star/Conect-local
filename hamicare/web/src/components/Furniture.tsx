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
  'p-xadrez': 'repeating-linear-gradient(0deg,rgba(255,120,150,.22) 0 14px,transparent 14px 28px),repeating-linear-gradient(90deg,rgba(255,120,150,.22) 0 14px,transparent 14px 28px),#FFF6F8',
  'p-coracoes': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M16 24 C6 17 6 10 11 9 C14 8 15.5 10 16 11.5 C16.5 10 18 8 21 9 C26 10 26 17 16 24 Z' fill='%23FFB3C7'/%3E%3C/svg%3E") 0 0/32px 32px,#FFF0F4`,
  'p-arco-iris': 'linear-gradient(180deg,#FFD6E0 0 16%,#FFE7C7 16% 33%,#FFF7C2 33% 50%,#DDF6D8 50% 66%,#D6ECFF 66% 83%,#E9DDFF 83%)',
  'p-tijolo': 'repeating-linear-gradient(0deg,#F3D2C2 0 2px,transparent 2px 20px),repeating-linear-gradient(90deg,#F3D2C2 0 2px,transparent 2px 40px),#E8A487',
  'p-madeira': 'repeating-linear-gradient(90deg,#C8925E 0 34px,#B98251 34px 36px)',
  'p-praia': 'linear-gradient(180deg,#9AD9F5 0 60%,#7CC9EE 60% 70%,#F7E2B0 70%)',
  'p-girassois': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cg fill='%23FFD34D'%3E%3Ccircle cx='20' cy='12' r='4'/%3E%3Ccircle cx='28' cy='20' r='4'/%3E%3Ccircle cx='20' cy='28' r='4'/%3E%3Ccircle cx='12' cy='20' r='4'/%3E%3Ccircle cx='26' cy='14' r='4'/%3E%3Ccircle cx='26' cy='26' r='4'/%3E%3Ccircle cx='14' cy='26' r='4'/%3E%3Ccircle cx='14' cy='14' r='4'/%3E%3C/g%3E%3Ccircle cx='20' cy='20' r='5' fill='%238A5A3B'/%3E%3C/svg%3E") 0 0/40px 40px,#FFF7D6`,
  'p-galaxia': 'radial-gradient(circle at 30% 40%,rgba(255,120,200,.35),transparent 40%),radial-gradient(circle at 70% 60%,rgba(120,160,255,.35),transparent 45%),radial-gradient(circle at 20% 20%,#FFFFFF 1px,transparent 1.5px) 0 0/34px 34px,linear-gradient(180deg,#1E1A4A,#3B2C7A)',
  // Arenas
  'p-jardim': 'radial-gradient(circle at 10px 12px,#FF9FC2 3px,transparent 4px) 0 0/34px 34px,radial-gradient(circle at 26px 26px,#FFE27A 3px,transparent 4px) 0 0/34px 34px,linear-gradient(180deg,#E6F7DA,#D2EFC2)',
  'p-vila': 'repeating-linear-gradient(0deg,rgba(176,122,82,.25) 0 2px,transparent 2px 26px),linear-gradient(180deg,#FFE9CF,#F7D9B5)',
  'p-floresta': 'radial-gradient(ellipse 14px 30px at 15% 60%,#4F9A63 60%,transparent 62%) 0 0/60px 80px,radial-gradient(ellipse 12px 26px at 65% 40%,#6DB97A 60%,transparent 62%) 0 0/60px 80px,linear-gradient(180deg,#CFEBD2,#A9D8B2)',
  'p-tropical': 'radial-gradient(ellipse 16px 34px at 20% 40%,#3FB27F 60%,transparent 62%) 0 0/70px 90px,radial-gradient(circle at 60% 70%,#FF8FB1 6px,transparent 7px) 0 0/70px 90px,linear-gradient(180deg,#BFF0E6,#FFE9B8)',
  'p-chale': 'repeating-linear-gradient(90deg,#A86E44 0 30px,#94603A 30px 32px),linear-gradient(180deg,#A86E44,#8A5A36)',
  'p-cidade': 'linear-gradient(180deg,transparent 55%,#2E3654 55% 58%,transparent 58%),repeating-linear-gradient(90deg,#3B4470 0 28px,#4A548A 28px 46px),linear-gradient(180deg,#2A2F55,#4B4C9A)',
  'p-mar': 'radial-gradient(circle at 20% 70%,rgba(255,255,255,.5) 4px,transparent 5px) 0 0/50px 60px,radial-gradient(circle at 70% 30%,rgba(255,255,255,.4) 3px,transparent 4px) 0 0/50px 60px,linear-gradient(180deg,#7FD3E8,#2F7FB8)',
  'p-sonhos': 'radial-gradient(ellipse 40px 18px at 30% 40%,#FFFFFF 60%,transparent 62%) 0 0/120px 80px,radial-gradient(circle at 80% 20%,#FFF3B0 3px,transparent 4px) 0 0/60px 60px,linear-gradient(180deg,#F2D9FF,#FFC9E8)',
  'p-castelo': 'repeating-linear-gradient(0deg,#C9C2DA 0 2px,transparent 2px 22px),repeating-linear-gradient(90deg,#C9C2DA 0 2px,transparent 2px 44px),linear-gradient(180deg,#E9E4F5,#D8D0EC)',
  'p-espaco': 'radial-gradient(circle at 20% 30%,#FFFFFF 1.5px,transparent 2px) 0 0/46px 46px,radial-gradient(circle at 70% 70%,#FFE27A 1.5px,transparent 2px) 0 0/58px 58px,radial-gradient(circle at 80% 20%,rgba(169,139,242,.6) 18px,transparent 19px),linear-gradient(180deg,#1E2350,#3E2F7A)',
  'p-celeste': 'radial-gradient(circle at 50% 0%,rgba(255,233,160,.9),transparent 60%),radial-gradient(ellipse 50px 20px at 20% 80%,#FFFFFF 60%,transparent 62%) 0 0/140px 90px,linear-gradient(180deg,#FFF3C9,#BFE6FF)',
};

export const FLOOR_CSS: Record<string, string> = {
  'f-madeira': 'repeating-linear-gradient(90deg,#D8B48C 0 46px,#C79F75 46px 48px)',
  'f-clara': 'repeating-linear-gradient(90deg,#EFDCC3 0 46px,#E2CBAE 46px 48px)',
  'f-carpete': 'radial-gradient(circle at 3px 3px,#F7BFCB 1px,transparent 1.5px) 0 0/8px 8px,#FBD3DC',
  'f-azulejo': 'conic-gradient(#FFFFFF 25%,#D9E7F5 0 50%,#FFFFFF 0 75%,#D9E7F5 0) 0 0/36px 36px',
  'f-grama': 'repeating-linear-gradient(80deg,#8FD08A 0 6px,#7FC47A 6px 12px)',
  'f-marmore': 'linear-gradient(135deg,#F4F4F6 0%,#E3E4EA 40%,#F7F7F9 60%,#DCDDE4 100%)',
  'f-areia': 'radial-gradient(circle at 3px 3px,#E9CF97 1px,transparent 1.5px) 0 0/9px 9px,#F5DFAE',
  'f-tabuleiro': 'conic-gradient(#FFFFFF 25%,#E3DDF2 0 50%,#FFFFFF 0 75%,#E3DDF2 0) 0 0/40px 40px',
  'f-hexagono': 'radial-gradient(circle at 50% 50%,#F6C445 0 9px,#E8B020 9px 11px,transparent 11px) 0 0/24px 24px,#FFE59A',
  'f-azul': 'radial-gradient(circle at 3px 3px,#A9CBF2 1px,transparent 1.5px) 0 0/8px 8px,#BFD9F7',
  'f-nuvem': 'radial-gradient(ellipse 40px 18px at 30% 40%,#FFFFFF 60%,transparent 62%),radial-gradient(ellipse 50px 20px at 75% 70%,#FFFFFF 60%,transparent 62%),linear-gradient(180deg,#DDEFFF,#C9E4FF)',
  'f-ladrilho': 'conic-gradient(#FFB3C7 25%,#B9E6FF 0 50%,#FFF1A8 0 75%,#C9F0C9 0) 0 0/30px 30px',
  // Arenas
  'f-musgo': 'radial-gradient(circle at 4px 4px,#6FBF5E 2px,transparent 3px) 0 0/10px 10px,#8FD08A',
  'f-tacos': 'repeating-linear-gradient(45deg,#C99560 0 14px,#B98251 14px 28px)',
  'f-folhas': 'radial-gradient(ellipse 6px 3px at 30% 40%,#E27E2C 60%,transparent 62%) 0 0/18px 14px,radial-gradient(ellipse 5px 3px at 70% 70%,#C9A227 60%,transparent 62%) 0 0/18px 14px,#B9824F',
  'f-chale': 'repeating-linear-gradient(90deg,#7A4E32 0 40px,#6A4229 40px 42px)',
  'f-concreto': 'radial-gradient(circle at 2px 2px,#B8BDC9 1px,transparent 1.5px) 0 0/7px 7px,#9AA2B4',
  'f-areia-mar': 'radial-gradient(circle at 3px 3px,#E9D7A6 1px,transparent 1.5px) 0 0/9px 9px,linear-gradient(180deg,#E3CF96,#CDB57A)',
  'f-algodao': 'radial-gradient(ellipse 30px 14px at 30% 40%,#FFE3F1 60%,transparent 62%) 0 0/80px 30px,#F7D2E8',
  'f-real': 'conic-gradient(#F4E7C6 25%,#E9D19A 0 50%,#F4E7C6 0 75%,#E9D19A 0) 0 0/34px 34px',
  'f-metal': 'repeating-linear-gradient(90deg,#8C95AE 0 2px,transparent 2px 36px),linear-gradient(180deg,#B9C1D6,#9AA3BC)',
  'f-ouro': 'linear-gradient(135deg,#FFE9A3 0%,#F2C94C 40%,#FFF3C4 60%,#E8B020 100%)',
};

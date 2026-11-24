// Enfeites do Hami 3D: os "z" do sono e as bolhinhas do banho.

/** Os "z" subindo devagar. */
export function Zzz({ size = 54 }: { size?: number }) {
  return (
    <svg className="zz-float" viewBox="-4 -40 50 48" width={size} height={size * 0.96} aria-hidden="true" fill="#7C83C9" fontWeight="900" fontFamily="inherit" style={{ overflow: 'visible' }}>
      <text x="0" y="0" fontSize="16" className="zz-1">
        z
      </text>
      <text x="12" y="-14" fontSize="20" className="zz-2">
        z
      </text>
      <text x="26" y="-32" fontSize="25" className="zz-3">
        Z
      </text>
    </svg>
  );
}

/** Bolhinhas de sabão subindo e estourando em volta do banho. */
export function BathBubbles({ n = 7 }: { n?: number }) {
  return (
    <span className="photo-bubbles" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i
          key={i}
          style={{ left: `${8 + ((i * 37) % 84)}%`, width: 8 + ((i * 5) % 11), height: 8 + ((i * 5) % 11), animationDelay: `${(i * 0.53) % 3}s`, animationDuration: `${2.6 + ((i * 0.37) % 1.4)}s` }}
        />
      ))}
    </span>
  );
}

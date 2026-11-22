// Ícones ilustrados e coloridos da barra de abas (desenho próprio).
export type TabId = 'inicio' | 'crescer' | 'cuidar' | 'loja' | 'bolsa' | 'mundo' | 'atividades' | 'bem-estar' | 'amigos';

export function TabIcon({ id }: { id: TabId }) {
  return (
    <span className="tab-ico" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="30" height="30">
        {id === 'inicio' && (
          <g>
            <path d="M5 15 L16 5 L27 15 Z" fill="#FF6F91" stroke="#D94B70" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="8" y="14" width="16" height="13" rx="3" fill="#FFE2B8" />
            <path d="M13 27 v-6 a3 3 0 0 1 6 0 v6 Z" fill="#B07A52" />
            <circle cx="21" cy="18" r="2" fill="#9FD2FF" />
          </g>
        )}
        {id === 'atividades' && (
          <g>
            <rect x="6" y="5" width="20" height="23" rx="5" fill="#7BD389" stroke="#3FA45E" strokeWidth="1.5" />
            <rect x="11" y="3" width="10" height="5" rx="2.5" fill="#FFFFFF" stroke="#3FA45E" strokeWidth="1.5" />
            <path d="M11 17 l3.5 3.5 L21.5 13" stroke="#FFFFFF" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {id === 'crescer' && (
          <g>
            <path d="M16 18 C16 12 12 8 6 8 C6 14 10 18 16 18 Z" fill="#7BD389" stroke="#3FA45E" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 16 C16 9 20 5 27 5 C27 12 22 16 16 16 Z" fill="#9BE58F" stroke="#3FA45E" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 23 V15" stroke="#3FA45E" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M8 21 H24 L22 29 H10 Z" fill="#FF9F68" stroke="#D9733F" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="7" y="19.5" width="18" height="3.5" rx="1.75" fill="#FFB98A" stroke="#D9733F" strokeWidth="1.5" />
          </g>
        )}
        {id === 'loja' && (
          <g>
            <rect x="6" y="14" width="20" height="14" rx="2.5" fill="#FFE2B8" stroke="#D99A5B" strokeWidth="1.5" />
            <path d="M4 13 L7 5 H25 L28 13 Z" fill="#FF6F91" stroke="#D94B70" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10.5 5 L9.5 13 M16 5 V13 M21.5 5 L22.5 13" stroke="#FFFFFF" strokeWidth="2.2" />
            <path d="M4 13 q3 3 6 0 q3 3 6 0 q3 3 6 0 q3 3 6 0" fill="#FF8FA8" stroke="#D94B70" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="13" y="19" width="6" height="9" rx="1.5" fill="#6FB7FF" />
          </g>
        )}
        {id === 'bolsa' && (
          <g>
            <path d="M11 11 V9 a5 5 0 0 1 10 0 V11" fill="none" stroke="#8A63D2" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M6 12 Q6 10 8 10 H24 Q26 10 26 12 L27 26 Q27 29 24 29 H8 Q5 29 5 26 Z" fill="#B48CFF" stroke="#8A63D2" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="11" y="17" width="10" height="6" rx="2" fill="#FFC75F" stroke="#D99A2B" strokeWidth="1.3" />
            <ellipse cx="10" cy="14" rx="2.4" ry="1.4" fill="#FFFFFF" opacity="0.55" />
          </g>
        )}
        {id === 'cuidar' && (
          <g>
            <circle cx="9" cy="9" r="4.5" fill="#E8955A" />
            <circle cx="23" cy="9" r="4.5" fill="#E8955A" />
            <circle cx="9" cy="9.5" r="2.2" fill="#FFB3C1" />
            <circle cx="23" cy="9.5" r="2.2" fill="#FFB3C1" />
            <ellipse cx="16" cy="18" rx="12" ry="10.5" fill="#F4B26B" stroke="#D98C45" strokeWidth="1.5" />
            <ellipse cx="16" cy="22" rx="7" ry="5" fill="#FFE9D2" />
            <circle cx="11.5" cy="16" r="1.5" fill="#2B2224" />
            <circle cx="20.5" cy="16" r="1.5" fill="#2B2224" />
            <path d="M14.6 19 h2.8 l-1.4 1.6 Z" fill="#F07A93" />
            <path d="M16 27.5 C11.5 24.5 11 22 13 21 C14.2 20.5 15.4 21.2 16 22.2 C16.6 21.2 17.8 20.5 19 21 C21 22 20.5 24.5 16 27.5 Z" fill="#FF6F91" />
          </g>
        )}
        {id === 'mundo' && (
          <g>
            <circle cx="16" cy="16" r="11.5" fill="#6FB7FF" stroke="#3D8BD9" strokeWidth="1.5" />
            <path d="M9 11 q4 -2 6 1 q1 3 -2 4 q-3 1 -2 4 q-3 -2 -2 -9 Z M18 19 q3 -1 5 1 q-1 4 -4 5 q-2 -3 -1 -6 Z M19 7 q3 0 5 3 q-3 1 -5 -1 Z" fill="#7BD389" />
          </g>
        )}
        {id === 'bem-estar' && (
          <g>
            <path d="M16 27 C5 20 3 13 7 9 C10 6 14 7 16 11 C18 7 22 6 25 9 C29 13 27 20 16 27 Z" fill="#FF8FB1" stroke="#E0567F" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M24 3 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 Z" fill="#FFC75F" />
            <ellipse cx="11.5" cy="12.5" rx="2.5" ry="1.6" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 11.5 12.5)" />
          </g>
        )}
        {id === 'amigos' && (
          <g>
            <circle cx="11" cy="17" r="8" fill="#FFC75F" stroke="#D99A2B" strokeWidth="1.5" />
            <circle cx="22" cy="15" r="7" fill="#B48CFF" stroke="#8A63D2" strokeWidth="1.5" />
            <circle cx="8.5" cy="16" r="1.2" fill="#2B2224" />
            <circle cx="13.5" cy="16" r="1.2" fill="#2B2224" />
            <path d="M9 20 q2 1.6 4 0" stroke="#2B2224" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <circle cx="20" cy="14" r="1.1" fill="#2B2224" />
            <circle cx="24.5" cy="14" r="1.1" fill="#2B2224" />
            <path d="M20.5 17.5 q1.8 1.4 3.6 0" stroke="#2B2224" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </span>
  );
}

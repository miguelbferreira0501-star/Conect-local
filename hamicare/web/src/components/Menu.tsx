// Menu do HamiCare (estilo Finch): cartão do Hami, widget, atalhos em grade, Plus e comunidade.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { Hamster } from './Hamster';
import { AreaSheet } from './AreaSheet';
import { openGuardian } from './Guardian';
import { openLegal } from './Legal';
import { showPlusOffers } from './PlusCard';
import { Glyph } from './art';
import { toast } from './ui';
import { openUi } from '../lib/bus';
import { unreadMail } from '../lib/mail';
import { isNativeApp, nativePlatform } from '../lib/native';
import { getSocial } from '../lib/social';
import { isPremium, useApp } from '../lib/store';
import { copyText } from '../lib/util';

export function MenuScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [code, setCode] = useState<string | null>(null);
  const [area, setArea] = useState(false);
  useEffect(() => {
    if (!open || code) return;
    let live = true;
    getSocial()
      .then((api) => api?.me())
      .then((me) => live && me && setCode(me.code))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open, code]);
  if (!open) return null;
  const go = (t: Parameters<typeof openUi>[0]) => (onClose(), openUi(t));
  const mail = unreadMail(s);
  const widget = () =>
    toast(
      !isNativeApp()
        ? 'O widget funciona no app instalado pela loja. Assim que o app sair, é só adicionar pela tela inicial.'
        : nativePlatform() === 'ios'
          ? 'Segure a tela inicial, toque em + e procure por HamiCare.'
          : 'Segure a tela inicial, toque em Widgets e escolha HamiCare.',
    );
  const tiles: { ico: string; label: string; on: () => void; badge?: number }[] = [
    { ico: '⚡', label: 'Missões', on: () => go('missoes') },
    { ico: '🌈', label: 'Minha área de cuidado', on: () => setArea(true) },
    { ico: '📋', label: 'Temporada', on: () => go('temporada') },
    { ico: '📊', label: 'Evolução', on: () => go('evolucao') },
    { ico: '💌', label: 'Correio', on: () => go('correio'), badge: mail },
    { ico: '📅', label: 'Carteira e histórico', on: () => go('carteira') },
  ];
  return (
    <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="menu-back" onClick={onClose} aria-label="Voltar">
        <ChevronLeft size={34} strokeWidth={3.5} />
      </button>
      <section className="menu-card menu-id">
        <span className="menu-id-pet" aria-hidden="true">
          <Hamster fur={s.pet.fur} phase={s.pet.phase} outfit={s.pet.outfit} size={64} idle={false} label="" />
        </span>
        <span className="min-w-0 flex-1">
          <b>
            {s.pet.name} <i>&</i> {s.profile.name || 'você'}
          </b>
          {code ? (
            <button className="menu-code" onClick={async () => toast((await copyText(code)) ? 'Código copiado!' : code)} aria-label={`Copiar código ${code}`}>
              {code} <Copy size={15} />
            </button>
          ) : (
            <small>Entre na conta (em Ajustes) para ter um código de amigo.</small>
          )}
        </span>
      </section>

      <button className="menu-banner menu-widget" onClick={widget}>
        <span className="menu-banner-ico" aria-hidden="true">
          <Glyph e="💗" size={34} />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <b>Adicione o widget</b>
          <small>Fique perto do {s.pet.name} na tela inicial do celular!</small>
        </span>
        <span className="menu-pill">Adicionar</span>
      </button>

      <div className="menu-grid">
        {tiles.map((t) => (
          <button key={t.label} className="menu-tile" onClick={t.on}>
            <Glyph e={t.ico} size={38} />
            <b>{t.label}</b>
            {!!t.badge && <span className="menu-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {(showPlusOffers(s) || isPremium(s)) && (
        <button className="menu-banner menu-plus" onClick={() => go('plus')}>
          <span className="min-w-0 flex-1 text-left">
            <b>
              HamiCare <em>PLUS</em>
            </b>
            <small>{isPremium(s) ? 'Sua mesada, fantasias e turma maior' : `Sementes toda semana e mimos pro ${s.pet.name}`}</small>
          </span>
          <span className="menu-pill">{isPremium(s) ? 'Ver' : 'Testar grátis'}</span>
        </button>
      )}

      <p className="menu-label">Comunidade</p>
      <div className="menu-list">
        <button onClick={() => go('amigos')}>
          <Glyph e="💌" size={30} /> <span className="menu-t">Convidar amigos</span> <ChevronRight size={22} />
        </button>
        {s.profile.ageGroup !== 'ate12' && (
          <button onClick={() => (onClose(), openGuardian())}>
            <Glyph e="🛡️" size={30} /> <span className="menu-t">Guardiões do Hami</span> <ChevronRight size={22} />
          </button>
        )}
      </div>

      <p className="menu-label">Ajustes</p>
      <div className="menu-list">
        <button onClick={() => go('ajustes')}>
          <Glyph e="⚙️" size={30} /> <span className="menu-t">Preferências, conta e lembretes</span> <ChevronRight size={22} />
        </button>
        <button onClick={() => openLegal('termos')}>
          <Glyph e="📄" size={30} /> <span className="menu-t">Termos de uso</span> <ChevronRight size={22} />
        </button>
        <button onClick={() => openLegal('privacidade')}>
          <Glyph e="🔒" size={30} /> <span className="menu-t">Privacidade</span> <ChevronRight size={22} />
        </button>
      </div>
      <AreaSheet open={area} onClose={() => setArea(false)} />
    </div>
  );
}

// Correio do Hami (estilo Finch): caixa de correio no céu, cartas novas com bolinha e cartas lidas.
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Sheet } from './ui';
import { openGuardian } from './Guardian';
import { openUi } from '../lib/bus';
import { agoText, lettersOf, type Letter } from '../lib/mail';
import { dayDiff } from '../lib/util';
import { mailClear, mailRead, todayKey, useApp } from '../lib/store';

const ENV: Record<Letter['kind'], [string, string]> = {
  estrela: ['#8FC4F5', '#F5B82E'],
  arco: ['#B9DC8A', '#E0685F'],
  trofeu: ['#F2A04A', '#FFE27A'],
  coracao: ['#F5A9C0', '#E0554F'],
  presente: ['#C9B6FF', '#7E5BD9'],
};

function Envelope({ kind }: { kind: Letter['kind'] }) {
  const [bg, ink] = ENV[kind];
  return (
    <svg viewBox="0 0 64 48" width="58" height="44" aria-hidden="true">
      <rect x="2" y="4" width="60" height="40" rx="7" fill={bg} />
      <path d="M4 8 L32 28 L60 8" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" fill="none" />
      {kind === 'estrela' && <path d="M32 12 l4.5 9 10 1.4 -7.2 7 1.7 10 -9 -4.8 -9 4.8 1.7 -10 -7.2 -7 10 -1.4 Z" fill={ink} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />}
      {kind === 'arco' && <><path d="M18 36 A14 14 0 0 1 46 36" stroke={ink} strokeWidth="5" fill="none" /><path d="M23 36 A9 9 0 0 1 41 36" stroke="#F5B82E" strokeWidth="5" fill="none" /><path d="M28 36 A4 4 0 0 1 36 36" stroke="#5B8BD6" strokeWidth="4" fill="none" /></>}
      {kind === 'trofeu' && <><path d="M22 12 H42 V20 C42 28 36 31 32 31 C28 31 22 28 22 20 Z" fill={ink} stroke="#fff" strokeWidth="2.5" /><rect x="29" y="31" width="6" height="5" fill="#fff" /><rect x="24" y="36" width="16" height="4" rx="2" fill="#fff" /></>}
      {kind === 'coracao' && <path d="M32 38 C18 28 20 14 28 14 C31 14 32 17 32 17 C32 17 33 14 36 14 C44 14 46 28 32 38 Z" fill={ink} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />}
      {kind === 'presente' && <><rect x="20" y="20" width="24" height="18" rx="3" fill={ink} stroke="#fff" strokeWidth="2.5" /><rect x="17" y="14" width="30" height="8" rx="3" fill={ink} stroke="#fff" strokeWidth="2.5" /><rect x="30" y="14" width="4" height="24" fill="#fff" /></>}
    </svg>
  );
}

function Mailbox() {
  return (
    <svg viewBox="0 0 200 150" width="210" height="158" aria-hidden="true">
      <rect x="92" y="96" width="18" height="60" fill="#8C5552" />
      <rect x="92" y="96" width="9" height="60" fill="#7A4746" />
      <path d="M46 96 V52 C46 30 62 20 80 20 H140 C158 20 170 32 170 52 V96 Z" fill="#DE5F68" />
      <path d="M46 96 V52 C46 30 62 20 80 20 C98 20 108 32 108 52 V96 Z" fill="#C4434F" />
      <rect x="34" y="92" width="140" height="6" rx="3" fill="#C4434F" />
      <rect x="40" y="56" width="62" height="38" rx="5" fill="#E8B544" />
      <path d="M40 60 L71 80 L102 60" stroke="#F8D168" strokeWidth="5" fill="none" />
      <rect x="118" y="26" width="6" height="42" fill="#F2C24E" />
      <rect x="118" y="20" width="22" height="14" rx="2" fill="#F8D168" />
      <circle cx="121" cy="70" r="6" fill="#F2C24E" />
      <path d="M144 76 C136 68 140 60 146 60 C149 60 150 63 150 63 C150 63 151 60 154 60 C160 60 164 68 150 80 Z" fill="#F29BB2" />
      <path d="M150 18 l6 -12 M160 24 l12 -8 M164 36 l14 -2" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function MailScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [letter, setLetter] = useState<Letter | null>(null);
  if (!open) return null;
  const today = todayKey();
  const all = lettersOf(s, today);
  const read = new Set(s.mail?.read ?? []);
  const fresh = all.filter((l) => !read.has(l.id));
  const old = all.filter((l) => read.has(l.id));
  const row = (l: Letter, isNew: boolean) => (
    <li key={l.id}>
      <button className="mail-row" onClick={() => (setLetter(l), mailRead(l.id))}>
        <Envelope kind={l.kind} />
        <span className="min-w-0 flex-1 text-left">
          <b>{l.title}</b>
          <small>
            {agoText(l.date, today)}
            {l.expires ? ` · Expira em ${Math.max(0, dayDiff(today, l.expires))} dias` : ''}
          </small>
        </span>
        {isNew && <span className="mail-dot" aria-label="nova" />}
      </button>
    </li>
  );
  return (
    <div className="mail" role="dialog" aria-modal="true" aria-label={`Correio do ${s.pet.name}`}>
      <div className="mail-sky">
        <button className="mail-back" onClick={onClose} aria-label="Voltar">
          <ChevronLeft size={34} strokeWidth={3.5} />
        </button>
        <span className="mail-cloud mail-cloud-1" />
        <span className="mail-cloud mail-cloud-2" />
        <Mailbox />
      </div>
      <div className="mail-panel">
        <div className="flex items-center justify-between gap-3">
          <h2>Correio do {s.pet.name}</h2>
          {all.length > 0 && (
            <button className="mail-clear" onClick={() => mailClear(all.map((l) => l.id))}>
              Limpar tudo
            </button>
          )}
        </div>
        {fresh.length > 0 && (
          <>
            <p className="mail-label">
              Novas <span>{fresh.length}</span>
            </p>
            <ul className="grid gap-3">{fresh.map((l) => row(l, true))}</ul>
          </>
        )}
        {old.length > 0 && (
          <>
            <p className="mail-label">Lidas</p>
            <ul className="grid gap-3">{old.map((l) => row(l, false))}</ul>
          </>
        )}
        {!all.length && <p className="py-10 text-center text-[15px] font-bold text-[#9aa3b5]">Nenhuma cartinha por enquanto. O {s.pet.name} avisa quando chegar.</p>}
      </div>
      <Sheet open={!!letter} onClose={() => setLetter(null)} title={letter?.title ?? ''}>
        {letter && (
          <div className="grid gap-4 pb-2 pt-1">
            <p className="text-[16px] leading-relaxed">{letter.body}</p>
            {letter.action && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const go = letter.action!.go;
                  setLetter(null);
                  onClose();
                  if (go === 'guardioes') openGuardian();
                  else openUi(go);
                }}
              >
                {letter.action.label}
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

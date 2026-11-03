// Política de privacidade e termos de uso dentro do app. Abre de qualquer tela com openLegal().
import { useEffect, useState } from 'react';
import { Sheet } from './ui';
import { LEGAL, LEGAL_INFO, formatLegalDate, type LegalBlock, type LegalId } from '../shared/legal';

let show: ((id: LegalId) => void) | null = null;
export function openLegal(id: LegalId) {
  show?.(id);
}

export function LegalHost() {
  const [id, setId] = useState<LegalId | null>(null);
  const [last, setLast] = useState<LegalId>('privacidade');
  useEffect(() => {
    show = (next) => (setId(next), setLast(next));
    return () => {
      show = null;
    };
  }, []);
  const doc = LEGAL[id ?? last];
  return (
    <Sheet open={!!id} onClose={() => setId(null)} title={doc.title}>
      <article className="legal grid gap-4 pb-6">
        <p className="text-[13px] font-bold text-muted">Versão de {formatLegalDate(LEGAL_INFO.atualizado)}</p>
        <div className="legal-summary grid gap-2 rounded-3xl p-4">
          <p className="font-display text-[17px] font-bold">Em poucas palavras</p>
          <ul className="grid gap-1.5">
            {doc.summary.map((t) => (
              <li key={t} className="flex gap-2 text-[14.5px] font-semibold leading-snug">
                <span aria-hidden="true">🐹</span>
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        {doc.sections.map((sec) => (
          <section key={sec.h} className="grid gap-2">
            <h3 className="font-display text-[17px] font-bold leading-tight">{sec.h}</h3>
            {sec.body.map((b, i) => (
              <Block key={i} b={b} />
            ))}
          </section>
        ))}
        <button className="btn btn-ghost" onClick={() => setId(doc.id === 'termos' ? 'privacidade' : 'termos')}>
          Ler {doc.id === 'termos' ? 'a Política de Privacidade' : 'os Termos de Uso'}
        </button>
      </article>
    </Sheet>
  );
}

function Block({ b }: { b: LegalBlock }) {
  if (typeof b === 'string') return <p className="text-[14.5px] leading-relaxed text-ink">{b}</p>;
  return (
    <ul className="grid gap-1.5 pl-1">
      {b.map((t) => (
        <li key={t} className="flex gap-2 text-[14.5px] leading-relaxed text-ink">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Links para os dois textos, usados no aceite da conta. */
export function LegalLinks() {
  const link = 'font-extrabold text-ink underline underline-offset-2';
  return (
    <>
      <button type="button" className={link} onClick={() => openLegal('termos')}>
        termos de uso
      </button>{' '}
      e a{' '}
      <button type="button" className={link} onClick={() => openLegal('privacidade')}>
        política de privacidade
      </button>
    </>
  );
}

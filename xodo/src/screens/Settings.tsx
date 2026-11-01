import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Sheet, toast } from '../components/ui';
import { Pet } from '../components/Pet';
import { COLOR_ORDER, PET_COLORS } from '../data/colors';
import { exportCode, importCode, resetAll, stageOf, updateProfile, useApp, type Theme } from '../lib/store';
import { copyText } from '../lib/util';

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useApp();
  const [code, setCode] = useState('');
  const [importText, setImportText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="grid gap-6 pt-1">
        <section className="grid gap-3">
          <h3 className="eyebrow">Perfil</h3>
          <label className="grid gap-1.5" htmlFor="set-user">
            <span className="text-[14px] font-extrabold">Seu nome</span>
            <input id="set-user" className="field" value={s.userName} maxLength={24} onChange={(e) => updateProfile({ userName: e.target.value })} />
          </label>
          <label className="grid gap-1.5" htmlFor="set-pet">
            <span className="text-[14px] font-extrabold">Nome do xodó</span>
            <input id="set-pet" className="field" value={s.petName} maxLength={20} onChange={(e) => updateProfile({ petName: e.target.value })} />
          </label>
          <div className="grid gap-1.5">
            <span className="text-[14px] font-extrabold">Cor</span>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_ORDER.map((c) => (
                <button key={c} className="color-opt" aria-pressed={s.petColor === c} aria-label={PET_COLORS[c].label} onClick={() => updateProfile({ petColor: c })}>
                  <Pet color={c} stage={stageOf(s.xp)} size={48} idle={false} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-2">
          <h3 className="eyebrow">Aparência</h3>
          <div className="seg" role="group" aria-label="Tema">
            {(['auto', 'claro', 'escuro'] as Theme[]).map((t) => (
              <button key={t} aria-pressed={s.theme === t} onClick={() => updateProfile({ theme: t })}>
                {t === 'auto' ? 'Automático' : t === 'claro' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <div>
            <h3 className="eyebrow">Salvar progresso</h3>
            <p className="mt-1 text-[15px] text-muted">
              Seu xodó fica guardado neste aparelho. Gere um código de backup e guarde (no WhatsApp pra você mesmo, por exemplo). Pra trocar de
              celular, cole o código lá.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => setCode(exportCode())}>
            <Download size={18} /> Gerar código de backup
          </button>
          {code && (
            <div className="grid gap-2">
              <label className="sr-only" htmlFor="backup-code">
                Código de backup
              </label>
              <textarea id="backup-code" className="field min-h-[88px] font-mono text-[12px]" readOnly value={code} onFocus={(e) => e.currentTarget.select()} />
              <button
                className="btn btn-soft"
                onClick={async () => toast((await copyText(code)) ? 'Código copiado' : 'Selecione o texto e copie')}
              >
                <Copy size={18} /> Copiar código
              </button>
            </div>
          )}
          <label className="grid gap-1.5" htmlFor="import-code">
            <span className="text-[14px] font-extrabold">Recuperar de um código</span>
            <textarea
              id="import-code"
              className="field min-h-[72px] font-mono text-[12px]"
              placeholder="Cole aqui o código que começa com XODO1."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </label>
          <button
            className="btn btn-ghost"
            disabled={!importText.trim()}
            onClick={() => {
              if (importCode(importText)) {
                toast('Progresso recuperado!');
                setImportText('');
                onClose();
              } else toast('Esse código não funcionou. Confira se copiou ele inteiro.');
            }}
          >
            Recuperar
          </button>
        </section>

        <section className="grid gap-2">
          <h3 className="eyebrow">Sobre</h3>
          <p className="text-[15px] text-muted">
            O Xodó é um companheiro de autocuidado. Ele não substitui terapia nem atendimento médico. Em crise, ligue 188 (CVV, grátis, 24h).
          </p>
          <p className="text-[15px] text-muted">Em breve: conta na nuvem, lembretes e o Xodó+ com mais roupas, passeios e temporadas.</p>
        </section>

        <section className="grid gap-2">
          {confirmReset ? (
            <div className="grid gap-2 rounded-2xl bg-accent-soft p-4">
              <p className="font-bold">Apagar tudo e começar do zero? Seu xodó, itens e diário somem deste aparelho.</p>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => {
                    resetAll();
                    setConfirmReset(false);
                    onClose();
                  }}
                >
                  Apagar tudo
                </button>
                <button className="btn btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button className="text-[14px] font-bold text-muted underline underline-offset-4" onClick={() => setConfirmReset(true)}>
              Começar do zero
            </button>
          )}
        </section>
      </div>
    </Sheet>
  );
}

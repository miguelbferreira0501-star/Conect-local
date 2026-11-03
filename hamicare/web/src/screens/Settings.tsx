import { useState, type ReactNode } from 'react';
import { ChevronRight, Copy, Download, Lock, Sparkles } from 'lucide-react';
import { Sheet, toast } from '../components/ui';
import { Hamster } from '../components/Hamster';
import { ACCENTS, FURS } from '../data/fur';
import { TRAITS } from '../data/lines';
import {
  deleteWeightData, enableTracking, exportCode, importCode, isPremium, minor, owned, resetAll, setHeight, setHideNumbers, updatePet, updatePrivacy, updateProfile, updateSettings, useApp,
} from '../lib/store';
import { askPermission, permission, pickReminder, showNotification } from '../lib/notify';
import { copyText, formatDay } from '../lib/util';
import { syncPush } from '../lib/account';
import { getState } from '../lib/store';
import type { AgeGroup, NotifKind, ThemePref, TraitId } from '../types';

const NOTIF_LABEL: Record<NotifKind, string> = {
  tarefas: 'Lembrete das atividades',
  hami: 'Quando o Hami precisar de você',
  missoes: 'Missões e desafios novos',
  aventura: 'Volta das aventuras',
  amigos: 'Vibes e presentes de amigos',
};

export function SettingsSheet({ open, onClose, onPlus, account }: { open: boolean; onClose: () => void; onPlus: () => void; account?: ReactNode }) {
  const s = useApp();
  const [code, setCode] = useState('');
  const [importText, setImportText] = useState('');
  const [confirm, setConfirm] = useState<'reset' | 'peso' | null>(null);
  const isMinor = minor(s);

  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="grid gap-6 pt-1">
        <Group title="Você">
          <Field id="set-name" label="Seu nome">
            <input id="set-name" className="field" maxLength={24} value={s.profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
          </Field>
          <Field id="set-age" label="Faixa de idade">
            <select id="set-age" className="field" value={s.profile.ageGroup} onChange={(e) => updateProfile({ ageGroup: e.target.value as AgeGroup })}>
              <option value="ate12">Até 12 anos</option>
              <option value="13a17">13 a 17 anos</option>
              <option value="18mais">18 anos ou mais</option>
            </select>
          </Field>
        </Group>

        <Group title="Hami">
          <Field id="set-pet" label="Nome">
            <input id="set-pet" className="field" maxLength={18} value={s.pet.name} onChange={(e) => updatePet({ name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-5 gap-1.5">
            {FURS.map((f) => {
              const locked = f.plus && !isPremium(s);
              const toBuy = !!f.price && !owned(s, `fur:${f.id}`);
              return (
                <button key={f.id} className="color-opt relative !p-0.5" aria-pressed={s.pet.fur === f.id} aria-label={locked ? `${f.label} (Plus)` : toBuy ? `${f.label} (no Armário)` : f.label} onClick={() => (locked ? onPlus() : toBuy ? toast(`A pelagem ${f.label} fica no Armário (aba Mundo).`) : updatePet({ fur: f.id }))}>
                  <Hamster fur={f.id} size={50} idle={false} />
                  {(locked || toBuy) && <Lock size={12} className="absolute right-1 top-1 text-muted" />}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TRAITS) as TraitId[]).map((t) => (
              <button key={t} className={`chip ${s.pet.trait === t ? 'chip-accent' : 'chip-plain'}`} onClick={() => updatePet({ trait: t })}>
                {TRAITS[t].emoji} {TRAITS[t].label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Aparência">
          <div className="seg" role="group" aria-label="Tema">
            {(['auto', 'claro', 'escuro'] as ThemePref[]).map((t) => (
              <button key={t} aria-pressed={s.settings.theme === t} onClick={() => updateSettings({ theme: t })}>
                {t === 'auto' ? 'Automático' : t === 'claro' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
          <p className="text-[14px] font-extrabold">Cor do app</p>
          <div className="grid grid-cols-6 gap-2">
            {ACCENTS.map((a) => (
              <button key={a.id} className="grid min-w-0 justify-items-center gap-1" aria-pressed={s.settings.accent === a.id} onClick={() => updateSettings({ accent: a.id })}>
                <span className={`accent-swatch accent-${a.id} ${s.settings.accent === a.id ? 'is-on' : ''}`} />
                <span className="w-full truncate text-center text-[11px] font-bold">{a.label}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Lembretes">
          <Toggle
            id="set-notif"
            checked={s.settings.notif.enabled}
            onChange={async (on) => {
              if (on && permission() === 'default') await askPermission();
              updateSettings({ notif: { ...s.settings.notif, enabled: on } });
              syncPush(getState());
            }}
            label="Receber lembretes gentis"
            sub="Sem culpa e sem pressão. Um por dia, no horário que você escolher."
          />
          {s.settings.notif.enabled && (
            <>
              <Field id="set-time" label="Horário">
                <input id="set-time" type="time" className="field" value={s.settings.notif.time} onChange={(e) => updateSettings({ notif: { ...s.settings.notif, time: e.target.value || '19:00' } })} onBlur={() => syncPush(getState())} />
              </Field>
              {(Object.keys(NOTIF_LABEL) as NotifKind[]).map((k) => (
                <Toggle key={k} id={`set-n-${k}`} checked={s.settings.notif.kinds[k]} onChange={(on) => updateSettings({ notif: { ...s.settings.notif, kinds: { ...s.settings.notif.kinds, [k]: on } } })} label={NOTIF_LABEL[k]} />
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => showNotification(pickReminder(s)?.text ?? 'Hora de cuidar um pouquinho de você.', toast)}>
                Testar lembrete
              </button>
              {permission() === 'denied' && <p className="text-[13px] text-muted">As notificações do sistema estão bloqueadas neste navegador. Os lembretes aparecem dentro do app.</p>}
            </>
          )}
        </Group>

        <Group title="Privacidade">
          <Toggle id="set-req" checked={s.privacy.requests === 'todos'} onChange={(on) => updatePrivacy({ requests: on ? 'todos' : 'ninguem' })} label="Aceitar pedidos de amizade pelo código" sub="Só quem tem o seu código consegue pedir." />
          <Toggle id="set-photos" checked={s.privacy.sharePhotos} onChange={(on) => updatePrivacy({ sharePhotos: on })} label="Permitir que eu compartilhe fotos no feed" />
          <p className="text-[13px] text-muted">Peso, diário e humor nunca vão para o feed nem para amigos. No feed e nas visitas, o Hami de todo mundo aparece no formato padrão: ninguém compara corpo.</p>
        </Group>

        {!isMinor && (
          <Group title="Dados físicos (opcional)">
            <Toggle id="set-track" checked={s.body.tracking} onChange={(on) => enableTracking(on)} label="Registrar meu peso" sub={s.body.consentAt ? `Consentimento dado em ${formatDay(s.body.consentAt.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'Fica só com você. Dá pra apagar tudo.'} />
            <Toggle id="set-hide" checked={s.body.hideNumbers} onChange={setHideNumbers} label="Modo sem números" sub="Esconde todos os pesos, do Hami e seus." />
            {s.body.tracking && (
              <Field id="set-height" label="Altura (cm), opcional">
                <input id="set-height" className="field" inputMode="numeric" defaultValue={s.body.heightCm ?? ''} onBlur={(e) => setHeight(Number(e.target.value) || null)} />
              </Field>
            )}
            {confirm === 'peso' ? (
              <div className="grid gap-2 rounded-2xl bg-accent-soft p-3">
                <p className="font-bold">Apagar todos os registros de peso, a meta e a sincronização?</p>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1" onClick={() => (deleteWeightData(), setConfirm(null), toast('Registros apagados'))}>
                    Apagar
                  </button>
                  <button className="btn btn-ghost btn-sm flex-1" onClick={() => setConfirm(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button className="text-left text-[14px] font-bold text-muted underline underline-offset-4" onClick={() => setConfirm('peso')}>
                Apagar meus registros de peso
              </button>
            )}
          </Group>
        )}

        <Group title="HamiCare+">
          <button className="opt" onClick={onPlus}>
            <Sparkles size={20} className="text-accent" />
            <span className="min-w-0 flex-1">{isPremium(s) ? `Plus ativo até ${formatDay(s.premium.until!, { day: 'numeric', month: 'long' })}` : 'Conhecer o HamiCare+'}</span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </Group>

        {account}

        <Group title="Código de backup">
          <p className="text-[14px] text-muted">Guarde este código (no WhatsApp pra você mesmo, por exemplo) para recuperar seu progresso em outro celular, mesmo sem conta.</p>
          <button className="btn btn-ghost" onClick={() => setCode(exportCode())}>
            <Download size={18} /> Gerar código
          </button>
          {code && (
            <>
              <label className="sr-only" htmlFor="backup-code">
                Código de backup
              </label>
              <textarea id="backup-code" className="field min-h-[80px] font-mono text-[11px]" readOnly value={code} onFocus={(e) => e.currentTarget.select()} />
              <button className="btn btn-soft" onClick={async () => toast((await copyText(code)) ? 'Código copiado' : 'Selecione o texto e copie')}>
                <Copy size={18} /> Copiar
              </button>
            </>
          )}
          <Field id="import-code" label="Recuperar de um código">
            <textarea id="import-code" className="field min-h-[64px] font-mono text-[11px]" placeholder="Cole aqui o código (HAMI2… ou XODO1…)" value={importText} onChange={(e) => setImportText(e.target.value)} />
          </Field>
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
        </Group>

        <Group title="Sobre">
          <p className="text-[14px] text-muted">O HamiCare é um companheiro de autocuidado. Ele não faz diagnóstico, não substitui terapia nem atendimento médico e não vende resultado físico. Em crise, ligue 188 (CVV, grátis, 24h).</p>
          {confirm === 'reset' ? (
            <div className="grid gap-2 rounded-2xl bg-accent-soft p-3">
              <p className="font-bold">Apagar tudo deste aparelho e começar do zero?</p>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm flex-1" onClick={() => (resetAll(), setConfirm(null), onClose())}>
                  Apagar tudo
                </button>
                <button className="btn btn-ghost btn-sm flex-1" onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button className="text-left text-[14px] font-bold text-muted underline underline-offset-4" onClick={() => setConfirm('reset')}>
              Começar do zero
            </button>
          )}
        </Group>
      </div>
    </Sheet>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="eyebrow">{title}</h3>
      {children}
    </section>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5" htmlFor={id}>
      <span className="text-[14px] font-extrabold">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({ id, checked, onChange, label, sub }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="flex items-start gap-3" htmlFor={id}>
      <input id={id} type="checkbox" role="switch" className="switch mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-tight">{label}</span>
        {sub && <span className="block text-[13px] text-muted">{sub}</span>}
      </span>
    </label>
  );
}

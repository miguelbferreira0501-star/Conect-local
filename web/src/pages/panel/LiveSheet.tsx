import { StageIcon } from '@/components/StageIcon';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, X , Check } from 'lucide-react';
import { LIVE_DETAILS, LIVE_STAGE_DETAILS, LIVE_STAGES, FINAL_LIVE_STAGES, liveFlow, type LiveDetail, type LiveStage, type PetDTO } from '@conecta/shared';
import { api, ApiError } from '@/lib/api';
import { resizeImage } from '@/lib/image';
import { useLive } from '@/lib/pets';
import { LiveTimeline, PetCard } from '@/components/pets';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ChipToggle, TextField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';

export interface LiveTarget { id: string; title: string; status: string; pet: PetDTO | null }

/**
 * Pet ao Vivo (empresa): um toque na etapa + foto opcional. O tutor recebe na hora, no app.
 * A etapa final conclui o atendimento e libera a avaliação.
 */
export function LiveSheet({ businessId, categorySlug, target, onClose }: { businessId: string; categorySlug: string; target: LiveTarget | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const live = useLive(target?.id, { live: !!target, panelBusinessId: businessId });
  const flow = liveFlow(categorySlug);
  const done = new Set((live.data ?? []).map((u) => u.stage));
  const next = flow.find((s) => !done.has(s)) ?? 'photo';
  const [stage, setStage] = useState<LiveStage | null>(null);
  const current = stage ?? next;
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [details, setDetails] = useState<Partial<Record<LiveDetail, boolean>>>({});
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const reset = () => { setStage(null); setNote(''); setPhoto(null); setDetails({}); setErr(''); };

  const send = async () => {
    if (!target) return;
    setSending(true);
    setErr('');
    try {
      await api.post(`/panel/businesses/${businessId}/bookings/${target.id}/live`, { stage: current, note: note || undefined, details, photo: photo ?? undefined });
      toast(FINAL_LIVE_STAGES.has(current) ? 'Enviado! Atendimento concluído, o tutor já pode avaliar.' : 'Enviado para o tutor.');
      reset();
      await qc.invalidateQueries({ queryKey: ['live', target.id] });
      qc.invalidateQueries({ queryKey: ['panel'] });
    } catch (e) {
      setErr((e as ApiError).message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    await api.delete(`/panel/businesses/${businessId}/live/${id}`);
    qc.invalidateQueries({ queryKey: ['live', target?.id] });
  };

  return (
    <Sheet open={!!target} onClose={() => { reset(); onClose(); }} title={`Pet ao Vivo${target?.pet ? `: ${target.pet.name}` : ''}`}>
      {target && (
        <div className="space-y-5">
          <p className="text-sm text-muted">{target.title}</p>
          {target.pet && <PetCard pet={target.pet} />}
          {target.status === 'requested' ? (
            <Alert tone="warning">Confirme o agendamento em Pedidos para mostrar o pet ao vivo.</Alert>
          ) : (
            <>
              <section>
                <p className="label">Etapa</p>
                <div className="flex flex-wrap gap-2">
                  {[...flow, 'photo' as LiveStage].map((s) => (
                    <ChipToggle key={s} selected={current === s} onClick={() => { setStage(s); setDetails({}); }}>
                      <StageIcon stage={s} />{LIVE_STAGES[s].label}{done.has(s) && s !== 'photo' && <Check className="h-3.5 w-3.5 text-success-700" aria-label="já enviada" />}
                    </ChipToggle>
                  ))}
                </div>
              </section>
              {(LIVE_STAGE_DETAILS[current] ?? []).length > 0 && (
                <section>
                  <p className="label">{current === 'walk_end' ? 'Relatório do passeio' : 'Checklist da visita'}</p>
                  <div className="flex flex-wrap gap-2">
                    {LIVE_STAGE_DETAILS[current]!.map((d) => (
                      <ChipToggle key={d} selected={!!details[d]} onClick={() => setDetails({ ...details, [d]: !details[d] })}>{details[d] && <Check className="h-3.5 w-3.5" aria-hidden />}{LIVE_DETAILS[d]}</ChipToggle>
                    ))}
                  </div>
                </section>
              )}
              <section>
                {photo ? (
                  <div className="relative">
                    <img src={photo} alt="Foto que será enviada" className="max-h-64 w-full rounded-xl object-cover" />
                    <button aria-label="Tirar a foto" onClick={() => setPhoto(null)} className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-5 w-5" /></button>
                  </div>
                ) : (
                  <Button block variant="secondary" icon={<Camera className="h-5 w-5" />} onClick={() => file.current?.click()}>Tirar foto (opcional)</Button>
                )}
                <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]; e.target.value = '';
                  if (!f) return;
                  try { setPhoto(await resizeImage(f, 1280)); } catch (er) { setErr((er as Error).message); }
                }} />
              </section>
              <TextField label="Recado para o tutor" optional maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: comportado e tranquilo no banho!" />
              {err && <Alert tone="error">{err}</Alert>}
              <Button block size="lg" loading={sending} onClick={send}>Enviar “{LIVE_STAGES[current].label}”</Button>
              {FINAL_LIVE_STAGES.has(current) && <p className="text-center text-xs text-muted">Esta etapa conclui o atendimento e libera a avaliação para o tutor.</p>}
            </>
          )}
          <section>
            <h3 className="mb-3 font-semibold">O que o tutor está vendo</h3>
            <LiveTimeline updates={live.data ?? []} emptyText="Nenhuma etapa enviada ainda." />
            {(live.data ?? []).length > 0 && (
              <ul className="mt-3 space-y-1">
                {live.data!.map((u) => (
                  <li key={u.id}>
                    <button onClick={() => remove(u.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger-700"><Trash2 className="h-3.5 w-3.5" /> Apagar “{LIVE_STAGES[u.stage].label}” das {new Date(u.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}

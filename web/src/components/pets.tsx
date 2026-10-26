import { useRef, useState } from 'react';
import { Camera, Cat, Dog, HeartPulse, PawPrint, Scissors, ShieldCheck, Syringe, TriangleAlert } from 'lucide-react';
import {
  LIVE_DETAILS, LIVE_STAGES, PET_SIZES, PET_SPECIES, PET_TEMPERAMENTS, petInputSchema, petSummary,
  type LiveUpdateDTO, type PetDTO, type PetInput, type PetSize, type PetSpecies,
} from '@conecta/shared';
import { ApiError } from '@/lib/api';
import { resizeImage } from '@/lib/image';
import { useDeletePet, useSavePet } from '@/lib/pets';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ChipToggle, TextArea, TextField } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';

export function PetAvatar({ pet, size = 48 }: { pet: Pick<PetDTO, 'name' | 'species' | 'photoUrl'>; size?: number }) {
  const Icon = pet.species === 'cat' ? Cat : pet.species === 'dog' ? Dog : PawPrint;
  return pet.photoUrl ? (
    <img src={pet.photoUrl} alt="" width={size} height={size} className="shrink-0 rounded-full border-2 border-brand-700 object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full border-2 border-brand-700 bg-brand-50 text-brand-fg" style={{ width: size, height: size }} aria-hidden="true">
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

type Form = { name: string; species: PetSpecies; breed: string; size: PetSize | null; sex: 'male' | 'female' | null; birthYear: string; weightKg: string;
  temperament: string[]; healthNotes: string; careNotes: string; groomingNotes: string; vaccinesUpToDate: boolean | null };

const toForm = (p: PetDTO | null): Form => ({
  name: p?.name ?? '', species: p?.species ?? 'dog', breed: p?.breed ?? '', size: p?.size ?? null, sex: p?.sex ?? null,
  birthYear: p?.birthYear ? String(p.birthYear) : '', weightKg: p?.weightKg ? String(p.weightKg).replace('.', ',') : '',
  temperament: p?.temperament ?? [], healthNotes: p?.healthNotes ?? '', careNotes: p?.careNotes ?? '', groomingNotes: p?.groomingNotes ?? '',
  vaccinesUpToDate: p?.vaccinesUpToDate ?? null,
});

/** Cadastro/edição da ficha do pet. `pet === undefined` = fechado; `null` = novo. */
export function PetFormSheet({ pet, onClose, onSaved }: { pet: PetDTO | null | undefined; onClose: () => void; onSaved?: (p: PetDTO) => void }) {
  const open = pet !== undefined;
  return (
    <Sheet open={open} onClose={onClose} title={pet ? `Ficha de ${pet.name}` : 'Novo pet'}>
      {open && <PetForm key={pet?.id ?? 'new'} pet={pet} onDone={(p) => { onSaved?.(p); onClose(); }} />}
    </Sheet>
  );
}

function PetForm({ pet, onDone }: { pet: PetDTO | null; onDone: (p: PetDTO) => void }) {
  const [f, setF] = useState<Form>(() => toForm(pet));
  const [photo, setPhoto] = useState<string | null | undefined>(undefined); // undefined = não mudou
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoErr, setPhotoErr] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const save = useSavePet();
  const del = useDeletePet();
  const toast = useToast();
  const set = (p: Partial<Form>) => { setF((o) => ({ ...o, ...p })); setErrors({}); };
  const preview = photo === undefined ? pet?.photoUrl ?? null : photo;

  const submit = () => {
    const data: PetInput = {
      ...f, breed: f.breed || null, birthYear: f.birthYear ? Number(f.birthYear) : null,
      weightKg: f.weightKg ? Number(f.weightKg.replace(',', '.')) : null, temperament: f.temperament as PetInput['temperament'],
    };
    const parsed = petInputSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    save.mutate({ id: pet?.id ?? null, data, photo }, {
      onSuccess: (p) => { toast(pet ? 'Ficha atualizada.' : `${p.name} foi cadastrado!`); onDone(p); },
      onError: (e) => setErrors((e as ApiError).fields ?? { _: (e as Error).message }),
    });
  };

  return (
    <div className="space-y-5 pb-2">
      <div className="flex items-center gap-4">
        {preview ? <img src={preview} alt="" className="h-20 w-20 rounded-full border-2 border-brand-700 object-cover" /> : <PetAvatar pet={{ name: f.name, species: f.species, photoUrl: null }} size={80} />}
        <div className="space-y-1">
          <Button size="sm" variant="secondary" icon={<Camera className="h-4 w-4" />} onClick={() => file.current?.click()}>{preview ? 'Trocar foto' : 'Adicionar foto'}</Button>
          {preview && <button className="block text-sm text-muted underline" onClick={() => setPhoto(null)}>Remover foto</button>}
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const fl = e.target.files?.[0]; e.target.value = '';
            if (!fl) return;
            try { setPhoto(await resizeImage(fl, 800)); setPhotoErr(''); } catch (er) { setPhotoErr((er as Error).message); }
          }} />
        </div>
      </div>
      {photoErr && <Alert tone="error">{photoErr}</Alert>}

      <TextField label="Nome" value={f.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} error={errors.name} placeholder="Ex.: Thor" />
      <div>
        <p className="label">Espécie</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PET_SPECIES) as PetSpecies[]).map((s) => <ChipToggle key={s} selected={f.species === s} onClick={() => set({ species: s })}>{PET_SPECIES[s]}</ChipToggle>)}
        </div>
      </div>
      <TextField label="Raça" optional value={f.breed} maxLength={60} onChange={(e) => set({ breed: e.target.value })} placeholder={f.species === 'cat' ? 'Ex.: SRD, Persa' : 'Ex.: Shih-tzu, SRD'} error={errors.breed} />
      <div>
        <p className="label">Porte</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PET_SIZES) as PetSize[]).map((s) => <ChipToggle key={s} selected={f.size === s} onClick={() => set({ size: f.size === s ? null : s })}>{PET_SIZES[s]}</ChipToggle>)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="label">Sexo</p>
          <div className="flex gap-2">
            <ChipToggle selected={f.sex === 'male'} onClick={() => set({ sex: f.sex === 'male' ? null : 'male' })}>Macho</ChipToggle>
            <ChipToggle selected={f.sex === 'female'} onClick={() => set({ sex: f.sex === 'female' ? null : 'female' })}>Fêmea</ChipToggle>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Ano de nascimento" optional inputMode="numeric" maxLength={4} value={f.birthYear} onChange={(e) => set({ birthYear: e.target.value.replace(/\D/g, '') })} error={errors.birthYear} placeholder="2021" />
        <TextField label="Peso (kg)" optional inputMode="decimal" maxLength={5} value={f.weightKg} onChange={(e) => set({ weightKg: e.target.value.replace(/[^\d,.]/g, '') })} error={errors.weightKg} placeholder="8,5" />
      </div>
      <div>
        <p className="label">Comportamento <span className="font-normal text-muted">(ajuda quem vai cuidar)</span></p>
        <div className="flex flex-wrap gap-2">
          {PET_TEMPERAMENTS.map((t) => (
            <ChipToggle key={t} selected={f.temperament.includes(t)} onClick={() => set({ temperament: f.temperament.includes(t) ? f.temperament.filter((x) => x !== t) : [...f.temperament, t] })}>{t}</ChipToggle>
          ))}
        </div>
      </div>
      <TextArea label="Saúde: alergias, remédios, condições" optional maxLength={500} value={f.healthNotes} onChange={(e) => set({ healthNotes: e.target.value })} className="field min-h-[70px]" placeholder="Ex.: alergia a shampoo com perfume; toma remédio para o coração às 8h" />
      <TextArea label="Cuidados e medos" optional maxLength={500} value={f.careNotes} onChange={(e) => set({ careNotes: e.target.value })} className="field min-h-[70px]" placeholder="Ex.: tem medo de secador; não pode ficar perto de gatos; puxa na guia" />
      <TextArea label="Como gosta da tosa" optional maxLength={300} value={f.groomingNotes} onChange={(e) => set({ groomingNotes: e.target.value })} className="field min-h-[60px]" placeholder="Ex.: tosa bebê, deixar as orelhas compridas, laço rosa" />
      <div>
        <p className="label">Vacinas em dia?</p>
        <div className="flex gap-2">
          <ChipToggle selected={f.vaccinesUpToDate === true} onClick={() => set({ vaccinesUpToDate: f.vaccinesUpToDate === true ? null : true })}>Sim</ChipToggle>
          <ChipToggle selected={f.vaccinesUpToDate === false} onClick={() => set({ vaccinesUpToDate: f.vaccinesUpToDate === false ? null : false })}>Não</ChipToggle>
        </div>
      </div>
      {errors._ && <Alert tone="error">{errors._}</Alert>}
      <Button block size="lg" loading={save.isPending} onClick={submit}>{pet ? 'Salvar ficha' : 'Cadastrar pet'}</Button>
      {pet && (
        <Button block variant="danger" loading={del.isPending} onClick={() => {
          if (!window.confirm(`Remover ${pet.name}? A ficha some dos próximos pedidos.`)) return;
          del.mutate(pet.id, { onSuccess: () => { toast('Pet removido.'); onDone(pet); } });
        }}>Remover {pet.name}</Button>
      )}
    </div>
  );
}

/** Ficha resumida para a empresa (no pedido e na agenda). */
export function PetCard({ pet }: { pet: PetDTO }) {
  const [open, setOpen] = useState(false);
  const hasNotes = pet.healthNotes || pet.careNotes || pet.groomingNotes;
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <PetAvatar pet={pet} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{pet.name}</p>
          <p className="text-sm text-muted">{petSummary(pet)}{pet.weightKg ? ` · ${String(pet.weightKg).replace('.', ',')} kg` : ''}</p>
        </div>
        {hasNotes && <button className="text-sm font-semibold text-brand-fg" onClick={() => setOpen(!open)}>{open ? 'Ocultar' : 'Ver ficha'}</button>}
      </div>
      {pet.temperament.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pet.temperament.map((t) => <span key={t} className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">{t}</span>)}
        </div>
      )}
      {pet.vaccinesUpToDate === false && <p className="mt-2 flex items-center gap-1 text-sm text-warning-700"><Syringe className="h-4 w-4" /> Vacinas não estão em dia</p>}
      {open && (
        <dl className="mt-3 space-y-2 text-sm">
          {pet.healthNotes && <div><dt className="flex items-center gap-1 font-medium"><HeartPulse className="h-4 w-4 text-danger-700" /> Saúde</dt><dd className="text-ink/90">{pet.healthNotes}</dd></div>}
          {pet.careNotes && <div><dt className="flex items-center gap-1 font-medium"><TriangleAlert className="h-4 w-4 text-warning-700" /> Cuidados e medos</dt><dd className="text-ink/90">{pet.careNotes}</dd></div>}
          {pet.groomingNotes && <div><dt className="flex items-center gap-1 font-medium"><Scissors className="h-4 w-4 text-brand-fg" /> Tosa preferida</dt><dd className="text-ink/90">{pet.groomingNotes}</dd></div>}
        </dl>
      )}
    </div>
  );
}

/** Linha do tempo do "Pet ao Vivo". */
export function LiveTimeline({ updates, emptyText }: { updates: LiveUpdateDTO[]; emptyText?: string }) {
  if (!updates.length) {
    return <p className="flex items-center gap-2 text-sm text-muted"><ShieldCheck className="h-4 w-4 text-accent-600" /> {emptyText ?? 'Quando o atendimento começar, as etapas e fotos aparecem aqui.'}</p>;
  }
  return (
    <ol className="relative space-y-4 border-l-2 border-brand-200 pl-5">
      {updates.map((u, i) => {
        const st = LIVE_STAGES[u.stage];
        const latest = i === updates.length - 1;
        const checks = Object.entries(u.details ?? {}).filter(([, v]) => v).map(([k]) => LIVE_DETAILS[k as keyof typeof LIVE_DETAILS]);
        return (
          <li key={u.id} className="relative">
            <span className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-sm ${latest ? 'bg-accent-600 ring-4 ring-accent-600/25' : 'bg-brand-700'}`} aria-hidden="true">{st.emoji}</span>
            <p className="font-semibold">{st.label} <span className="font-normal text-muted">· {new Date(u.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></p>
            {u.note && <p className="text-sm text-ink/90">{u.note}</p>}
            {checks.length > 0 && <p className="mt-1 text-sm text-accent-700">{checks.map((c) => `✓ ${c}`).join('   ')}</p>}
            {u.photoUrl && (
              <a href={u.photoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                <img src={u.photoUrl} alt={`Foto: ${st.label}`} loading="lazy" className="max-h-72 w-full rounded-xl border border-line object-cover" />
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}

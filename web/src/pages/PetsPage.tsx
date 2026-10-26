import { useState } from 'react';
import { Plus, PawPrint } from 'lucide-react';
import { petSummary, type PetDTO } from '@conecta/shared';
import { usePets } from '@/lib/pets';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { PetAvatar, PetFormSheet } from '@/components/pets';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';

export function PetsPage() {
  return (
    <div>
      <PageHeader title="Meus pets" subtitle="A ficha vai junto em cada agendamento" />
      <div className="container-app max-w-2xl py-5">
        <RequireAuth title="Entre para cadastrar seus pets" reason="A ficha (raça, porte, alergias e medos) vai junto em cada agendamento, para cuidarem do seu pet do jeito certo.">
          <PetsList />
        </RequireAuth>
      </div>
    </div>
  );
}

function PetsList() {
  const pets = usePets();
  const [editing, setEditing] = useState<PetDTO | null | undefined>(undefined);
  if (pets.isLoading) return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (pets.isError) return <ErrorState error={pets.error} onRetry={() => pets.refetch()} />;
  return (
    <div className="space-y-3">
      {pets.data!.length === 0 ? (
        <EmptyState icon={<PawPrint className="h-8 w-8" />} title="Cadastre seu primeiro pet" action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>Cadastrar pet</Button>}>
          Leva 1 minuto. Quem for cuidar dele vai saber a raça, o porte, as alergias e do que ele tem medo.
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-2">
            {pets.data!.map((p) => (
              <li key={p.id}>
                <button onClick={() => setEditing(p)} className="card flex w-full items-center gap-3 p-4 text-left transition hover:border-brand-200">
                  <PetAvatar pet={p} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold">{p.name}</span>
                    <span className="block text-sm text-muted">{petSummary(p)}</span>
                    {p.temperament.length > 0 && <span className="mt-1 block truncate text-xs text-accent-700">{p.temperament.join(' · ')}</span>}
                  </span>
                  <span className="text-sm font-semibold text-brand-fg">Editar</span>
                </button>
              </li>
            ))}
          </ul>
          <Button block variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>Adicionar outro pet</Button>
        </>
      )}
      <PetFormSheet pet={editing} onClose={() => setEditing(undefined)} />
    </div>
  );
}

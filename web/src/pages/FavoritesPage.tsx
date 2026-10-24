import { Heart } from 'lucide-react';
import { useFavorites } from '@/lib/queries';
import { BusinessCard } from '@/components/BusinessCard';
import { PageHeader } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { ButtonLink } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { FavoriteButton } from '@/components/FavoriteButton';

export function FavoritesPage() {
  return (
    <div>
      <PageHeader title="Favoritos" back={false} />
      <div className="container-app py-5">
        <RequireAuth title="Salve suas empresas favoritas" reason="Entre na sua conta para guardar empresas e encontrá-las rapidamente depois.">
          <FavoritesList />
        </RequireAuth>
      </div>
    </div>
  );
}

function FavoritesList() {
  const favs = useFavorites();
  if (favs.isLoading) return <div className="grid gap-3 lg:grid-cols-2">{[0, 1].map((i) => <CardSkeleton key={i} />)}</div>;
  if (favs.isError) return <ErrorState error={favs.error} onRetry={() => favs.refetch()} />;
  if (!favs.data?.length) {
    return (
      <EmptyState icon={<Heart className="h-8 w-8" />} title="Nenhuma empresa salva ainda" action={<ButtonLink to="/buscar">Buscar empresas</ButtonLink>}>
        Toque no coração na página de uma empresa para salvá-la aqui.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {favs.data.map((b) => (
        <li key={b.id} className="relative">
          <BusinessCard b={b} />
          <div className="absolute bottom-2 right-2"><FavoriteButton businessId={b.id} isFavorite name={b.name} /></div>
        </li>
      ))}
    </ul>
  );
}

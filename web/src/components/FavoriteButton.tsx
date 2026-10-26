import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToggleFavorite } from '@/lib/queries';
import { useToast } from './ui/Toast';

export function FavoriteButton({ businessId, isFavorite, name, variant = 'plain' }: { businessId: string; isFavorite: boolean; name: string; variant?: 'plain' | 'overlay' }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toggle = useToggleFavorite();
  const toast = useToast();
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      nav(`/entrar?voltar=${encodeURIComponent(loc.pathname + loc.search)}&motivo=favoritos`);
      return;
    }
    toggle.mutate(
      { id: businessId, favorite: !isFavorite },
      {
        onSuccess: () => toast(isFavorite ? 'Removida dos favoritos.' : 'Salva nos favoritos.'),
        onError: (err) => toast(err.message, 'error'),
      },
    );
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={toggle.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
        variant === 'overlay' ? 'bg-card/95 shadow-card hover:bg-card' : 'hover:bg-brand-50'
      }`}
    >
      <Heart className={`h-[22px] w-[22px] ${isFavorite ? 'text-danger-700' : 'text-ink'}`} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}

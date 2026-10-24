import type { ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ButtonLink } from './ui/Button';
import { EmptyState, PageLoader } from './ui/Feedback';

/** Mostra um convite para entrar em vez de bloquear a navegação. */
export function RequireAuth({ children, title, reason }: { children: ReactNode; title: string; reason: string }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    const back = encodeURIComponent(loc.pathname + loc.search);
    return (
      <EmptyState
        icon={<LogIn className="h-8 w-8" />}
        title={title}
        action={
          <>
            <ButtonLink to={`/entrar?voltar=${back}`}>Entrar</ButtonLink>
            <ButtonLink to={`/criar-conta?voltar=${back}`} variant="secondary">Criar conta grátis</ButtonLink>
          </>
        }
      >
        {reason}
      </EmptyState>
    );
  }
  return <>{children}</>;
}

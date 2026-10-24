import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { PageLoader } from './components/ui/Feedback';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { useScrollTop } from './hooks/useScrollTop';

// Telas menos acessadas são carregadas sob demanda (bom para celulares de entrada).
const BusinessPage = lazy(() => import('./pages/BusinessPage').then((m) => ({ default: m.BusinessPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })));
const QuotePage = lazy(() => import('./pages/QuotePage').then((m) => ({ default: m.QuotePage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })));
const ReviewFormPage = lazy(() => import('./pages/ReviewFormPage').then((m) => ({ default: m.ReviewFormPage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.EditProfilePage })));
const MyReviewsPage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.MyReviewsPage })));
const PrivacyPage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.PrivacyPage })));
const ForBusinessPage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.ForBusinessPage })));
const HowItWorksPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.HowItWorksPage })));
const TermsPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.TermsPage })));
const DeleteAccountInfoPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.DeleteAccountInfoPage })));
const NotFoundPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.NotFoundPage })));

export function App() {
  useScrollTop();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="categoria/:slug" element={<SearchPage />} />
          <Route path="empresa/:slug" element={<BusinessPage />} />
          <Route path="empresa/:slug/agendar" element={<BookingPage />} />
          <Route path="empresa/:slug/orcamento" element={<QuotePage />} />
          <Route path="favoritos" element={<FavoritesPage />} />
          <Route path="atividades" element={<ActivitiesPage />} />
          <Route path="avaliar/:type/:id" element={<ReviewFormPage />} />
          <Route path="entrar" element={<LoginPage />} />
          <Route path="criar-conta" element={<RegisterPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="perfil/dados" element={<EditProfilePage />} />
          <Route path="perfil/avaliacoes" element={<MyReviewsPage />} />
          <Route path="perfil/privacidade" element={<PrivacyPage />} />
          <Route path="para-empresas" element={<ForBusinessPage />} />
          <Route path="como-funciona" element={<HowItWorksPage />} />
          <Route path="termos" element={<TermsPage />} />
          <Route path="excluir-conta" element={<DeleteAccountInfoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

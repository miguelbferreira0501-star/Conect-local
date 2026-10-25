import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { PageLoader } from './components/ui/Feedback';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { useScrollTop } from './hooks/useScrollTop';
import { Navigate } from 'react-router-dom';

const panel = () => import('./pages/panel/PanelPages');
const PanelShell = lazy(() => import('./pages/panel/PanelLayout').then((m) => ({ default: m.PanelShell })));
const BusinessPanelLayout = lazy(() => import('./pages/panel/PanelLayout').then((m) => ({ default: m.BusinessPanelLayout })));
const PanelHomeRedirect = lazy(() => panel().then((m) => ({ default: m.PanelHomeRedirect })));
const CreateBusinessPage = lazy(() => panel().then((m) => ({ default: m.CreateBusinessPage })));
const PanelDashboard = lazy(() => panel().then((m) => ({ default: m.PanelDashboard })));
const PanelRequestsPage = lazy(() => panel().then((m) => ({ default: m.PanelRequestsPage })));
const PanelProfilePage = lazy(() => panel().then((m) => ({ default: m.PanelProfilePage })));
const PanelServicesPage = lazy(() => panel().then((m) => ({ default: m.PanelServicesPage })));
const PanelHoursPage = lazy(() => panel().then((m) => ({ default: m.PanelHoursPage })));
const PanelPhotosPage = lazy(() => panel().then((m) => ({ default: m.PanelPhotosPage })));
const PanelReviewsPage = lazy(() => panel().then((m) => ({ default: m.PanelReviewsPage })));
const panel2 = () => import('./pages/panel/PanelPages2');
const PanelStaffPage = lazy(() => panel2().then((m) => ({ default: m.PanelStaffPage })));
const PanelAgendaPage = lazy(() => panel2().then((m) => ({ default: m.PanelAgendaPage })));
const PanelAssistantPage = lazy(() => panel2().then((m) => ({ default: m.PanelAssistantPage })));
const PanelPlanPage = lazy(() => panel2().then((m) => ({ default: m.PanelPlanPage })));
const PanelPromotePage = lazy(() => import('./pages/panel/PanelPromote').then((m) => ({ default: m.PanelPromotePage })));
const AdminPage = lazy(() => import('./pages/panel/AdminPage').then((m) => ({ default: m.AdminPage })));

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
const HowItWorksPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.HowItWorksPage })));
const TermsPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.TermsPage })));
const DeleteAccountInfoPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.DeleteAccountInfoPage })));
const NotFoundPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.NotFoundPage })));

export function App() {
  useScrollTop();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Painel das empresas e administração: layout próprio, sem a navegação do cliente */}
        <Route path="empresas" element={<PanelShell />}>
          <Route index element={<PanelHomeRedirect />} />
          <Route path="nova" element={<CreateBusinessPage />} />
          <Route path=":businessId" element={<BusinessPanelLayout />}>
            <Route index element={<PanelDashboard />} />
            <Route path="pedidos" element={<PanelRequestsPage />} />
            <Route path="perfil" element={<PanelProfilePage />} />
            <Route path="servicos" element={<PanelServicesPage />} />
            <Route path="horarios" element={<PanelHoursPage />} />
            <Route path="fotos" element={<PanelPhotosPage />} />
            <Route path="avaliacoes" element={<PanelReviewsPage />} />
            <Route path="equipe" element={<PanelStaffPage />} />
            <Route path="agenda" element={<PanelAgendaPage />} />
            <Route path="assistente" element={<PanelAssistantPage />} />
            <Route path="divulgar" element={<PanelPromotePage />} />
            <Route path="plano" element={<PanelPlanPage />} />
          </Route>
        </Route>
        <Route path="admin" element={<PanelShell />}>
          <Route index element={<AdminPage />} />
        </Route>
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
          <Route path="para-empresas" element={<Navigate to="/empresas" replace />} />
          <Route path="como-funciona" element={<HowItWorksPage />} />
          <Route path="termos" element={<TermsPage />} />
          <Route path="excluir-conta" element={<DeleteAccountInfoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

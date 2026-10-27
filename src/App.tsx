import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/backend/lib/auth';
import { lazy, Suspense, type ReactNode } from 'react';
import { Loading } from '@/frontend/components/ui/Loading';

const PublicLayout = lazy(() => import('@/frontend/components/layout/PublicLayout'));
const HomePage = lazy(() => import('@/frontend/pages/HomePage'));
const CatalogPage = lazy(() => import('@/frontend/pages/CatalogPage'));
const ProductPage = lazy(() => import('@/frontend/pages/ProductPage'));
const QuotePage = lazy(() => import('@/frontend/pages/QuotePage'));
const AboutPage = lazy(() => import('@/frontend/pages/AboutPage'));
const SectorsPage = lazy(() => import('@/frontend/pages/SectorsPage'));
const ContactPage = lazy(() => import('@/frontend/pages/ContactPage'));
const PrivacyPage = lazy(() => import('@/frontend/pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('@/frontend/pages/NotFoundPage'));

const AdminLayout = lazy(() => import('@/admin/components/AdminLayout'));
const LoginPage = lazy(() => import('@/admin/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/admin/pages/DashboardPage'));
const AdminProductsPage = lazy(() => import('@/admin/pages/AdminProductsPage'));
const AdminQuotesPage = lazy(() => import('@/admin/pages/AdminQuotesPage'));
const AdminQuoteDetailPage = lazy(() => import('@/admin/pages/AdminQuoteDetailPage'));
const AdminQuoteFormPage = lazy(() => import('@/admin/pages/AdminQuoteFormPage'));
const AdminInventoryPage = lazy(() => import('@/admin/pages/AdminInventoryPage'));
const AdminSalesPage = lazy(() => import('@/admin/pages/AdminSalesPage'));
const AdminSaleDetailPage = lazy(() => import('@/admin/pages/AdminSaleDetailPage'));

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Loading fullScreen />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading fullScreen />}>
          <Routes>
            {/* Public */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <PublicLayout />
                </PublicRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="equipements" element={<CatalogPage />} />
              <Route path="equipements/:slug" element={<ProductPage />} />
              <Route path="demande-de-devis" element={<QuotePage />} />
              <Route path="a-propos" element={<AboutPage />} />
              <Route path="secteurs" element={<SectorsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="politique-de-confidentialite" element={<PrivacyPage />} />
            </Route>

            {/* Admin auth */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Admin protected */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="produits" element={<AdminProductsPage />} />
              <Route path="demandes" element={<AdminQuotesPage />} />
              <Route path="demandes/:id" element={<AdminQuoteDetailPage />} />
              <Route path="devis" element={<AdminQuoteFormPage />} />
              <Route path="stock" element={<AdminInventoryPage />} />
              <Route path="ventes" element={<AdminSalesPage />} />
              <Route path="ventes/:id" element={<AdminSaleDetailPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

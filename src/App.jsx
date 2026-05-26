import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import MobileNav from '@/components/MobileNav';
import Header from '@/components/Header';
import { Command as KyroRune } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { useData } from '@/contexts/DataContext';

import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
// const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
// const Leads = React.lazy(() => import('@/pages/Leads'));
const Deals = React.lazy(() => import('@/pages/Deals'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const ClientOnboarding = React.lazy(() => import('@/pages/ClientOnboarding'));
const Clients = React.lazy(() => import('@/pages/Clients'));
const Logistics = React.lazy(() => import('@/pages/Logistics'));
const ToDo = React.lazy(() => import('@/pages/ToDo'));
const Directory = React.lazy(() => import('@/pages/Directory'));
const News = React.lazy(() => import('@/pages/News'));
const Search = React.lazy(() => import('@/pages/Search'));
const Login = React.lazy(() => import('@/pages/Login'));
const SignUp = React.lazy(() => import('@/pages/SignUp'));
const ContactsPage = React.lazy(() => import('@/pages/Contacts'));
const SystemSettings = React.lazy(() => import('@/pages/SystemSettings'));

const Fallback = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[9999]" style={{ backgroundColor: '#000' }}>
    <div className="flex flex-col items-center gap-4">
      <KyroRune className="w-12 h-12 text-primary animate-spin" />
      <p className="text-primary font-bold tracking-widest uppercase text-[10px] animate-pulse">
        Iniciando KYRO Nova
      </p>
    </div>
  </div>
);

const ViewFallback = () => (
  <div className="flex-1 flex items-center justify-center h-full min-h-[200px]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Fallback />;
  }

  // Bypass Auth: Always return children
  return children;
};
const AppContent = () => {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const { loading: dataLoading } = useData();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    // Reducimos el tiempo de splash screen para una carga más rápida
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 500); // Antes era 1000
    return () => clearTimeout(timer);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const hasCache = !!localStorage.getItem(`kyro-leads-${user?.id}`);
  const isLoading = dataLoading && !hasCache && showSplash;

  if (isLoading) {
    return <Fallback />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground transition-colors duration-300 overflow-hidden select-none">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 md:pl-20 overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-0">
          <Suspense fallback={<ViewFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="deals" element={<Deals />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="onboarding" element={<ClientOnboarding />} />
              <Route path="clients" element={<Clients />} />
              <Route path="logistics" element={<Logistics />} />
              <Route path="industrial-logistics" element={<Logistics />} />
              <Route path="todo" element={<ToDo />} />
              <Route path="directory" element={<Directory />} />
              <Route path="news" element={<News />} />
              <Route path="search" element={<Search />} />
              <Route path="system-settings" element={<SystemSettings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <MobileNav className="md:hidden" />
    </div>
  );
};

function App() {
  const { user, loading: authLoading } = useAuth();

  return (
    <ThemeProvider>
      <Router>
        <Helmet>
          <title>KYRO - CRM Revolucionario</title>
          <meta name="description" content="KYRO: Un CRM radicalmente más simple y potente que Salesforce, diseñado para la claridad y la eficiencia." />
        </Helmet>
        <Suspense fallback={<Fallback />}>
          <SidebarProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/*"
                element={
                  authLoading ? (
                    <Fallback />
                  ) : user ? (
                    <AppContent />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </SidebarProvider>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
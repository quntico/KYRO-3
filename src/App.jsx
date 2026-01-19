import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import MobileNav from '@/components/MobileNav';
import Header from '@/components/Header';
import { Command as KyroRune } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { DataProvider } from '@/contexts/DataContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Leads = React.lazy(() => import('@/pages/Leads'));
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

const Fallback = () => (
  <div className="flex items-center justify-center w-full h-full bg-background">
    <KyroRune className="w-16 h-16 animate-spin text-primary" />
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

  const routes = (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/deals" element={<Deals />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/client-onboarding" element={<ClientOnboarding />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/logistics" element={<Logistics />} />
      <Route path="/todo" element={<ToDo />} />
      <Route path="/directory" element={<Directory />} />
      <Route path="/news" element={<News />} />
      <Route path="/search" element={<Search />} />
    </Routes>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 md:ml-20 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-16 md:pb-0">
          <Suspense fallback={<Fallback />}>
            {routes}
          </Suspense>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

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
              {/* Bypass Auth: Access AppContent if not loading, or redirect if no user (but we mock user now) */}
              <Route path="/*" element={
                loading ? <Fallback /> : <AppContent />
              } />
            </Routes>
          </SidebarProvider>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  HeartHandshake as Handshake,
  BarChart2,
  Settings,
  Command as KyroRune,
  ListChecks,
  BookUser,
  UserPlus,
  Ship,
  Newspaper,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Target, label: 'Prospectos' },
  { to: '/deals', icon: Handshake, label: 'Ventas' },
  { to: '/clients', icon: UserPlus, label: 'Clientes' },
  { to: '/client-onboarding', icon: UserPlus, label: 'Alta' },
  { to: '/logistics', icon: Ship, label: 'Logística' },
  { to: '/todo', icon: ListChecks, label: 'To Do' },
  { to: '/directory', icon: BookUser, label: 'Directorio' },
  { to: '/news', icon: Newspaper, label: 'Noticias' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const NavItem = ({ to, icon: Icon, label, isCollapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    title={isCollapsed ? label : ""}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group ${isActive
        ? 'bg-primary/10 text-primary shadow-inner'
        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
      } ${isCollapsed ? 'justify-center' : ''} ${window.document.documentElement.classList.contains('nova') ? 'hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]' : ''}`
    }
  >
    <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0" />
    <AnimatePresence>
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="font-medium overflow-hidden whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </NavLink>
);

const Sidebar = () => {
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      if (isMobileOpen) toggleMobileSidebar();
      navigate('/login');
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente.',
      });
    }
  };

  const handleItemClick = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  }

  return (
    <>
      {!isMobile && (
        <motion.aside
          className="hidden md:flex flex-col bg-white/[0.04] backdrop-blur-[40px] border-r border-white/30 h-screen fixed left-0 top-0 z-50 shadow-[15px_0_50px_rgba(0,0,0,0.7),inset_0_0_25px_rgba(255,255,255,0.05)]"
          style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}
          animate={{
            width: isCollapsed ? '5rem' : '16rem',
            backgroundColor: isCollapsed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)'
          }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className={`flex items-center h-16 border-b border-white/20 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-center'} relative bg-white/[0.03]`}>
            <KyroRune className={`w-8 h-8 text-primary transition-all duration-300 drop-shadow-[0_0_15px_rgba(var(--primary),0.7)]`} />

            <button
              onClick={() => toggleSidebar()}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 bg-white/10 backdrop-blur-3xl border border-white/40 p-1.5 text-primary hover:text-white rounded-full flex items-center justify-center transition-all hover:scale-125 hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              title={isCollapsed ? "Expandir" : "Contraer"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center ml-3"
                >
                  <span className="text-2xl font-bold text-white tracking-[0.25em] uppercase whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter brightness-110">
                    KYRO
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <nav className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide py-8">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
            ))}
          </nav>
          <div className="p-3 border-t border-white/20 bg-white/[0.03] mb-4">
            <NavItem to="/settings" icon={Settings} label="Ajustes" isCollapsed={isCollapsed} />
            <button
              onClick={handleSignOut}
              title={isCollapsed ? "Cerrar Sesión" : ""}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full mt-2 text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-bold overflow-hidden whitespace-nowrap text-[10px] tracking-[0.2em] uppercase"
                  >
                    Cerrar Sesión
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.aside>
      )}

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={toggleMobileSidebar}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-center h-16 border-b border-border px-4">
                <KyroRune className={`w-8 h-8 text-primary`} />
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                  <NavItem key={item.to} {...item} isCollapsed={false} onClick={handleItemClick} />
                ))}
              </nav>
              <div className="p-4 border-t border-border">
                <NavItem to="/settings" icon={Settings} label="Ajustes" isCollapsed={false} onClick={handleItemClick} />
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group w-full mt-2 text-red-500 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
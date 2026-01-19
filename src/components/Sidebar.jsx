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
  LogOut
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
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
        ? 'bg-primary/10 text-primary shadow-inner'
        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
      } ${isCollapsed ? 'justify-center' : ''}`
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
  const { isCollapsed, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      <motion.aside
        className="hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0"
        animate={{ width: isCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className={`flex items-center h-16 border-b border-border transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-center'}`}>
          <KyroRune className={`w-8 h-8 text-primary transition-all duration-300`} />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="flex items-center ml-3"
              >
                <span className="text-2xl font-bold text-foreground whitespace-nowrap">
                  KYRO
                </span>
                <div className="ml-2 flex items-center bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),1)] mr-1.5" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    ver. 2.35
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <NavItem to="/settings" icon={Settings} label="Ajustes" isCollapsed={isCollapsed} />
          <button
            onClick={handleSignOut}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group w-full mt-2 text-red-500 hover:bg-red-500/10 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium overflow-hidden whitespace-nowrap"
                >
                  Cerrar Sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

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
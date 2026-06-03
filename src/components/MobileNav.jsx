import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, HeartHandshake as Handshake, ListChecks, BookUser, MoreHorizontal, BarChart2, Settings, UserPlus, Ship, Newspaper, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tablero' },
  { to: '/leads', icon: Target, label: 'Prospectos' },
  { to: '/deals', icon: Handshake, label: 'Ventas' },
  { to: '/news', icon: Newspaper, label: 'Noticias' },
];

const moreNavItems = [
  { to: '/todo', icon: ListChecks, label: 'Tareas' },
  { to: '/directory', icon: BookUser, label: 'Directorio' },
  { to: '/clients', icon: UserPlus, label: 'Clientes' },
  { to: '/client-onboarding', icon: UserPlus, label: 'Alta' },
  { to: '/logistics', icon: Ship, label: 'Logística' },
  { to: '/analytics', icon: BarChart2, label: 'Analíticas' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

const NavItem = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-all duration-300 group ${isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary'
        }`
      }
    >
      <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300 mb-0.5 ${location.pathname === to ? 'bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-white/5 group-hover:bg-white/10'
        }`}>
        <Icon className={`w-5 h-5 transition-transform duration-300 ${location.pathname === to ? 'scale-110' : 'group-hover:scale-110'}`} />
      </div>
      <span className="truncate uppercase tracking-tighter">{label}</span>
    </NavLink>
  );
};

const MobileNav = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    setPopoverOpen(false);
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/login');
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente.',
      });
    }
  };

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <nav className="mx-auto max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-2 py-1">
        <div className="grid grid-cols-5 gap-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex flex-col items-center justify-center py-2 text-[10px] font-bold text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 mb-0.5">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <span className="truncate">MÁS</span>
              </div>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-56 p-2 mb-4 bg-white/[0.05] backdrop-blur-3xl border border-white/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(255,255,255,0.05)] animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 gap-1">
                {moreNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setPopoverOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-3 rounded-xl text-sm transition-all ${isActive
                        ? 'bg-primary/20 text-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.1)]'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-primary'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </NavLink>
                ))}
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 p-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </nav>
    </div>
  );
};

export default MobileNav;
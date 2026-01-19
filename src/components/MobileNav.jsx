import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, HeartHandshake as Handshake, ListChecks, BookUser, MoreHorizontal, BarChart2, Settings, UserPlus, Ship, Newspaper, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Target, label: 'Prospectos' },
  { to: '/deals', icon: Handshake, label: 'Ventas' },
  { to: '/news', icon: Newspaper, label: 'Noticias' },
];

const moreNavItems = [
  { to: '/todo', icon: ListChecks, label: 'To Do' },
  { to: '/directory', icon: BookUser, label: 'Directorio' },
  { to: '/clients', icon: UserPlus, label: 'Clientes' },
  { to: '/client-onboarding', icon: UserPlus, label: 'Alta' },
  { to: '/logistics', icon: Ship, label: 'Logística' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors group ${
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary'
      }`
    }
  >
    <Icon className="w-5 h-5 mb-1" />
    <span className="truncate">{label}</span>
  </NavLink>
);

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <nav className="grid grid-cols-5">
        {mainNavItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="flex flex-col items-center justify-center py-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <MoreHorizontal className="w-5 h-5 mb-1" />
              <span className="truncate">Más</span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 mb-2 bg-card/80 backdrop-blur-lg border-white/10">
            <div className="grid grid-cols-1 gap-1">
              {moreNavItems.map((item) => (
                 <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setPopoverOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 p-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 p-2 rounded-md text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </div>
  );
};

export default MobileNav;
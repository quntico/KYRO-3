import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Settings, PanelLeft, BrainCircuit, Palette, ChevronDown, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/contexts/SidebarContext';
const AISandbox = React.lazy(() => import('./ai/AISandbox'));
import { useTheme } from '@/contexts/ThemeContext.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const Header = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const onLeads = location.pathname.replace(/\/$/, '') === '/leads';
  const searchTerm = onLeads ? searchParams.get('q') || '' : '';
  const searchProspects = value => {
    if (!onLeads) { navigate(`/leads${value ? `?q=${encodeURIComponent(value)}` : ''}`); return; }
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set('q', value); else next.delete('q');
      return next;
    }, {replace: true});
  };
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxLoaded, setSandboxLoaded] = useState(false);
  const openSandbox = () => { setSandboxLoaded(true); setSandboxOpen(true); };
  const navigate = useNavigate();
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, changeTheme } = useTheme();

  const themeLabels = {
    recilogic: 'Recilogic (Claro)',
    nova: 'Nova (Oscuro)',
    futuristic: 'Futurista',
    play: 'Modo Play',
    dark: 'Oscuro',
    light: 'Claro'
  };

  return (
    <header className="sticky top-0 z-40 flex shrink-0 flex-wrap items-center gap-2 border-b border-border/50 bg-background/95 px-3 py-2 backdrop-blur-xl sm:flex-nowrap sm:gap-3 md:px-4">
      <button aria-label="Abrir o cerrar menú" onClick={() => window.innerWidth < 768 ? toggleMobileSidebar() : toggleSidebar()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary">
        <PanelLeft className="h-5 w-5" />
      </button>
      <form role="search" aria-label="Buscar prospectos" onSubmit={event => {event.preventDefault(); if (!onLeads) searchProspects(searchTerm);}} className="relative order-last w-full sm:order-none sm:min-w-0 sm:flex-1 sm:max-w-3xl">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input type="search" aria-label="Buscar vectores o prospectos" placeholder="Buscar Vectores / Prospectos…" value={searchTerm} onChange={event => searchProspects(event.target.value)} className="h-11 w-full rounded-xl border-primary/20 bg-secondary/40 pl-10 pr-10 text-sm focus:border-primary/60 [&::-webkit-search-cancel-button]:appearance-none" />
        {searchTerm && <button type="button" aria-label="Limpiar búsqueda" onClick={() => searchProspects('')} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><X className="h-4 w-4" /></button>}
      </form>
      <button type="button" onClick={openSandbox} aria-label="Abrir orquestador de IA" title="Orquestador de IA" className="ml-auto flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-secondary/20 px-3 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"><BrainCircuit className="h-4 w-4" /><span>IA</span></button>
      {sandboxLoaded && <React.Suspense fallback={<div role="status" className="fixed bottom-5 right-5 rounded-xl border border-primary/30 bg-card p-4">Abriendo asistente…</div>}>
      <AISandbox 
        open={sandboxOpen} 
        onOpenChange={setSandboxOpen} 
        initialPrompt=""
      />
      </React.Suspense>}
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden lg:inline text-[10px] font-mono font-bold text-muted-foreground/40 select-none">v6.0</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Elegir paleta de colores" className="flex items-center space-x-2 px-3 py-1 bg-secondary/40 border border-border hover:bg-secondary rounded-full cursor-pointer select-none active:scale-95 transition-all text-[10px] font-black uppercase tracking-tighter text-foreground h-11">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">{themeLabels[theme] || theme}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border border-border text-popover-foreground z-50 text-[10px] font-black uppercase tracking-widest rounded-xl p-1 min-w-[150px]">
            <div className="px-2.5 py-1.5 text-[8px] font-black tracking-widest text-muted-foreground/60 border-b border-border mb-1">
              Seleccionar Tema
            </div>
            {Object.entries(themeLabels).map(([key, label]) => (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                checked={theme === key}
                onClick={() => changeTheme(key)}
                className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-secondary rounded-lg m-0.5"
              >
                <span>{label}</span>
                {theme === key && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-2" />}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          aria-label="Ajustes del sistema"
          onClick={() => navigate('/system-settings')}
          className="flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer select-none active:scale-95 transition-all hover:bg-cyan-500/20 h-11"
          title="Ajustes del Sistema"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-led-blink shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <Settings aria-hidden="true" className="h-4 w-4 text-cyan-400 lg:hidden" /><span className="hidden lg:inline text-[10px] font-black text-cyan-400 uppercase tracking-tighter whitespace-nowrap">
            Ajustes del Sistema
          </span>
        </button>
      </div>


    </header>
  );
};

export default Header;

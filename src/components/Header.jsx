import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Bot, Sparkles, PanelLeft, Command as KyroRune, BrainCircuit, Terminal, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { useSidebar } from '@/contexts/SidebarContext';
import AISandbox from './ai/AISandbox';


const SearchEngineSelector = () => {
  const { toast } = useToast();
  const engines = [
    { name: 'GPT', icon: Sparkles },
    { name: 'Gemini', icon: Sparkles },
    { name: 'DeepSeek', icon: Bot },
  ];

  const handleSelection = () => {
    toast({
      title: 'Próximamente 🚀',
      description: 'La integración con motores de IA estará disponible pronto.',
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
          <Settings className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 bg-card/80 backdrop-blur-lg border-white/10">
        <div className="p-2">
          <p className="text-sm font-medium text-foreground mb-2">Motor de Búsqueda</p>
          <div className="space-y-1">
            {engines.map(engine => (
              <button
                key={engine.name}
                onClick={handleSelection}
                className="w-full flex items-center space-x-2 p-2 rounded-md text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <engine.icon className="w-4 h-4" />
                <span>{engine.name}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const navigate = useNavigate();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setInitialPrompt(searchTerm);
      setSandboxOpen(true);
      setSearchTerm('');
    }
  };

  return (
    <header className={`sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-background/60 backdrop-blur-xl px-4 md:pl-20 md:pr-8 transition-all duration-400`}>
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="hidden md:block p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors">
          <PanelLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center">
        <button onClick={toggleMobileSidebar} className="p-2 text-primary hover:scale-110 transition-transform">
          <KyroRune className="h-7 w-7 drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
        </button>
      </div>

      <div className="w-full max-w-lg hidden md:flex justify-center">
        <form onSubmit={handleSearch} className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary animate-pulse" />
              <div className="w-[1px] h-4 bg-white/10" />
            </div>
            <Input
              type="text"
              placeholder="Orquestador de Estrategia AI... (kW, costos, agenda)"
              className="w-full appearance-none bg-white/5 border-white/10 pl-12 pr-12 focus:bg-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all rounded-2xl h-11 text-sm placeholder:text-muted-foreground/50 cursor-pointer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={() => setSandboxOpen(true)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <div className="text-[9px] font-black text-muted-foreground/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tighter">Modo IA</div>
               <SearchEngineSelector />
            </div>
          </motion.div>
        </form>
      </div>

      <AISandbox 
        open={sandboxOpen} 
        onOpenChange={setSandboxOpen} 
        initialPrompt={initialPrompt} 
      />
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono font-bold text-muted-foreground/40 select-none">v5.5</span>
        <button
          onClick={() => navigate('/system-settings')}
          className="flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer select-none active:scale-95 transition-all hover:bg-cyan-500/20"
          title="Ajustes del Sistema"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-led-blink shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter whitespace-nowrap">
            Ajustes del Sistema
          </span>
        </button>
      </div>


    </header>
  );
};

export default Header;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Settings, BrainCircuit, Bot, Sparkles, PanelLeft, Command as KyroRune } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { useSidebar } from '@/contexts/SidebarContext';

const SearchEngineSelector = () => {
  const { toast } = useToast();
  const engines = [
    { name: 'GPT', icon: BrainCircuit },
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
  const navigate = useNavigate();
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-lg px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="hidden md:block p-2 -ml-2 text-muted-foreground hover:text-primary">
          <PanelLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="md:hidden flex-1 flex justify-center">
        <button onClick={toggleMobileSidebar} className="p-2 text-muted-foreground hover:text-primary">
          <KyroRune className="h-8 w-8 text-primary" />
        </button>
      </div>

      <div className="w-full max-w-lg hidden md:flex justify-center">
        <form onSubmit={handleSearch} className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Busca en la web sin distracciones..."
              className="w-full appearance-none bg-transparent pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <SearchEngineSelector />
            </div>
          </motion.div>
        </form>
      </div>
      <div className="flex items-center">
        <div className="flex items-center space-x-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)] animate-in fade-in zoom-in duration-500">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),1)]" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">
            ver. 2.35
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
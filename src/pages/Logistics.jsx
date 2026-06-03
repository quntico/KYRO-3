import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Search,
  Plus,
  Navigation,
  Package,
  Anchor,
  ShieldCheck,
  Home,
  Factory,
  Calendar,
  MapPin,
  MoreHorizontal,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useData } from '@/contexts/DataContext';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import LogisticsStatusDialog from '@/components/logistics/LogisticsStatusDialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const stages = [
  { id: 'china', label: 'China', icon: Factory, color: 'text-blue-400', glow: 'shadow-blue-500/20' },
  { id: 'maritime', label: 'Marítimo', icon: Anchor, color: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  { id: 'customs', label: 'Aduanas', icon: ShieldCheck, color: 'text-purple-400', glow: 'shadow-purple-500/20' },
  { id: 'land', label: 'Terrestre', icon: Truck, color: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  { id: 'delivery', label: 'Entrega', icon: Home, color: 'text-green-400', glow: 'shadow-green-500/20' },
];

const LogisticsCard = ({ entry, index, onUpdateStatus }) => {
  const { theme } = useTheme();
  const currentStageIndex = stages.findIndex(s => s.id === (entry.current_stage || 'china'));

  const cardBgClass = theme === 'futuristic'
    ? 'bg-background/40 backdrop-blur-xl border border-primary/20 shadow-2xl'
    : 'bg-card border border-border';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-[2rem] p-6 flex flex-col ${cardBgClass} group overflow-hidden relative`}
    >
      {/* Glow Effect */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-primary" />
              <h3 className={`text-xl font-black tracking-tight ${theme === 'futuristic' ? 'text-glow-sm' : ''}`}>
                {entry.machine_name?.toUpperCase() || 'MAQUINARIA'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{entry.client_name || 'Cliente Genérico'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10 text-primary"
            onClick={() => onUpdateStatus(entry)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Improved Vertical Progress */}
        <div className="flex justify-between items-start mb-8 relative px-2">
          <div className="absolute left-4 right-4 h-1 bg-border/30 top-[1.4rem] -z-10 rounded-full" />
          <div
            className="absolute left-4 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-primary top-[1.4rem] -z-10 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 90}%` }}
          />

          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center gap-2">
                <div className={`
                            w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500
                            ${isActive ? `bg-primary text-white scale-125 shadow-lg shadow-primary/40` :
                    isCompleted ? 'bg-primary/20 text-primary' : 'bg-secondary/50 text-muted-foreground'}
                        `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> SEGUIMIENTO
            </span>
            <p className="text-sm font-mono font-bold truncate">{entry.tracking_number || 'S/N'}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" /> ETA
            </span>
            <p className="text-sm font-bold">
              {entry.estimated_delivery ? format(parseISO(entry.estimated_delivery), 'dd MMM yyyy', { locale: es }) : 'POR DEFINIR'}
            </p>
          </div>
        </div>

        {entry.notes && (
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{entry.notes}</p>
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-6">
          <Button
            onClick={() => onUpdateStatus(entry)}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold uppercase text-xs tracking-widest py-6"
          >
            Actualizar Tracking
          </Button>
        </div>
      )}
    </motion.div>
  );
};

const Logistics = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { logistics, deals, loading, updateLogistics, addLogistics } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingLog, setViewingLog] = useState(null);

  const filteredEntries = useMemo(() => {
    if (!Array.isArray(logistics)) return [];
    return logistics.filter(entry =>
      (entry.machine_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.tracking_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logistics, searchTerm]);

  const handleCreateFromDeal = async () => {
    // Buscar deals ganados que no tengan logística
    const wonDeals = deals.filter(d => (d.stage === 'closed-won' || d.stage === 'Anticipo Recibido'));
    const existingDealsIds = logistics.map(l => l.deal_id);
    const dealsToConvert = wonDeals.filter(d => !existingDealsIds.includes(d.id));

    if (dealsToConvert.length === 0) {
      toast({ title: "Sin nuevas ventas", description: "No hay ventas ganadas pendientes de logística." });
      return;
    }

    const newLogEntries = dealsToConvert.map(deal => ({
      user_id: user.id,
      deal_id: deal.id,
      client_name: deal.client,
      machine_name: deal.title,
      current_stage: 'china',
      last_updated: new Date().toISOString()
    }));

    const { data, error } = await supabase.from('logistics').insert(newLogEntries).select();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      data.forEach(log => addLogistics(log));
      toast({ title: "¡Logística Generada!", description: `Se han creado ${data.length} nuevos seguimientos.` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Navigation className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background text-foreground transition-colors duration-500">
      <Helmet>
        <title>Logística Industrial - KYRO</title>
      </Helmet>

      <header className="p-6 md:p-10 border-b border-white/5 relative bg-background/50 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="p-3 rounded-2xl bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className={`text-4xl font-black italic tracking-tighter ${theme === 'futuristic' ? 'text-glow' : ''}`}>
                  LOGÍSTICA <span className="text-primary not-italic">GLOBAL</span>
                </h1>
                <p className="text-muted-foreground font-medium uppercase text-xs tracking-[0.3em]">Gestión Inteligente de la Cadena de Suministro</p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por equipo o tracking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 rounded-2xl bg-secondary/30 border-primary/10 border-none focus-visible:ring-primary/30"
              />
            </div>
            <Button
              onClick={handleCreateFromDeal}
              className="py-6 px-6 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest button-glow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Sincronizar Ventas
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        <div className="max-w-7xl mx-auto">
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEntries.map((entry, index) => (
                <LogisticsCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onUpdateStatus={setViewingLog}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 opacity-50">
              <Factory className="w-32 h-32 mb-8 text-muted-foreground" />
              <h2 className="text-2xl font-black uppercase tracking-widest text-muted-foreground">Puerto Vacío</h2>
              <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest">No hay maquinaria en tránsito actualmente</p>
            </div>
          )}
        </div>
      </div>

      <LogisticsStatusDialog
        isOpen={!!viewingLog}
        onOpenChange={(open) => !open && setViewingLog(null)}
        entry={viewingLog}
        onUpdate={updateLogistics}
      />
    </div>
  );
};

export default Logistics;
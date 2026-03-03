import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Filter, CheckCircle, XCircle, ArrowRight, Target, Sparkles, UserCheck, Mail, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';

const ClientOnboarding = () => {
  const { theme } = useTheme();
  const { leads, loading, updateLead } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'onboarded', 'pending'
  const [loadingId, setLoadingId] = useState(null);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    return leads.filter(lead => {
      const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.contact?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const isOnboarded = lead.onboarded || lead.status === 'onboarded';
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'onboarded' && isOnboarded) ||
        (filterStatus === 'pending' && !isOnboarded);

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, filterStatus]);

  const handleOnboardClient = async (lead) => {
    setLoadingId(lead.id);

    // Intentamos actualizar con un campo genérico o status
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        status: 'onboarded',
        last_activity: new Date().toISOString()
      })
      .eq('id', lead.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al convertir", description: error.message, variant: "destructive" });
    } else {
      updateLead(updatedLead);
      toast({
        title: "🚀 ¡Onboarding Completado!",
        description: `"${lead.name}" ha sido convertido con éxito.`,
      });
    }
    setLoadingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Target className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  const cardBgClass = theme === 'futuristic'
    ? 'bg-background/40 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
    : 'bg-card border border-border shadow-sm';

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground transition-colors duration-500">
      <Helmet>
        <title>Onboarding - KYRO</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <h1 className={`text-4xl font-black tracking-tight ${theme === 'futuristic' ? 'text-glow' : ''}`}>
                  ONBOARDING <span className="text-primary italic">PRIME</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">Impulsa tus prospectos a la fase de clientes activos con un solo click.</p>
            </div>

            <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-primary/10'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-primary/10'}`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilterStatus('onboarded')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'onboarded' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-primary/10'}`}
              >
                Completados
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Buscar por empresa, contacto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-6 text-lg border-input rounded-2xl focus:ring-4 focus:ring-primary/20 bg-background/50 backdrop-blur-sm"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredLeads.map((lead, index) => {
              const isOnboarded = lead.onboarded || lead.status === 'onboarded';
              return (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`${cardBgClass} rounded-3xl p-6 flex flex-col group relative overflow-hidden`}
                >
                  {/* Decorative Background Element */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700" />

                  <div className="flex-grow relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-1 leading-tight ${theme === 'futuristic' ? 'text-glow-sm' : ''}`}>{lead.name}</h3>
                        <div className="flex items-center text-sm text-primary font-medium">
                          <Globe className="w-3 h-3 mr-1" />
                          {lead.source || 'Directo'}
                        </div>
                      </div>
                      {isOnboarded ? (
                        <div className="bg-green-500/10 text-green-500 p-2 rounded-full">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 text-amber-500 p-2 rounded-full animate-pulse">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors group/text">
                        <div className="p-1.5 rounded-lg bg-secondary/50 mr-3 group-hover/text:bg-primary/10 transition-all">
                          <UserCheck className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{lead.contact}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors group/text">
                        <div className="p-1.5 rounded-lg bg-secondary/50 mr-3 group-hover/text:bg-primary/10 transition-all">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm truncate font-mono">{lead.email}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors group/text">
                        <div className="p-1.5 rounded-lg bg-secondary/50 mr-3 group-hover/text:bg-primary/10 transition-all">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-mono">{lead.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto relative z-10">
                    {isOnboarded ? (
                      <div className="w-full py-3 rounded-2xl bg-green-500/5 border border-green-500/20 text-green-500 text-center font-bold flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        FINALIZADO
                      </div>
                    ) : (
                      <Button
                        disabled={loadingId === lead.id}
                        className={`w-full py-6 rounded-2xl text-lg font-bold group/btn flex items-center justify-center gap-2 overflow-hidden relative ${theme === 'futuristic'
                            ? 'button-glow bg-gradient-to-r from-primary to-accent text-white border-none'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                          }`}
                        onClick={() => handleOnboardClient(lead)}
                      >
                        {loadingId === lead.id ? (
                          <Target className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            ONBOARD AHORA
                            <ArrowRight className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredLeads.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Sin resultados para tu búsqueda</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchTerm ? 'Prueba con términos diferentes o revisa los filtros aplicados.' : 'Todos los prospectos actuales ya han completado su proceso.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClientOnboarding;
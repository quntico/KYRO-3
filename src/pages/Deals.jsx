import React, { useState, useMemo, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Plus, Filter, FolderKanban, Target } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import ViewDealDialog from '@/components/deals/ViewDealDialog';
    import ClientFileViewerDialog from '@/components/deals/ClientFileViewerDialog';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const stages = [
      { id: 'discovery', name: 'Descubrimiento', color: 'bg-yellow-500' },
      { id: 'qualification', name: 'Calificación', color: 'bg-orange-500' },
      { id: 'proposal', name: 'Propuesta', color: 'bg-blue-500' },
      { id: 'negotiation', name: 'Negociación', color: 'bg-purple-500' },
      { id: 'closed-won', name: 'Ganada', color: 'bg-green-500' },
      { id: 'closed-lost', name: 'Perdida', color: 'bg-red-500' },
    ];

    const DealCard = ({ deal, index, onView, onViewFile }) => {
      const { theme } = useTheme();
      const stageInfo = stages.find(s => s.id === deal.stage);
      const cardBgClass = theme === 'futuristic' ? 'bg-background/70 backdrop-blur-sm border border-primary/20' : 'bg-card';
      
      return (
        <motion.div
          layout
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`rounded-xl p-4 shadow-md flex flex-col justify-between ${cardBgClass}`}
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold ${theme === 'futuristic' ? 'text-glow' : 'text-foreground'}`}>{deal.title}</h3>
              <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${stageInfo?.color || 'bg-gray-500'}`}>
                {stageInfo?.name || 'Desconocido'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{deal.client}</p>
            <p className="text-sm text-muted-foreground mb-4">{deal.contact}</p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-lg font-bold text-primary">${(deal.value || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Cierre: {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : 'N/A'}</p>
            </div>
             <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onViewFile} className="flex items-center gap-1">
                <FolderKanban className="w-4 h-4" />
                Expediente
              </Button>
              <Button variant="ghost" size="sm" onClick={onView}>
                Ver más
              </Button>
            </div>
          </div>
        </motion.div>
      );
    };

    const Deals = () => {
      const { theme } = useTheme();
      const { user } = useAuth();
      const [deals, setDeals] = useState([]);
      const [loading, setLoading] = useState(true);
      const [viewingDeal, setViewingDeal] = useState(null);
      const [viewingClientFile, setViewingClientFile] = useState(null);
      const navigate = useNavigate();

      useEffect(() => {
        const fetchDeals = async () => {
          if (!user) return;
          setLoading(true);
          const { data, error } = await supabase.from('deals').select('*').eq('user_id', user.id);
          if (error) {
            toast({ title: "Error al cargar ventas", description: error.message, variant: 'destructive' });
          } else {
            setDeals(data || []);
          }
          setLoading(false);
        };
        fetchDeals();
      }, [user]);

      const updateDealsList = useCallback((updatedDeal) => {
        setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
      }, []);

      const removeDealFromList = useCallback((dealId) => {
        setDeals(prev => prev.filter(d => d.id !== dealId));
      }, []);

      const dealsByStage = useMemo(() => {
        return stages.reduce((acc, stage) => {
          acc[stage.id] = (deals || []).filter(deal => deal.stage === stage.id).sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
          return acc;
        }, {});
      }, [deals]);

      const totalValueByStage = useMemo(() => {
        return stages.reduce((acc, stage) => {
          acc[stage.id] = (deals || [])
            .filter(deal => deal.stage === stage.id)
            .reduce((sum, deal) => sum + Number(deal.value || 0), 0);
          return acc;
        }, {});
      }, [deals]);
      
      const handleRevertToLead = useCallback(async (dealToRevert) => {
        const newLead = {
          user_id: dealToRevert.user_id,
          name: dealToRevert.client,
          contact: dealToRevert.contact,
          email: dealToRevert.contact_email, 
          phone: dealToRevert.contact_phone,
          status: 'warm', 
          score: 70,
          source: 'Reverted from Deal',
          machines: dealToRevert.machines || [],
          quotations: dealToRevert.quotations || [],
          last_activity: new Date().toISOString(),
          notes: `Revertido desde venta: ${dealToRevert.title}. Valor original: $${dealToRevert.value}. ${dealToRevert.description || ''}`,
          next_step: { type: 'Re-contactar', date: null },
          activity_status: {},
        };

        const { error: leadError } = await supabase.from('leads').insert(newLead);
        if (leadError) {
          toast({ title: "Error al revertir a prospecto", description: leadError.message, variant: "destructive" });
          return;
        }

        const { error: deleteError } = await supabase.from('deals').delete().eq('id', dealToRevert.id);
        if (deleteError) {
          toast({ title: "Error al eliminar venta", description: `La venta fue revertida pero no se pudo eliminar. ${deleteError.message}`, variant: "destructive" });
        } else {
          removeDealFromList(dealToRevert.id);
          setViewingDeal(null);
          toast({
            title: "¡Venta revertida a Prospecto!",
            description: `"${dealToRevert.client}" ha vuelto a tu lista de prospectos.`,
          });
          navigate('/leads');
        }
      }, [user, removeDealFromList, navigate]);
      
      if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Target className="w-16 h-16 text-primary animate-spin" />
            </div>
        );
      }

      const headerBgClass = theme === 'futuristic' ? 'bg-background/80 backdrop-blur-md' : 'bg-background';

      return (
        <div className="h-full flex flex-col overflow-hidden bg-background text-foreground">
          <Helmet>
            <title>Ventas - KYRO</title>
            <meta name="description" content="Visualiza y gestiona tu pipeline de ventas en KYRO CRM." />
          </Helmet>
          
          <header className={`p-4 md:p-6 border-b border-border sticky top-0 z-10 ${headerBgClass}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold mb-1 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Pipeline de Ventas</h1>
                    <p className="text-muted-foreground">Arrastra y suelta las ventas para actualizar su estado.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" className={`flex items-center space-x-2 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}>
                        <Filter className="w-4 h-4"/>
                        <span>Filtros</span>
                    </Button>
                    <Button className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'} onClick={() => toast({ title: '🚧 Nueva Venta', description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀" })}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Venta
                    </Button>
                </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-x-auto p-4 md:p-6">
            <div className="flex space-x-4 h-full min-w-max">
                {stages.map(stage => (
                  <div key={stage.id} className="w-80 flex-shrink-0 h-full">
                    <div className={`p-3 rounded-t-lg ${theme === 'futuristic' ? 'bg-primary/10' : 'bg-secondary'}`}>
                      <div className="flex justify-between items-center">
                        <h2 className={`font-semibold ${theme === 'futuristic' ? 'text-primary' : 'text-foreground'}`}>{stage.name}</h2>
                        <span className="text-sm text-muted-foreground">{dealsByStage[stage.id]?.length || 0}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">${(totalValueByStage[stage.id] || 0).toLocaleString()}</p>
                    </div>
                    <div className={`p-2 rounded-b-lg h-full overflow-y-auto ${theme === 'futuristic' ? 'bg-black/20' : 'bg-secondary/50'}`}>
                        <div className="space-y-4">
                            {dealsByStage[stage.id]?.map((deal, index) => (
                               <DealCard 
                                 key={deal.id} 
                                 deal={deal} 
                                 index={index} 
                                 onView={() => setViewingDeal(deal)}
                                 onViewFile={() => setViewingClientFile(deal)}
                               />
                            ))}
                        </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {viewingDeal && (
            <ViewDealDialog
              isOpen={!!viewingDeal}
              setIsOpen={() => setViewingDeal(null)}
              deal={viewingDeal}
              setDeals={updateDealsList}
              onRevert={handleRevertToLead}
            />
          )}
          {viewingClientFile && (
            <ClientFileViewerDialog
              isOpen={!!viewingClientFile}
              onClose={() => setViewingClientFile(null)}
              deal={viewingClientFile}
              setDeals={updateDealsList}
            />
          )}
        </div>
      );
    };

    export default Deals;
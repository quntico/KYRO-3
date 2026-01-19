import React, { useState, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { UserPlus, Search, Filter, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';

    const ClientOnboarding = ({ leads, setClients }) => {
      const { theme } = useTheme();
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'onboarded', 'pending'

      const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
          const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                lead.email.toLowerCase().includes(searchTerm.toLowerCase());
          
          const isOnboarded = lead.onboarded; // Assuming a new 'onboarded' flag for leads
          const matchesStatus = filterStatus === 'all' ||
                                (filterStatus === 'onboarded' && isOnboarded) ||
                                (filterStatus === 'pending' && !isOnboarded);
          
          return matchesSearch && matchesStatus;
        });
      }, [leads, searchTerm, filterStatus]);

      const handleOnboardClient = (lead) => {
        const newClient = {
          id: Date.now(),
          name: lead.contact,
          companyName: lead.name,
          email: lead.email,
          phone: lead.phone,
          onboardingDate: new Date().toISOString(),
          status: 'active',
          notes: `Onboarded from lead: ${lead.name}`,
          // Inherit machines and quotations from lead
          machines: lead.machines || [],
          quotations: lead.quotations || [],
        };

        setClients(prevClients => [...prevClients, newClient]);
        
        // Optionally, update the lead status or mark as onboarded
        // setLeads(prevLeads => prevLeads.map(l => l.id === lead.id ? { ...l, onboarded: true, status: 'converted' } : l));

        toast({
          title: "¡Cliente Onboarded!",
          description: `"${lead.name}" ha sido añadido a tus clientes.`,
        });
      };

      const handleAction = (action, lead = null) => {
        const actionName = lead ? `${action} - ${lead.name}` : action;
        toast({
          title: `🚧 ${actionName}`,
          description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
        });
      };

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
          <Helmet>
            <title>Onboarding de Clientes - KYRO</title>
            <meta name="description" content="Gestiona el proceso de onboarding de nuevos clientes en KYRO CRM." />
          </Helmet>
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Onboarding de Clientes</h1>
                  <p className="text-muted-foreground">Convierte tus prospectos en clientes activos</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Buscar prospectos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                  />
                </div>
                <Button
                  variant="outline"
                  className={`flex items-center space-x-2 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
                  onClick={() => handleAction('Filtros')}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </Button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 shadow-sm border border-border card-hover flex flex-col"
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${theme === 'futuristic' ? 'text-glow' : ''}`}>{lead.name}</h3>
                        <p className="text-sm text-muted-foreground">{lead.contact}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {lead.onboarded ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${theme === 'futuristic' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'}`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Onboarded
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${theme === 'futuristic' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'}`}>
                            <XCircle className="w-3 h-3 mr-1" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                      <p>📧 {lead.email}</p>
                      <p>📞 {lead.phone}</p>
                      <p>🔗 {lead.source}</p>
                      <p>📝 {lead.notes}</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    {!lead.onboarded && (
                      <Button
                        className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground w-full' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full'}
                        onClick={() => handleOnboardClient(lead)}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Onboard Cliente
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredLeads.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron prospectos para onboarding</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Todos los prospectos han sido onboarded o no hay nuevos.'}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      );
    };

    export default ClientOnboarding;
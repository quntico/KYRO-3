import React, { useState, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Truck, Search, Filter, Package, Calendar, MapPin, Edit, CheckCircle, XCircle, Plus, Phone, Trash2 } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { format, parseISO, isValid } from 'date-fns';
    import { es } from 'date-fns/locale';
    import LogisticsEditDialog from '@/components/logistics/LogisticsEditDialog';

    const Logistics = ({ clients, logistics, setLogistics }) => {
      const { theme } = useTheme();
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'delivered'
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [editingLogistics, setEditingLogistics] = useState(null);

      const allLogisticsEntries = useMemo(() => {
        return clients.flatMap(client => {
          const clientLogistics = logistics[client.id] || [];
          if (clientLogistics.length === 0 && client.machines && client.machines.length > 0) {
            // If no specific logistics entry, create a default one from client machines
            return client.machines.map((machine, index) => ({
              id: `${client.id}-${index}`,
              clientId: client.id,
              clientName: client.name,
              companyName: client.companyName,
              machineName: machine.name,
              deliveryDate: null,
              status: 'pending',
              notes: 'Generado automáticamente desde la máquina del cliente.',
              address: 'Pendiente',
              contactPhone: client.phone,
            }));
          }
          return clientLogistics.map(entry => ({
            ...entry,
            clientName: client.name,
            companyName: client.companyName,
            contactPhone: client.phone,
          }));
        });
      }, [clients, logistics]);

      const filteredEntries = useMemo(() => {
        return allLogisticsEntries.filter(entry => {
          const matchesSearch = entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                entry.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                entry.address.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
          
          return matchesSearch && matchesStatus;
        });
      }, [allLogisticsEntries, searchTerm, filterStatus]);

      const handleAction = (action, entry = null) => {
        const actionName = entry ? `${action} - ${entry.machineName}` : action;
        toast({
          title: `🚧 ${actionName}`,
          description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
        });
      };

      const handleEditClick = (entry) => {
        setEditingLogistics(entry);
        setIsEditDialogOpen(true);
      };

      const handleSaveLogistics = (updatedEntry) => {
        setLogistics(prevLogistics => {
          const clientLogistics = prevLogistics[updatedEntry.clientId] || [];
          const existingIndex = clientLogistics.findIndex(item => item.id === updatedEntry.id);

          let newClientLogistics;
          if (existingIndex > -1) {
            newClientLogistics = clientLogistics.map((item, idx) =>
              idx === existingIndex ? updatedEntry : item
            );
          } else {
            newClientLogistics = [...clientLogistics, updatedEntry];
          }

          return {
            ...prevLogistics,
            [updatedEntry.clientId]: newClientLogistics,
          };
        });
        toast({
          title: "Logística Actualizada",
          description: `La entrada para "${updatedEntry.machineName}" ha sido actualizada.`,
        });
        setIsEditDialogOpen(false);
      };

      const handleAddLogistics = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) {
          toast({ variant: "destructive", title: "Error", description: "Cliente no encontrado." });
          return;
        }
        setEditingLogistics({
          id: Date.now(),
          clientId: client.id,
          clientName: client.name,
          companyName: client.companyName,
          machineName: '',
          deliveryDate: null,
          status: 'pending',
          notes: '',
          address: '',
          contactPhone: client.phone,
        });
        setIsEditDialogOpen(true);
      };

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
          <Helmet>
            <title>Logística - KYRO</title>
            <meta name="description" content="Gestiona la logística de entrega de productos a tus clientes en KYRO CRM." />
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
                  <h1 className={`text-3xl font-bold mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Logística</h1>
                  <p className="text-muted-foreground">Seguimiento de entregas y envíos</p>
                </div>
                <Button
                  className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}
                  onClick={() => handleAction('Nueva Entrada de Logística')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Entrada
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Buscar entregas..."
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
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 shadow-sm border border-border card-hover flex flex-col"
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${theme === 'futuristic' ? 'text-glow' : ''}`}>{entry.machineName}</h3>
                        <p className="text-sm text-muted-foreground">{entry.companyName} ({entry.clientName})</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {entry.status === 'delivered' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${theme === 'futuristic' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'}`}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Entregado
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${theme === 'futuristic' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'}`}>
                            <XCircle className="w-3 h-3 mr-1" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4 text-sm text-muted-foreground">
                      <p className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{entry.address || 'Dirección no especificada'}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Fecha de Entrega: {entry.deliveryDate && isValid(parseISO(entry.deliveryDate))
                            ? format(parseISO(entry.deliveryDate), 'dd MMM yyyy', { locale: es })
                            : 'Pendiente'}
                        </span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Contacto: {entry.contactPhone || 'N/A'}</span>
                      </p>
                      <p className="text-xs italic mt-2">{entry.notes}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
                      onClick={() => handleEditClick(entry)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={theme === 'futuristic' ? 'border-destructive text-destructive hover:bg-destructive/20' : 'text-red-500 hover:bg-red-900/20'}
                      onClick={() => handleAction('Eliminar Entrada', entry)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredEntries.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron entradas de logística</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando una nueva entrada de logística.'}
                </p>
              </motion.div>
            )}
          </div>

          {editingLogistics && (
            <LogisticsEditDialog
              isOpen={isEditDialogOpen}
              setIsOpen={setIsEditDialogOpen}
              logisticsEntry={editingLogistics}
              onSave={handleSaveLogistics}
            />
          )}
        </div>
      );
    };

    export default Logistics;
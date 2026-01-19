
    import React, { useState, useMemo, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Search, Filter, Phone, MessageCircle, Eye, User } from 'lucide-react';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Avatar, AvatarFallback } from '@/components/ui/avatar';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { toast } from '@/components/ui/use-toast';
    import { useLocation, useNavigate } from 'react-router-dom';
    import { useData } from '@/contexts/DataContext';
    import { Badge } from '@/components/ui/badge';
    import { cn } from '@/lib/utils';
    import ViewLeadDialog from '@/components/leads/ViewLeadDialog';
    import ViewDealDialog from '@/components/deals/ViewDealDialog';

    const getStatusInfo = (status) => {
      switch (status) {
        case 'new': return { label: 'Nuevo', color: 'bg-blue-500' };
        case 'hot': return { label: 'Caliente', color: 'bg-red-500' };
        case 'warm': return { label: 'Tibio', color: 'bg-yellow-500' };
        case 'cold': return { label: 'Frío', color: 'bg-cyan-500' };
        case 'closed-won': return { label: 'Cliente', color: 'bg-green-500' };
        case 'contact': return { label: 'Contacto', color: 'bg-gray-500' };
        default: return { label: status, color: 'bg-gray-400' };
      }
    };

    const DirectoryListItem = ({ contact, onCall, onWhatsApp, onView }) => {
      const { theme } = useTheme();
      const contactName = contact.contact || contact.name || 'N/A';
      const initials = contactName.split(' ').map(n => n[0]).slice(0, 2).join('');
      const { label, color } = getStatusInfo(contact.status);

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between bg-card p-4 rounded-lg shadow-sm border border-border transition-all duration-300 hover:shadow-md hover:border-primary/50"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
                <AvatarFallback className={`text-sm font-semibold ${theme === 'futuristic' ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground'}`}>
                  {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{contactName}</p>
                <p className="text-xs text-muted-foreground truncate">{contact.company || contact.name}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 mx-4">
              <Badge variant="outline" className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", color)}></span>
                  {label}
              </Badge>
          </div>
          <div className="hidden sm:block text-sm text-muted-foreground mx-4">{contact.phone || 'N/A'}</div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => onView(contact)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onCall(contact.phone)}>
              <Phone className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onWhatsApp(contact.phone, contactName)}>
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      );
    };

    const Directory = () => {
      const location = useLocation();
      const navigate = useNavigate();
      const { leads, deals, contacts: generalContacts, loading, setLeads, setDeals } = useData();
      
      const queryParams = new URLSearchParams(location.search);
      const initialSearch = queryParams.get('search') || '';
      
      const [searchTerm, setSearchTerm] = useState(initialSearch);
      const [viewingItem, setViewingItem] = useState(null);
      const { theme } = useTheme();

      const allContacts = useMemo(() => {
        const uniqueContacts = new Map();

        const addContact = (contact, source, status) => {
            const email = contact.email?.toLowerCase().trim();
            const phone = contact.phone;
            const key = email || phone || `${contact.name}-${contact.contact}`;

            if (key && !uniqueContacts.has(key)) {
                uniqueContacts.set(key, {
                    id: contact.id,
                    source: source,
                    name: contact.name || contact.company || contact.client, 
                    contact: contact.contact || contact.name, 
                    email: contact.email,
                    phone: contact.phone,
                    position: contact.position || (contact.notes && contact.notes.includes('Puesto:') ? contact.notes.split('Puesto:')[1].split(',')[0].trim() : 'Contacto'),
                    company: contact.company || contact.name || contact.client,
                    status: status,
                });
            }
        };

        leads.forEach(lead => addContact(lead, 'lead', lead.status));
        deals.forEach(deal => addContact({ ...deal, name: deal.client }, 'deal', deal.stage));
        generalContacts.forEach(contact => addContact(contact, 'contact', 'contact'));
        
        return Array.from(uniqueContacts.values());
      }, [leads, deals, generalContacts]);

      const filteredContacts = useMemo(() => {
        return allContacts.filter(contact =>
          (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contact.contact && contact.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contact.phone && contact.phone.includes(searchTerm)) ||
          (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }, [allContacts, searchTerm]);

      const handleCall = (phone) => {
        if (phone) {
          window.location.href = `tel:${phone}`;
        } else {
          toast({ title: "Sin teléfono", description: "Este contacto no tiene un número de teléfono.", variant: "destructive" });
        }
      };

      const handleWhatsApp = (phone, name) => {
        if (phone) {
          const message = encodeURIComponent(`Hola ${name}, te contacto de...`);
          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
        } else {
          toast({ title: "Sin teléfono", description: "Este contacto no tiene un número para WhatsApp.", variant: "destructive" });
        }
      };

      const handleView = (contact) => {
        const sourceItem = (contact.source === 'lead' ? leads : deals).find(item => item.id === contact.id);
        if (sourceItem) {
          setViewingItem({ ...sourceItem, source: contact.source });
        } else {
           toast({ title: "No se puede ver", description: "No hay una vista detallada para este tipo de contacto.", variant: "destructive" });
        }
      };
      
      const handleFilterClick = () => {
        toast({
          title: "🚧 Filtros",
          description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
        });
      };
      
      const selectedLead = useMemo(() => {
        if (viewingItem?.source === 'lead') {
          return leads.find(l => l.id === viewingItem.id);
        }
        return null;
      }, [viewingItem, leads]);

      const selectedDeal = useMemo(() => {
        if (viewingItem?.source === 'deal') {
          return deals.find(d => d.id === viewingItem.id);
        }
        return null;
      }, [viewingItem, deals]);

      const handleLeadUpdate = useCallback((updatedLead) => {
        setLeads(prevLeads => prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l));
      }, [setLeads]);

      const handleRevertToLead = useCallback((dealToRevert) => {
        // This is a placeholder. In a real app, you'd call an API to revert the deal.
        toast({ title: "Funcionalidad no implementada", description: "Revertir a prospecto aún no está disponible." });
      }, []);

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
          <Helmet>
            <title>Directorio - KYRO</title>
            <meta name="description" content="Acceso rápido a todos tus contactos en KYRO CRM." />
          </Helmet>
          <div className="p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className={`text-3xl font-bold mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Directorio</h1>
              <p className="text-muted-foreground">Acceso rápido a todos tus contactos.</p>
            </motion.div>

            <div className="flex gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, empresa, email o teléfono..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleFilterClick}>
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>

            <div className="space-y-3">
              {filteredContacts.map(contact => (
                <DirectoryListItem 
                  key={`${contact.source}-${contact.id}`} 
                  contact={contact}
                  onCall={handleCall}
                  onWhatsApp={handleWhatsApp}
                  onView={handleView}
                />
              ))}
            </div>

            {!loading && filteredContacts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron contactos</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Tus contactos de prospectos, ventas y agenda aparecerán aquí.'}
                </p>
              </motion.div>
            )}
             {loading && (
                 <div className="text-center py-12">
                     <p>Cargando contactos...</p>
                 </div>
             )}
          </div>
          {selectedLead && (
             <ViewLeadDialog
                isOpen={!!selectedLead}
                setIsOpen={() => setViewingItem(null)}
                lead={selectedLead}
                onUpdate={handleLeadUpdate}
            />
          )}
          {selectedDeal && (
              <ViewDealDialog
                isOpen={!!selectedDeal}
                setIsOpen={() => setViewingItem(null)}
                deal={selectedDeal}
                setDeals={setDeals}
                onRevert={handleRevertToLead}
              />
          )}
        </div>
      );
    };

    export default Directory;
  
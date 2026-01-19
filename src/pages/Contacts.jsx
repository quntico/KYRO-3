import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ContactsHeader from '@/components/contacts/ContactsHeader';
import ContactCard from '@/components/contacts/ContactCard';
import ContactDialog from '@/components/contacts/ContactDialog';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const Contacts = ({ contacts, setContacts, setLeads }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  const filteredContacts = useMemo(() => 
    contacts.filter(contact =>
      (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [contacts, searchTerm]);

  const handleOpenNewDialog = useCallback(() => {
    setCurrentContact(null);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((contact) => {
    setCurrentContact(contact);
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback((submittedData) => {
    const { contactData, files } = submittedData;
    if (!contactData.name || !contactData.email) {
      toast({ variant: "destructive", title: "Error de validación", description: "Nombre y correo son campos obligatorios." });
      return;
    }

    const totalSaleAmount = (contactData.machines || []).reduce((sum, machine) => sum + (Number(machine.price) || 0), 0);

    const contactToSave = {
      ...contactData,
      saleAmount: totalSaleAmount,
      commission: Number(contactData.commission) || 0,
      quotations: files,
      machineModel: (contactData.machines && contactData.machines[0]?.name) || '',
    };

    if (contactData.id) {
      setContacts(prev => prev.map(c => c.id === contactToSave.id ? contactToSave : c));
      toast({ title: "¡Éxito!", description: `El contacto "${contactToSave.name}" ha sido actualizado.` });
    } else {
      const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
      const newContact = {
        ...contactToSave,
        id: newId,
        status: 'active',
        avatar: contactToSave.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        favorite: false,
        createdAt: new Date().toISOString(),
      };
      setContacts(prev => [newContact, ...prev]);
      toast({ title: "¡Éxito!", description: `El contacto "${newContact.name}" ha sido agregado.` });
    }
    setIsDialogOpen(false);
  }, [contacts, setContacts]);

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!contactToDelete) return;
    setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
    toast({ title: "Contacto eliminado", description: `"${contactToDelete.name}" ha sido eliminado de tu lista.` });
    setIsDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const convertToLead = (contactToConvert) => {
    const totalSaleAmount = (contactToConvert.machines || []).reduce((sum, machine) => sum + (Number(machine.price) || 0), contactToConvert.saleAmount || 0);

    const newLead = {
      id: Date.now(),
      name: contactToConvert.company,
      contact: contactToConvert.name,
      email: contactToConvert.email,
      phone: contactToConvert.phone,
      status: 'new',
      score: 50,
      source: 'Convertido de Contacto',
      value: totalSaleAmount,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      notes: `Convertido desde la lista de contactos. Puesto: ${contactToConvert.position}`,
      quotations: contactToConvert.quotations || [],
      machineProject: (contactToConvert.machines || []).map(m => m.name).join(', ') || contactToConvert.machineModel || '',
      commission: contactToConvert.commission || 0,
      activityStatus: {
        quotationSent: { checked: false, date: null },
        quotationReview: { checked: false, date: null },
        appointment: { checked: false, date: null },
        zoom: { checked: false, date: null },
        closing: { checked: false, date: null },
      }
    };
    setLeads(prev => [newLead, ...prev]);
    setContacts(prev => prev.filter(c => c.id !== contactToConvert.id));
    toast({ title: "¡Contacto convertido!", description: `"${contactToConvert.name}" ahora es un prospecto.` });
    navigate('/leads');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Contactos y Ventas - KYRO", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
    const tableColumn = ["Nombre", "Empresa", "Puesto", "Email", "Monto de Cotización"];
    const tableRows = filteredContacts.map(contact => [
      contact.name,
      contact.company,
      contact.position,
      contact.email,
      contact.saleAmount ? `${contact.saleAmount.toLocaleString()}` : 'N/A',
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40, theme: 'grid', headStyles: { fillColor: [22, 160, 133] } });
    doc.save("reporte_contactos_kyro.pdf");
    toast({ title: "¡PDF Generado!", description: "Tu reporte de contactos ha sido descargado." });
  };

  const handleAction = (action, contact = null) => {
    const actionName = contact ? `${action} - ${contact.name}` : action;
    toast({ title: `🚧 ${actionName}`, description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀" });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
      <Helmet>
        <title>Contactos - KYRO</title>
        <meta name="description" content="Gestiona tu red de contactos profesionales en KYRO CRM." />
      </Helmet>
      
      <div className="p-8">
        <ContactsHeader
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onExportPDF={handleExportPDF}
          onFilter={() => handleAction('Filtros')}
          onNewContact={handleOpenNewDialog}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContacts.map((contact, index) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              index={index}
              onEdit={handleOpenEditDialog}
              onDelete={handleDeleteClick}
              onConvertToLead={convertToLead}
              onAction={handleAction}
            />
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className={`text-lg font-medium mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>No se encontraron contactos</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer contacto'}
            </p>
            <Button className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'} onClick={handleOpenNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Contacto
            </Button>
          </motion.div>
        )}
      </div>

      {isDialogOpen && (
        <ContactDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          contact={currentContact}
          onSubmit={handleSubmit}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el contacto
              "{contactToDelete?.name}" de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contacts;
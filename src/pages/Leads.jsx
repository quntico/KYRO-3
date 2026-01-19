import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import LeadsHeader from '@/components/leads/LeadsHeader';
import LeadCard from '@/components/leads/LeadCard';
import LeadsTable from '@/components/leads/LeadsTable';
import ViewLeadDialog from '@/components/leads/ViewLeadDialog';
import EditLeadDialog from '@/components/leads/EditLeadDialog';
import DeleteLeadDialog from '@/components/leads/DeleteLeadDialog';
import NewLeadDialog from '@/components/leads/NewLeadDialog';
import FollowUpDialog from '@/components/leads/FollowUpDialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const Leads = () => {
  const { user } = useAuth();
  const { leads, loading, updateLead, removeLead, addLead, addTask, updateTaskByLeadId } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dialogState, setDialogState] = useState({
    view: false,
    edit: false,
    delete: false,
    followUp: false,
    new: false,
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [followUpAction, setFollowUpAction] = useState(null);
  const navigate = useNavigate();

  const filteredLeads = useMemo(() => {
    return leads.map(lead => {
      const totalValue = (lead.machines || []).reduce((sum, machine) => sum + (Number(machine.price) || 0), 0);
      const totalCommission = (lead.machines || []).reduce((sum, machine) => sum + (Number(machine.commission) || 0), 0);
      return { ...lead, value: totalValue, commission: totalCommission };
    }).filter(lead => {
      const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.contact?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [leads, searchTerm, selectedStatus]);

  const totalPossibleSales = useMemo(() => {
    return filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
  }, [filteredLeads]);

  const openDialog = useCallback((type, lead = null, action = null) => {
    setSelectedLead(lead);
    if (type === 'followUp') setFollowUpAction(action);
    setDialogState(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeDialogs = useCallback(() => {
    setDialogState({ view: false, edit: false, delete: false, followUp: false, new: false });
    setSelectedLead(null);
    setFollowUpAction(null);
  }, []);

  const handleScheduleFollowUp = useCallback(async (lead, actionType, due) => {
    closeDialogs();
    const newTask = {
      user_id: user.id,
      title: `${actionType} con ${lead.name}`,
      due: due.toISOString(),
      client: lead.name,
      priority: 'medium',
      completed: false,
      attachments: [],
      lead_id: lead.id,
    };

    const { data: upsertedTask, error: taskError } = await supabase
      .from('tasks')
      .upsert(newTask, { onConflict: 'lead_id' }).select().single();

    if (taskError) {
      toast({ title: "Error al agendar tarea", description: taskError.message, variant: "destructive" });
    } else {
      updateTaskByLeadId(lead.id, upsertedTask);
    }

    const { data: updatedLead, error: leadError } = await supabase
      .from('leads')
      .update({ next_step: { type: actionType, date: due.toISOString() }, last_activity: new Date().toISOString() })
      .eq('id', lead.id)
      .select()
      .single();

    if (leadError) {
      toast({ title: "Error al actualizar prospecto", description: leadError.message, variant: "destructive" });
    } else {
      updateLead(updatedLead);
      toast({
        title: "✅ Seguimiento Agendado",
        description: `Tarea "${actionType} con ${lead.name}" creada en tu Agenda.`,
      });
    }
  }, [closeDialogs, user, updateLead, updateTaskByLeadId]);

  const handleConvertToDeal = useCallback(async (leadToConvert) => {
    const totalValue = (leadToConvert.machines || []).reduce((sum, machine) => sum + (Number(machine.price) || 0), 0);
    const machineProjects = (leadToConvert.machines || []).map(m => m.name).join(', ');

    const newDeal = {
      user_id: user.id,
      title: `Venta - ${leadToConvert.name}`,
      client: leadToConvert.name,
      contact: leadToConvert.contact,
      contact_email: leadToConvert.email,
      contact_phone: leadToConvert.phone,
      value: totalValue,
      stage: 'discovery',
      probability: 40,
      close_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      last_activity: new Date().toISOString(),
      description: `Venta generada desde el prospecto: ${leadToConvert.name}. Proyectos: ${machineProjects || 'No especificado'}`,
      quotations: leadToConvert.quotations || [],
      machines: leadToConvert.machines || [],
    };

    const { error: dealError } = await supabase.from('deals').insert(newDeal);
    if (dealError) {
      toast({ title: "Error al convertir a venta", description: dealError.message, variant: "destructive" });
      return;
    }

    const { error: deleteError } = await supabase.from('leads').delete().eq('id', leadToConvert.id);
    if (deleteError) {
      toast({ title: "Error al eliminar prospecto", description: deleteError.message, variant: "destructive" });
    } else {
      removeLead(leadToConvert.id);
      toast({
        title: "¡Prospecto convertido a Venta!",
        description: `"${leadToConvert.name}" ahora está en tu pipeline de ventas.`,
      });
      navigate('/deals');
    }
  }, [user, removeLead, navigate]);

  const handleCreateLead = useCallback(async (newLeadData) => {
    const leadToAdd = {
      user_id: user.id,
      name: newLeadData.company,
      contact: newLeadData.name,
      position: newLeadData.position,
      email: newLeadData.email,
      phone: newLeadData.phone,
      status: 'new',
      score: 50,
      source: 'Manual Entry',
      machines: newLeadData.machines,
      last_activity: new Date().toISOString(),
      notes: newLeadData.notes,
      quotations: newLeadData.quotations,
      follow_up_date: null,
      activity_status: {
        quotationSent: { checked: !!newLeadData.quotations.length, date: newLeadData.quotations.length ? new Date().toISOString() : null },
        quotationReview: { checked: false, date: null },
        appointment: { checked: false, date: null },
        zoom: { checked: false, date: null },
        closing: { checked: false, date: null },
      },
      next_step: { type: 'Enviar Cotización', date: null }
    };

    const { data, error } = await supabase.from('leads').insert(leadToAdd).select().single();

    if (error) {
      toast({ variant: "destructive", title: "Error al crear prospecto", description: error.message });
      return;
    }

    addLead(data);
    toast({ title: "¡Prospecto Creado!", description: `Se ha añadido "${data.name}" a tus prospectos.` });
    closeDialogs();
  }, [user, addLead, closeDialogs]);

  const updateLeadAndLastActivity = useCallback(async (leadId, updates) => {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, last_activity: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al actualizar prospecto", description: error.message, variant: "destructive" });
    } else {
      updateLead(data);
    }
    return { data, error };
  }, [updateLead]);

  const handleStatusChange = useCallback(async (leadId, newStatus) => {
    let newScore;
    switch (newStatus) {
      case 'hot': newScore = Math.floor(Math.random() * (99 - 85 + 1)) + 85; break;
      case 'warm': newScore = Math.floor(Math.random() * (84 - 60 + 1)) + 60; break;
      case 'cold': newScore = Math.floor(Math.random() * (59 - 30 + 1)) + 30; break;
      default: newScore = 50;
    }
    await updateLeadAndLastActivity(leadId, { status: newStatus, score: newScore });
    toast({ title: "¡Estado Actualizado!", description: `El prospecto ha sido marcado como ${newStatus} y su score es ahora ${newScore}.` });
  }, [updateLeadAndLastActivity]);

  const handleNextStepChange = useCallback((lead, newNextStep) => {
    openDialog('followUp', lead, newNextStep);
  }, [openDialog]);

  const getNextStep = useCallback((lead) => {
    if (lead.next_step && lead.next_step.type) return lead.next_step.type;
    return lead.notes || 'N/A';
  }, []);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Prospectos - KYRO', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Cliente", "Contacto", "Máquinas/Proyectos", "Siguiente Paso", "Monto ($)"];
    const tableRows = [];

    filteredLeads.forEach(lead => {
      const machineProjects = (lead.machines || []).map(m => m.name).join(', ');
      const leadData = [
        lead.name,
        lead.contact,
        machineProjects || 'N/A',
        getNextStep(lead),
        lead.value.toLocaleString(),
      ];
      tableRows.push(leadData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save('reporte-prospectos-kyro.pdf');
    toast({ title: "¡Exportación Exitosa!", description: "Tu reporte de prospectos ha sido generado en PDF." });
  }, [filteredLeads, getNextStep]);

  const exportExcelTemplate = useCallback(() => {
    const headers = ["Empresa", "Contacto", "Cargo", "Email", "Teléfono", "Notas", "Valor Estimado"];
    const csvContent = [
      headers.join(","),
      "" // Fila vacía para ejemplo o ingreso directo
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla-importacion-leads.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Plantilla Generada",
      description: "Se ha descargado la plantilla Excel para importar prospectos."
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Target className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
      <Helmet>
        <title>Prospectos - KYRO</title>
        <meta name="description" content="Gestiona y convierte tus oportunidades de negocio en KYRO CRM." />
      </Helmet>
      <div className="p-8">
        <LeadsHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          leads={leads}
          onNewLead={() => openDialog('new')}
          onExportPDF={exportToPDF}
          onExportExcel={exportExcelTemplate}
          totalSales={totalPossibleSales}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLeads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={index}
              onView={() => openDialog('view', lead)}
              onEdit={() => openDialog('edit', lead)}
              onDelete={() => openDialog('delete', lead)}
              onStatusChange={handleStatusChange}
              onConvertToDeal={handleConvertToDeal}
              onQuickFollowUp={(lead, actionType) => openDialog('followUp', lead, actionType)}
              onNextStepChange={handleNextStepChange}
            />
          ))}
        </div>

        {filteredLeads.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron prospectos</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer prospecto'}
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => openDialog('new')}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Prospecto
            </Button>
          </motion.div>
        )}

        {filteredLeads.length > 0 && <LeadsTable leads={filteredLeads} />}
      </div>

      <ViewLeadDialog
        isOpen={dialogState.view}
        setIsOpen={(isOpen) => setDialogState(prev => ({ ...prev, view: isOpen }))}
        lead={selectedLead}
        onUpdate={updateLead}
      />
      <EditLeadDialog
        isOpen={dialogState.edit}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, edit: isOpen }))}
        lead={selectedLead}
        onUpdate={updateLead}
      />
      <DeleteLeadDialog
        isOpen={dialogState.delete}
        setIsOpen={(isOpen) => setDialogState(prev => ({ ...prev, delete: isOpen }))}
        lead={selectedLead}
        onDelete={removeLead}
      />
      <NewLeadDialog
        open={dialogState.new}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, new: isOpen }))}
        onSubmit={handleCreateLead}
      />
      <FollowUpDialog
        open={dialogState.followUp}
        onOpenChange={closeDialogs}
        lead={selectedLead}
        actionType={followUpAction}
        onSchedule={handleScheduleFollowUp}
        onUpdate={updateLeadAndLastActivity}
      />
    </div>
  );
};

export default Leads;
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import LeadsHeader from '@/components/leads/LeadsHeader';
import LeadCard from '@/components/leads/LeadCard';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadsKanban from '@/components/leads/LeadsKanban';
import ViewLeadDialog from '@/components/leads/ViewLeadDialog';
import EditLeadDialog from '@/components/leads/EditLeadDialog';
import DeleteLeadDialog from '@/components/leads/DeleteLeadDialog';
import NewLeadDialog from '@/components/leads/NewLeadDialog';
import FollowUpDialog from '@/components/leads/FollowUpDialog';
import LeadConversationDialog from '@/components/leads/LeadConversationDialog';
import ModernLeadsDashboard from '@/components/leads/ModernLeadsDashboard';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import * as XLSX from 'xlsx';

const Leads = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { leads, loading, updateLead, removeLead, addLead, addDeal, addTask, updateTaskByLeadId, fetchData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dialogState, setDialogState] = useState({
    view: false,
    edit: false,
    delete: false,
    followUp: false,
    new: false,
    conversation: false,
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'kanban'
  const [dashboardStyle, setDashboardStyle] = useState('modern'); // 'modern', 'classic'
  const [sortMode, setSortMode] = useState('status'); // 'date', 'status', 'alpha', 'value'
  const [selectedLead, setSelectedLead] = useState(null);
  const [followUpAction, setFollowUpAction] = useState(null);
  const [initialPdf, setInitialPdf] = useState(null);
  const navigate = useNavigate();



  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    return leads.filter(l => l && typeof l === 'object').map(lead => {
      const totalValue = (lead.machines || []).reduce((sum, m) => sum + (Number(m?.price) || 0), 0);
      const totalCommission = (lead.machines || []).reduce((sum, m) => sum + (Number(m?.commission) || 0), 0);
      return { ...lead, value: totalValue, commission: totalCommission };
    }).filter(lead => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (lead.name?.toLowerCase() || '').includes(search) ||
        (lead.contact?.toLowerCase() || '').includes(search) ||
        (lead.email?.toLowerCase() || '').includes(search);
      const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortMode === 'date') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortMode === 'status') {
        const priority = { closing: 1, hot: 2, warming: 3, warm: 4, cooling: 5, cold: 6, new: 7, declined: 8 };
        const pA = priority[a.status] || 99;
        const pB = priority[b.status] || 99;
        if (pA !== pB) return pA - pB;
        return (b.value || 0) - (a.value || 0);
      }
      if (sortMode === 'alpha') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortMode === 'value') {
        return (b.value || 0) - (a.value || 0);
      }
      return 0;
    });
  }, [leads, searchTerm, selectedStatus, sortMode]);

  const totalPossibleSales = useMemo(() => {
    return filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
  }, [filteredLeads]);

  const totalPossibleUtilities = useMemo(() => {
    return filteredLeads.reduce((sum, lead) => sum + (lead.commission || 0), 0);
  }, [filteredLeads]);

  const openDialog = useCallback((type, lead = null, actionOrPdf = null) => {
    setSelectedLead(lead);
    if (type === 'followUp') setFollowUpAction(actionOrPdf);
    if (type === 'view') setInitialPdf(actionOrPdf);

    // Si abrimos la bitácora desde la ficha, cerramos la ficha y abrimos la bitácora con un micro-delay
    setDialogState(prev => {
      if (type === 'conversation' && prev.view) {
        setTimeout(() => setDialogState(s => ({ ...s, view: false, conversation: true })), 10);
        return prev;
      }
      return { ...prev, [type]: true };
    });
  }, []);

  const closeDialogs = useCallback(() => {
    setDialogState({ view: false, edit: false, delete: false, followUp: false, new: false, conversation: false });
    setSelectedLead(null);
    setFollowUpAction(null);
    setInitialPdf(null);
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
    const totalValue = (leadToConvert.machines || []).reduce((sum, machine) => sum + (Number(machine?.price) || 0), 0);
    const machineProjects = (leadToConvert.machines || []).filter(Boolean).map(m => m?.name || 'Máquina').join(', ');

    const newDeal = {
      title: `Venta - ${leadToConvert.name}`,
      client: leadToConvert.name,
      contact: leadToConvert.contact,
      contact_email: leadToConvert.email,
      contact_phone: leadToConvert.phone,
      value: totalValue,
      stage: 'anticipo',
      probability: 100,
      close_date: new Date().toISOString().split('T')[0],
      last_activity: new Date().toISOString(),
      description: `Venta generada desde el prospecto: ${leadToConvert.name}. Proyectos: ${machineProjects || 'No especificado'}`,
      quotations: leadToConvert.quotations || [],
      machines: leadToConvert.machines || [],
      notes: leadToConvert.notes || '[]',
      closing_status: {},
    };

    const insertedDeal = await addDeal(newDeal);
    if (!insertedDeal) {
      toast({ title: "Error al convertir a venta", description: "Ocurrió un problema al crear la venta en la base de datos.", variant: "destructive" });
      return;
    }

    await removeLead(leadToConvert.id);
    toast({
      title: "¡Prospecto convertido a Venta!",
      description: `"${leadToConvert.name}" ahora está en tu pipeline de ventas.`,
    });
    navigate('/deals');
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
      source: newLeadData.source || 'Manual Entry',
      machines: newLeadData.machines,
      last_activity: new Date().toISOString(),
      notes: newLeadData.notes,
      quotations: newLeadData.quotations,
      follow_up_date: null,
      activity_status: {
        client_code: newLeadData.clientCode || '',
        quotationSent: { checked: !!newLeadData.quotations.length, date: newLeadData.quotations.length ? new Date().toISOString() : null },
        quotationReview: { checked: false, date: null },
        appointment: { checked: false, date: null },
        zoom: { checked: false, date: null },
        closing: { checked: false, date: null },
      },
      next_step: { type: 'Enviar Cotización', date: null }
    };

    const createdLead = await addLead(leadToAdd);

    if (!createdLead) {
      toast({ variant: "destructive", title: "Error al crear prospecto", description: "No se pudo conectar con el servidor." });
      return;
    }

    toast({ title: "¡Prospecto Creado!", description: `Se ha añadido "${createdLead.name}" a tus prospectos.` });
    closeDialogs();
  }, [user, addLead, closeDialogs]);

  const updateLeadAndLastActivity = useCallback(async (leadId, updates) => {
    const fullUpdates = { ...updates, last_activity: new Date().toISOString() };
    await updateLead(leadId, fullUpdates);
    return { data: fullUpdates, error: null };
  }, [updateLead]);

  const handleStatusChange = useCallback(async (leadId, newStatus) => {
    let newScore;
    switch (newStatus) {
      case 'closing': newScore = 100; break;
      case 'hot': newScore = Math.floor(Math.random() * (99 - 85 + 1)) + 85; break;
      case 'warm': newScore = Math.floor(Math.random() * (84 - 60 + 1)) + 60; break;
      case 'cold': newScore = Math.floor(Math.random() * (59 - 30 + 1)) + 30; break;
      case 'declined': newScore = Math.floor(Math.random() * (20 - 0 + 1)) + 0; break;
      default: newScore = 50;
    }
    
    const statusNames = {
      closing: 'Cierre',
      hot: 'Caliente',
      warming: 'Avanzando',
      warm: 'Tibio',
      cooling: 'Enfriando',
      cold: 'Frío',
      new: 'Nuevo',
      declined: 'Perdido'
    };

    await updateLeadAndLastActivity(leadId, { status: newStatus, score: newScore });
    toast({ 
      title: "¡Estatus Actualizado!", 
      description: `El prospecto ha sido marcado como ${statusNames[newStatus] || newStatus}.` 
    });
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
    const colors = {
      nova: { primary: [255, 204, 0], accent: [255, 255, 255], bg: [26, 26, 26] },
      futuristic: { primary: [13, 242, 242], accent: [242, 13, 242], bg: [20, 25, 35] },
      play: { primary: [238, 68, 68], accent: [255, 255, 255], bg: [15, 15, 15] },
      dark: { primary: [59, 130, 246], accent: [255, 255, 255], bg: [15, 23, 42] },
      light: { primary: [59, 130, 246], accent: [255, 255, 255], bg: [255, 255, 255] }
    };
    const activeColors = colors[theme] || colors.light;
    const headerBg = [30, 30, 30]; // Dark gray as requested

    // Header Rect
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, 210, 25, 'F');

    // Logo Symol (Command icon fake)
    doc.setDrawColor(...activeColors.primary);
    doc.setLineWidth(0.8);
    // Draw 4 circles for the Command symbol
    const cx = 14, cy = 12.5, r = 1.5, offset = 2.5;
    doc.circle(cx - offset, cy - offset, r);
    doc.circle(cx + offset, cy - offset, r);
    doc.circle(cx - offset, cy + offset, r);
    doc.circle(cx + offset, cy + offset, r);
    // Connecting lines
    doc.line(cx - offset, cy - offset + r, cx - offset, cy + offset - r);
    doc.line(cx + offset, cy - offset + r, cx + offset, cy + offset - r);
    doc.line(cx - offset + r, cy - offset, cx + offset - r, cy - offset);
    doc.line(cx - offset + r, cy + offset, cx + offset - r, cy + offset);

    // Logo Text
    doc.setTextColor(...activeColors.primary);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('KYRO', 24, 15);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('REPORTE DE PROSPECTOS', 80, 15);

    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 165, 15);

    const tableColumn = ["#", "Cliente", "Contacto", "Máquinas/Proyectos", "Siguiente Paso", "Monto ($)"];
    const tableRows = [];

    const statusPriority = { closing: 1, hot: 2, warming: 3, warm: 4, cooling: 5, cold: 6, new: 7, declined: 8 };
    const statusColorsRGB = {
      closing: [0, 71, 255],
      hot: [239, 68, 68],
      warming: [16, 185, 129],
      warm: [249, 115, 22],
      cooling: [6, 182, 212],
      cold: [59, 130, 246],
      new: [168, 85, 247],
      declined: [139, 69, 19],
    };

    const sortedLeads = [...filteredLeads].sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      if (pA !== pB) return pA - pB;
      return (b.value || 0) - (a.value || 0);
    });

    sortedLeads.forEach((lead, index) => {
      const machineProjects = (lead.machines || []).filter(Boolean).map(m => m?.name || 'Máquina').join(', ');
      const leadData = [
        index + 1,
        lead.name,
        lead.contact,
        machineProjects || 'N/A',
        getNextStep(lead),
        `$${(lead.value || 0).toLocaleString()}`,
      ];
      tableRows.push(leadData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: activeColors.primary,
        textColor: theme === 'nova' ? [0, 0, 0] : [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 30 },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 0) {
          const leadStatus = sortedLeads[data.row.index].status;
          const bgColor = statusColorsRGB[leadStatus] || [128, 128, 128];
          data.cell.styles.fillColor = bgColor;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    const TC = 17.50;
    const totalSalesMXN = totalPossibleSales * TC;
    const totalUtilitiesMXN = totalPossibleUtilities * TC;

    // Summary Section
    doc.setFillColor(...activeColors.primary);
    doc.rect(105, finalY - 5, 95, 52, 'F'); // Expanded height for better framing

    doc.setTextColor(theme === 'nova' ? 0 : 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN FINANCIERO (USD/MXN)', 110, finalY + 2);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`TC 17.50`, 110, finalY + 8);

    doc.setFontSize(11); // Larger font for Sales
    doc.setFont('helvetica', 'bold'); // Bold for Sales
    doc.text(`VENTAS TOTALES:`, 110, finalY + 16);
    doc.text(`- USD: $${totalPossibleSales.toLocaleString()}`, 115, finalY + 22);
    doc.text(`- MXN: ${totalSalesMXN.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`, 115, finalY + 28);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Utilidad Estimada:`, 110, finalY + 36);
    doc.setFont('helvetica', 'normal');
    doc.text(`- USD: $${totalPossibleUtilities.toLocaleString()}`, 115, finalY + 41);
    doc.text(`- MXN: ${totalUtilitiesMXN.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`, 115, finalY + 46);

    doc.save(`reporte-prospectos-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "¡Exportación Exitosa!", description: "Reporte generado con conversión a MXN (TC: 17.50)." });
  }, [filteredLeads, getNextStep, theme, totalPossibleSales, totalPossibleUtilities]);

  const exportExcelTemplate = useCallback(() => {
    const headers = [["Empresa", "Contacto", "Cargo", "Email", "Teléfono", "Notas", "Valor Estimado"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Leads");

    XLSX.writeFile(wb, "plantilla-importacion-leads.xlsx");

    toast({
      title: "✅ Plantilla Generada",
      description: "Se ha descargado la plantilla Excel (.xlsx) para importar prospectos."
    });
  }, []);

  const exportDataToExcel = useCallback(() => {
    const headers = ["Empresa", "Contacto", "Cargo", "Email", "Teléfono", "Notas", "Valor Estimado"];
    const data = filteredLeads.map(lead => [
      lead.name || '',
      lead.contact || '',
      lead.position || '',
      lead.email || '',
      lead.phone || '',
      lead.notes || '',
      lead.value || 0
    ]);
    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mis Prospectos");

    XLSX.writeFile(wb, `prospectos-exportados-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "✅ Exportación a Excel Exitosa",
      description: "Tu lista de prospectos ha sido exportada. Puedes usar este archivo para importar de nuevo."
    });
  }, [filteredLeads]);

  const handleImportExcel = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length <= 1) {
          toast({ title: "Archivo vacío", description: "El archivo no contiene datos para importar.", variant: "destructive" });
          return;
        }

        // Obtener encabezados de la primera fila
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());

        // Helper para encontrar índice por nombre
        const getIdx = (names) => headers.findIndex(h => names.some(n => h.includes(n.toLowerCase())));

        const colIdx = {
          name: getIdx(['empresa', 'compañía', 'nombre de empresa', 'name', 'company']),
          contact: getIdx(['contacto', 'persona', 'contact', 'person', 'nombre']),
          position: getIdx(['cargo', 'puesto', 'position', 'role']),
          email: getIdx(['email', 'correo', 'e-mail']),
          phone: getIdx(['teléfono', 'telefono', 'phone', 'celular', 'whatsapp']),
          notes: getIdx(['notas', 'notas adicionales', 'notes', 'comentarios'])
        };

        const leadsToInsert = jsonData.slice(1).map(row => {
          const getName = () => row[colIdx.name] || row[colIdx.contact] || null;
          if (!getName()) return null;

          return {
            user_id: user.id,
            name: String(row[colIdx.name] || 'Empresa sin nombre'),
            contact: String(row[colIdx.contact] || 'Sin contacto'),
            position: String(row[colIdx.position] || ''),
            email: String(row[colIdx.email] || ''),
            phone: String(row[colIdx.phone] || ''),
            notes: String(row[colIdx.notes] || ''),
            status: 'new',
            score: 50,
            source: 'Excel Import',
            last_activity: new Date().toISOString(),
            machines: [],
            quotations: [],
            activity_status: {
              quotationSent: { checked: false, date: null },
              quotationReview: { checked: false, date: null },
              appointment: { checked: false, date: null },
              zoom: { checked: false, date: null },
              closing: { checked: false, date: null },
            },
            next_step: { type: 'Enviar Cotización', date: null }
          };
        }).filter(Boolean);

        if (leadsToInsert.length === 0) {
          toast({ title: "Sin datos válidos", description: "No se encontraron prospectos válidos para importar.", variant: "destructive" });
          return;
        }

        const { error } = await supabase.from('leads').insert(leadsToInsert);

        if (error) throw error;

        await fetchData();
        toast({
          title: "✅ Importación Exitosa",
          description: `Se han importado ${leadsToInsert.length} prospectos exitosamente.`
        });
      } catch (err) {
        console.error("Error importing leads:", err);
        toast({
          title: "Error de Importación",
          description: `Detalle: ${err.message || 'Error desconocido al procesar el archivo.'}`,
          variant: "destructive"
        });
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }, [user, supabase, fetchData]);

  React.useEffect(() => {
    const handleOpenEdit = (e) => {
      const lead = e.detail;
      openDialog('edit', lead);
    };
    window.addEventListener('open-edit-lead', handleOpenEdit);
    return () => window.removeEventListener('open-edit-lead', handleOpenEdit);
  }, [openDialog]);

  if (loading && (!leads || leads.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Target className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-cyan-500/30">
      <Helmet>
        <title>Prospectos | KYRO STRATEGIC CONSOLE</title>
      </Helmet>

      {/* Futuristic Background System */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Digital Grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-cyan-400/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px]" />
        
        {/* Scanning Line Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-[2px] w-full animate-scan shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ top: '-100%' }} />
      </div>

      <div className="relative z-10 p-4 md:p-10 max-w-[1700px] mx-auto space-y-10">
        <LeadsHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          leads={leads}
          onNewLead={() => openDialog('new')}
          onExportPDF={exportToPDF}
          onExportExcel={exportExcelTemplate}
          onExportDataExcel={exportDataToExcel}
          onImportExcel={handleImportExcel}
          totalSales={totalPossibleSales}
          viewMode={viewMode}
          setViewMode={setViewMode}
          dashboardStyle={dashboardStyle}
          setDashboardStyle={setDashboardStyle}
          sortMode={sortMode}
          setSortMode={setSortMode}
        />

        {dashboardStyle === 'modern' ? (
          <ModernLeadsDashboard
            filteredLeads={filteredLeads}
            viewMode={viewMode}
            onView={(lead, pdf = null) => openDialog('view', lead, pdf)}
            onEdit={(lead) => openDialog('edit', lead)}
            onDelete={(lead) => openDialog('delete', lead)}
            onStatusChange={handleStatusChange}
            onConvertToDeal={handleConvertToDeal}
            onQuickFollowUp={(lead, actionType) => openDialog('followUp', lead, actionType)}
            onNextStepChange={handleNextStepChange}
            onOpenConversation={(lead) => openDialog('conversation', lead)}
            onUpdateField={updateLeadAndLastActivity}
          />
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLeads.map((lead, index) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={index}
                    onView={(pdf = null) => openDialog('view', lead, pdf)}
                    onEdit={() => openDialog('edit', lead)}
                    onDelete={() => openDialog('delete', lead)}
                    onStatusChange={handleStatusChange}
                    onConvertToDeal={handleConvertToDeal}
                    onQuickFollowUp={(lead, actionType) => openDialog('followUp', lead, actionType)}
                    onNextStepChange={handleNextStepChange}
                    onOpenConversation={(lead) => openDialog('conversation', lead)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <LeadsTable
                leads={filteredLeads}
                onView={(lead) => openDialog('view', lead)}
                onEdit={(lead) => openDialog('edit', lead)}
                onDelete={(lead) => openDialog('delete', lead)}
                onOpenConversation={(lead) => openDialog('conversation', lead)}
                onConvertToDeal={handleConvertToDeal}
                onStatusChange={handleStatusChange}
              />
            )}

            {viewMode === 'kanban' && (
              <LeadsKanban
                leads={filteredLeads}
                onView={(lead) => openDialog('view', lead)}
                onOpenConversation={(lead) => openDialog('conversation', lead)}
              />
            )}

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
          </>
        )}

        {/* LeadsTable removed from here as it is now controlled by viewMode */}
      </div>

      <ViewLeadDialog
        key={selectedLead?.id || 'none'}
        isOpen={dialogState.view}
        setIsOpen={(isOpen) => setDialogState(prev => ({ ...prev, view: isOpen }))}
        lead={selectedLead}
        initialPdf={initialPdf}
        onUpdate={updateLead}
        onOpenConversation={(lead) => openDialog('conversation', lead)}
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
      <LeadConversationDialog
        isOpen={dialogState.conversation}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, conversation: isOpen }))}
        lead={selectedLead}
        onSave={updateLeadAndLastActivity}
      />
    </div>
  );
};

export default Leads;
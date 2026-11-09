import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Target, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import LeadFilters, { LeadFilterButton, activeFilterCount } from '@/components/leads/LeadFilters';
import LeadFinancialSummary from '@/components/leads/LeadFinancialSummary';
import { DEFAULT_FILTERS, DATE_FIELDS, analyzeLeads, summarizeLeads, displayDate, leadDate } from '@/lib/leadAnalysis';
import LeadsHeader from '@/components/leads/LeadsHeader';
import LeadCard from '@/components/leads/LeadCard';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadsKanban from '@/components/leads/LeadsKanban';
const ViewLeadDialog = React.lazy(() => import('@/components/leads/ViewLeadDialog'));
const EditLeadDialog = React.lazy(() => import('@/components/leads/EditLeadDialog'));
const DeleteLeadDialog = React.lazy(() => import('@/components/leads/DeleteLeadDialog'));
const NewLeadDialog = React.lazy(() => import('@/components/leads/NewLeadDialog'));
const FollowUpDialog = React.lazy(() => import('@/components/leads/FollowUpDialog'));
const LeadConversationDialog = React.lazy(() => import('@/components/leads/LeadConversationDialog'));
const LeadQuoteCalculator = React.lazy(() => import('@/components/leads/LeadQuoteCalculator'));
import ModernLeadsDashboard from '@/components/leads/ModernLeadsDashboard';
const ManageCompaniesDialog = React.lazy(() => import('@/components/leads/ManageCompaniesDialog'));
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { loadLeadDetails } from '@/lib/workspaceLoader';
import { useDailyContacts } from '@/contexts/DailyContactContext';
import { contactRecordKey } from '@/lib/dailyContacts';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const Leads = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { leads, pipelineLoading: loading, dataError, updateLead, removeLead, addLead, convertLead, addTask, updateTaskByLeadId, fetchData } = useData();
  
  const defaultCompanies = useMemo(() => [
    { id: 'comp-1', name: 'Empresa 1', logo: '' },
    { id: 'comp-2', name: 'Empresa 2', logo: '' },
    { id: 'comp-3', name: 'Empresa 3', logo: '' },
    { id: 'comp-4', name: 'Empresa 4', logo: '' },
    { id: 'comp-5', name: 'Empresa 5', logo: '' },
  ], []);

  const [companies, setCompanies] = useState(() => {
    const keys = [
      'kyro_crm_companies_v5.5',
      'kyro_crm_companies_v5.0',
      'kyro_crm_companies',
      'pandora_companies_data',
      'kyro_companies',
      'companies'
    ];
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const standardized = parsed.map((item, idx) => ({
              id: item.id || `comp-${idx + 1}`,
              name: item.name || item.company_name || `Empresa ${idx + 1}`,
              logo: item.logo || item.logo_url || ''
            }));
            localStorage.setItem('kyro_crm_companies_v5.5', JSON.stringify(standardized));
            return standardized;
          }
        } catch (e) {
          console.error(`Error parsing companies from localStorage key ${key}:`, e);
        }
      }
    }
    return [
      { id: 'comp-1', name: 'Empresa 1', logo: '' },
      { id: 'comp-2', name: 'Empresa 2', logo: '' },
      { id: 'comp-3', name: 'Empresa 3', logo: '' },
      { id: 'comp-4', name: 'Empresa 4', logo: '' },
      { id: 'comp-5', name: 'Empresa 5', logo: '' },
    ];
  });

  const [selectedCompanyIds, setSelectedCompanyIds] = useState(['all']);
  const handleToggleCompany = (companyId) => {
    setSelectedCompanyIds((prev) => {
      if (companyId === 'all') {
        return ['all'];
      }
      let next = prev.filter(id => id !== 'all');
      if (next.includes(companyId)) {
        next = next.filter(id => id !== companyId);
        if (next.length === 0) return ['all'];
        return next;
      } else {
        return [...next, companyId];
      }
    });
  };
  const [manageCompaniesOpen, setManageCompaniesOpen] = useState(false);
  const [isStandaloneCalcOpen, setIsStandaloneCalcOpen] = useState(false);

  const handleSaveCompanies = (updatedCompanies) => {
    setCompanies(updatedCompanies);
    localStorage.setItem('kyro_crm_companies_v5.5', JSON.stringify(updatedCompanies));
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const setSearchTerm = value => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set('q', value); else next.delete('q');
    return next;
  }, {replace: true});
  const {history, day, ready: contactsReady, error: contactError, refresh: refreshContacts} = useDailyContacts();
  const contactLeads = useMemo(() => leads.map(lead => ({...lead, last_contact_date: history[contactRecordKey(lead)] || ''})), [leads, history]);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [scenarioMargin, setScenarioMargin] = useState('');
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
  const [detailsLoading, setDetailsLoading] = useState(false);
  const detailRequest = useRef(0);
  const [followUpAction, setFollowUpAction] = useState(null);
  const [initialPdf, setInitialPdf] = useState(null);
  const navigate = useNavigate();



  const filteredLeads = useMemo(() => analyzeLeads(contactLeads, {
    filters, search: searchTerm, status: selectedStatus, companies: selectedCompanyIds,
    sort: sortMode, margin: scenarioMargin, today: day,
  }), [contactLeads, day, filters, searchTerm, selectedStatus, selectedCompanyIds, sortMode, scenarioMargin]);
  const availableMonths = useMemo(() => [...new Set((contactLeads || []).map(lead => leadDate(lead, filters.dateField).slice(0, 7)).filter(Boolean))].sort().reverse(), [contactLeads, filters.dateField]);
  const analysisSummary = useMemo(() => summarizeLeads(filteredLeads), [filteredLeads]);
  const filterCount = activeFilterCount(filters, searchTerm, selectedStatus, selectedCompanyIds);
  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS }); setSearchTerm(''); setSelectedStatus('all');
    setSelectedCompanyIds(['all']); setSortMode('status'); setScenarioMargin('');
  };
  const dateSelection = filters.undated ? 'Sin fecha' : filters.month
    ? new Date(`${filters.month}-15T12:00:00Z`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : filters.from || filters.to ? `${filters.from ? displayDate(filters.from) : 'Inicio'} → ${filters.to ? displayDate(filters.to) : 'Hoy y futuras'}` : '';

  const totalPossibleSales = useMemo(() => {
    return filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
  }, [filteredLeads]);

  const totalPossibleUtilities = useMemo(() => {
    return filteredLeads.reduce((sum, lead) => sum + (lead.commission || 0), 0);
  }, [filteredLeads]);

  const openDialog = useCallback(async (type, lead = null, actionOrPdf = null) => {
    const request = ++detailRequest.current;
    if (lead && (type === 'view' || type === 'edit')) {
      setDetailsLoading(true);
      try {
        const complete = await loadLeadDetails(supabase, user.id, lead.id);
        if (request !== detailRequest.current) return;
        if (actionOrPdf?.deferred) {
          const index = lead.quotations?.indexOf(actionOrPdf);
          actionOrPdf = complete.quotations?.[index] || complete.quotations?.find(q => q.fileName === actionOrPdf.fileName) || null;
        }
        lead = complete;
      } catch (error) {
        if (request === detailRequest.current) toast({title:'No se pudo abrir la ficha',description:error.message,variant:'destructive'});
        return;
      } finally { if (request === detailRequest.current) setDetailsLoading(false); }
    } else { setDetailsLoading(false); }
    setSelectedLead(lead);
    if (type === 'followUp') setFollowUpAction(actionOrPdf);
    if (type === 'view') setInitialPdf(actionOrPdf);
    setDialogState(prev => ({...prev, ...(type === 'conversation' ? {view:false} : {}), [type]:true}));
  }, [user?.id]);

  const closeDialogs = useCallback(() => {
    ++detailRequest.current;
    setDetailsLoading(false);
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

  const conversionInFlight = useRef(false);
  const handleConvertToDeal = useCallback(async (leadToConvert) => {
    if (conversionInFlight.current) return;
    conversionInFlight.current = true;
    try {
      await convertLead(leadToConvert.id);
      toast({ title: 'Prospecto convertido a venta', description: `${leadToConvert.name} conserva su ficha en Ventas.` });
      navigate('/deals');
    } catch (error) {
      toast({ title: 'No se pudo convertir', description: error.message || 'El prospecto se conserva. Intenta de nuevo.', variant: 'destructive' });
    } finally { conversionInFlight.current = false; }
  }, [convertLead, navigate]);

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

  const exportToPDF = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
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

    // Logo Text / Brand branding
    const isSingleCompany = selectedCompanyIds.length === 1 && selectedCompanyIds[0] !== 'all';
    const selectedComp = isSingleCompany ? companies.find(c => c.id === selectedCompanyIds[0]) : null;
    if (selectedComp) {
      if (selectedComp.logo) {
        try {
          doc.addImage(selectedComp.logo, 'PNG', 24, 5, 15, 15);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(selectedComp.name.toUpperCase(), 43, 15);
        } catch (e) {
          doc.setTextColor(...activeColors.primary);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(selectedComp.name.toUpperCase(), 24, 15);
        }
      } else {
        doc.setTextColor(...activeColors.primary);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(selectedComp.name.toUpperCase(), 24, 15);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('REPORTE DE PROSPECTOS', 95, 15);
    } else {
      doc.setTextColor(...activeColors.primary);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('KYRO', 24, 15);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('REPORTE DE PROSPECTOS', 80, 15);
    }

    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 165, 15);

    const tableColumn = ["#", "Cliente", "Contacto", "Empresa Gestora", "Máquinas/Proyectos", "Siguiente Paso", "Monto ($)"];
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
      const companyId = lead.activity_status?.managingCompanyId || 'comp-1';
      const companyName = companies.find(c => c.id === companyId)?.name || 'Empresa 1';
      const leadData = [
        index + 1,
        lead.name,
        lead.contact,
        companyName,
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
  }, [filteredLeads, getNextStep, theme, totalPossibleSales, totalPossibleUtilities, companies, selectedCompanyIds]);

  const exportExcelTemplate = useCallback(async () => {
    const XLSX = await import('xlsx');
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

  const exportDataToExcel = useCallback(async () => {
    const XLSX = await import('xlsx');
    const headers = ["Empresa", "Contacto", "Cargo", "Email", "Teléfono", "Empresa Gestora", "Notas", "Valor Estimado"];
    const data = filteredLeads.map(lead => {
      const companyId = lead.activity_status?.managingCompanyId || 'comp-1';
      const companyName = companies.find(c => c.id === companyId)?.name || 'Empresa 1';
      return [
        lead.name || '',
        lead.contact || '',
        lead.position || '',
        lead.email || '',
        lead.phone || '',
        companyName,
        lead.notes || '',
        lead.value || 0
      ];
    });
    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mis Prospectos");

    XLSX.writeFile(wb, `prospectos-exportados-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "✅ Exportación a Excel Exitosa",
      description: "Tu lista de prospectos ha sido exportada. Puedes usar este archivo para importar de nuevo."
    });
  }, [filteredLeads, companies]);

  const handleImportExcel = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const XLSX = await import('xlsx');
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
          notes: getIdx(['notas', 'notas adicionales', 'notes', 'comentarios']),
          managingCompany: getIdx(['empresa gestora', 'managing company', 'unidad de negocio', 'gestora'])
        };

        const leadsToInsert = jsonData.slice(1).map(row => {
          const getName = () => row[colIdx.name] || row[colIdx.contact] || null;
          if (!getName()) return null;

          const rawCompanyName = row[colIdx.managingCompany] ? String(row[colIdx.managingCompany]).trim() : '';
          const matchedCompany = companies.find(c => c.name.toLowerCase() === rawCompanyName.toLowerCase());
          const managingCompanyId = matchedCompany ? matchedCompany.id : 'comp-1';

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
              managingCompanyId: managingCompanyId,
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

        await fetchData({force: true});
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
  }, [user, supabase, fetchData, companies]);

  React.useEffect(() => {
    const handleOpenEdit = (e) => {
      const lead = e.detail;
      openDialog('edit', lead);
    };
    const handleOpenManageCompanies = () => {
      setManageCompaniesOpen(true);
    };
    window.addEventListener('open-edit-lead', handleOpenEdit);
    window.addEventListener('open-manage-companies', handleOpenManageCompanies);
    return () => {
      window.removeEventListener('open-edit-lead', handleOpenEdit);
      window.removeEventListener('open-manage-companies', handleOpenManageCompanies);
    };
  }, [openDialog]);

  if (loading && (!leads || leads.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Target className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Helmet>
        <title>Prospectos | Consola Estratégica KYRO</title>
      </Helmet>

      {/* Futuristic Background System */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Digital Grid */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        
        {/* Scanning Line Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-[2px] w-full animate-scan" style={{ top: '-100%' }} />
      </div>

      <div className="relative z-10 p-3 md:p-4 max-w-[1700px] mx-auto space-y-2">
        {dataError && <div role="alert" className="rounded-xl border border-amber-500/30 bg-card p-3 text-sm">{dataError} <Button variant="outline" size="sm" onClick={() => fetchData({force: true})}>Reintentar</Button></div>}
        <LeadsHeader
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
          companies={companies}
          selectedCompanyIds={selectedCompanyIds}
          onToggleCompany={handleToggleCompany}
          onManageCompanies={() => setManageCompaniesOpen(true)}
          onOpenCalculator={() => setIsStandaloneCalcOpen(true)}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="Contacto de prospectos" className="flex flex-wrap items-center gap-1.5">
            {[['all','Todos los contactos'],['today','Contactados hoy'],['pending','Pendientes hoy']].map(([value,label]) => <button key={value} type="button" aria-pressed={filters.contact === value} disabled={!contactsReady && value !== 'all'} onClick={() => setFilters(previous => ({...previous,contact:value}))} className={`min-h-9 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${filters.contact === value ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.1)]' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{label}</button>)}
          </div>
          <LeadFilterButton open={filtersOpen} onClick={() => setFiltersOpen(open => !open)} count={filterCount} />
        </div>
        {contactError && <p role="alert" className="text-xs text-amber-400">No se pudo sincronizar el último contacto. <button type="button" onClick={refreshContacts} className="underline focus-visible:ring-2 focus-visible:ring-primary">Reintentar</button></p>}
        <LeadFilters open={filtersOpen} filters={filters} setFilters={setFilters}
          status={selectedStatus} setStatus={setSelectedStatus} sort={sortMode} setSort={setSortMode}
          margin={scenarioMargin} setMargin={setScenarioMargin} onReset={resetFilters} months={availableMonths} resultCount={filteredLeads.length} contactsReady={contactsReady} />
        <LeadFinancialSummary summary={analysisSummary} total={leads.length} basis={filters.basis}
          dateLabel={DATE_FIELDS[filters.dateField]} dateSelection={dateSelection} margin={scenarioMargin} setMargin={setScenarioMargin}
          onReset={resetFilters} active={filterCount} />

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
            companies={companies}
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
                    companies={companies}
                    onUpdateField={updateLeadAndLastActivity}
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
                companies={companies}
                onUpdateField={updateLeadAndLastActivity}
              />
            )}

            {viewMode === 'kanban' && (
              <LeadsKanban
                leads={filteredLeads}
                onView={(lead) => openDialog('view', lead)}
                onOpenConversation={(lead) => openDialog('conversation', lead)}
                companies={companies}
                onUpdateField={updateLeadAndLastActivity}
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

      {detailsLoading && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-xl border border-primary/30 bg-card p-4">Abriendo ficha y documentos…</div>}
      <Suspense fallback={<div role="status" className="fixed bottom-5 right-5 z-50 rounded-xl border border-primary/30 bg-card p-4">Abriendo…</div>}>
      {dialogState.view && (<ViewLeadDialog
        detailsLoaded
        key={selectedLead?.id || 'none'}
        isOpen={dialogState.view}
        setIsOpen={(isOpen) => setDialogState(prev => ({ ...prev, view: isOpen }))}
        lead={selectedLead}
        initialPdf={initialPdf}
        onUpdate={updateLead}
        onOpenConversation={(lead) => openDialog('conversation', lead)}
        companies={companies}
      />) }
      {dialogState.edit && (<EditLeadDialog
        isOpen={dialogState.edit}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, edit: isOpen }))}
        lead={selectedLead}
        onUpdate={updateLead}
        companies={companies}
      />) }
      {dialogState.delete && (<DeleteLeadDialog
        isOpen={dialogState.delete}
        setIsOpen={(isOpen) => setDialogState(prev => ({ ...prev, delete: isOpen }))}
        lead={selectedLead}
        onDelete={removeLead}
      />) }
      {dialogState.new && (<NewLeadDialog
        open={dialogState.new}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, new: isOpen }))}
        onSubmit={handleCreateLead}
        companies={companies}
      />) }
      {dialogState.followUp && (<FollowUpDialog
        open={dialogState.followUp}
        onOpenChange={closeDialogs}
        lead={selectedLead}
        actionType={followUpAction}
        onSchedule={handleScheduleFollowUp}
        onUpdate={updateLeadAndLastActivity}
      />) }
      {dialogState.conversation && (<LeadConversationDialog
        isOpen={dialogState.conversation}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, conversation: isOpen }))}
        lead={selectedLead}
        onSave={updateLeadAndLastActivity}
      />) }
      {manageCompaniesOpen && (<ManageCompaniesDialog
        isOpen={manageCompaniesOpen}
        onOpenChange={setManageCompaniesOpen}
        companies={companies}
        onSave={handleSaveCompanies}
      />) }

      {isStandaloneCalcOpen && (
        <LeadQuoteCalculator
          isOpen={isStandaloneCalcOpen}
          onClose={() => setIsStandaloneCalcOpen(false)}
          machine={{}}
          clientCompany="Simulación Independiente"
          clientName="Usuario Interno"
          location="No especificada"
          onApply={() => {
            setIsStandaloneCalcOpen(false);
            toast({
              title: "Simulación Cerrada",
              description: "Los datos de la simulación no se guardan ya que es un cálculo independiente.",
            });
          }}
        />
      )}
      </Suspense>
    </div>
  );
};

export default Leads;

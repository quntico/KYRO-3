import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { toast } from '@/components/ui/use-toast';
import {
  File, Send, FileText, Calendar, Video, Gem, CheckCircle,
  Circle, Download, ExternalLink, X, User, Mail, Phone,
  Package, Activity, Target, MessageSquare, Check, Copy, Edit, Calculator
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LeadQuoteCalculator from './LeadQuoteCalculator';
import ExportPdfDialog from './ExportPdfDialog';
import { Label } from "@/components/ui/label";

const activitySteps = [
  { id: 'quotationSent', label: 'Cotización Enviada', Icon: Send },
  { id: 'quotationReview', label: 'Revisión de Cotización', Icon: FileText },
  { id: 'appointment', label: 'Cita', Icon: Calendar },
  { id: 'zoom', label: 'Zoom', Icon: Video },
  { id: 'closing', label: 'Próximo a Cierre', Icon: Gem },
];

const safeFormatDate = (dateSource, formatStr = "dd/MM/yy") => {
  if (!dateSource) return '';
  try {
    const d = (dateSource instanceof Date) ? dateSource : new Date(dateSource);
    if (isNaN(d.getTime())) return '';
    return format(d, formatStr, { locale: es });
  } catch (e) {
    return '';
  }
};

const ViewLeadDialog = ({ isOpen, setIsOpen, lead, onUpdate, onOpenConversation, initialPdf, companies = [] }) => {
  const { theme } = useTheme();
  const [activityStatus, setActivityStatus] = useState({});
  const [viewingPdf, setViewingPdf] = useState(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState(null);
  const [copied, setCopied] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [calcMachineIndex, setCalcMachineIndex] = useState(null);
  const [pdfExportMachineIndex, setPdfExportMachineIndex] = useState(null);
  const [isEditingClientCode, setIsEditingClientCode] = useState(false);
  const [newClientCode, setNewClientCode] = useState('');
  const [isSavingClientCode, setIsSavingClientCode] = useState(false);

  useEffect(() => {
    if (isOpen && initialPdf) {
      setViewingPdf(initialPdf);
    }
  }, [isOpen, initialPdf]);

  useEffect(() => {
    if (isOpen && lead) {
      if (lead.quotations) setQuotations(lead.quotations);
      else setQuotations([]);

      const fetchHeavyData = async () => {
        const { data } = await supabase.from('leads').select('quotations').eq('id', lead.id).single();
        if (data && data.quotations) {
            setQuotations(data.quotations);
        }
      };
      fetchHeavyData();
    }
  }, [isOpen, lead]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: "Copiado",
      description: `${type === 'email' ? 'Correo' : 'Teléfono'} al portapapeles.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    if (isOpen && lead) {
      setActivityStatus(lead.activity_status || {});
    }
    if (!isOpen) {
      setViewingPdf(null);
      setCalcMachineIndex(null);
      setPdfExportMachineIndex(null);
    }
  }, [isOpen, lead]);

  useEffect(() => {
    if (viewingPdf) {
      // Si ya es un blob URL, no hacer nada
      if (viewingPdf.url?.startsWith('blob:')) {
        setPdfObjectUrl(viewingPdf.url);
        return;
      }

      // Si es una URL directa (http/https), usarla directamente
      if (viewingPdf.url?.startsWith('http')) {
        setPdfObjectUrl(viewingPdf.url);
        return;
      }

      // Si es base64, procesar a Blob
      if (viewingPdf.url?.startsWith('data:application/pdf;base64,')) {
        try {
          const base64String = viewingPdf.url.split(',')[1];
          const byteCharacters = atob(base64String);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const objectUrl = URL.createObjectURL(blob);
          setPdfObjectUrl(objectUrl);

          return () => {
            URL.revokeObjectURL(objectUrl);
            setPdfObjectUrl(null);
          };
        } catch (error) {
          console.error("PDF Processing error:", error);
          toast({ title: "Error al procesar PDF", description: "El formato interno del archivo no es válido.", variant: "destructive" });
          setViewingPdf(null);
        }
      } else {
        // Formato desconocido o URL malformada
        toast({ title: "Error de formato", description: "No se reconoce el origen del documento.", variant: "destructive" });
        setViewingPdf(null);
      }
    }
  }, [viewingPdf]);

  const handleStatusChange = useCallback((stepId) => {
    setActivityStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      const step = newStatus[stepId];

      newStatus[stepId] = {
        checked: !step?.checked,
        date: !step?.checked ? new Date().toISOString() : null,
      };

      return newStatus;
    });
  }, []);

  const handleSaveStatus = useCallback(async () => {
    if (!lead) return;
    const firstUncheckedStep = activitySteps.find(step => !activityStatus[step.id]?.checked);
    const nextStep = firstUncheckedStep
      ? { type: firstUncheckedStep.label, date: null }
      : { type: 'Cierre Completado', date: new Date().toISOString() };

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({ activity_status: activityStatus, next_step: nextStep, last_activity: new Date().toISOString() })
      .eq('id', lead.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" });
    } else {
      onUpdate(updatedLead.id, updatedLead);
      toast({ title: "Estado Actualizado", description: "Se ha registrado el nuevo avance." });
    }
  }, [lead, activityStatus, onUpdate]);

  const handleLeadStatusChange = useCallback(async (newStatus) => {
    if (!lead) return;
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

    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({ status: newStatus, score: newScore, last_activity: new Date().toISOString() })
      .eq('id', lead.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" });
    } else {
      onUpdate(updatedLead.id, updatedLead);
      toast({ title: "¡Estatus Actualizado!", description: `El prospecto ha sido marcado como ${statusNames[newStatus] || newStatus}.` });
    }
  }, [lead, onUpdate]);

  const handleViewPdf = useCallback((file) => {
    if (!file?.url) {
      toast({ title: "Error", description: "El documento no tiene una ubicación válida.", variant: "destructive" });
      return;
    }
    setViewingPdf(file);
  }, []);

  const downloadPdf = useCallback((file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.fileName || 'cotizacion.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleSaveClientCode = useCallback(async () => {
    if (!lead) return;
    setIsSavingClientCode(true);
    try {
      const updatedActivityStatus = {
        ...(lead.activity_status || {}),
        client_code: newClientCode
      };

      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update({ activity_status: updatedActivityStatus })
        .eq('id', lead.id)
        .select()
        .single();

      if (error) {
        toast({ title: "Error al actualizar número de cliente", description: error.message, variant: "destructive" });
      } else {
        onUpdate(updatedLead.id, updatedLead);
        toast({ title: "¡Número de Cliente Guardado!", description: `Se ha asignado el Nº "${newClientCode}" correctamente.` });
        setIsEditingClientCode(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingClientCode(false);
    }
  }, [lead, newClientCode, onUpdate]);

  const handleApplyQuote = useCallback(async (index, updatedMachine) => {
    if (!lead) return;
    const newMachines = [...(lead.machines || [])];
    newMachines[index] = updatedMachine;
    
    const totalValue = newMachines.reduce((sum, m) => sum + (Number(m.price || m.salePrice) || 0), 0);
    const totalCommission = newMachines.reduce((sum, m) => sum + (Number(m.commission) || Number(m.estimated_commission) || 0), 0);
    
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({ 
        machines: newMachines,
        value: totalValue,
        commission: totalCommission,
        last_activity: new Date().toISOString()
      })
      .eq('id', lead.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al actualizar cotización", description: error.message, variant: "destructive" });
    } else {
      onUpdate(updatedLead.id, updatedLead);
      toast({ title: "Cotización Aplicada", description: "Se ha actualizado la ingeniería financiera del prospecto." });
    }
  }, [lead, onUpdate]);

  if (!lead) return null;

  const matchedCompany = companies.find(c => c.id === lead?.activity_status?.managingCompanyId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`sm:max-w-[580px] max-h-[90vh] flex flex-col p-0 overflow-hidden border border-border bg-card text-foreground shadow-2xl [&>button]:hidden ${viewingPdf ? "sm:max-w-5xl h-[95vh]" : ""}`}>
        {viewingPdf ? (
          <div className="flex flex-col h-full p-6 bg-background">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground tracking-tight">Visor: {viewingPdf.fileName}</DialogTitle>
                <DialogDescription className="text-muted-foreground">Revisando documento para {lead.name}.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPdf(viewingPdf)}
                  className="border-border text-foreground hover:bg-secondary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingPdf(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cerrar Visor
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </Button>
                </DialogClose>
              </div>
            </div>
            <div className="flex-grow w-full bg-secondary/50 rounded-xl overflow-hidden border border-border shadow-inner">
              {pdfObjectUrl && (
                <iframe
                  src={pdfObjectUrl}
                  title={viewingPdf.fileName}
                  className="w-full h-full"
                  frameBorder="0"
                ></iframe>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 h-full bg-background text-foreground">
            {/* Header de la Ficha */}
            <div className="p-6 pb-4 border-b border-border bg-secondary/10 relative overflow-hidden flex-shrink-0">
              <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary-hover); }
              `}} />
              <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-all flex items-center gap-1.5 hover:brightness-125 hover:scale-[1.02] active:scale-95 ${
                        lead.status === 'closing' ? 'bg-[#00D4FF]/20 border-[#00D4FF]/50 text-[#00D4FF]' :
                        lead.status === 'hot' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                        lead.status === 'warming' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                        lead.status === 'warm' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                        lead.status === 'cooling' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' :
                        lead.status === 'cold' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                        lead.status === 'new' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                        'bg-slate-500/20 border-slate-500/50 text-slate-400'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {
                        lead.status === 'closing' ? '🚀 Cierre' :
                        lead.status === 'hot' ? '🔥 Caliente' :
                        lead.status === 'warming' ? '📈 Avanzando' :
                        lead.status === 'warm' ? '⚡ Tibio' :
                        lead.status === 'cooling' ? '📉 Enfriando' :
                        lead.status === 'cold' ? '❄️ Frío' :
                        lead.status === 'new' ? '🎯 Nuevo' :
                        '💼 Perdido'
                      }
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border border-border text-popover-foreground z-50 font-black text-[10px] uppercase tracking-widest rounded-xl">
                    <DropdownMenuRadioGroup value={lead.status} onValueChange={handleLeadStatusChange}>
                      <DropdownMenuRadioItem value="closing" className="focus:bg-[#00D4FF]/20 focus:text-[#00D4FF] cursor-pointer rounded-lg m-1">
                        🚀 Cierre
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="hot" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer rounded-lg m-1">
                        🔥 Caliente
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="warming" className="focus:bg-emerald-500/20 focus:text-emerald-400 cursor-pointer rounded-lg m-1">
                        📈 Avanzando
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="warm" className="focus:bg-orange-500/20 focus:text-orange-400 cursor-pointer rounded-lg m-1">
                        ⚡ Tibio
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="cooling" className="focus:bg-cyan-500/20 focus:text-cyan-400 cursor-pointer rounded-lg m-1">
                        📉 Enfriando
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="cold" className="focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer rounded-lg m-1">
                        ❄️ Frío
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="new" className="focus:bg-purple-500/20 focus:text-purple-400 cursor-pointer rounded-lg m-1">
                        🎯 Nuevo
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="declined" className="focus:bg-[#8B4513]/20 focus:text-[#D2691E] cursor-pointer rounded-lg m-1">
                        💼 Perdido
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground hover:bg-secondary rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </Button>
                </DialogClose>
              </div>

              <DialogHeader className="text-left">
                <DialogTitle className="text-4xl font-black text-foreground tracking-tight mb-2 uppercase">
                  {String(lead?.name || 'Prospecto sin nombre')}
                </DialogTitle>
                <div className="flex items-center gap-3 text-primary font-bold tracking-widest text-sm uppercase opacity-90 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <User className="w-4 h-4 text-primary" />
                    {String(lead?.contact || 'Sin contacto')}
                  </div>
                  <span className="w-2 h-[2px] bg-border hidden sm:inline" />
                  <button
                    onClick={() => {
                      setNewClientCode(lead.activity_status?.client_code || '');
                      setIsEditingClientCode(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-black tracking-widest border transition-all duration-200 cursor-pointer bg-[#0047FF]/10 border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#0047FF]/20 active:scale-95"
                    title="Editar número de cliente / cotización"
                  >
                    <FileText className="w-4 h-4 text-[#00D4FF]" />
                    {lead.activity_status?.client_code ? (
                      <>Nº {lead.activity_status.client_code}</>
                    ) : (
                      <span className="text-[#00D4FF]/80 italic font-bold uppercase tracking-wider">Asignar Nº Cliente</span>
                    )}
                  </button>
                  {matchedCompany && (
                    <>
                      <span className="w-2 h-[2px] bg-border hidden sm:inline" />
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black tracking-widest border border-border bg-secondary text-foreground">
                        {matchedCompany.logo ? (
                          <img src={matchedCompany.logo} alt={matchedCompany.name} className="h-4 w-auto max-w-[50px] object-contain rounded" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded bg-secondary text-muted-foreground flex items-center justify-center text-[7px] font-black">
                            {matchedCompany.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span>{matchedCompany.name}</span>
                      </div>
                    </>
                  )}
                </div>
              </DialogHeader>

              {/* Metas/Stats Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                <div className="bg-secondary/40 p-2 rounded-xl border border-border text-center flex sm:flex-col justify-between items-center sm:justify-center px-4 sm:px-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Score</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{lead.score}/100</div>
                </div>
                <div className="bg-secondary/40 p-2 rounded-xl border border-border text-center flex sm:flex-col justify-between items-center sm:justify-center px-4 sm:px-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Venta</div>
                  <div className="text-lg font-bold text-primary">${(lead.value || 0).toLocaleString()} USD</div>
                </div>
                <div className="bg-secondary/40 p-2 rounded-xl border border-border text-center flex sm:flex-col justify-between items-center sm:justify-center px-4 sm:px-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Utilidad</div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-500">${(lead.commission || 0).toLocaleString()} USD</div>
                </div>
              </div>
            </div>

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 bg-secondary/10 custom-scrollbar">
              {/* Radiografía de Notas/Avance (Chat Bubble Style) */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 font-mono">
                  <MessageSquare className="w-3 h-3 text-primary" /> SEGUIMIENTO
                </h3>
                {(() => {
                  const lastNote = lead.notes ? (() => {
                    try {
                      const parsed = JSON.parse(lead.notes);
                      return Array.isArray(parsed) ? parsed[parsed.length - 1] : { text: lead.notes, date: lead.last_activity };
                    } catch (e) {
                      return { text: lead.notes, date: lead.last_activity };
                    }
                  })() : null;

                  return lastNote ? (
                    <div
                      className="relative group cursor-pointer active:scale-[0.98] transition-all"
                      onClick={() => onOpenConversation(lead)}
                    >
                      <div className="absolute -top-3 right-4 px-2 py-0.5 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full z-10 group-hover:bg-primary/40 transition-colors shadow-lg">
                        <span className="text-[10px] font-mono text-primary font-bold">
                          {lastNote.date ? safeFormatDate(lastNote.date, "iii dd, HH:mm") : ''}
                        </span>
                      </div>
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-md relative group-hover:bg-secondary/40 transition-colors overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-all" />
                        <p className="text-lg font-bold text-foreground leading-tight mb-2">
                          {typeof lastNote.text === 'string' ? lastNote.text : (typeof lastNote.text === 'object' ? 'Ver detalles en edición...' : String(lastNote.text))}
                        </p>
                        <div className="flex items-center gap-2 opacity-40 text-muted-foreground">
                          <Activity className="w-3 h-3" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Toca para abrir bitácora completa</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-6 rounded-3xl border border-dashed border-border text-center cursor-pointer hover:bg-secondary/40 transition-colors"
                      onClick={() => onOpenConversation(lead)}
                    >
                      <span className="text-xs text-muted-foreground/60 italic">No hay notas registradas. Toca para añadir una.</span>
                    </div>
                  );
                })()}
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                  <Target className="w-3 h-3 text-primary" /> Ficha de Enlace
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border group hover:bg-secondary/40 transition-colors cursor-pointer" onClick={() => handleCopy(lead.email, 'email')}>
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="overflow-hidden flex-1 group/copy cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="text-[9px] uppercase font-bold text-muted-foreground mb-1">E-mail Principal</div>
                        {copied === 'email' ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground/35 group-hover/copy:text-primary transition-colors" />}
                      </div>
                      <div className="text-sm text-foreground font-medium break-all">{lead.email || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border group hover:bg-secondary/40 transition-colors cursor-pointer" onClick={() => handleCopy(lead.phone, 'phone')}>
                    <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="overflow-hidden flex-1 group/copy cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Teléfono Directo</div>
                        {copied === 'phone' ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground/35 group-hover/copy:text-primary transition-colors" />}
                      </div>
                      <div className="text-sm text-foreground font-medium break-all flex items-center gap-1.5 flex-wrap">
                        <span>{lead.phone || 'N/A'}</span>
                        {lead.source && lead.source !== 'Manual Entry' && lead.source !== 'Excel Import' && lead.source !== 'Convertido de Contacto' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-md font-bold uppercase tracking-wider">
                            {lead.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proyectos/Máquinas */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                  <Package className="w-3 h-3 text-primary" /> Especificaciones de Interés
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {lead.machines && lead.machines.length > 0 ? (
                    lead.machines.filter(Boolean).map((m, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-5 rounded-2xl border-l-[6px] border-l-primary border border-border shadow group hover:bg-secondary/40 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-secondary rounded-lg group-hover:scale-110 transition-transform">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-black text-foreground text-base tracking-tight uppercase">{m?.name || 'Máquina'}</div>
                            {m?.costChina !== undefined && (
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                Costo Base: ${Number(m.costChina).toLocaleString()} USD | TC: ${m.exchangeRate || 18.0} {m.divideByTwo ? ' (TC/2)' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <div className="text-primary font-black text-lg mr-2">
                            ${Number(m?.price || 0).toLocaleString()} USD
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCalcMachineIndex(i);
                              }}
                              className="text-primary hover:bg-primary/10 h-8 w-8 flex-shrink-0"
                              title="Calcular costos y utilidad"
                            >
                              <Calculator className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPdfExportMachineIndex(i);
                              }}
                              className="bg-primary hover:bg-primary/80 text-primary-foreground h-8 px-2.5 rounded-lg flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                              title="Exportar Radiografía Interna a PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-card border border-border text-xs text-muted-foreground/60 italic">
                      No hay máquinas o proyectos vinculados.
                    </div>
                  )}
                </div>
              </div>

              {/* Status de Actividad - Pipeline */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-primary" /> Progreso del Cierre
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {activitySteps.map(({ id, label, Icon }) => {
                    const isChecked = activityStatus[id]?.checked;
                    return (
                      <div
                        key={id}
                        onClick={() => handleStatusChange(id)}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 group ${isChecked
                          ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.05)] text-foreground'
                          : 'bg-card border-border opacity-60 hover:opacity-100 hover:bg-secondary/40 text-foreground/80'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <Icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                          <span className={`text-sm font-bold tracking-tight ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {label}
                          </span>
                        </div>
                        {isChecked ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-mono">
                              {safeFormatDate(activityStatus[id]?.date)}
                            </span>
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground/50" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cotizaciones */}
              {quotations && quotations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                    <FileText className="w-3 h-3 text-primary" /> Documentos Adjuntos
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {quotations.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border hover:bg-secondary/40 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden mr-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <File className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-foreground/90 truncate tracking-tight">{file?.fileName || 'Documento'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewPdf(file)} className="text-primary hover:bg-primary/10">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadPdf(file)} className="text-muted-foreground hover:text-foreground">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer de la Ficha */}
            <div className="p-6 border-t border-border bg-secondary/10 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSaveStatus}
                  className="bg-primary text-primary-foreground font-black uppercase tracking-widest py-5 rounded-2xl shadow-[0_4px_20px_rgba(var(--primary),0.2)] hover:scale-[1.02] active:scale-95 transition-all text-xs"
                >
                  Confirmar Cambios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-edit-lead', { detail: lead }));
                    }, 100);
                  }}
                  className="border-border text-foreground font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-secondary transition-all text-xs"
                >
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      {calcMachineIndex !== null && (
        <LeadQuoteCalculator
          isOpen={calcMachineIndex !== null}
          onClose={() => setCalcMachineIndex(null)}
          location={lead.source}
          clientName={lead.contact}
          clientCompany={lead.name}
          machine={lead.machines?.[calcMachineIndex]}
          onApply={(updatedMachine) => handleApplyQuote(calcMachineIndex, updatedMachine)}
        />
      )}
      {pdfExportMachineIndex !== null && (
        <ExportPdfDialog
          isOpen={pdfExportMachineIndex !== null}
          onClose={() => setPdfExportMachineIndex(null)}
          clientCompany={lead.name}
          clientName={lead.contact}
          location={lead.source}
          machine={lead.machines?.[pdfExportMachineIndex]}
        />
      )}
      <Dialog open={isEditingClientCode} onOpenChange={setIsEditingClientCode}>
        <DialogContent className="sm:max-w-[400px] glass-bevel border-border shadow-2xl p-6 bg-card text-foreground z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wider text-foreground">Numeración del Cliente</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Introduce el número de cotización o de cliente para este prospecto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="popup_client_code" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Nº de Cotización / Cliente</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  id="popup_client_code"
                  value={newClientCode}
                  onChange={(e) => setNewClientCode(e.target.value)}
                  placeholder="Ej: C-1002"
                  className="pl-10 bg-secondary/50 border-border focus:border-primary/50 text-foreground rounded-lg h-10 w-full"
                  autoFocus
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingClientCode(false)}
              className="border-border text-foreground hover:bg-secondary h-10 font-bold uppercase tracking-wider text-[10px] rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveClientCode}
              disabled={isSavingClientCode}
              className="bg-primary hover:bg-primary/80 text-primary-foreground h-10 font-bold uppercase tracking-wider text-[10px] rounded-lg"
            >
              {isSavingClientCode ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default React.memo(ViewLeadDialog);
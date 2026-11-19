import './lead-card.css';
import LeadContactRow from './LeadContactRow';
import { SALE_STAGES } from '@/lib/dealConversion';
import { displayDate, money } from '@/lib/leadAnalysis';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Target, Banknote, Mail, Phone, Edit, Trash2, HeartHandshake, CalendarPlus, Flame, Sun, Snowflake, TrendingUp, TrendingDown, Clock, MessageSquare, ExternalLink, Zap, FileText, FileDown, MoreHorizontal, Check, ChevronDown, Undo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/contexts/ThemeContext.jsx';

const getStatusPill = (status, isLightTheme) => {
  if (isLightTheme) {
    switch (status) {
      case 'hot': return 'border-red-200 bg-red-50 text-red-600';
      case 'closing': return 'border-blue-200 bg-blue-50 text-blue-600';
      case 'warming': return 'border-emerald-200 bg-emerald-50 text-emerald-600';
      case 'warm': return 'border-orange-200 bg-orange-50 text-orange-600';
      case '2027': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'cooling': return 'border-cyan-200 bg-cyan-50 text-cyan-700';
      case 'cold': return 'border-blue-200 bg-blue-50 text-blue-600';
      case 'new': return 'border-purple-200 bg-purple-50 text-purple-600';
      case 'declined': return 'border-amber-200 bg-amber-50 text-amber-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  }
  switch (status) {
    case 'hot': return 'border-red-500/30 bg-red-500/10 text-red-400';
    case 'closing': return 'border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF]';
    case 'warming': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    case 'warm': return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
    case '2027': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
    case 'cooling': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
    case 'cold': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    case 'new': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
    case 'declined': return 'border-[#8B4513]/30 bg-[#8B4513]/10 text-[#D2691E]';
    default: return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
  }
};

const getStatusName = (status) => {
  switch (status) {
    case 'closing': return 'Cierre';
    case 'hot': return 'Caliente';
    case 'warming': return 'Avanzando';
    case 'warm': return 'Tibio';
    case '2027': return '2027';
    case 'cooling': return 'Enfriando';
    case 'cold': return 'Frío';
    case 'new': return 'Nuevo';
    case 'declined': return 'Perdido';
    default: return status ? status.toUpperCase() : 'SIN DEFINIR';
  }
};

const getDerivedScore = (status, originalScore) => {
  switch (status) {
    case 'closing': return 98;
    case 'hot': return 88;
    case 'warming': return 75;
    case 'warm': return 60;
    case 'cooling': return 45;
    case 'cold': return 25;
    case 'declined': return 10;
    case 'new': return 0;
    default: return originalScore || 0;
  }
};

const getStatusTextColor = (status, isLightTheme) => {
  if (isLightTheme) {
    switch (status) {
      case 'hot': return 'text-red-600';
      case 'closing': return 'text-[#005AB5]';
      case 'warming': return 'text-emerald-600';
      case 'warm': return 'text-orange-600';
      case '2027': return 'text-yellow-700';
      case 'cooling': return 'text-cyan-700';
      case 'cold': return 'text-blue-600';
      case 'new': return 'text-purple-600';
      case 'declined': return 'text-[#8B4513]';
      default: return 'text-foreground';
    }
  }
  switch (status) {
    case 'hot': return 'text-red-400';
    case 'closing': return 'text-[#00D4FF]';
    case 'warming': return 'text-emerald-400';
    case 'warm': return 'text-orange-400';
    case '2027': return 'text-yellow-400';
    case 'cooling': return 'text-cyan-400';
    case 'cold': return 'text-blue-400';
    case 'new': return 'text-purple-400';
    case 'declined': return 'text-[#D2691E]';
    default: return 'text-white';
  }
};

const ModernLeadCard = ({ lead, index, onView, onEdit, onDelete, onStatusChange, onConvertToDeal, onQuickFollowUp, onNextStepChange, onOpenConversation, onUpdateField, companies = [], sale = null }) => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'recilogic' || theme === 'light' || !theme;

  const matchedCompany = (companies || []).find(c => c.id === (lead.activity_status?.managingCompanyId || 'comp-1'));
  const [quotationNumber, setQuotationNumber] = useState(lead.quotationNumber || '');
  const [isEditingQT, setIsEditingQT] = useState(!lead.quotationNumber);

  useEffect(() => {
    setQuotationNumber(lead.quotationNumber || '');
    if (lead.quotationNumber) setIsEditingQT(false);
  }, [lead.quotationNumber]);

  const handleQuotationSave = (e) => {
    if (e) e.stopPropagation();
    if (quotationNumber !== (lead.quotationNumber || '')) {
      if (onUpdateField) {
        onUpdateField(lead.id, { quotationNumber });
      }
    }
    setIsEditingQT(false);
  };

  const handleExportGenerals = async (e) => {
    e.stopPropagation();
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Generales del Cliente', 14, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${lead.name || 'N/A'}`, 14, 40);
    doc.text(`Contacto: ${lead.contact || 'N/A'}`, 14, 50);
    doc.text(`Cargo: ${lead.position || 'N/A'}`, 14, 60);
    doc.text(`Email: ${lead.email || 'N/A'}`, 14, 70);
    doc.text(`Teléfono: ${lead.phone || 'N/A'}`, 14, 80);
    doc.text(`Valor Estimado: $${(lead.value || 0).toLocaleString()}`, 14, 90);
    if (quotationNumber) {
        doc.text(`Cotización: ${quotationNumber}`, 14, 100);
    }

    doc.save(`Generales_${(lead.name || 'Cliente').replace(/\s+/g, '_')}.pdf`);
  };

  const statusPill = getStatusPill(lead.status, isLightTheme);
  const statusName = sale ? (SALE_STAGES.find(([id]) => id === sale.stage)?.[1] || sale.stage) : getStatusName(lead.status);
  const displayScore = getDerivedScore(lead.status, lead.score);
  const statusTextColor = getStatusTextColor(lead.status, isLightTheme);

  const lastUpdateRaw = lead.created_at || null;
  const formattedDate = lastUpdateRaw ? new Date(lastUpdateRaw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase() : 'SIN FECHA';

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 280px' }}
      onClick={() => onView(lead)}
      className="kyro-client-card"
    >
      <header className="client-heading">
        <div className="client-heading-meta">
          <span>Empresa</span>
          <span className="client-record-id">#{lead.sourceLeadId || lead.id}</span>
        </div>
        <h3>{lead.name?.trim() || 'Sin registrar'}</h3>
        <div className="client-status" onClick={event => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={`client-status-button ${statusPill}`}
              >
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                {statusName}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              onClick={(e) => e.stopPropagation()}
              align="end"
              className="bg-popover border border-border text-popover-foreground z-50 font-black text-[10px] uppercase tracking-widest rounded-xl"
            >
              <DropdownMenuRadioGroup value={sale ? sale.stage : lead.status} onValueChange={(newStatus) => sale ? sale.onStageChange(newStatus) : onStatusChange(lead.id, newStatus)}>
                {sale ? SALE_STAGES.map(([id,label]) => <DropdownMenuRadioItem key={id} value={id} className="cursor-pointer rounded-lg m-1">{label}</DropdownMenuRadioItem>) : <>
                <DropdownMenuRadioItem value="closing" className="focus:bg-[#00D4FF]/20 focus:text-[#00D4FF] cursor-pointer rounded-lg m-1">
                  <Zap className="w-3.5 h-3.5 mr-2 text-[#00D4FF]" /> Cierre
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hot" className="focus:bg-red-500/20 focus:text-red-400 cursor-pointer rounded-lg m-1">
                  <Flame className="w-3.5 h-3.5 mr-2 text-red-500" /> Caliente
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="warming" className="focus:bg-emerald-500/20 focus:text-emerald-400 cursor-pointer rounded-lg m-1">
                  <TrendingUp className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Avanzando
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="warm" className="focus:bg-orange-500/20 focus:text-orange-400 cursor-pointer rounded-lg m-1">
                  <Sun className="w-3.5 h-3.5 mr-2 text-orange-500" /> Tibio
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cooling" className="focus:bg-cyan-500/20 focus:text-cyan-400 cursor-pointer rounded-lg m-1">
                  <TrendingDown className="w-3.5 h-3.5 mr-2 text-cyan-500" /> Enfriando
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cold" className="focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer rounded-lg m-1">
                  <Snowflake className="w-3.5 h-3.5 mr-2 text-blue-500" /> Frío
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="new" className="focus:bg-purple-500/20 focus:text-purple-400 cursor-pointer rounded-lg m-1">
                  <Target className="w-3.5 h-3.5 mr-2 text-purple-500" /> Nuevo
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="2027" className="text-yellow-500 focus:bg-yellow-500/20 focus:text-yellow-400 cursor-pointer rounded-lg m-1">
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-yellow-500" /> 2027
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="declined" className="focus:bg-[#8B4513]/20 focus:text-[#D2691E] cursor-pointer rounded-lg m-1">
                  <TrendingDown className="w-3.5 h-3.5 mr-2 text-[#8B4513]" /> Perdido
                </DropdownMenuRadioItem>
                </>}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <LeadContactRow lead={lead} isSale={!!sale} cardLayout>
        <div className="client-financials">
        <div className="min-w-0"><p className="text-[9px] font-semibold text-muted-foreground">{lead.reportBasis === 'document' ? 'Referencia documental' : 'Venta'}</p><p className="text-sm leading-snug font-bold text-foreground [overflow-wrap:anywhere]">{money(lead.financial?.value ?? null, lead.financial?.currency || 'USD')}</p></div>
        <div className="min-w-0"><p className="text-[9px] font-semibold text-muted-foreground">{lead.financial?.scenario ? 'Utilidad simulada' : 'Utilidad posible'}{lead.financial?.profit !== null && !lead.financial?.complete ? ' · parcial' : ''}</p><p className="text-sm leading-snug font-bold text-foreground [overflow-wrap:anywhere]">{money(lead.financial?.profit ?? null, lead.financial?.currency || 'USD')}</p></div>
        <div><p className="text-[9px] font-semibold text-muted-foreground">{sale ? 'Registro' : 'Conversión'}</p><p className={`text-sm leading-snug font-black ${statusTextColor}`}>{sale ? 'Venta' : `${displayScore}%`}</p></div>
      </div>
      </LeadContactRow>
      <div className="client-footer">
      <details className="client-details" onClick={e => e.stopPropagation()}>
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-1 text-[11px] font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
          Contacto y cotización <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </summary>
          <p className="mb-2 mt-3 text-xs text-muted-foreground">Alta en KYRO · {formattedDate}</p>
          <div className="min-w-0 text-[10px] font-black text-muted-foreground/80 uppercase tracking-[0.15em] flex flex-wrap items-center gap-2">
            {matchedCompany && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="inline-flex items-center justify-center p-1 rounded bg-secondary/40 border border-border hover:bg-secondary transition-all cursor-pointer">
                    {matchedCompany.logo ? (
                      <img src={matchedCompany.logo} alt={matchedCompany.name} className="h-5 w-auto max-w-[50px] object-contain rounded" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-[8px] font-black text-muted-foreground/80 uppercase">
                        {matchedCompany.name.slice(0, 2)}
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border border-border text-popover-foreground p-1 rounded-xl min-w-[180px] z-[50]" onClick={(e) => e.stopPropagation()}>
                  <div className="px-2.5 py-1.5 text-[8px] font-black tracking-widest text-muted-foreground uppercase border-b border-border mb-1">
                    Asignar Empresa Gestora
                  </div>
                  {(companies || []).map(c => (
                    <DropdownMenuRadioItem
                      key={c.id}
                      value={c.id}
                      checked={c.id === matchedCompany.id}
                      onClick={() => {
                        if (onUpdateField) {
                          const updatedActivityStatus = {
                            ...(lead.activity_status || {}),
                            managingCompanyId: c.id
                          };
                          onUpdateField(lead.id, { activity_status: updatedActivityStatus });
                        }
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary rounded-lg cursor-pointer transition-colors"
                    >
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="w-4 h-4 rounded object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded bg-secondary flex items-center justify-center text-[8px] font-black text-muted-foreground/80">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{c.name}</span>
                      {c.id === matchedCompany.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                    </DropdownMenuRadioItem>
                  ))}
                  <div className="border-t border-border my-1" />
                  <DropdownMenuRadioItem
                    value="manage"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-manage-companies'));
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 text-[9px] font-black uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer transition-colors"
                  >
                    ⚙️ Gestionar Empresas
                  </DropdownMenuRadioItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
      <div className="space-y-2 text-[11px] font-black tracking-[0.15em] relative z-10 pt-2">
        <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors px-3 py-2 bg-secondary/30 border border-border rounded-full">
           <Mail className="w-4 h-4 mr-3 text-primary/50" />
           <span className="truncate uppercase">{lead.email || 'NO_DATA'}</span>
        </div>

        <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors px-3 py-2 bg-secondary/30 border border-border rounded-full">
           <Phone className="w-4 h-4 mr-3 text-primary/50" />
           <span className="uppercase">{lead.phone || 'NO_DATA'}</span>
        </div>


        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <div
            className={`flex-1 flex items-center bg-secondary/30 border border-border rounded-full px-3 py-2 transition-all ${isEditingQT ? 'focus-within:border-primary/50' : 'cursor-pointer hover:border-border/80'}`}
            onClick={(e) => { e.stopPropagation(); if (!isEditingQT) setIsEditingQT(true); }}
          >
            <span className="text-[10px] text-muted-foreground/60 tracking-[0.15em] mr-2 uppercase shrink-0">QT//</span>
            {isEditingQT ? (
              <>
                <input
                   value={quotationNumber}
                   onChange={(e) => setQuotationNumber(e.target.value)}
                   placeholder="SIN DEFINIR"
                   className="bg-transparent border-none outline-none text-primary font-black text-[11px] w-full focus:ring-0 p-0 tracking-[0.15em] placeholder:text-muted-foreground/30 uppercase"
                   onClick={(e) => e.stopPropagation()}
                   onKeyDown={(e) => { if(e.key === 'Enter') { handleQuotationSave(e); } }}
                 />
                <button
                  onClick={handleQuotationSave}
                  className="w-5 h-5 rounded flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/40 ml-1 shrink-0 transition-colors"
                  title="Guardar Cotización"
                >
                  <Check className="w-3 h-3" />
                </button>
              </>
            ) : (
              <span className="text-primary font-black text-[13px] tracking-[0.2em] uppercase truncate w-full">
                 {quotationNumber || 'SIN DEFINIR'}
              </span>
            )}
          </div>

          <button
            title="Ver Cotización PDF"
            disabled={!(lead.quotations && lead.quotations.length > 0)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              lead.quotations && lead.quotations.length > 0
                ? 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
                : 'bg-secondary/30 border border-border text-muted-foreground/20 cursor-not-allowed'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (lead.quotations && lead.quotations.length > 0) {
                const file = lead.quotations[lead.quotations.length - 1];
                if (file.deferred) onView(lead, file);
                else if (file.url) window.open(file.url, '_blank');
              }
            }}
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            title="Exportar Generales"
            className="w-9 h-9 rounded-full bg-secondary/30 border border-border flex items-center justify-center text-muted-foreground/60 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all shrink-0"
            onClick={handleExportGenerals}
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      </details>

      <div role="group" aria-label={`Acciones de ${lead.name}`} className="client-tools" onClick={e=>e.stopPropagation()}>
        <button type="button" title={sale ? 'Ver venta' : 'Editar'} aria-label={sale ? 'Ver venta' : 'Editar'} onClick={()=>sale ? onView(lead) : onEdit(lead)}>{sale ? <ExternalLink/> : <Edit/>}</button>
        <button type="button" title={sale ? 'Expediente' : 'Bitácora'} aria-label={sale ? 'Expediente' : 'Bitácora'} onClick={()=>sale ? sale.onViewFile() : onOpenConversation(lead)}>{sale ? <FileText/> : <MessageSquare/>}</button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" aria-label="Más acciones" title="Más acciones"><MoreHorizontal/></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={e=>e.stopPropagation()}>
            {sale ? <DropdownMenuItem onSelect={sale.onRevert}><Undo2 className="mr-2 h-4 w-4"/>Regresar a Leads</DropdownMenuItem> : <>
              <DropdownMenuItem onSelect={()=>onQuickFollowUp(lead,'Llamada')}><CalendarPlus className="mr-2 h-4 w-4"/>Agendar seguimiento</DropdownMenuItem>
              <DropdownMenuItem onSelect={()=>onConvertToDeal(lead)}><HeartHandshake className="mr-2 h-4 w-4"/>Convertir a venta</DropdownMenuItem>
            </>}
            <DropdownMenuSeparator/>
            <DropdownMenuItem className="text-red-500" onSelect={()=>sale ? sale.onDelete() : onDelete(lead)}><Trash2 className="mr-2 h-4 w-4"/>{sale ? 'Borrar venta' : 'Eliminar prospecto'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </motion.div>
  );
};

export default ModernLeadCard;

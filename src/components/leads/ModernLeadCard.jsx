import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Banknote, Mail, Phone, Package, Edit, HeartHandshake, CalendarPlus, Flame, Sun, Snowflake, TrendingUp, TrendingDown, Clock, MessageSquare, ExternalLink, Zap, FileText, FileDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ModernLeadCard = ({ lead, index, onView, onEdit, onDelete, onStatusChange, onConvertToDeal, onQuickFollowUp, onNextStepChange, onOpenConversation, onUpdateField }) => {
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

  const handleExportGenerals = (e) => {
    e.stopPropagation();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400';
      case 'closing': return 'from-[#0047FF]/30 to-[#00D4FF]/30 border-[#0047FF]/50 text-[#00D4FF] font-black tracking-widest';
      case 'warming': return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400';
      case 'warm': return 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400';
      case 'cooling': return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400';
      case 'cold': return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400';
      case 'new': return 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400';
      case 'declined': return 'from-[#8B4513]/20 to-[#A0522D]/20 border-[#8B4513]/30 text-[#D2691E]';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getHoverEffects = (status) => {
    switch (status) {
      case 'hot': return { glow: 'from-red-500/20', shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] border-transparent hover:border-red-500/50' };
      case 'closing': return { glow: 'from-[#0047FF]/20', shadow: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.15)] border-transparent hover:border-[#00D4FF]/50' };
      case 'warming': return { glow: 'from-emerald-500/20', shadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] border-transparent hover:border-emerald-500/50' };
      case 'warm': return { glow: 'from-orange-500/20', shadow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] border-transparent hover:border-orange-500/50' };
      case 'cooling': return { glow: 'from-cyan-500/20', shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] border-transparent hover:border-cyan-500/50' };
      case 'cold': return { glow: 'from-blue-500/20', shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] border-transparent hover:border-blue-500/50' };
      case 'new': return { glow: 'from-purple-500/20', shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] border-transparent hover:border-purple-500/50' };
      case 'declined': return { glow: 'from-[#8B4513]/20', shadow: 'hover:shadow-[0_0_30px_rgba(139,69,19,0.15)] border-transparent hover:border-[#8B4513]/50' };
      default: return { glow: 'from-white/5', shadow: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-white/20' };
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'hot': return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'closing': return 'border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF]';
      case 'warming': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'warm': return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
      case 'cooling': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
      case 'cold': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'new': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'declined': return 'border-[#8B4513]/30 bg-[#8B4513]/10 text-[#D2691E]';
      default: return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  const getScoreGradient = (status) => {
    switch (status) {
      case 'hot': return 'from-red-400 to-red-600';
      case 'closing': return 'from-[#00D4FF] to-[#0047FF]';
      case 'warming': return 'from-emerald-400 to-emerald-600';
      case 'warm': return 'from-orange-400 to-orange-600';
      case 'cooling': return 'from-cyan-400 to-cyan-600';
      case 'cold': return 'from-blue-400 to-blue-600';
      case 'new': return 'from-purple-400 to-purple-600';
      case 'declined': return 'from-[#D2691E] to-[#8B4513]';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusName = (status) => {
    switch (status) {
      case 'closing': return 'Cierre';
      case 'hot': return 'Caliente';
      case 'warming': return 'Avanzando';
      case 'warm': return 'Tibio';
      case 'cooling': return 'Enfriando';
      case 'cold': return 'Frío';
      case 'new': return 'Nuevo';
      case 'declined': return 'Perdido';
      default: return status ? status.toUpperCase() : 'UNDEFINED';
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

  const statusGradient = getStatusColor(lead.status);
  const statusPill = getStatusPill(lead.status);
  const scoreGradient = getScoreGradient(lead.status);
  const hoverFx = getHoverEffects(lead.status);
  const statusName = getStatusName(lead.status);
  const displayScore = getDerivedScore(lead.status, lead.score);

  const lastUpdateRaw = lead.lastActivity || lead.updated_at || lead.updatedAt || lead.created_at || new Date().toISOString();
  const formattedDate = new Date(lastUpdateRaw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => onView(lead)}
      className={`relative px-4 pt-4 pb-14 cursor-pointer border border-white/5 bg-[#080808] transition-all duration-300 group flex flex-col h-full rounded-2xl overflow-hidden ${hoverFx.shadow}`}
    >
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${statusGradient.split(' ')[0]} ${statusGradient.split(' ')[1]}`} />
      
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${hoverFx.glow} to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none mix-blend-screen`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="pr-2">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
             <span className="text-[10px] font-black text-white/40 tracking-[0.15em] uppercase whitespace-nowrap">SYS.ID // <span className="text-cyan-400">{String(lead.id || '').substring(0,6)}</span></span>
             <span className="w-1 h-1 rounded-full bg-white/10" />
             <span className="text-[8px] font-black text-white/20 tracking-[0.15em] uppercase whitespace-nowrap flex items-center gap-1">
               <Clock className="w-2.5 h-2.5" /> {formattedDate}
             </span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-0.5 line-clamp-1">
            {lead.name}
          </h3>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.15em] truncate mt-1">{lead.contact}</p>
        </div>
        
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-all flex items-center gap-2 ${statusPill} hover:brightness-125`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {statusName}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              onClick={(e) => e.stopPropagation()}
              align="end" 
              className="bg-[#050505] border-white/10 text-white/70 z-50 font-black text-[10px] uppercase tracking-widest rounded-xl"
            >
              <DropdownMenuRadioGroup value={lead.status} onValueChange={(newStatus) => onStatusChange(lead.id, newStatus)}>
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
                <DropdownMenuRadioItem value="declined" className="focus:bg-[#8B4513]/20 focus:text-[#D2691E] cursor-pointer rounded-lg m-1">
                  <TrendingDown className="w-3.5 h-3.5 mr-2 text-[#8B4513]" /> Perdido
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
        <div className="p-3 bg-[#0A0A0A] border border-white/5 flex flex-col relative group-hover:border-white/10 transition-colors rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">% de Conversión</span>
            <Target className="w-3 h-3 text-white/20" />
          </div>
          <span className={`text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${scoreGradient}`}>
            {displayScore}%
          </span>
          <div className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${scoreGradient} rounded-b-xl`} style={{width: `${displayScore}%`}} />
        </div>
        <div className="p-3 bg-[#0A0A0A] border border-white/5 flex flex-col relative group-hover:border-white/10 transition-colors rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">Valoración</span>
            <Banknote className="w-3 h-3 text-white/20" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight mt-1">
            ${(lead.value || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-[11px] font-black tracking-[0.15em] relative z-10 flex-1">
        <div className="flex items-center text-white/50 hover:text-white transition-colors px-3 py-2 bg-[#0A0A0A] border border-white/5 rounded-full">
           <Mail className="w-4 h-4 mr-3 text-cyan-400/50" />
           <span className="truncate uppercase">{lead.email || 'NO_DATA'}</span>
        </div>
        
        <div className="flex items-center text-white/50 hover:text-white transition-colors px-3 py-2 bg-[#0A0A0A] border border-white/5 rounded-full">
           <Phone className="w-4 h-4 mr-3 text-cyan-400/50" />
           <span className="uppercase">{lead.phone || 'NO_DATA'}</span>
        </div>

        {(lead.machines && lead.machines.length > 0) && (
          <div className="flex items-center text-cyan-400 px-3 py-2 bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-full">
             <Package className="w-4 h-4 mr-3" />
             <span className="truncate uppercase">{lead.machines[0]?.name} {lead.machines.length > 1 ? `[+${lead.machines.length - 1}]` : ''}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          <div 
            className={`flex-1 flex items-center bg-[#0A0A0A] border border-white/5 rounded-full px-3 py-2 transition-all ${isEditingQT ? 'focus-within:border-cyan-400/50' : 'cursor-pointer hover:border-white/20'}`}
            onClick={(e) => { e.stopPropagation(); if (!isEditingQT) setIsEditingQT(true); }}
          >
            <span className="text-[10px] text-white/40 tracking-[0.15em] mr-2 uppercase shrink-0">QT//</span>
            {isEditingQT ? (
              <>
                <input 
                   autoFocus
                   value={quotationNumber}
                   onChange={(e) => setQuotationNumber(e.target.value)}
                   placeholder="UNDEFINED"
                   className="bg-transparent border-none outline-none text-cyan-400 font-black text-[11px] w-full focus:ring-0 p-0 tracking-[0.15em] placeholder:text-white/10 uppercase"
                   onClick={(e) => e.stopPropagation()}
                   onKeyDown={(e) => { if(e.key === 'Enter') { handleQuotationSave(e); } }}
                />
                <button 
                  onClick={handleQuotationSave}
                  className="w-5 h-5 rounded flex items-center justify-center bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 ml-1 shrink-0 transition-colors"
                  title="Guardar Cotización"
                >
                  <Check className="w-3 h-3" />
                </button>
              </>
            ) : (
              <span className="text-cyan-400 font-black text-[13px] tracking-[0.2em] uppercase truncate w-full">
                 {quotationNumber || 'UNDEFINED'}
              </span>
            )}
          </div>
          
          <button
            title="Ver Cotización PDF"
            disabled={!(lead.quotations && lead.quotations.length > 0)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              lead.quotations && lead.quotations.length > 0
                ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20'
                : 'bg-[#0A0A0A] border border-white/5 text-white/10 cursor-not-allowed'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (lead.quotations && lead.quotations.length > 0) {
                const url = lead.quotations[lead.quotations.length - 1].url;
                window.open(url, '_blank');
              }
            }}
          >
            <FileText className="w-4 h-4" />
          </button>
          
          <button
            title="Exportar Generales"
            className="w-9 h-9 rounded-full bg-[#0A0A0A] border border-white/5 flex items-center justify-center text-white/40 hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30 hover:text-[#00E5FF] transition-all shrink-0"
            onClick={handleExportGenerals}
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent flex items-center justify-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
         <Button size="icon" variant="ghost" className="rounded-full w-9 h-9 bg-[#0A0A0A] border border-white/10 hover:border-white/30 text-white/60 hover:text-white shadow-lg" onClick={(e) => { e.stopPropagation(); onEdit(lead); }} title="Editar">
           <Edit className="w-4 h-4" />
         </Button>
         <Button size="icon" variant="ghost" className="rounded-full w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 shadow-lg" onClick={(e) => { e.stopPropagation(); onConvertToDeal(lead); }} title="Convertir a Venta">
           <HeartHandshake className="w-4 h-4" />
         </Button>
         <Button size="icon" variant="ghost" className="rounded-full w-9 h-9 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 shadow-lg" onClick={(e) => { e.stopPropagation(); onQuickFollowUp(lead, 'Llamada'); }} title="Seguimiento">
           <CalendarPlus className="w-4 h-4" />
         </Button>
         <Button size="icon" variant="ghost" className="rounded-full w-9 h-9 bg-[#00E5FF]/10 border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 text-[#00E5FF] shadow-lg" onClick={(e) => { e.stopPropagation(); onOpenConversation(lead); }} title="Bitácora">
           <MessageSquare className="w-4 h-4" />
         </Button>
      </div>
    </motion.div>
  );
};

export default ModernLeadCard;

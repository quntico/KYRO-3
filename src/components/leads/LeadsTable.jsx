import React from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { Eye, Edit, Trash2, MessageSquare, HeartHandshake, ChevronDown, Copy, Check, File, ExternalLink, Link as LinkIcon, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from '@/components/ui/use-toast';

const LeadsTable = ({ leads, onView, onEdit, onDelete, onOpenConversation, onConvertToDeal, onStatusChange, companies = [], onUpdateField }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(null);

  const handleCompanyChange = async (lead, companyId) => {
    if (!onUpdateField) return;
    try {
      const updatedActivityStatus = {
        ...(lead.activity_status || {}),
        managingCompanyId: companyId
      };
      await onUpdateField(lead.id, { activity_status: updatedActivityStatus });
      toast({
        title: "Empresa Gestora Actualizada",
        description: `Prospecto asignado a ${companies.find(c => c.id === companyId)?.name || 'la empresa seleccionada'}.`
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la empresa gestora."
      });
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: "Copiado",
      description: `${type === 'email' ? 'Correo' : 'Teléfono'} al portapapeles.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const getNextStep = (lead) => {
    if (!lead) return 'N/A';
    if (lead.next_step && lead.next_step.type) {
      return lead.next_step.type;
    }
    const status = lead.activity_status;
    if (!status) return (typeof lead.notes === 'string' ? lead.notes : 'N/A');
    if (!status.quotationSent?.checked) return 'Enviar Cotización';
    if (!status.quotationReview?.checked) return 'Revisión de Cotización';
    if (!status.appointment?.checked) return 'Agendar Cita';
    if (!status.zoom?.checked) return 'Realizar Zoom';
    if (!status.closing?.checked) return 'Próximo a Cierre';
    return 'Cerrado';
  };

  const getLastNote = (lead) => {
    if (!lead || !lead.notes) return 'Sin seguimiento registrado';
    try {
      const parsed = JSON.parse(lead.notes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[parsed.length - 1].text || 'Sin texto';
      }
      return String(lead.notes);
    } catch (e) {
      return String(lead.notes);
    }
  };

  const formatLastActivity = (dateString) => {
    if (!dateString) return 'N/A';

    const date = parseISO(dateString);
    if (!isValid(date)) {
      return 'Fecha inválida';
    }

    if (new Date() - date > 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'dd MMM yyyy', { locale: es });
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'closing': return { label: 'Cierre', color: 'bg-[#0047FF]/20 text-[#00D4FF] border-[#00D4FF]/30', rowColor: 'border-l-4 border-l-[#00D4FF] hover:bg-[#00D4FF]/10 hover:shadow-[0_0_15px_rgba(0,212,255,0.1)]' };
      case 'hot': return { label: 'Caliente', color: 'bg-red-500/20 text-red-400 border-red-500/30', rowColor: 'border-l-4 border-l-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]' };
      case 'warming': return { label: 'Avanzando', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', rowColor: 'border-l-4 border-l-emerald-500 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]' };
      case 'warm': return { label: 'Tibio', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', rowColor: 'border-l-4 border-l-orange-500 hover:bg-orange-500/10 hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]' };
      case 'cooling': return { label: 'Enfriando', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', rowColor: 'border-l-4 border-l-cyan-500 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]' };
      case 'cold': return { label: 'Frío', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', rowColor: 'border-l-4 border-l-blue-500 hover:bg-blue-500/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' };
      case 'new': return { label: 'Nuevo', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', rowColor: 'border-l-4 border-l-purple-500 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]' };
      case 'declined': return { label: 'Declinado', color: 'bg-[#8B4513]/20 text-[#D2691E] border-[#8B4513]/30', rowColor: 'border-l-4 border-l-[#8B4513] hover:bg-[#8B4513]/10 hover:shadow-[0_0_15px_rgba(139,69,19,0.1)]' };
      default: return { label: 'Nuevo', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', rowColor: 'border-l-4 border-l-purple-500 hover:bg-purple-500/5' };
    }
  };

  const statusPriority = { closing: 1, hot: 2, warming: 3, warm: 4, cooling: 5, cold: 6, new: 7, declined: 8 };

  const sortedLeads = leads || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-6"
    >
      <div className={`bg-card rounded-2xl border border-border overflow-visible ${theme === 'nova' ? 'hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]' : ''}`}>
        <Table wrapperClassName="overflow-visible" className="[&_td]:py-1.5 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3">
          <TableHeader className="bg-[#00D4FF] sticky top-0 z-40 shadow-lg shadow-black/50 [&>tr>th:first-child]:rounded-tl-2xl [&>tr>th:last-child]:rounded-tr-2xl">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="w-[50px] text-center uppercase text-[12px] tracking-widest font-black text-black">#</TableHead>
              <TableHead className="w-[300px] text-center uppercase text-[12px] tracking-widest font-black text-black">Empresa / Contacto</TableHead>
              <TableHead className="text-center uppercase text-[12px] tracking-widest font-black text-black">Proyecto / Equipo</TableHead>
              <TableHead className="text-center uppercase text-[12px] tracking-widest font-black text-black">Status</TableHead>
              <TableHead className="text-center uppercase text-[12px] tracking-widest font-black text-black">Finanzas</TableHead>
              <TableHead className="text-center uppercase text-[12px] tracking-widest font-black text-black">Seguimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.map((lead, index) => {
              const statusInfo = getStatusBadge(lead.status);
              
              let value = Number(lead.value) || 0;
              let utilities = 0;
              if (lead.machines && lead.machines.length > 0) {
                value = lead.machines.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
                utilities = lead.machines.reduce((sum, m) => sum + (Number(m.commission) || 0), 0);
              }

              return (
                <TableRow
                  key={lead.id}
                  className={`transition-colors group cursor-pointer ${statusInfo.rowColor || 'hover:bg-secondary/10'}`}
                  onClick={() => onView(lead)}
                >
                  <TableCell className="text-center font-bold text-muted-foreground/50 text-[10px]">
                    {String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex flex-col cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => onView(lead)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base text-primary transition-colors">
                          {lead.name}
                        </span>
                        {lead.activity_status?.client_code && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0047FF]/20 border border-[#00D4FF]/40 text-[#00D4FF] text-[9.5px] font-black tracking-wider shadow-[0_0_8px_rgba(0,212,255,0.3)]">
                            Nº {lead.activity_status.client_code}
                          </span>
                        )}

                        {lead.quotations && lead.quotations.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 text-red-500 hover:scale-110 transition-transform cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                                onClick={(e) => { e.stopPropagation(); onView(lead); }}
                              >
                                <File className="w-3 h-3" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Ver Cotizaciones PDF</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5 text-[11px] text-muted-foreground">
                        <div
                          className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group/copy"
                          onClick={(e) => { e.stopPropagation(); handleCopy(lead.email, `email-${lead.id}`); }}
                        >
                          <Mail className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="truncate max-w-[170px] font-medium">{lead.email}</span>
                          {copied === `email-${lead.id}` ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div
                          className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group/copy"
                          onClick={(e) => { e.stopPropagation(); handleCopy(lead.phone, `phone-${lead.id}`); }}
                        >
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-medium">{lead.phone}</span>
                          {copied === `phone-${lead.id}` ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          )}
                        </div>
                        {lead.source && lead.source !== 'Manual Entry' && lead.source !== 'Excel Import' && lead.source !== 'Convertido de Contacto' && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded bg-green-500/10 border border-green-500/30 text-green-400">
                              {lead.source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 items-start">
                      {(() => {
                        const matchedCompany = (companies || []).find(c => c.id === (lead.activity_status?.managingCompanyId || 'comp-1'));
                        if (!matchedCompany) return null;
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="flex items-center justify-center p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                                {matchedCompany.logo ? (
                                  <img src={matchedCompany.logo} alt={matchedCompany.name} className="h-5 w-auto max-w-[60px] object-contain rounded" />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[8px] font-black text-white/40 uppercase">
                                    {matchedCompany.name.slice(0, 2)}
                                  </div>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-[#050505] border border-white/10 text-white/80 p-1 rounded-xl min-w-[180px] z-[50]" onClick={(e) => e.stopPropagation()}>
                              <div className="px-2.5 py-1.5 text-[8px] font-black tracking-widest text-white/40 uppercase border-b border-white/5 mb-1">
                                Asignar Empresa Gestora
                              </div>
                              {(companies || []).map(c => (
                                <DropdownMenuRadioItem
                                  key={c.id}
                                  value={c.id}
                                  checked={c.id === matchedCompany.id}
                                  onClick={() => handleCompanyChange(lead, c.id)}
                                  className="flex items-center gap-2 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer transition-colors"
                                >
                                  {c.logo ? (
                                    <img src={c.logo} alt={c.name} className="w-4 h-4 rounded object-cover" />
                                  ) : (
                                    <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px] font-black text-white/40">
                                      {c.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{c.name}</span>
                                  {c.id === matchedCompany.id && <Check className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
                                </DropdownMenuRadioItem>
                              ))}
                              <div className="border-t border-white/5 my-1" />
                              <DropdownMenuRadioItem
                                value="manage"
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('open-manage-companies'));
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 text-[9px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 rounded-lg cursor-pointer transition-colors"
                              >
                                  ⚙️ Gestionar Empresas
                              </DropdownMenuRadioItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                      {lead.machines && lead.machines.length > 0 ? (
                        <div className="flex flex-col">
                          <div className="flex items-start gap-1.5">
                            <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-[8px] font-black uppercase text-primary tracking-tighter mt-0.5 shrink-0">
                              EQUIPO
                            </div>
                            <span className="text-[13px] font-bold text-foreground line-clamp-2 leading-tight max-w-[185px] break-words">
                              {lead.machines[0].name}
                            </span>
                          </div>
                          {lead.machines.length > 1 && (
                            <span className="text-[9px] text-muted-foreground/60 mt-0.5 ml-1">
                              + {lead.machines.length - 1} unidades adicionales
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground/40 italic">Sin equipo asignado</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase transition-all flex items-center gap-1 hover:brightness-110 active:scale-95 ${statusInfo.color}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusInfo.label}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        onClick={(e) => e.stopPropagation()}
                        align="start" 
                        className={theme === 'nova' ? 'glass-bevel' : ''}
                      >
                        <DropdownMenuRadioGroup value={lead.status} onValueChange={(newStatus) => onStatusChange(lead.id, newStatus)}>
                          <DropdownMenuRadioItem value="closing" className="text-[10px] font-bold uppercase text-[#00D4FF] focus:bg-[#0047FF]/20">Próximo Cierre</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="hot" className="text-[10px] font-bold uppercase text-red-400 focus:bg-red-500/20">Caliente</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="warming" className="text-[10px] font-bold uppercase text-emerald-400 focus:bg-emerald-500/20">Avanzando</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="warm" className="text-[10px] font-bold uppercase text-orange-400 focus:bg-orange-500/20">Tibio</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="cooling" className="text-[10px] font-bold uppercase text-cyan-400 focus:bg-cyan-500/20">Enfriando</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="cold" className="text-[10px] font-bold uppercase text-blue-400 focus:bg-blue-500/20">Frío</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="new" className="text-[10px] font-bold uppercase text-purple-400 focus:bg-purple-500/20">Nuevo</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="declined" className="text-[10px] font-bold uppercase text-[#D2691E] focus:bg-[#8B4513]/20">Declinado</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">
                        ${value.toLocaleString()} <span className="text-[10px] text-white/70">USD</span>
                      </span>
                      {utilities > 0 && (() => {
                        const tc = lead.machines && lead.machines.length > 0 ? (lead.machines[0].exchangeRate || 18.0) : 18.0;
                        const utilMXN = utilities * tc;
                        return (
                          <div className="flex flex-col mt-0.5 gap-0.5">
                            <span className="text-[10px] text-white font-bold uppercase">
                              Utilidad: ${utilities.toLocaleString()} <span className="text-[8px] text-white/70">USD</span>
                            </span>
                            <span className="text-[9px] text-white/80 font-bold uppercase">
                              ${utilMXN.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[7px] text-white/50">MXN</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex flex-col min-w-[280px] max-w-[500px] cursor-pointer group/note p-1 rounded-xl hover:bg-white/5 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onOpenConversation(lead); }}
                    >
                      <span 
                        className="text-xs font-bold leading-snug text-white group-hover/note:text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-colors mb-0.5"
                        title={getLastNote(lead)}
                      >
                        {getLastNote(lead)}
                      </span>
                      <span className="text-[10px] text-white/40 group-hover/note:text-white/60 uppercase tracking-wider font-bold transition-colors">
                        {lead.last_activity && isValid(parseISO(lead.last_activity)) 
                          ? format(parseISO(lead.last_activity), "dd MMM yyyy • HH:mm", { locale: es }) 
                          : 'N/A'}
                      </span>
                      
                      <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onOpenConversation(lead)} className="h-7 w-7 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Conversación</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onView(lead)} className="h-7 w-7 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Detalles</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(lead)} className="h-7 w-7 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onConvertToDeal(lead)} className="h-7 w-7 p-0 text-green-500/70 hover:text-green-400 hover:bg-green-500/10 rounded-lg">
                              <HeartHandshake className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Convertir a Venta</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => onDelete(lead)} className="h-7 w-7 p-0 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default LeadsTable;
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

const LeadsTable = ({ leads, onView, onEdit, onDelete, onOpenConversation, onConvertToDeal, onStatusChange }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(null);

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
      <div className={`bg-card rounded-2xl border border-border overflow-hidden ${theme === 'nova' ? 'hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]' : ''}`}>
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow>
              <TableHead className="w-[50px] text-center uppercase text-[10px] tracking-widest font-bold">#</TableHead>
              <TableHead className="w-[300px] uppercase text-[10px] tracking-widest font-bold">Empresa / Contacto</TableHead>
              <TableHead className="uppercase text-[10px] tracking-widest font-bold">Proyecto / Equipo</TableHead>
              <TableHead className="uppercase text-[10px] tracking-widest font-bold">Status</TableHead>
              <TableHead className="uppercase text-[10px] tracking-widest font-bold">Finanzas</TableHead>
              <TableHead className="uppercase text-[10px] tracking-widest font-bold">Seguimiento</TableHead>
              <TableHead className="text-right uppercase text-[10px] tracking-widest font-bold">Acciones</TableHead>
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primary transition-colors">
                          {lead.name}
                        </span>
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
                      <div className="flex flex-col gap-0.5 mt-1">
                        <div
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group/copy"
                          onClick={(e) => { e.stopPropagation(); handleCopy(lead.email, `email-${lead.id}`); }}
                        >
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                          {copied === `email-${lead.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                        </div>
                        <div
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group/copy flex-wrap"
                          onClick={(e) => { e.stopPropagation(); handleCopy(lead.phone, `phone-${lead.id}`); }}
                        >
                          <Phone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                          {lead.source && lead.source !== 'Manual Entry' && lead.source !== 'Excel Import' && lead.source !== 'Convertido de Contacto' && (
                            <span className="text-[9px] px-1 py-0.2 bg-green-500/20 border border-green-500/30 text-green-400 rounded font-bold uppercase tracking-wider scale-90">
                              {lead.source}
                            </span>
                          )}
                          {copied === `phone-${lead.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      {lead.machines && lead.machines.length > 0 ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-[8px] font-black uppercase text-primary tracking-tighter">
                              EQUIPO
                            </div>
                            <span className="text-[11px] font-bold text-foreground truncate max-w-[160px]">
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
                      <span className="text-sm font-bold text-primary">${value.toLocaleString()}</span>
                      {utilities > 0 && (
                        <span className="text-[10px] text-yellow-500 font-bold uppercase mt-0.5">Utilidad: ${utilities.toLocaleString()}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${theme === 'nova' ? 'text-primary' : 'text-foreground'}`}>
                        {getNextStep(lead)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Último: {formatLastActivity(lead.last_activity)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpenConversation(lead); }} className="h-8 w-8 p-0">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Conversación</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(lead); }} className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver Detalles</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(lead); }} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onConvertToDeal(lead); }} className="h-8 w-8 p-0 text-green-500 hover:text-green-600">
                            <HeartHandshake className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Convertir a Venta</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(lead); }} className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
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
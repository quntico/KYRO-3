import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Clock, MoreVertical, Eye, Edit, Trash2, Flame, Sun, Snowflake, Banknote, BookUser, HeartHandshake, Package, Phone, Mail, Video, FileText, Sparkles, CalendarPlus, Send, FileSearch, Calendar, Gem, MessageSquare, PlusCircle, Copy, Check, Link as LinkIcon, ExternalLink, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { ICON_MAP } from '@/constants/leadStatuses';
import * as Icons from 'lucide-react';

const LeadCard = ({ lead, index, onView, onEdit, onDelete, onStatusChange, onConvertToDeal, onQuickFollowUp, onNextStepChange, onOpenConversation }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { leadStatuses } = useData();
  const [copied, setCopied] = React.useState(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: '¡Copiado!',
      description: `${type === 'email' ? 'Correo' : 'Teléfono'} copiado al portapapeles.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGoToDirectory = () => {
    toast({
      title: 'Redirigiendo al Directorio',
      description: `Mostrando detalles para ${lead.contact}.`,
    });
    navigate(`/directory?search=${encodeURIComponent(lead.contact)}`);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'hot': return { label: 'Caliente', color: theme === 'futuristic' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400', Icon: Flame };
      case 'warming': return { label: 'Se está calentando', color: theme === 'futuristic' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400', Icon: TrendingUp };
      case 'warm': return { label: 'Tibio', color: theme === 'futuristic' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400', Icon: Sun };
      case 'cooling': return { label: 'Se está enfriando', color: theme === 'futuristic' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400', Icon: TrendingDown };
      case 'cold': return { label: 'Frío', color: theme === 'futuristic' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400', Icon: Snowflake };
      case 'new': return { label: 'Nuevo', color: theme === 'futuristic' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400', Icon: null };
      default: return { label: status, color: theme === 'futuristic' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', Icon: null };
    }
  };

  const nextStepOptions = (leadStatuses || []).map(status => ({
    ...status,
    Icon: ICON_MAP[status.icon] || Icons.Sparkles
  }));

  const getNextStepInfo = (nextStepType) => {
    return nextStepOptions.find(opt => opt.type === nextStepType) || { Icon: Sparkles, color: 'text-yellow-400' };
  };

  const statusInfo = getStatusInfo(lead.status);
  const nextStepInfo = lead.next_step ? getNextStepInfo(lead.next_step.type) : getNextStepInfo('Otro');

  const getScoreColor = (score) => {
    if (score >= 80) return theme === 'futuristic' ? 'text-green-400' : 'text-green-600 dark:text-green-400';
    if (score >= 60) return theme === 'futuristic' ? 'text-yellow-400' : 'text-yellow-600 dark:text-yellow-400';
    return theme === 'futuristic' ? 'text-red-400' : 'text-red-600 dark:text-red-400';
  };

  const safeFormatDate = (dateStr, formatStr = null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      if (formatStr) return format(date, formatStr, { locale: es });
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatLastActivity = (dateString) => {
    return safeFormatDate(dateString);
  };

  const followUpActions = [
    { type: 'Llamada', Icon: Phone },
    { type: 'WhatsApp', Icon: MessageSquare },
    { type: 'Correo', Icon: Mail },
    { type: 'Zoom', Icon: Video },
    { type: 'Cita', Icon: Calendar },
  ];

  const getLastNote = () => {
    if (!lead.notes) return null;
    try {
      const parsed = JSON.parse(lead.notes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[parsed.length - 1];
      }
      return { text: lead.notes, date: lead.last_activity };
    } catch (e) {
      return { text: lead.notes, date: lead.last_activity };
    }
  };

  const lastNote = getLastNote();

  return (
    <motion.div
      key={lead.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-card rounded-2xl p-6 shadow-sm border border-border card-hover flex flex-col cursor-pointer select-none ${theme === 'nova' ? 'hover:border-primary/50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onView(lead);
      }}
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold mb-1 text-primary ${theme === 'futuristic' ? 'text-glow' : ''}`}>{lead.name}</h3>
              {lead.quotations && lead.quotations.length > 0 && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-500 hover:scale-110 transition-transform cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  onClick={(e) => { e.stopPropagation(); onView(lead); }}
                  title="Ver Cotizaciones PDF">
                  <File className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{lead.contact}</p>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusInfo.color}`}>
              {statusInfo.Icon && <statusInfo.Icon className="w-3 h-3 mr-1" />}
              {statusInfo.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={lead.status} onValueChange={(newStatus) => onStatusChange(lead.id, newStatus)}>
                  <DropdownMenuRadioItem value="hot" onClick={(e) => e.stopPropagation()}>
                    <Flame className="w-4 h-4 mr-2 text-red-500" />
                    Caliente
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="warming" onClick={(e) => e.stopPropagation()}>
                    <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                    Se está calentando
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="warm" onClick={(e) => e.stopPropagation()}>
                    <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                    Tibio
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="cooling" onClick={(e) => e.stopPropagation()}>
                    <TrendingDown className="w-4 h-4 mr-2 text-cyan-500" />
                    Se está enfriando
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="cold" onClick={(e) => e.stopPropagation()}>
                    <Snowflake className="w-4 h-4 mr-2 text-blue-500" />
                    Frío
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50">
            <Target className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Score</span>
              <span className={`font-black text-sm leading-none ${getScoreColor(lead.score)}`}>
                {lead.score}/100
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-1">
            <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 w-full justify-between sm:justify-end">
              <div className="flex flex-col items-end mr-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground leading-none mb-1">Venta</span>
                <span className={`font-black text-sm leading-none ${theme === 'futuristic' ? 'text-glow text-white' : 'text-foreground'}`}>
                  ${(lead.value || 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>

            {lead.commission > 0 && (
              <div className="flex items-center space-x-2 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/10 w-full justify-between sm:justify-end">
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[9px] uppercase font-bold text-yellow-500/60 leading-none mb-1">Utilidad</span>
                  <span className="font-black text-sm text-yellow-500 leading-none">
                    ${(lead.commission || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-yellow-500/20 p-1.5 rounded-lg">
                  <Banknote className="w-3.5 h-3.5 text-yellow-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <div
            className="flex items-center justify-between group/copy cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleCopy(lead.email, 'email'); }}
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </span>
            {copied === 'email' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
          </div>

          <div
            className="flex items-center justify-between group/copy cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleCopy(lead.phone, 'phone'); }}
          >
            <span className="flex items-center gap-2 overflow-hidden flex-wrap">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{lead.phone}</span>
              {lead.source && lead.source !== 'Manual Entry' && lead.source !== 'Excel Import' && lead.source !== 'Convertido de Contacto' && (
                <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-md font-bold uppercase tracking-wider scale-90">
                  {lead.source}
                </span>
              )}
            </span>
            {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
          </div>

          {(lead.machines || []).length > 0 && (
            <div className="space-y-1.5 px-2 mt-2">
              {lead.machines.map((m, i) => (
                <div key={i} className="flex items-center gap-2 group/machine">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-foreground text-sm uppercase flex-1 truncate">{m?.name || 'Proyectos'}</span>
                  {lead.quotations && lead.quotations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-primary/20 transition-all rounded-full bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(lead.quotations[i] || lead.quotations[0]);
                      }}
                      title="Abrir en Visor"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sección de Cotización Dinámica */}
          <div className="flex items-center justify-between px-2 mt-2 group/dynamic">
            <div className="flex items-center gap-2">
              <LinkIcon className={`w-4 h-4 ${lead.dynamic_quotation_url ? 'text-primary transition-all scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]' : 'text-muted-foreground opacity-30'}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wider ${lead.dynamic_quotation_url ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
                Cotización Dinámica
              </span>
            </div>
            {lead.dynamic_quotation_url && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-primary/20 transition-all rounded-full bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(lead.dynamic_quotation_url);
                    toast({
                      title: "Copiado",
                      description: "Enlace de cotización copiado.",
                    });
                  }}
                  title="Copiar enlace de cotización"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-primary/20 transition-all rounded-full bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(lead.dynamic_quotation_url, '_blank');
                  }}
                  title="Abrir Cotización Dinámica"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground capitalize">Última actividad: {formatLastActivity(lead.last_activity)}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="flex items-center space-x-2 mb-4 text-sm p-2 bg-secondary rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-2 h-2 rounded-full ${nextStepInfo.color.replace('text-', 'bg-')} animate-pulse`}></div>
              <nextStepInfo.Icon className={`w-4 h-4 ${nextStepInfo.color}`} />
              <span className="text-muted-foreground">STATUS:</span>
              <span className="font-semibold text-foreground">{lead.next_step?.type || 'Definir'}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {nextStepOptions.map(({ type, Icon }) => (
              <DropdownMenuItem key={type} onClick={(e) => {
                e.stopPropagation();
                onNextStepChange(lead, type);
              }}>
                <Icon className="w-4 h-4 mr-2" />
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mb-4 cursor-pointer group" onClick={(e) => { e.stopPropagation(); onOpenConversation(lead); }}>
          <div className={`text-sm rounded-2xl p-4 border transition-all relative ${theme === 'nova'
            ? 'bg-primary/10 border-primary/20 hover:bg-primary/20'
            : 'bg-secondary border-transparent hover:border-primary/30 hover:bg-primary/5'
            }`}>
            {lastNote ? (
              <div className="flex flex-col">
                <div className="flex justify-end mb-1">
                  <span className="text-xs font-semibold text-primary/90 whitespace-nowrap">
                    {lastNote.date ? safeFormatDate(lastNote.date, "EEE HH:mm") : ''}
                  </span>
                </div>
                <p className={`line-clamp-3 font-medium ${theme === 'nova' ? 'text-primary' : 'text-foreground'}`}>
                  {typeof lastNote.text === 'string' ? lastNote.text : (typeof lastNote.text === 'object' ? 'Ver nota...' : String(lastNote.text))}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between text-muted-foreground opacity-60">
                <span>Añadir avance...</span>
                <PlusCircle className="w-4 h-4" />
              </div>
            )}
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
              <MessageSquare className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
          onClick={(e) => { e.stopPropagation(); onView(lead); }}
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
          onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
        >
          <Edit className="w-4 h-4 mr-1" />
          Editar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              Seguimiento
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {followUpActions.map(({ type, Icon }) => (
              <DropdownMenuItem key={type} onClick={(e) => {
                e.stopPropagation();
                onQuickFollowUp(lead, type);
              }}>
                <Icon className="w-4 h-4 mr-2" />
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex space-x-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${theme === 'futuristic' ? 'border-primary/50 text-primary/80 hover:bg-primary/20' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleGoToDirectory(); }}
        >
          <BookUser className="w-4 h-4 mr-2" />
          Directorio
        </Button>
        <Button
          size="sm"
          className={`flex-1 ${theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          onClick={(e) => { e.stopPropagation(); onConvertToDeal(lead); }}
        >
          <HeartHandshake className="w-4 h-4 mr-2" />
          Convertir
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`w-10 flex-none ${theme === 'futuristic' ? 'border-destructive text-destructive hover:bg-destructive/20' : 'text-red-500 hover:bg-red-900/20'}`}
          onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default LeadCard;
import React from 'react';
    import { motion } from 'framer-motion';
    import { Target, TrendingUp, Clock, MoreVertical, Eye, Edit, Trash2, Flame, Sun, Snowflake, Banknote, BookUser, HeartHandshake, Package, Phone, Mail, Video, FileText, Sparkles, CalendarPlus, Send, FileSearch, Calendar, Gem, MessageSquare } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuRadioGroup,
      DropdownMenuRadioItem,
      DropdownMenuTrigger,
      DropdownMenuItem,
    } from "@/components/ui/dropdown-menu";
    import { formatDistanceToNow } from 'date-fns';
    import { es } from 'date-fns/locale';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { useNavigate } from 'react-router-dom';
    import { toast } from '@/components/ui/use-toast';

    const LeadCard = ({ lead, index, onView, onEdit, onDelete, onStatusChange, onConvertToDeal, onQuickFollowUp, onNextStepChange }) => {
      const { theme } = useTheme();
      const navigate = useNavigate();

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
          case 'warm': return { label: 'Tibio', color: theme === 'futuristic' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400', Icon: Sun };
          case 'cold': return { label: 'Frío', color: theme === 'futuristic' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400', Icon: Snowflake };
          case 'new': return { label: 'Nuevo', color: theme === 'futuristic' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400', Icon: null };
          default: return { label: status, color: theme === 'futuristic' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', Icon: null };
        }
      };

      const nextStepOptions = [
        { type: 'Llamada', Icon: Phone, color: 'text-blue-400' },
        { type: 'Correo', Icon: Mail, color: 'text-orange-400' },
        { type: 'Zoom', Icon: Video, color: 'text-purple-400' },
        { type: 'Cotizar', Icon: FileText, color: 'text-cyan-400' },
        { type: 'Cotización Enviada', Icon: Send, color: 'text-blue-400' },
        { type: 'Revisión de Cotización', Icon: FileSearch, color: 'text-orange-400' },
        { type: 'Cita', Icon: Calendar, color: 'text-purple-400' },
        { type: 'Próximo a Cierre', Icon: Gem, color: 'text-teal-400' },
        { type: 'WhatsApp', Icon: MessageSquare, color: 'text-green-400' },
        { type: 'Otro', Icon: Sparkles, color: 'text-yellow-400' },
      ];

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

      const formatLastActivity = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
        } catch (error) {
          return dateString;
        }
      };

      const followUpActions = [
        { type: 'Llamada', Icon: Phone },
        { type: 'WhatsApp', Icon: MessageSquare },
        { type: 'Correo', Icon: Mail },
        { type: 'Zoom', Icon: Video },
        { type: 'Cita', Icon: Calendar },
      ];

      const machineProjects = (lead.machines || []).map(m => m.name).join(', ');

      return (
        <motion.div
          key={lead.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border card-hover flex flex-col"
        >
          <div className="flex-grow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${theme === 'futuristic' ? 'text-glow' : ''}`}>{lead.name}</h3>
                <p className="text-sm text-muted-foreground">{lead.contact}</p>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusInfo.color}`}>
                  {statusInfo.Icon && <statusInfo.Icon className="w-3 h-3 mr-1" />}
                  {statusInfo.label}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-auto">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={lead.status} onValueChange={(newStatus) => onStatusChange(lead.id, newStatus)}>
                      <DropdownMenuRadioItem value="hot">
                        <Flame className="w-4 h-4 mr-2 text-red-500" />
                        Caliente
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="warm">
                        <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                        Tibio
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="cold">
                        <Snowflake className="w-4 h-4 mr-2 text-blue-500" />
                        Frío
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Score:</span>
                <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                  {lead.score}/100
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className={`font-semibold ${theme === 'futuristic' ? 'text-glow' : ''}`}>
                  ${lead.value.toLocaleString()}
                </span>
              </div>
              {lead.commission > 0 && (
                <div className="flex items-center space-x-2">
                  <Banknote className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-400">
                    ${lead.commission.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm text-muted-foreground">
              <p>📧 {lead.email}</p>
              <p>📞 {lead.phone}</p>
              <p>🔗 {lead.source}</p>
              {machineProjects && (
                <p className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-muted-foreground mt-1" />
                  <span className="font-medium text-foreground flex-1">{machineProjects}</span>
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-4 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">Última actividad: {formatLastActivity(lead.last_activity)}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 mb-4 text-sm p-2 bg-secondary rounded-lg cursor-pointer hover:bg-primary/10 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${nextStepInfo.color.replace('text-', 'bg-')} animate-pulse`}></div>
                  <nextStepInfo.Icon className={`w-4 h-4 ${nextStepInfo.color}`} />
                  <span className="text-muted-foreground">STATUS:</span>
                  <span className="font-semibold text-foreground">{lead.next_step?.type || 'Definir'}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {nextStepOptions.map(({ type, Icon }) => (
                  <DropdownMenuItem key={type} onClick={() => onNextStepChange(lead, type)}>
                    <Icon className="w-4 h-4 mr-2" />
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                {lead.notes}
              </p>
            </div>
          </div>

          <div className="flex space-x-2 mt-auto">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
              onClick={() => onView(lead)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
              onClick={() => onEdit(lead)}
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
                >
                  <CalendarPlus className="w-4 h-4 mr-1" />
                  Seguimiento
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {followUpActions.map(({ type, Icon }) => (
                  <DropdownMenuItem key={type} onClick={() => onQuickFollowUp(lead, type)}>
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
              onClick={handleGoToDirectory}
            >
              <BookUser className="w-4 h-4 mr-2" />
              Directorio
            </Button>
            <Button
              size="sm"
              className={`flex-1 ${theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              onClick={() => onConvertToDeal(lead)}
            >
              <HeartHandshake className="w-4 h-4 mr-2" />
              Convertir
            </Button>
             <Button
              variant="outline"
              size="sm"
              className={`w-10 flex-none ${theme === 'futuristic' ? 'border-destructive text-destructive hover:bg-destructive/20' : 'text-red-500 hover:bg-red-900/20'}`}
              onClick={() => onDelete(lead)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      );
    };

    export default LeadCard;
import React from 'react';
    import { motion } from 'framer-motion';
    import { DollarSign, Target, Calendar, Users } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { formatDistanceToNow, parseISO } from 'date-fns';
    import { es } from 'date-fns/locale';

    const RecentActivity = ({ leads, deals, tasks }) => {
      const { theme } = useTheme();

      const combinedActivities = [
        ...leads.map(lead => ({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: `Nuevo prospecto: ${lead.name}`,
          details: lead.contact,
          date: lead.createdAt,
        })),
        ...deals.map(deal => ({
          id: `deal-${deal.id}`,
          type: 'deal',
          title: `Venta actualizada: ${deal.title}`,
          details: `Etapa: ${deal.stage}`,
          date: deal.lastActivity,
        })),
        ...tasks.map(task => ({
          id: `task-${task.id}`,
          type: 'task',
          title: `Tarea creada: ${task.title}`,
          details: `Para: ${task.client || 'General'}`,
          date: task.due,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

      const handleQuickAction = (action) => {
        toast({
          title: `🚧 ${action}`,
          description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
        });
      };

      const getIconStyle = (type) => {
        switch (type) {
          case 'deal': return 'bg-green-500/20 text-green-400';
          case 'lead': return 'bg-cyan-500/20 text-cyan-400';
          case 'task': return 'bg-purple-500/20 text-purple-400';
          default: return 'bg-orange-500/20 text-orange-400';
        }
      };

      const safeFormatDate = (dateString) => {
        try {
          const date = typeof dateString === 'string' && !isNaN(Date.parse(dateString)) ? parseISO(dateString) : new Date(dateString);
          if (isNaN(date.getTime())) {
            return 'hace un momento';
          }
          return formatDistanceToNow(date, { addSuffix: true, locale: es });
        } catch (error) {
          return 'fecha inválida';
        }
      };

      return (
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border border-white/10 card-hover">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-xl font-semibold text-glow">Actividad Reciente</h2>
            <Button variant="ghost" size="sm" onClick={() => handleQuickAction('Ver Todo')}>
              Ver todo
            </Button>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            {combinedActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle(activity.type)}`}>
                  {activity.type === 'deal' ? <DollarSign className="w-4 h-4 md:w-5 md:h-5" /> :
                  activity.type === 'lead' ? <Target className="w-4 h-4 md:w-5 md:h-5" /> :
                  activity.type === 'task' ? <Calendar className="w-4 h-4 md:w-5 md:h-5" /> :
                  <Users className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base text-foreground truncate">{activity.title}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {activity.details}
                  </p>
                </div>
                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{safeFormatDate(activity.date)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    };

    export default RecentActivity;
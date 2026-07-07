import React from 'react';
import { motion } from 'framer-motion';
import ModernLeadCard from './ModernLeadCard';
import { Activity, Target, Zap, Users } from 'lucide-react';
import LeadsKanban from './LeadsKanban';
import LeadsTable from './LeadsTable';

const ModernLeadsDashboard = ({ filteredLeads, viewMode, ...cardProps }) => {
  const hotLeadsCount = filteredLeads.filter(l => l.status === 'hot' || l.status === 'closing').length;
  const newLeadsCount = filteredLeads.filter(l => l.status === 'new').length;
  const avgScore = filteredLeads.length ? Math.round(filteredLeads.reduce((acc, l) => acc + (l.score || 0), 0) / filteredLeads.length) : 0;

  return (
    <div className="space-y-12">
      {/* Strategic Console Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Universo Prospectos', value: filteredLeads.length, icon: Users, color: 'text-cyan-400', glow: 'shadow-cyan-500/20', accent: 'bg-cyan-500' },
          { label: 'Vectores de Cierre', value: hotLeadsCount, icon: Zap, color: 'text-amber-400', glow: 'shadow-amber-500/20', accent: 'bg-amber-500' },
          { label: 'Nuevas Frecuencias', value: newLeadsCount, icon: Activity, color: 'text-purple-400', glow: 'shadow-purple-500/20', accent: 'bg-purple-500' },
          { label: 'Eficiencia de Score', value: `${avgScore}/100`, icon: Target, color: 'text-emerald-400', glow: 'shadow-emerald-500/20', accent: 'bg-emerald-500' },
        ].map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative group cursor-default"
          >
            <div className={`absolute -inset-px bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="bg-card border border-border p-6 relative overflow-hidden flex flex-col justify-between h-32 shadow-xl transition-all duration-300 group-hover:border-primary/40">
              {/* Corner Accents */}
              <div className={`absolute top-0 right-0 w-8 h-[1px] ${metric.accent} opacity-80`} />
              <div className={`absolute top-0 right-0 h-8 w-[1px] ${metric.accent} opacity-80`} />
              
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-[0.3em] leading-none">
                  {metric.label}
                </p>
                <metric.icon className={`w-4 h-4 ${metric.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              </div>
              
              <div className="flex items-baseline gap-2">
                <h4 className={`text-4xl font-black text-foreground tracking-tighter tabular-nums ${metric.glow} drop-shadow-md`}>
                  {metric.value}
                </h4>
                <div className={`w-1 h-1 rounded-full ${metric.accent} animate-pulse`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cards, Table or Kanban based on viewMode */}
      {viewMode === 'kanban' ? (
        <LeadsKanban
          leads={filteredLeads}
          onView={(lead) => cardProps.onView(lead)}
          onOpenConversation={(lead) => cardProps.onOpenConversation(lead)}
          companies={cardProps.companies}
          onUpdateField={cardProps.onUpdateField}
        />
      ) : viewMode === 'list' ? (
        <LeadsTable
          leads={filteredLeads}
          onView={(lead) => cardProps.onView(lead)}
          onEdit={(lead) => cardProps.onEdit(lead)}
          onDelete={(lead) => cardProps.onDelete(lead)}
          onOpenConversation={(lead) => cardProps.onOpenConversation(lead)}
          onConvertToDeal={(lead) => cardProps.onConvertToDeal(lead)}
          onStatusChange={(leadId, status) => cardProps.onStatusChange(leadId, status)}
          companies={cardProps.companies}
          onUpdateField={cardProps.onUpdateField}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredLeads.map((lead, index) => (
            <ModernLeadCard key={lead.id} lead={lead} index={index} {...cardProps} />
          ))}
        </div>
      )}
      
      {filteredLeads.length === 0 && (
         <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-border backdrop-blur-sm">
           <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-foreground/80 mb-2">No se encontraron prospectos</h3>
           <p className="text-muted-foreground">Intenta cambiar los filtros o agrega un nuevo prospecto.</p>
         </div>
      )}
    </div>
  );
};

export default ModernLeadsDashboard;

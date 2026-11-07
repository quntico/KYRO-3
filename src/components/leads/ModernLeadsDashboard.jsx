import React from 'react';
import { motion } from 'framer-motion';
import ModernLeadCard from './ModernLeadCard';
import { Target } from 'lucide-react';
import LeadsKanban from './LeadsKanban';
import LeadsTable from './LeadsTable';

const ModernLeadsDashboard = ({ filteredLeads, viewMode, ...cardProps }) => {
  return (
    <div className="space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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

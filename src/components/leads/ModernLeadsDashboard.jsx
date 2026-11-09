import React, {useEffect,useState} from 'react';
import { motion } from 'framer-motion';
import ModernLeadCard from './ModernLeadCard';
import { Target } from 'lucide-react';
import LeadsKanban from './LeadsKanban';
import LeadsTable from './LeadsTable';

const ModernLeadsDashboard = ({ filteredLeads, viewMode, ...cardProps }) => {
  const [visibleCount,setVisibleCount]=useState(24);
  const resultKey=filteredLeads.map(l=>l.id).join('|');
  useEffect(()=>setVisibleCount(24),[resultKey,viewMode]);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
          {filteredLeads.slice(0,visibleCount).map((lead, index) => (
            <ModernLeadCard key={lead.id} lead={lead} index={index} {...cardProps} />
          ))}
        </div>
      )}
      
      {viewMode!=='kanban' && viewMode!=='list' && filteredLeads.length>visibleCount && <button onClick={()=>setVisibleCount(n=>n+24)} className="w-full rounded-xl border border-primary/30 bg-primary/10 py-3 font-semibold text-primary">Mostrar 24 más · {visibleCount} de {filteredLeads.length} prospectos</button>}
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

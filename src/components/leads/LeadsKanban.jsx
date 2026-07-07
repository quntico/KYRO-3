import React from 'react';
import { motion } from 'framer-motion';
import {
    Flame,
    Sun,
    Snowflake,
    Plus,
    MoreVertical,
    Eye,
    Phone,
    Mail,
    MessageSquare,
    TrendingUp,
    Package,
    ChevronDown,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const KanbanCard = ({ lead, onView, onOpenConversation, theme, companies = [], onUpdateField }) => {
    const machineProjects = (lead.machines || []).filter(Boolean).map(m => m?.name || 'Máquina').join(', ');
    const matchedCompany = (companies || []).find(c => c.id === (lead.activity_status?.managingCompanyId || 'comp-1'));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => { e.stopPropagation(); onView(lead); }}
            className={`bg-card p-4 rounded-xl border border-border shadow-sm mb-3 group relative cursor-pointer select-none hover:shadow-md transition-all ${theme === 'nova' ? 'hover:border-primary/50' : ''
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm line-clamp-1 flex-1">{lead.name}</h4>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenConversation(lead); }}
                        className="p-1 hover:text-primary transition-colors"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs text-muted-foreground">{lead.contact}</p>
                {matchedCompany && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="inline-flex items-center justify-center p-1 rounded bg-secondary/40 border border-border hover:bg-secondary transition-all cursor-pointer">
                                {matchedCompany.logo ? (
                                    <img src={matchedCompany.logo} alt={matchedCompany.name} className="h-4 w-auto max-w-[45px] object-contain rounded" />
                                ) : (
                                    <div className="w-4 h-4 rounded bg-secondary flex items-center justify-center text-[7px] font-black text-muted-foreground/80 uppercase">
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

            {machineProjects && (
                <div className="flex items-center space-x-1 mb-3 text-[10px] bg-secondary/50 p-1.5 rounded-md">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium truncate">{machineProjects}</span>
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <div className="flex items-center space-x-1.5">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] font-bold">
                        ${(lead.value || 0).toLocaleString()}
                    </span>
                </div>
                <div className="flex -space-x-1">
                    {lead.phone && <Phone className="w-3 h-3 text-muted-foreground" />}
                    {lead.email && <Mail className="w-3 h-3 text-muted-foreground ml-1" />}
                </div>
            </div>

            {theme === 'nova' && (
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute top-0 right-0 w-full h-full bg-primary/5 blur-xl rounded-full"></div>
                </div>
            )}
        </motion.div>
    );
};

const LeadsKanban = ({ leads, onView, onOpenConversation, companies = [], onUpdateField }) => {
    const { theme } = useTheme();

    const columns = [
        { id: 'new', title: 'Nuevos', icon: Plus, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { id: 'hot', title: 'Calientes', icon: Flame, color: 'text-red-400', bg: 'bg-red-400/10' },
        { id: 'warm', title: 'Tibios', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { id: 'cold', title: 'Fríos', icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-400/10' }
    ];

    const getLeadsByStatus = (status) => leads.filter(l => l.status === status);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8 overflow-x-auto min-h-[600px]">
            {columns.map((column) => (
                <div key={column.id} className="flex flex-col h-full min-w-[280px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${column.bg} ${column.color}`}>
                                <column.icon className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">{column.title}</h3>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                {getLeadsByStatus(column.id).length}
                            </span>
                        </div>
                    </div>

                    <div className={`flex-1 p-2 rounded-2xl bg-secondary/20 border border-transparent transition-colors ${theme === 'nova' ? 'hover:border-primary/20 hover:bg-secondary/30' : ''
                        }`}>
                        <div className="space-y-3">
                            {getLeadsByStatus(column.id).map((lead) => (
                                <KanbanCard
                                    key={lead.id}
                                    lead={lead}
                                    onView={onView}
                                    onOpenConversation={onOpenConversation}
                                    theme={theme}
                                    companies={companies}
                                    onUpdateField={onUpdateField}
                                />
                            ))}

                            {getLeadsByStatus(column.id).length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sin Prospectos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LeadsKanban;

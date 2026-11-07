import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Filter, 
  FileDown, 
  DollarSign, 
  Upload, 
  LayoutGrid, 
  Calculator,
  List, 
  Columns, 
  TrendingUp, 
  Sparkles, 
  Palette, 
  Clock, 
  Type, 
  SortAsc,
  FileSpreadsheet,
  FileText,
  Layout,
  Building,
  ChevronDown,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LeadsHeader = ({ 
  selectedStatus, 
  setSelectedStatus, 
  leads, 
  onNewLead, 
  onExportPDF, 
  onExportExcel, 
  onExportDataExcel, 
  onImportExcel, 
  totalSales, 
  viewMode, 
  setViewMode, 
  dashboardStyle, 
  setDashboardStyle, 
  sortMode, 
  setSortMode,
  companies = [],
  selectedCompanyIds = ['all'],
  onToggleCompany,
  onManageCompanies,
  onOpenCalculator
}) => {
  const { theme } = useTheme();
  const fileInputRef = React.useRef(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [viewOptionsOpen, setViewOptionsOpen] = React.useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'new', label: 'Nuevos' },
    { value: 'closing', label: 'Próximo Cierre' },
    { value: 'hot', label: 'Calientes' },
    { value: 'warm', label: 'Tibios' },
    { value: 'cold', label: 'Fríos' },
    { value: 'declined', label: 'Declinados / Riesgo' }
  ];

  const getStatusCount = (status) => {
    if (!Array.isArray(leads)) return 0;
    if (status === 'all') return leads.filter(Boolean).length;
    return leads.filter(l => l && l.status === status).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4 space-y-3"
    >
      {/* Top Row: Strategic Title and Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 overflow-visible">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-9 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] hidden md:block" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Prospectos</h1>
              <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] font-bold text-primary tracking-[0.2em] animate-pulse">
                OPS EN VIVO
              </div>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.25em] flex items-center gap-2">
              Consola Estratégica de IA <span className="w-8 h-[1px] bg-border" /> v6.0
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 w-full lg:w-auto">
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-primary px-3 py-2.5 rounded-xl flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(var(--primary),0.2)] border-0 relative overflow-hidden group w-auto min-w-0 cursor-help"
                >
                  <div className="bg-primary-foreground/15 p-2 rounded-lg border border-primary-foreground/5 relative z-10 shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="relative z-10 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground/75 leading-none mb-2">
                      Capital Proyectado
                    </p>
                    <div className="text-xl font-black text-primary-foreground tabular-nums leading-none tracking-tighter flex items-baseline gap-1">
                      <span>${(totalSales || 0).toLocaleString()}</span>
                      <span className="text-xs font-black opacity-60">USD</span>
                    </div>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-popover border border-border text-popover-foreground p-3 rounded-xl max-w-xs shadow-2xl backdrop-blur-md">
                <p className="text-xs font-bold leading-relaxed">
                  Suma del valor total de todos los prospectos activos. Representa el valor potencial estimado de las cotizaciones en proceso.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Action Buttons Container */}
          <div className="flex flex-wrap items-center justify-end gap-2 w-full lg:w-auto">
            <input type="file" ref={fileInputRef} onChange={onImportExcel} accept=".csv, .xlsx, .xls" className="hidden" />
            <button
              type="button"
              onClick={() => setToolsOpen((open) => !open)}
              aria-expanded={toolsOpen}
              aria-controls="leads-tools-panel"
              className="flex items-center gap-2 min-h-11 md:min-h-0 h-10 rounded-lg border border-primary/30 bg-secondary/50 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-foreground transition-all hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              <span>Herramientas</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setViewOptionsOpen((open) => !open)}
              aria-expanded={viewOptionsOpen}
              aria-controls="leads-view-options-panel"
              className="flex items-center gap-2 min-h-11 md:min-h-0 h-10 rounded-lg border border-primary/30 bg-secondary/50 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-foreground transition-all hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
              <span>Visualización</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${viewOptionsOpen ? 'rotate-180' : ''}`} />
            </button>
            <Button
              onClick={onNewLead}
              className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl h-10 px-4 font-black shadow-[0_4px_12px_rgba(var(--primary),0.3)] border-0 gap-2 w-auto text-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="uppercase tracking-tighter">NUEVO</span>
            </Button>
          </div>
        </div>
      </div>

      {toolsOpen && (
        <div id="leads-tools-panel" className="flex w-full flex-wrap items-center justify-end gap-2 rounded-xl border border-primary/20 bg-card/80 p-2 shadow-[0_0_18px_rgba(var(--primary),0.08)]">
          <Button variant="outline" onClick={onManageCompanies} className="bg-secondary/40 border-cyan-400/40 text-muted-foreground rounded-lg h-10 px-3 shadow-[0_0_10px_rgba(34,211,238,0.12)] hover:bg-cyan-400/10 hover:text-foreground hover:border-cyan-300/70 transition-all font-bold text-[11px] gap-2">
            <Building className="w-4 h-4 text-cyan-300" /><span className="uppercase tracking-widest">Empresas</span>
          </Button>
          <Button variant="outline" onClick={onOpenCalculator} className="bg-pink-400/10 border-pink-300/50 text-pink-200 rounded-lg h-10 px-3 shadow-[0_0_10px_rgba(244,114,182,0.14)] hover:bg-pink-400/20 hover:border-pink-300/80 hover:text-pink-100 transition-all font-bold text-[11px] gap-2">
            <Calculator className="w-4 h-4" /><span className="uppercase tracking-widest">Simulador</span>
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-secondary/40 border-emerald-300/40 text-muted-foreground rounded-lg h-10 px-3 shadow-[0_0_10px_rgba(110,231,183,0.12)] hover:bg-emerald-300/10 hover:text-foreground hover:border-emerald-200/70 transition-all font-bold text-[11px] gap-2">
            <Upload className="w-4 h-4 text-emerald-300" /><span className="uppercase tracking-widest">Importar</span>
          </Button>
          <Button variant="outline" onClick={onExportDataExcel} className="bg-secondary/40 border-blue-400/40 text-muted-foreground rounded-lg h-10 px-3 shadow-[0_0_10px_rgba(96,165,250,0.12)] hover:bg-blue-400/10 hover:text-foreground hover:border-blue-300/70 transition-all font-bold text-[11px] gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-300" /><span className="uppercase tracking-widest">Excel</span>
          </Button>
          <Button variant="outline" onClick={onExportExcel} className="bg-secondary/40 border-orange-300/40 text-muted-foreground rounded-lg h-10 px-3 shadow-[0_0_10px_rgba(251,146,60,0.12)] hover:bg-orange-300/10 hover:text-foreground hover:border-orange-200/70 transition-all font-bold text-[11px] gap-2">
            <FileText className="w-4 h-4 text-orange-300" /><span className="uppercase tracking-widest">Plantilla</span>
          </Button>
          <Button variant="outline" onClick={onExportPDF} className="bg-secondary/40 border-sky-400/40 text-muted-foreground rounded-lg h-10 px-3 shadow-[0_0_10px_rgba(56,189,248,0.12)] hover:bg-sky-400/10 hover:text-foreground hover:border-sky-300/70 transition-all font-bold text-[11px] gap-2">
            <FileText className="w-4 h-4 text-sky-300" /><span className="uppercase tracking-widest">PDF</span>
          </Button>
        </div>
      )}

      {/* Middle Row: Strategic Controls */}
      <div className="flex flex-wrap items-center justify-end gap-2 w-full">
        {viewOptionsOpen && (
          <div id="leads-view-options-panel" className="flex w-full flex-wrap items-center justify-start gap-2 rounded-xl border border-primary/20 bg-card/80 p-2 shadow-[0_0_18px_rgba(var(--primary),0.08)]">
        <div className="flex flex-wrap items-center gap-2 w-full justify-start lg:justify-end">
          <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-secondary/40 border border-border hover:border-primary/50 text-muted-foreground hover:bg-secondary hover:text-primary rounded-lg h-10 min-h-11 md:min-h-0 w-auto min-w-[190px] max-w-full text-[10px] font-black uppercase tracking-[0.12em] justify-between flex items-center px-3 transition-all">
                <span>Empresa: {selectedCompanyIds.includes('all') ? 'Todas' : (selectedCompanyIds.length === 1 ? (companies.find(c => c.id === selectedCompanyIds[0])?.name || 'Seleccionada') : `${selectedCompanyIds.length} Sel.`)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border border-border text-popover-foreground z-50 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl min-w-[210px] p-1">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-muted-foreground/60 text-[8px] font-black tracking-widest">FILTRAR EMPRESAS</span>
                <button
                  aria-label="Cerrar selector de empresas"
                  title="Cerrar selector de empresas"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterDropdownOpen(false);
                  }}
                  className="p-1 hover:bg-secondary rounded-md transition-all text-muted-foreground/60 hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <DropdownMenuCheckboxItem
                checked={selectedCompanyIds.includes('all')}
                onCheckedChange={() => onToggleCompany('all')}
                onSelect={(e) => e.preventDefault()}
                className="focus:bg-secondary focus:text-foreground cursor-pointer m-1 rounded-lg py-2 pl-9 relative flex items-center justify-between"
              >
                <span>Todas las Empresas</span>
              </DropdownMenuCheckboxItem>
              <div className="h-px bg-border my-1" />
              {companies.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={selectedCompanyIds.includes(c.id)}
                  onCheckedChange={() => onToggleCompany(c.id)}
                  onSelect={(e) => e.preventDefault()}
                  className="focus:bg-secondary focus:text-foreground cursor-pointer m-1 rounded-lg py-2 pl-9 relative flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="w-4 h-4 rounded object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-secondary flex items-center justify-center text-[7px] font-black text-muted-foreground">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span>{c.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setDashboardStyle(dashboardStyle === 'classic' ? 'modern' : 'classic')}
            className="bg-secondary/40 border-border text-muted-foreground rounded-lg h-10 min-h-11 md:min-h-0 px-3 hover:bg-secondary hover:text-primary hover:border-primary/40 transition-all text-[10px] font-black uppercase tracking-[0.12em] gap-2"
          >
            {dashboardStyle === 'classic' ? <Sparkles className="w-4 h-4 text-primary" /> : <LayoutGrid className="w-4 h-4" />}
            <span>Modo Consola</span>
          </Button>

          <Button
            variant="outline"
            className="bg-secondary/40 border-border text-muted-foreground rounded-lg h-10 min-h-11 md:min-h-0 px-3 hover:bg-secondary hover:text-primary hover:border-primary/40 transition-all text-[10px] font-black uppercase tracking-[0.12em] gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </Button>

          <div className="bg-secondary/40 border border-border p-1 rounded-lg flex items-center h-10 min-h-11 md:min-h-0">
             <button className="px-3 min-h-11 md:min-h-0 text-yellow-500/70 hover:text-yellow-500 transition-colors"
               aria-label="Color de tarjetas"
               title="Color de tarjetas">
                <Palette className="w-5 h-5" />
             </button>
             <button className="px-3 min-h-11 md:min-h-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechas de tarjetas" title="Fechas de tarjetas">
                <Clock className="w-5 h-5" />
             </button>
             <button className="px-3 min-h-11 md:min-h-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Tipografía de tarjetas" title="Tipografía de tarjetas">
                <Type className="w-5 h-5" />
             </button>
             <button
               onClick={() => setSortMode(sortMode === 'value' ? 'status' : 'value')}
               className={`px-3 min-h-11 md:min-h-0 transition-colors ${sortMode === 'value' ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
                 aria-label="Ordenar prospectos"
                 title="Ordenar prospectos"
                 aria-pressed={sortMode === 'value'}
             >
                <SortAsc className="w-5 h-5" />
             </button>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Always-visible status filters and quick view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full pb-1">
        <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatus(opt.value)}
            className={`px-3 py-2 min-h-11 md:min-h-0 md:py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border ${
              selectedStatus === opt.value 
                ? 'bg-primary border-primary text-primary-foreground shadow-[0_4px_12px_rgba(var(--primary),0.2)] scale-105' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-border/80 border-border bg-secondary/30'
            }`}
          >
            {opt.label} <span className={`ml-2 ${selectedStatus === opt.value ? 'text-primary-foreground/60' : 'opacity-40'}`}>[{getStatusCount(opt.value)}]</span>
          </button>
        ))}
        </div>

        <div role="group" aria-label="Vista de prospectos" className="bg-secondary/40 border border-border p-1 rounded-xl flex shrink-0 items-center h-12 md:h-10">
            {[
              { id: 'grid', icon: LayoutGrid, label: '01', name: 'Cuadrícula' },
              { id: 'list', icon: List, label: '02', name: 'Lista' },
              { id: 'kanban', icon: Columns, label: '03', name: 'Kanban' }
            ].map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3 min-h-11 md:min-h-0 h-full rounded-lg flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${viewMode === v.id ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.05)]' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label={`Vista ${v.label}: ${v.name}`}
                title={v.name}
                aria-pressed={viewMode === v.id}
              >
                <v.icon className="w-4 h-4" />
                <span className="text-[10px] font-black">{v.label}</span>
              </button>
            ))}
          </div>
      </div>
    </motion.div>
  );
};

export default LeadsHeader;

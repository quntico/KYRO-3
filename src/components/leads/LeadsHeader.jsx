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
  onManageCompanies
}) => {
  const { theme } = useTheme();
  const fileInputRef = React.useRef(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);

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
      className="mb-10 space-y-8"
    >
      {/* Top Row: Strategic Title and Stats */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 overflow-visible">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="w-1.5 h-12 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] hidden md:block" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Prospectos</h1>
              <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-400 tracking-[0.2em] animate-pulse">
                OPS EN VIVO
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
              Consola Estratégica de IA <span className="w-8 h-[1px] bg-white/10" /> v5.5
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto flex-wrap justify-center lg:justify-end">
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-cyan-400 px-6 py-6 rounded-2xl flex items-center justify-center gap-4.5 shadow-[0_0_30px_rgba(34,211,238,0.3)] border-0 relative overflow-hidden group w-full sm:w-auto min-w-[350px] cursor-help"
                >
                  <div className="bg-black/10 p-3 rounded-xl border border-black/5 relative z-10 shrink-0">
                    <TrendingUp className="w-7 h-7 text-black" />
                  </div>
                  <div className="relative z-10 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60 leading-none mb-2">
                      Capital Proyectado
                    </p>
                    <div className="text-3xl font-black text-black tabular-nums leading-none tracking-tighter flex items-baseline gap-1">
                      <span>${(totalSales || 0).toLocaleString()}</span>
                      <span className="text-xs font-black opacity-60">USD</span>
                    </div>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/95 border border-white/10 text-white p-3 rounded-xl max-w-xs shadow-2xl backdrop-blur-md">
                <p className="text-xs font-bold leading-relaxed">
                  Suma del valor total de todos los prospectos activos. Representa el valor potencial estimado de las cotizaciones en proceso.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Action Buttons Container */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            <input type="file" ref={fileInputRef} onChange={onImportExcel} accept=".csv, .xlsx, .xls" className="hidden" />
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onManageCompanies}
                className="bg-white/[0.03] border-white/5 text-white/50 rounded-xl h-12 px-5 hover:bg-white/[0.08] hover:text-white transition-all font-bold text-[11px] gap-2"
              >
                <Building className="w-4 h-4 text-cyan-400" />
                <span className="hidden xl:inline uppercase tracking-widest">Empresas</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/[0.03] border-white/5 text-white/50 rounded-xl h-12 px-5 hover:bg-white/[0.08] hover:text-white transition-all font-bold text-[11px] gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden xl:inline uppercase tracking-widest">Importar</span>
              </Button>

              <Button
                variant="outline"
                onClick={onExportDataExcel}
                className="bg-white/[0.03] border-white/5 text-white/50 rounded-xl h-12 px-5 hover:bg-white/[0.08] hover:text-white transition-all font-bold text-[11px] gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden xl:inline uppercase tracking-widest">Excel</span>
              </Button>

              <Button
                variant="outline"
                onClick={onExportExcel}
                className="bg-white/[0.03] border-white/5 text-white/50 rounded-xl h-12 px-5 hover:bg-white/[0.08] hover:text-white transition-all font-bold text-[11px] gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden xl:inline uppercase tracking-widest">Plantilla</span>
              </Button>

              <Button
                variant="outline"
                onClick={onExportPDF}
                className="bg-white/[0.03] border-white/5 text-white/50 rounded-xl h-12 px-5 hover:bg-white/[0.08] hover:text-white transition-all font-bold text-[11px] gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="uppercase tracking-widest">PDF</span>
              </Button>
            </div>

            <Button
              onClick={onNewLead}
              className="bg-cyan-400 hover:bg-cyan-300 text-black rounded-2xl h-14 px-8 font-black shadow-[0_0_20px_rgba(34,211,238,0.4)] border-0 gap-3 w-full sm:w-auto text-sm"
            >
              <Plus className="w-6 h-6" />
              <span className="uppercase tracking-tighter">NUEVO</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Middle Row: Strategic Controls */}
      <div className="flex flex-col md:flex-row items-center justify-end gap-4 w-full">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
          <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-white/[0.04] border border-white/15 hover:border-cyan-400/40 text-white/70 hover:bg-white/[0.08] hover:text-cyan-400 rounded-2xl h-14 w-[210px] text-[10px] font-black uppercase tracking-[0.2em] justify-between flex items-center px-5 transition-all">
                <span>Empresa: {selectedCompanyIds.includes('all') ? 'Todas' : (selectedCompanyIds.length === 1 ? (companies.find(c => c.id === selectedCompanyIds[0])?.name || 'Seleccionada') : `${selectedCompanyIds.length} Sel.`)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#121214] border border-white/15 text-white/70 z-50 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl min-w-[210px] p-1">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-white/40 text-[8px] font-black tracking-widest">FILTRAR EMPRESAS</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterDropdownOpen(false);
                  }}
                  className="p-1 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <DropdownMenuCheckboxItem
                checked={selectedCompanyIds.includes('all')}
                onCheckedChange={() => onToggleCompany('all')}
                onSelect={(e) => e.preventDefault()}
                className="focus:bg-white/5 focus:text-white cursor-pointer m-1 rounded-lg py-2 pl-9 relative flex items-center justify-between"
              >
                <span>Todas las Empresas</span>
              </DropdownMenuCheckboxItem>
              <div className="h-px bg-white/5 my-1" />
              {companies.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={selectedCompanyIds.includes(c.id)}
                  onCheckedChange={() => onToggleCompany(c.id)}
                  onSelect={(e) => e.preventDefault()}
                  className="focus:bg-white/5 focus:text-white cursor-pointer m-1 rounded-lg py-2 pl-9 relative flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="w-4 h-4 rounded object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[7px] font-black text-white/50">
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
            className="bg-white/[0.04] border-white/15 text-white/70 rounded-2xl h-14 px-6 hover:bg-white/[0.08] hover:text-cyan-400 hover:border-cyan-400/40 transition-all text-[11px] font-black uppercase tracking-[0.2em] gap-3"
          >
            {dashboardStyle === 'classic' ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <LayoutGrid className="w-4 h-4" />}
            <span>Modo Consola</span>
          </Button>

          <Button
            variant="outline"
            className="bg-white/[0.04] border-white/15 text-white/70 rounded-2xl h-14 px-6 hover:bg-white/[0.08] hover:text-cyan-400 hover:border-cyan-400/40 transition-all text-[11px] font-black uppercase tracking-[0.2em] gap-3"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </Button>

          <div className="bg-white/[0.03] border border-white/15 p-1.5 rounded-2xl flex items-center h-14">
            {[
              { id: 'grid', icon: LayoutGrid, label: '01' },
              { id: 'list', icon: List, label: '02' },
              { id: 'kanban', icon: Columns, label: '03' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-5 h-full rounded-xl flex items-center gap-3 transition-all ${viewMode === v.id ? 'bg-cyan-400/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'text-white/40 hover:text-white'}`}
              >
                <v.icon className="w-4 h-4" />
                <span className="text-[10px] font-black">{v.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/15 p-1.5 rounded-2xl flex items-center h-14">
             <button className="px-4 text-yellow-500/70 hover:text-yellow-500 transition-colors">
                <Palette className="w-5 h-5" />
             </button>
             <button className="px-4 text-white/40 hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
             </button>
             <button className="px-4 text-white/40 hover:text-white transition-colors">
                <Type className="w-5 h-5" />
             </button>
             <button
               onClick={() => setSortMode(sortMode === 'value' ? 'status' : 'value')}
               className={`px-4 transition-colors ${sortMode === 'value' ? 'text-yellow-500' : 'text-white/40 hover:text-white'}`}
             >
                <SortAsc className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status Tabs */}
      <div className="flex flex-wrap items-center gap-3 w-full pb-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatus(opt.value)}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border ${
              selectedStatus === opt.value 
                ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-105' 
                : 'text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 border-white/15 bg-white/[0.02]'
            }`}
          >
            {opt.label} <span className={`ml-2 ${selectedStatus === opt.value ? 'text-black/50' : 'opacity-40'}`}>[{getStatusCount(opt.value)}]</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default LeadsHeader;
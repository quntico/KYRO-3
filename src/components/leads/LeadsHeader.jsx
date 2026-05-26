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
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const LeadsHeader = ({ 
  searchTerm, 
  setSearchTerm, 
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
  setSortMode 
}) => {
  const { theme } = useTheme();
  const fileInputRef = React.useRef(null);

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
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="w-1.5 h-12 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] hidden md:block" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Prospectos</h1>
              <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-400 tracking-[0.2em] animate-pulse">
                LIVE OPS
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
              Strategic AI Console <span className="w-8 h-[1px] bg-white/10" /> v5.5
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Projected Capital Card - Solid Pandora Cyan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-cyan-400 px-10 py-6 rounded-2xl flex items-center gap-8 shadow-[0_0_30px_rgba(34,211,238,0.3)] border-0 relative overflow-hidden group w-full sm:w-auto min-w-[340px]"
          >
            <div className="bg-black/10 p-4 rounded-xl border border-black/5 relative z-10">
              <TrendingUp className="w-10 h-10 text-black" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-black/50 leading-none mb-3">
                Capital Proyectado
              </p>
              <div className="text-4xl font-black text-black tabular-nums leading-none tracking-tighter">
                ${(totalSales || 0).toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons Container */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            <input type="file" ref={fileInputRef} onChange={onImportExcel} accept=".csv, .xlsx, .xls" className="hidden" />
            
            <div className="flex items-center gap-2">
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
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search Vectors / Leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl h-14 pl-14 pr-6 text-sm text-white placeholder:text-white/5 focus:outline-none focus:border-cyan-400/20 focus:bg-white/[0.04] transition-all font-mono tracking-wider"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setDashboardStyle(dashboardStyle === 'classic' ? 'modern' : 'classic')}
            className="bg-white/[0.02] border-white/5 text-white/40 rounded-2xl h-14 px-6 hover:bg-white/[0.08] hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] gap-3"
          >
            {dashboardStyle === 'classic' ? <Sparkles className="w-4 h-4 text-cyan-400" /> : <LayoutGrid className="w-4 h-4" />}
            <span>Console Mode</span>
          </Button>

          <Button
            variant="outline"
            className="bg-white/[0.02] border-white/5 text-white/40 rounded-2xl h-14 px-6 hover:bg-white/[0.08] hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] gap-3"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </Button>

          <div className="bg-white/[0.01] border border-white/5 p-1.5 rounded-2xl flex items-center h-14">
            {[
              { id: 'grid', icon: LayoutGrid, label: '01' },
              { id: 'list', icon: List, label: '02' },
              { id: 'kanban', icon: Columns, label: '03' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-5 h-full rounded-xl flex items-center gap-3 transition-all ${viewMode === v.id ? 'bg-cyan-400/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'text-white/10 hover:text-white/30'}`}
              >
                <v.icon className="w-4 h-4" />
                <span className="text-[10px] font-black">{v.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-1.5 rounded-2xl flex items-center h-14">
             <button className="px-4 text-yellow-500/50 hover:text-yellow-500 transition-colors">
                <Palette className="w-5 h-5" />
             </button>
             <button className="px-4 text-white/10 hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
             </button>
             <button className="px-4 text-white/10 hover:text-white transition-colors">
                <Type className="w-5 h-5" />
             </button>
             <button
               onClick={() => setSortMode(sortMode === 'value' ? 'status' : 'value')}
               className={`px-4 transition-colors ${sortMode === 'value' ? 'text-yellow-500' : 'text-white/10 hover:text-white'}`}
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
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
              selectedStatus === opt.value 
                ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-105' 
                : 'text-white/30 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {opt.label} <span className={`ml-2 ${selectedStatus === opt.value ? 'text-black/50' : 'opacity-30'}`}>[{getStatusCount(opt.value)}]</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default LeadsHeader;
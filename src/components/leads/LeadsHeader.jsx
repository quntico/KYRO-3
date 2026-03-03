import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, FileDown, DollarSign, Upload, LayoutGrid, List, Columns, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';


const LeadsHeader = ({ searchTerm, setSearchTerm, selectedStatus, setSelectedStatus, leads, onNewLead, onExportPDF, onExportExcel, onImportExcel, totalSales, viewMode, setViewMode }) => {
  const { theme } = useTheme();
  const fileInputRef = React.useRef(null);

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'new', label: 'Nuevos' },
    { value: 'hot', label: 'Calientes' },
    { value: 'warm', label: 'Tibios' },
    { value: 'cold', label: 'Fríos' }
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
      className="mb-8"
    >
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6 gap-6">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl md:text-3xl font-bold mb-1 md:mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Prospectos</h1>
          </div>
          <p className="text-sm text-muted-foreground">Gestiona y convierte tus oportunidades de negocio</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-primary px-4 md:px-6 py-2 md:py-3 rounded-2xl flex items-center gap-3 md:gap-4 shadow-[0_0_25px_rgba(var(--primary),0.2)] border border-primary/20 w-full sm:w-auto justify-center sm:justify-start"
          >
            <div className="bg-white/20 p-2 rounded-xl shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-900/60 leading-none mb-1">
                Ventas Posibles
              </p>
              <div className="text-xl md:text-2xl font-black text-slate-900 tabular-nums leading-none">
                ${(totalSales || 0).toLocaleString()}
              </div>
            </div>
          </motion.div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportExcel}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 sm:flex-initial h-10 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
              title="Sube tu archivo Excel/CSV con la lista de leads"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className={`flex-1 sm:flex-initial h-10 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
              title="Descargar plantilla para importar leads"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Plantilla
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              className={`flex-1 sm:flex-initial h-10 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              size="sm"
              className={`w-full sm:w-auto h-10 font-bold ${theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}
              onClick={onNewLead}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar prospectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input h-11 md:h-12"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className={`flex-1 sm:flex-initial items-center space-x-2 h-11 md:h-12 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </Button>

          <div className="flex items-center bg-secondary/50 p-1 rounded-xl border border-border space-x-1 flex-1 sm:flex-initial">

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-xs font-bold">1</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
              <span className="text-xs font-bold">2</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'kanban'
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              title="Vista Kanban"
            >
              <Columns className="w-4 h-4" />
              <span className="text-xs font-bold">3</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 bg-secondary rounded-xl p-1 overflow-x-auto">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedStatus(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedStatus === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {option.label} ({getStatusCount(option.value)})
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default LeadsHeader;
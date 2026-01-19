import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, FileDown, DollarSign, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const LeadsHeader = ({ searchTerm, setSearchTerm, selectedStatus, setSelectedStatus, leads, onNewLead, onExportPDF, onExportExcel, onImportExcel, totalSales }) => {
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
    if (status === 'all') return leads.length;
    return leads.filter(l => l.status === status).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Prospectos</h1>
            <div className="flex items-center space-x-2 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 animate-pulse mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),1)]" />
              <span className="text-[10px] font-bold text-primary tracking-tighter">V. 2.35</span>
            </div>
          </div>
          <p className="text-muted-foreground">Gestiona y convierte tus oportunidades de negocio</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-card border border-border rounded-lg p-3 flex items-center space-x-2 card-hover">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Ventas Posibles</p>
              <p className={`font-bold text-lg ${theme === 'futuristic' ? 'text-glow' : ''}`}>${totalSales.toLocaleString()}</p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportExcel}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className={theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}
            title="Sube tu archivo Excel/CSV con la lista de leads"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <Button
            variant="outline"
            onClick={onExportExcel}
            className={theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}
            title="Descargar plantilla para importar leads"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Plantilla Excel
          </Button>
          <Button
            variant="outline"
            onClick={onExportPDF}
            className={theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}
            onClick={onNewLead}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Prospecto
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar prospectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
          />
        </div>
        <Button
          variant="outline"
          className={`flex items-center space-x-2 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </Button>
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
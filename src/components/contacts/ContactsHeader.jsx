import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const ContactsHeader = ({ searchTerm, onSearchChange, onExportPDF, onFilter, onNewContact }) => {
  const { theme } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Contactos</h1>
          <p className="text-muted-foreground">Gestiona tu red de contactos profesionales</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onExportPDF} className={theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}>
            <Download className="w-4 h-4 mr-2" />
            Exportar a PDF
          </Button>
          <Button onClick={onNewContact} className={theme === 'futuristic' ? 'button-glow bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
          />
        </div>
        <Button
          variant="outline"
          className={`flex items-center space-x-2 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
          onClick={onFilter}
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default ContactsHeader;
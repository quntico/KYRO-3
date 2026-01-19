import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Filter, 
  Target,
  TrendingUp,
  Clock,
  Star,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const leads = [
    {
      id: 1,
      name: 'TechStart Solutions',
      contact: 'Roberto Silva',
      email: 'roberto@techstart.com',
      phone: '+34 612 345 678',
      status: 'hot',
      score: 95,
      source: 'Website',
      value: 45000,
      lastActivity: '2 horas',
      notes: 'Interesado en solución enterprise'
    },
    {
      id: 2,
      name: 'Digital Marketing Pro',
      contact: 'Laura Fernández',
      email: 'laura@digitalmp.com',
      phone: '+34 687 654 321',
      status: 'warm',
      score: 78,
      source: 'LinkedIn',
      value: 25000,
      lastActivity: '1 día',
      notes: 'Necesita propuesta personalizada'
    },
    {
      id: 3,
      name: 'InnovateCorp',
      contact: 'Miguel Torres',
      email: 'miguel@innovatecorp.es',
      phone: '+34 654 987 123',
      status: 'cold',
      score: 45,
      source: 'Referido',
      value: 15000,
      lastActivity: '5 días',
      notes: 'Primer contacto establecido'
    },
    {
      id: 4,
      name: 'StartupXYZ',
      contact: 'Carmen López',
      email: 'carmen@startupxyz.com',
      phone: '+34 698 123 456',
      status: 'hot',
      score: 88,
      source: 'Email Campaign',
      value: 35000,
      lastActivity: '4 horas',
      notes: 'Listo para demo'
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos', count: leads.length },
    { value: 'hot', label: 'Calientes', count: leads.filter(l => l.status === 'hot').length },
    { value: 'warm', label: 'Tibios', count: leads.filter(l => l.status === 'warm').length },
    { value: 'cold', label: 'Fríos', count: leads.filter(l => l.status === 'cold').length }
  ];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-600';
      case 'warm': return 'bg-yellow-100 text-yellow-600';
      case 'cold': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'hot': return 'Caliente';
      case 'warm': return 'Tibio';
      case 'cold': return 'Frío';
      default: return status;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAction = (action, lead = null) => {
    const actionName = lead ? `${action} - ${lead.name}` : action;
    toast({
      title: `🚧 ${actionName}`,
      description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
              <p className="text-gray-600">Gestiona y convierte tus oportunidades de negocio</p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={() => handleAction('Nuevo Lead')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => handleAction('Filtros Avanzados')}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </Button>
          </div>

          {/* Status Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedStatus === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover"
            >
              {/* Lead Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{lead.name}</h3>
                  <p className="text-sm text-gray-600">{lead.contact}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {getStatusLabel(lead.status)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => handleAction('Más opciones', lead)}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* Lead Score */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Score:</span>
                  <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                    {lead.score}/100
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    €{lead.value.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p>📧 {lead.email}</p>
                <p>📞 {lead.phone}</p>
                <p>🔗 {lead.source}</p>
              </div>

              {/* Last Activity */}
              <div className="flex items-center space-x-2 mb-4 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Última actividad: {lead.lastActivity}</span>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {lead.notes}
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction('Ver Detalles', lead)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction('Editar', lead)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAction('Eliminar', lead)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron leads</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer lead'}
            </p>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={() => handleAction('Nuevo Lead')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Lead
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leads;
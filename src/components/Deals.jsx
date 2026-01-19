import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, HeartHandshake as Handshake, DollarSign, Calendar, User, MoreVertical, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Deals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  
  const deals = [
    {
      id: 1,
      title: 'Implementación CRM - TechCorp',
      client: 'TechCorp Solutions',
      contact: 'María González',
      value: 75000,
      stage: 'proposal',
      probability: 80,
      closeDate: '2024-02-15',
      lastActivity: '1 día',
      description: 'Implementación completa de sistema CRM enterprise'
    },
    {
      id: 2,
      title: 'Consultoría Digital - StartupXYZ',
      client: 'StartupXYZ',
      contact: 'Carlos Ruiz',
      value: 35000,
      stage: 'negotiation',
      probability: 90,
      closeDate: '2024-01-30',
      lastActivity: '3 horas',
      description: 'Consultoría en transformación digital'
    },
    {
      id: 3,
      title: 'Desarrollo Web - InnovaCorp',
      client: 'InnovaCorp',
      contact: 'Ana Martín',
      value: 25000,
      stage: 'qualification',
      probability: 60,
      closeDate: '2024-03-10',
      lastActivity: '2 días',
      description: 'Desarrollo de plataforma web personalizada'
    },
    {
      id: 4,
      title: 'Marketing Automation - Digital Agency',
      client: 'Digital Agency',
      contact: 'David López',
      value: 45000,
      stage: 'closed-won',
      probability: 100,
      closeDate: '2024-01-15',
      lastActivity: '1 semana',
      description: 'Sistema de automatización de marketing'
    },
    {
      id: 5,
      title: 'ERP Integration - ManufacturingCo',
      client: 'ManufacturingCo',
      contact: 'Elena Rodríguez',
      value: 120000,
      stage: 'discovery',
      probability: 40,
      closeDate: '2024-04-20',
      lastActivity: '5 días',
      description: 'Integración de sistema ERP'
    }
  ];

  const stages = [
    { value: 'all', label: 'Todos', count: deals.length },
    { value: 'discovery', label: 'Descubrimiento', count: deals.filter(d => d.stage === 'discovery').length },
    { value: 'qualification', label: 'Calificación', count: deals.filter(d => d.stage === 'qualification').length },
    { value: 'proposal', label: 'Propuesta', count: deals.filter(d => d.stage === 'proposal').length },
    { value: 'negotiation', label: 'Negociación', count: deals.filter(d => d.stage === 'negotiation').length },
    { value: 'closed-won', label: 'Ganados', count: deals.filter(d => d.stage === 'closed-won').length },
    { value: 'closed-lost', label: 'Perdidos', count: deals.filter(d => d.stage === 'closed-lost').length }
  ];

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage) => {
    switch (stage) {
      case 'discovery': return 'bg-blue-100 text-blue-600';
      case 'qualification': return 'bg-yellow-100 text-yellow-600';
      case 'proposal': return 'bg-purple-100 text-purple-600';
      case 'negotiation': return 'bg-orange-100 text-orange-600';
      case 'closed-won': return 'bg-green-100 text-green-600';
      case 'closed-lost': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'discovery': return 'Descubrimiento';
      case 'qualification': return 'Calificación';
      case 'proposal': return 'Propuesta';
      case 'negotiation': return 'Negociación';
      case 'closed-won': return 'Ganado';
      case 'closed-lost': return 'Perdido';
      default: return stage;
    }
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleAction = (action, deal = null) => {
    const actionName = deal ? `${action} - ${deal.title}` : action;
    toast({
      title: `🚧 ${actionName}`,
      description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
    });
  };

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgProbability = filteredDeals.length > 0 
    ? Math.round(filteredDeals.reduce((sum, deal) => sum + deal.probability, 0) / filteredDeals.length)
    : 0;

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Deals</h1>
              <p className="text-gray-600">Gestiona tus oportunidades de negocio y cierra más ventas</p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={() => handleAction('Nuevo Deal')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Deal
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-xl font-bold text-gray-900">€{totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Handshake className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deals Activos</p>
                  <p className="text-xl font-bold text-gray-900">{filteredDeals.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Probabilidad Promedio</p>
                  <p className="text-xl font-bold text-gray-900">{avgProbability}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar deals..."
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

          {/* Stage Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {stages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => setSelectedStage(stage.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStage === stage.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {stage.label} ({stage.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDeals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover"
            >
              {/* Deal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{deal.title}</h3>
                  <p className="text-sm text-gray-600">{deal.client}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                    {getStageLabel(deal.stage)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => handleAction('Más opciones', deal)}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* Deal Value & Probability */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    €{deal.value.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Probabilidad:</span>
                  <span className={`font-semibold ${getProbabilityColor(deal.probability)}`}>
                    {deal.probability}%
                  </span>
                </div>
              </div>

              {/* Contact & Date Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{deal.contact}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Cierre: {new Date(deal.closeDate).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 line-clamp-2">
                  {deal.description}
                </p>
              </div>

              {/* Last Activity */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-gray-600">Última actividad: {deal.lastActivity}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction('Ver Detalles', deal)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction('Editar', deal)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAction('Eliminar', deal)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDeals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron deals</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer deal'}
            </p>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={() => handleAction('Nuevo Deal')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Deal
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Deals;
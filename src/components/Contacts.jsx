import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  Building,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const contacts = [
    {
      id: 1,
      name: 'María González',
      email: 'maria@techcorp.com',
      phone: '+34 612 345 678',
      company: 'TechCorp Solutions',
      position: 'CEO',
      status: 'active',
      avatar: 'MG',
      favorite: true
    },
    {
      id: 2,
      name: 'Carlos Ruiz',
      email: 'carlos@startupxyz.com',
      phone: '+34 687 654 321',
      company: 'StartupXYZ',
      position: 'CTO',
      status: 'active',
      avatar: 'CR',
      favorite: false
    },
    {
      id: 3,
      name: 'Ana Martín',
      email: 'ana@innovacorp.es',
      phone: '+34 654 987 123',
      company: 'InnovaCorp',
      position: 'Marketing Director',
      status: 'inactive',
      avatar: 'AM',
      favorite: true
    },
    {
      id: 4,
      name: 'David López',
      email: 'david@digitalagency.com',
      phone: '+34 698 123 456',
      company: 'Digital Agency',
      position: 'Founder',
      status: 'active',
      avatar: 'DL',
      favorite: false
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (action, contact = null) => {
    const actionName = contact ? `${action} - ${contact.name}` : action;
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contactos</h1>
              <p className="text-gray-600">Gestiona tu red de contactos profesionales</p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={() => handleAction('Nuevo Contacto')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contacto
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar contactos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => handleAction('Filtros')}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </Button>
          </div>
        </motion.div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover"
            >
              {/* Contact Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {contact.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => handleAction('Favorito', contact)}
                  >
                    <Star className={`w-4 h-4 ${contact.favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => handleAction('Más opciones', contact)}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{contact.company}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{contact.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{contact.phone}</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  contact.status === 'active' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {contact.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAction('Editar', contact)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAction('Eliminar', contact)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron contactos</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer contacto'}
            </p>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={() => handleAction('Nuevo Contacto')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Contacto
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
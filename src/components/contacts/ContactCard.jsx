import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Building,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  FileText,
  Target,
  TrendingUp,
  Banknote,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ContactCard = ({ contact, index, onEdit, onDelete, onConvertToLead, onAction }) => {
  const { theme } = useTheme();
  return (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col card-hover"
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${theme === 'futuristic' ? 'bg-gradient-to-br from-primary to-accent' : 'bg-gradient-to-br from-blue-500 to-purple-600'} rounded-full flex items-center justify-center text-white font-semibold`}>
              {contact.avatar}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-foreground ${theme === 'futuristic' ? 'text-glow' : ''}`}>{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.position}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => onAction('Favorito', contact)}
            >
              <Star className={`w-4 h-4 ${contact.favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => onAction('Más opciones', contact)}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3 text-sm">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{contact.company}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{contact.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{contact.phone}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            contact.status === 'active' 
              ? theme === 'futuristic' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
              : theme === 'futuristic' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {contact.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
          <div className="flex items-center space-x-4">
            {contact.saleAmount > 0 && (
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  ${contact.saleAmount.toLocaleString()}
                </span>
              </div>
            )}
            {contact.commission > 0 && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <Banknote className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  ${contact.commission.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mt-auto">
        {contact.quotations && contact.quotations.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 ${theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}`}
              >
                <FileText className="w-4 h-4 mr-1" />
                Ver Cotizaciones
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {contact.quotations.map((q, i) => (
                <DropdownMenuItem key={i} onClick={() => window.open(q.url, '_blank')}>
                  {q.fileName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled
          >
            <FileText className="w-4 h-4 mr-1" />
            Sin Cotización
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onConvertToLead(contact)}
          title="Convertir a Lead"
          className={theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}
        >
          <Target className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(contact)}
          className={theme === 'futuristic' ? 'border-primary text-primary hover:bg-primary/20' : ''}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={theme === 'futuristic' ? 'border-destructive text-destructive hover:bg-destructive/20' : 'text-red-500 hover:bg-red-900/20'}
          onClick={() => onDelete(contact)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ContactCard;
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  Calendar,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const stats = [
    {
      title: 'Ingresos del Mes',
      value: '$127,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Nuevos Leads',
      value: '342',
      change: '+8.2%',
      trend: 'up',
      icon: Target,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Deals Cerrados',
      value: '28',
      change: '-2.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-600'
    },
    {
      title: 'Contactos Activos',
      value: '1,247',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'deal', title: 'Deal cerrado con TechCorp', amount: '$25,000', time: 'Hace 2 horas' },
    { id: 2, type: 'lead', title: 'Nuevo lead calificado', company: 'StartupXYZ', time: 'Hace 4 horas' },
    { id: 3, type: 'meeting', title: 'Reunión programada', contact: 'María González', time: 'Hace 6 horas' },
    { id: 4, type: 'contact', title: 'Contacto actualizado', contact: 'Carlos Ruiz', time: 'Hace 8 horas' }
  ];

  const upcomingTasks = [
    { id: 1, title: 'Llamar a prospecto ABC Corp', priority: 'high', due: 'Hoy 14:00' },
    { id: 2, title: 'Enviar propuesta a cliente XYZ', priority: 'medium', due: 'Mañana 10:00' },
    { id: 3, title: 'Reunión de seguimiento', priority: 'low', due: 'Viernes 16:00' }
  ];

  const handleQuickAction = (action) => {
    toast({
      title: `🚧 ${action}`,
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Bienvenido de vuelta! 👋
              </h1>
              <p className="text-gray-600">
                Aquí tienes un resumen de tu actividad comercial
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => handleQuickAction('Notificaciones')}
              >
                <Bell className="w-4 h-4" />
                <span>3</span>
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                onClick={() => handleQuickAction('Acción Rápida')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Acción Rápida
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Actividad Reciente</h2>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('Ver Todo')}>
                Ver todo
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'deal' ? 'bg-green-100 text-green-600' :
                    activity.type === 'lead' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {activity.type === 'deal' ? <DollarSign className="w-5 h-5" /> :
                     activity.type === 'lead' ? <Target className="w-5 h-5" /> :
                     activity.type === 'meeting' ? <Calendar className="w-5 h-5" /> :
                     <Users className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {activity.amount || activity.company || activity.contact}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Tasks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Próximas Tareas</h2>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('Nueva Tarea')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{task.due}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
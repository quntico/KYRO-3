import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { theme } = useTheme();
  
  const periods = [
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' }
  ];

  const kpis = [
    {
      title: 'Ingresos Totales',
      value: '$247,850',
      change: '+18.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      futuristicColor: 'from-green-400 to-cyan-400',
    },
    {
      title: 'Tasa de Conversión',
      value: '24.8%',
      change: '+3.1%',
      trend: 'up',
      icon: Target,
      color: 'from-blue-500 to-cyan-600',
      futuristicColor: 'from-cyan-400 to-blue-500',
    },
    {
      title: 'Prospectos Generados',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-violet-600',
      futuristicColor: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Tiempo Promedio de Cierre',
      value: '18 días',
      change: '-2.3 días',
      trend: 'up',
      icon: Calendar,
      color: 'from-orange-500 to-red-600',
      futuristicColor: 'from-orange-400 to-yellow-500',
    }
  ];

  const salesData = [
    { month: 'Ene', value: 45000, leads: 120, deals: 15 },
    { month: 'Feb', value: 52000, leads: 135, deals: 18 },
    { month: 'Mar', value: 48000, leads: 128, deals: 16 },
    { month: 'Abr', value: 61000, leads: 145, deals: 22 },
    { month: 'May', value: 58000, leads: 142, deals: 20 },
    { month: 'Jun', value: 67000, leads: 158, deals: 25 }
  ];

  const topPerformers = [
    { name: 'María González', deals: 28, revenue: 125000, conversion: 32 },
    { name: 'Carlos Ruiz', deals: 24, revenue: 98000, conversion: 28 },
    { name: 'Ana Martín', deals: 22, revenue: 87000, conversion: 26 },
    { name: 'David López', deals: 19, revenue: 76000, conversion: 24 }
  ];

  const leadSources = [
    { source: 'Website', leads: 342, percentage: 35, color: 'bg-blue-500' },
    { source: 'LinkedIn', leads: 287, percentage: 29, color: 'bg-purple-500' },
    { source: 'Email Campaign', leads: 198, percentage: 20, color: 'bg-green-500' },
    { source: 'Referidos', leads: 156, percentage: 16, color: 'bg-orange-500' }
  ];

  const handleAction = (action) => {
    toast({
      title: `🚧 ${action}`,
      description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
      <Helmet>
        <title>Analytics - KYROS</title>
        <meta name="description" content="Analiza el rendimiento de tu equipo de ventas y métricas clave en KYROS CRM." />
      </Helmet>
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
              <h1 className={`text-3xl font-bold mb-2 ${theme === 'futuristic' ? 'text-glow' : ''}`}>Analytics</h1>
              <p className="text-muted-foreground">Analiza el rendimiento de tu equipo de ventas</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => handleAction('Actualizar Datos')}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => handleAction('Exportar Reporte')}
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-1 bg-secondary rounded-xl p-1 w-fit">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
            
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border card-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme === 'futuristic' ? kpi.futuristicColor : kpi.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{kpi.change}</span>
                  </div>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold mb-1 ${theme === 'futuristic' ? 'text-glow' : 'text-foreground'}`}>{kpi.value}</h3>
                  <p className="text-muted-foreground text-sm">{kpi.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${theme === 'futuristic' ? 'text-glow' : ''}`}>Evolución de Ventas</h2>
              <Button variant="ghost" size="sm" onClick={() => handleAction('Ver Detalles del Gráfico')}>
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {salesData.map((data, index) => (
                <motion.div
                  key={data.month}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <span className="text-sm font-medium text-muted-foreground w-8">{data.month}</span>
                  <div className="flex-1 bg-secondary rounded-full h-3 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.value / 70000) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className={`h-full ${theme === 'futuristic' ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gradient-to-r from-blue-500 to-purple-600'} rounded-full`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-16 text-right">
                    ${(data.value / 1000).toFixed(0)}k
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Lead Sources */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${theme === 'futuristic' ? 'text-glow' : ''}`}>Fuentes de Prospectos</h2>
              <Button variant="ghost" size="sm" onClick={() => handleAction('Analizar Fuentes')}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {leadSources.map((source, index) => (
                <motion.div
                  key={source.source}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${source.color}`} />
                    <span className="font-medium text-foreground">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{source.leads}</p>
                    <p className="text-sm text-muted-foreground">{source.percentage}%</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${theme === 'futuristic' ? 'text-glow' : ''}`}>Top Performers</h2>
            <Button variant="ghost" size="sm" onClick={() => handleAction('Ver Ranking Completo')}>
              Ver todo
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vendedor</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Ventas</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Ingresos</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((performer, index) => (
                  <motion.tr
                    key={performer.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${theme === 'futuristic' ? 'bg-gradient-to-br from-primary to-accent' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-foreground">{performer.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-foreground">
                      {performer.deals}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-foreground">
                      ${(performer.revenue / 1000).toFixed(0)}k
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${theme === 'futuristic' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        {performer.conversion}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
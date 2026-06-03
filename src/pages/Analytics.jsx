import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext.jsx';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar,
  Download, Filter, RefreshCw, Flame, Activity, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { theme } = useTheme();
  const { leads } = useData();

  const periods = [
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' }
  ];

  const metrics = useMemo(() => {
    const rawList = Array.isArray(leads) ? leads : [];
    
    // Enrich leads with calculated value from their machines or fallback to direct value
    const list = rawList.map(lead => {
      const machineValue = (lead.machines || []).reduce((sum, m) => sum + (Number(m?.price) || 0), 0);
      const totalValue = machineValue > 0 ? machineValue : (Number(lead.value) || 0);
      return { ...lead, value: totalValue };
    });

    const total = list.length;
    const totalValue = list.reduce((acc, lead) => acc + lead.value, 0);
    const avgScore = total > 0 ? Math.round(list.reduce((acc, lead) => acc + (Number(lead.score) || 0), 0) / total) : 0;
    
    const hotLeads = list.filter(l => l.status === 'hot' || l.status === 'closing');
    const hotValue = hotLeads.reduce((acc, lead) => acc + lead.value, 0);

    const statuses = [
      { id: 'closing', label: 'Cierre', color: 'bg-[#0047FF]', text: 'text-[#00D4FF]', border: 'border-[#0047FF]/30', bgGlow: 'bg-[#0047FF]/10' },
      { id: 'hot', label: 'Caliente', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30', bgGlow: 'bg-red-500/10' },
      { id: 'warming', label: 'Avanzando', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', bgGlow: 'bg-emerald-500/10' },
      { id: 'warm', label: 'Tibio', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', bgGlow: 'bg-orange-500/10' },
      { id: 'cooling', label: 'Enfriando', color: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30', bgGlow: 'bg-cyan-500/10' },
      { id: 'cold', label: 'Frío', color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30', bgGlow: 'bg-blue-500/10' },
      { id: 'new', label: 'Nuevo', color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', bgGlow: 'bg-purple-500/10' },
      { id: 'declined', label: 'Declinado', color: 'bg-[#8B4513]', text: 'text-[#D2691E]', border: 'border-[#8B4513]/30', bgGlow: 'bg-[#8B4513]/10' },
    ];

    const breakdown = statuses.map(s => {
      const match = list.filter(l => l.status === s.id);
      return {
        ...s,
        count: match.length,
        value: match.reduce((acc, l) => acc + l.value, 0),
        percentage: total > 0 ? Math.round((match.length / total) * 100) : 0
      };
    }).filter(s => s.count > 0).sort((a, b) => b.value - a.value);

    // Group by month for chart (using created_at or random fallback if not available)
    const monthlyData = {};
    list.forEach(l => {
      const date = l.created_at ? new Date(l.created_at) : new Date();
      const month = date.toLocaleString('es-ES', { month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = { value: 0, count: 0 };
      monthlyData[month].value += (Number(l.value) || 0);
      monthlyData[month].count += 1;
    });

    const chartData = Object.keys(monthlyData).map(k => ({
      month: k,
      value: monthlyData[k].value,
      count: monthlyData[k].count
    }));

    return { total, totalValue, avgScore, hotCount: hotLeads.length, hotValue, breakdown, chartData };
  }, [leads]);

  const kpis = [
    {
      title: 'Valor Total del Pipeline',
      value: `$${metrics.totalValue.toLocaleString()}`,
      subtitle: 'Todos los prospectos activos',
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Próximos a Cierre',
      value: `$${metrics.hotValue.toLocaleString()}`,
      subtitle: `${metrics.hotCount} prospectos a punto de cerrar`,
      icon: Flame,
      color: 'text-[#00D4FF]',
      bg: 'bg-[#0047FF]/20',
    },
    {
      title: 'Prospectos Generados',
      value: metrics.total.toString(),
      subtitle: 'Volumen total gestionado',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Score Promedio',
      value: `${metrics.avgScore}/100`,
      subtitle: 'Calidad general de los leads',
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    }
  ];

  const handleAction = (action) => {
    toast({
      title: `🚧 ${action}`,
      description: "Generando reporte de analíticas en tiempo real...",
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
      <Helmet>
        <title>Analíticas - KYRO</title>
        <meta name="description" content="Analíticas reales de tu pipeline." />
      </Helmet>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent tracking-tight">
              Analíticas del Pipeline
            </h1>
            <p className="text-muted-foreground">Datos reales en vivo basados en tus prospectos</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2 border-white/10 hover:bg-white/5"
              onClick={() => handleAction('Actualizar Datos')}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sincronizar</span>
            </Button>
            <Button
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20"
              onClick={() => handleAction('Exportar Reporte')}
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <motion.div 
              key={kpi.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="p-6 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-xl flex flex-col justify-between shadow-xl relative overflow-hidden group min-h-[160px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest leading-tight w-2/3">
                  {kpi.title}
                </p>
                <div className={`p-3 rounded-2xl ${kpi.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <div className="relative z-10">
                <h4 className="text-3xl font-black text-white tracking-tighter mb-1">{kpi.value}</h4>
                <p className="text-xs text-white/40">{kpi.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Breakdown by Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/20 rounded-[2rem] p-6 shadow-xl border border-white/5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">Valor por Estado</h2>
              <Button variant="ghost" size="sm" className="opacity-50 hover:opacity-100">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-5">
              {metrics.breakdown.length > 0 ? metrics.breakdown.map((data, index) => (
                <motion.div
                  key={data.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-4 group"
                >
                  <div className="w-24 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${data.border} ${data.text} ${data.bgGlow}`}>
                      {data.label}
                    </span>
                  </div>
                  
                  <div className="flex-1 bg-white/5 rounded-full h-3 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.value / (metrics.totalValue || 1)) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 1, type: "spring" }}
                      className={`h-full ${data.color} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                    />
                  </div>
                  
                  <div className="w-28 text-right flex flex-col">
                    <span className="text-sm font-black text-white">
                      ${data.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">
                      {data.count} Leads ({data.percentage}%)
                    </span>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-10 text-white/40">No hay datos suficientes para mostrar.</div>
              )}
            </div>
          </motion.div>

          {/* Timeline / Funnel (mockup with real lead counts) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/20 rounded-[2rem] p-6 shadow-xl border border-white/5 backdrop-blur-xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">Desglose de Pipeline</h2>
              <Button variant="ghost" size="sm" className="opacity-50 hover:opacity-100">
                <Target className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4">
               {metrics.breakdown.length > 0 ? metrics.breakdown.map((data, index) => {
                 // Creating a funnel-like visual
                 const width = Math.max(20, 100 - (index * 12));
                 return (
                   <motion.div 
                     key={`funnel-${data.id}`}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.6 + index * 0.1 }}
                     className={`mx-auto h-12 flex items-center justify-between px-6 rounded-2xl ${data.bgGlow} border ${data.border}`}
                     style={{ width: `${width}%` }}
                   >
                     <span className={`font-bold ${data.text}`}>{data.label}</span>
                     <span className="font-black text-white">{data.count}</span>
                   </motion.div>
                 );
               }) : (
                 <div className="text-center py-10 text-white/40">Agrega prospectos para ver el embudo.</div>
               )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
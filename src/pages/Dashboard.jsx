import React, { useState, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Target, HeartHandshake, DollarSign, Clock, TrendingUp, TrendingDown, Command as KyroRune } from 'lucide-react';
    import { format, parseISO } from 'date-fns';
    import useTextScramble from '@/hooks/useTextScramble.js';
    import { useData } from '@/contexts/DataContext';
    import { useSettings } from '@/contexts/SettingsContext';

    import DealsChart from '@/components/dashboard/DealsChart';
    import RecentActivity from '@/components/dashboard/RecentActivity';
    import TasksList from '@/components/dashboard/TasksList';
    import StatDetailDialog from '@/components/dashboard/StatDetailDialog';
    import WeatherWidget from '@/components/dashboard/WeatherWidget';
    import ExchangeRateWidget from '@/components/dashboard/ExchangeRateWidget';
    import BitcoinWidget from '@/components/dashboard/BitcoinWidget';
    import DynamicClock from '@/components/dashboard/DynamicClock';
    import NewsTicker from '@/components/dashboard/NewsTicker';

    const Dashboard = () => {
      const { leads, deals, tasks, contacts, loading, setTasks } = useData();
      const { settings, loading: settingsLoading } = useSettings();
      
      const [isStatDetailDialogOpen, setIsStatDetailDialogOpen] = useState(false);
      const [statDetailType, setStatDetailType] = useState('');
      const [statDetailTitle, setStatDetailTitle] = useState('');
      const [statDetailData, setStatDetailData] = useState([]);
      const [statDetailTotal, setStatDetailTotal] = useState(0);

      const greetings = useMemo(() => (settings.greetings || 'Hola,Bienvenido').split(','), [settings.greetings]);
      const [scrambledText, nextGreeting] = useTextScramble(greetings);

      const stats = useMemo(() => ({
        totalLeads: leads.length,
        totalDeals: deals.filter(d => d.stage === 'closed-won').length,
        totalRevenue: deals.filter(d => d.stage === 'closed-won').reduce((sum, deal) => sum + (deal.value || 0), 0),
        openTasks: tasks.filter(task => !task.completed).length,
      }), [leads, deals, tasks]);

      const handleViewStatDetail = (type) => {
        setStatDetailType(type);
        let title = '';
        let data = [];
        let total = 0;

        switch (type) {
          case 'leads':
            title = 'Total Prospectos';
            data = leads.map(lead => ({ primary: lead.name, secondary: lead.contact }));
            break;
          case 'deals':
            title = 'Ventas Cerradas';
            data = deals.filter(d => d.stage === 'closed-won').map(deal => ({ primary: deal.title, secondary: `${(deal.value || 0).toLocaleString()}` }));
            break;
          case 'revenue':
            title = 'Ingresos Totales';
            data = deals.filter(d => d.stage === 'closed-won').map(deal => ({ primary: deal.title, secondary: `${(deal.value || 0).toLocaleString()}` }));
            break;
          case 'tasks':
            title = 'Tareas Pendientes';
            data = tasks.filter(task => !task.completed).map(task => ({ primary: task.title, secondary: `Vence: ${format(parseISO(task.due), 'dd/MM/yyyy')}` }));
            break;
        }
        setStatDetailTitle(title);
        setStatDetailData(data);
        setStatDetailTotal(total);
        setIsStatDetailDialogOpen(true);
      };

      const StatCard = ({ title, value, icon: Icon, color, onClick, trend = null }) => (
        <motion.div
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className={`bg-card/60 backdrop-blur-sm rounded-2xl p-3 md:p-6 shadow-lg border border-white/10 flex flex-col justify-between cursor-pointer card-hover`}
          onClick={onClick}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xs md:text-sm font-medium text-muted-foreground">{title}</h3>
            <div className={`p-1.5 md:p-2 rounded-lg bg-slate-800/50`}>
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl md:text-4xl font-bold text-glow`}>{value}</span>
            {trend && (
              <span className={`hidden md:flex items-center text-sm font-medium ${trend.type === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {trend.type === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {trend.value}
              </span>
            )}
          </div>
        </motion.div>
      );
      
      if (loading || settingsLoading) {
        return (
          <div className="flex items-center justify-center w-full h-full bg-background">
            <KyroRune className="w-16 h-16 animate-spin text-primary" />
          </div>
        );
      }

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
          <Helmet>
            <title>Dashboard - KYRO</title>
            <meta name="description" content="Panel de control principal de KYRO CRM con resumen de ventas, leads y tareas." />
          </Helmet>
          <div className="p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-between items-start mb-6"
            >
              <div>
                <h1 
                  className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-glow cursor-pointer font-mono text-primary`}
                  onClick={nextGreeting}
                >
                  {scrambledText}
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground">Aquí tienes un resumen de tu actividad.</p>
              </div>
              <DynamicClock />
            </motion.div>

            {settings.logo_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-center items-center my-4 md:my-8"
              >
                <img src={settings.logo_url} alt="Logo de la Compañía" className="max-h-24 object-contain" />
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 md:mb-8">
                <WeatherWidget />
                <ExchangeRateWidget />
                <BitcoinWidget />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6 md:mb-8">
              <NewsTicker />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              <StatCard
                title="Prospectos"
                value={stats.totalLeads}
                icon={Target}
                color="text-cyan-400"
                onClick={() => handleViewStatDetail('leads')}
              />
              <StatCard
                title="Ventas"
                value={stats.totalDeals}
                icon={HeartHandshake}
                color="text-green-400"
                onClick={() => handleViewStatDetail('deals')}
              />
              <StatCard
                title="Ingresos"
                value={`${(stats.totalRevenue/1000).toFixed(0)}k`}
                icon={DollarSign}
                color="text-yellow-400"
                onClick={() => handleViewStatDetail('revenue')}
              />
              <StatCard
                title="Tareas"
                value={stats.openTasks}
                icon={Clock}
                color="text-red-400"
                onClick={() => handleViewStatDetail('tasks')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="lg:col-span-2"
              >
                <TasksList tasks={tasks} setTasks={setTasks} contacts={contacts} leads={leads} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-full"
              >
                <DealsChart deals={deals} />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <RecentActivity leads={leads} deals={deals} tasks={tasks} />
            </motion.div>
          </div>

          <StatDetailDialog
            isOpen={isStatDetailDialogOpen}
            onClose={() => setIsStatDetailDialogOpen(false)}
            title={statDetailTitle}
            data={statDetailData}
            total={statDetailTotal}
          />
        </div>
      );
    };

    export default Dashboard;
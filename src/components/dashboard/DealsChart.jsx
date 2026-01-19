import React from 'react';
    import { motion } from 'framer-motion';
    import { TrendingUp } from 'lucide-react';
    import { useTheme } from '@/contexts/ThemeContext.jsx';

    const DealsChart = ({ deals }) => {
      const { theme } = useTheme();
      
      const chartData = [
        { month: 'Ene', value: 65 },
        { month: 'Feb', value: 78 },
        { month: 'Mar', value: 52 },
        { month: 'Abr', value: 85 },
        { month: 'May', value: 92 },
        { month: 'Jun', value: 88 },
      ];

      const maxValue = Math.max(...chartData.map(d => d.value));

      const activeDeals = deals.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length;
      const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
      const wonDeals = deals.filter(d => d.stage === 'closed-won').length;
      const totalClosedDeals = deals.filter(d => d.stage === 'closed-won' || d.stage === 'closed-lost').length;
      const winRate = totalClosedDeals > 0 ? Math.round((wonDeals / totalClosedDeals) * 100) : 0;

      return (
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border border-white/10 h-full flex flex-col card-hover">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-glow">Rendimiento</h3>
              <p className="text-muted-foreground text-xs md:text-sm">Evolución mensual</p>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 text-green-400">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm font-medium">+15.3%</span>
            </div>
          </div>

          <div className="h-48 md:h-64 flex items-end justify-between space-x-2 md:space-x-4 mt-4 flex-grow">
            {chartData.map((item, index) => (
              <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, type: 'spring', stiffness: 50 }}
                  className="w-full rounded-md md:rounded-lg mb-2 min-h-[10px] bg-gradient-to-t from-primary to-accent"
                  style={{ boxShadow: '0 0 10px hsl(var(--primary)/0.5)' }}
                />
                <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 md:mt-6 grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-lg md:text-2xl font-bold text-glow">{activeDeals}</p>
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
            <div className="text-center">
              <p className="text-lg md:text-2xl font-bold text-green-400 text-shadow-[0_0_8px_hsl(var(--primary))]">${(totalValue / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Valor</p>
            </div>
            <div className="text-center">
              <p className="text-lg md:text-2xl font-bold text-glow">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Cierre</p>
            </div>
          </div>
        </div>
      );
    };

    export default DealsChart;
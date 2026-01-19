import React from 'react';
    import { motion } from 'framer-motion';
    import { Bitcoin, ArrowUp, ArrowDown } from 'lucide-react';

    const BitcoinWidget = () => {
      const btcData = {
        price: 1189420.55,
        trend: 'up',
      };

      const TrendIcon = ({ trend }) => {
        if (trend === 'up') {
          return <ArrowUp className="w-4 h-4 text-green-400" />;
        }
        return <ArrowDown className="w-4 h-4 text-red-400" />;
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 card-hover h-full flex flex-col"
        >
          <h3 className="text-base font-semibold text-glow mb-3 flex items-center">
            <Bitcoin className="w-5 h-5 mr-2 text-orange-400" /> Bitcoin (Google)
          </h3>
          <div className="flex flex-col items-center justify-center flex-grow">
            <p className="text-sm text-muted-foreground">Precio en MXN</p>
            <div className="flex items-baseline justify-center mt-1">
              <span className="text-xl md:text-2xl font-bold text-glow mr-2">${btcData.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <TrendIcon trend={btcData.trend} />
            </div>
          </div>
        </motion.div>
      );
    };

    export default BitcoinWidget;
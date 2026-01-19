import React from 'react';
    import { motion } from 'framer-motion';
    import { DollarSign, ArrowUp, ArrowDown, Banknote } from 'lucide-react';

    const ExchangeRateWidget = () => {
      const exchangeData = {
        currency: 'USD',
        buy: {
          price: 17.05,
          trend: 'down',
        },
        sell: {
          price: 17.95,
          trend: 'up',
        },
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
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 card-hover h-full flex flex-col"
        >
          <h3 className="text-base font-semibold text-glow mb-3 flex items-center">
            <Banknote className="w-5 h-5 mr-2" /> Dólar Hoy (MXN)
          </h3>
          <div className="flex items-center justify-around flex-grow">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Compra</p>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl md:text-2xl font-bold text-glow mr-2">${exchangeData.buy.price.toFixed(2)}</span>
                <TrendIcon trend={exchangeData.buy.trend} />
              </div>
            </div>
            <div className="border-l border-white/10 h-1/2"></div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Venta</p>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xl md:text-2xl font-bold text-glow mr-2">${exchangeData.sell.price.toFixed(2)}</span>
                <TrendIcon trend={exchangeData.sell.trend} />
              </div>
            </div>
          </div>
        </motion.div>
      );
    };

    export default ExchangeRateWidget;
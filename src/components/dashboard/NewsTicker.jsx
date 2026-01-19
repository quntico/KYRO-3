import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Newspaper } from 'lucide-react';
    import { Link } from 'react-router-dom';

    const mockNews = [
      { source: 'Milenio', title: 'Economía mexicana muestra signos de recuperación en el último trimestre.' },
      { source: 'El Financiero', title: 'El superpeso: ¿Hasta dónde puede llegar la apreciación de la moneda?' },
      { source: 'USA Today', title: 'Tech stocks rally as Fed holds interest rates steady.' },
      { source: 'Milenio', title: 'Nuevas regulaciones para el sector fintech entrarán en vigor en 2025.' },
      { source: 'El Financiero', title: 'Inversión extranjera directa en México alcanza cifra récord.' },
      { source: 'USA Today', title: 'Future of remote work: Companies adopt hybrid models permanently.' },
    ];

    const NewsTicker = () => {
      const [currentIndex, setCurrentIndex] = useState(0);

      useEffect(() => {
        const intervalId = setInterval(() => {
          setCurrentIndex(prevIndex => (prevIndex + 1) % mockNews.length);
        }, 5000); // Cambia cada 5 segundos

        return () => clearInterval(intervalId);
      }, []);

      const currentNews = mockNews[currentIndex];

      return (
        <Link to="/news">
          <motion.div 
            className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 flex items-center space-x-4 overflow-hidden cursor-pointer card-hover"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Newspaper className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative h-10 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-full"
                  >
                    <p className="text-sm font-medium text-foreground truncate">{currentNews.title}</p>
                    <p className="text-xs text-muted-foreground">{currentNews.source}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </Link>
      );
    };

    export default NewsTicker;
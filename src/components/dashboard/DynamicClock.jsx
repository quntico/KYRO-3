import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { format } from 'date-fns';
    import { es } from 'date-fns/locale';

    const AnalogClock = ({ time }) => {
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();

      const hourDeg = (hours % 12) * 30 + minutes * 0.5;
      const minuteDeg = minutes * 6 + seconds * 0.1;
      const secondDeg = seconds * 6;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="relative w-24 h-24 rounded-full border-2 border-primary/50 bg-card/50 flex items-center justify-center"
        >
          <div
            className="absolute w-1 h-8 bg-primary rounded-full origin-bottom"
            style={{ transform: `rotate(${hourDeg}deg)`, top: 'calc(50% - 2rem)' }}
          />
          <div
            className="absolute w-0.5 h-10 bg-primary/80 rounded-full origin-bottom"
            style={{ transform: `rotate(${minuteDeg}deg)`, top: 'calc(50% - 2.5rem)' }}
          />
          <div
            className="absolute w-px h-11 bg-accent rounded-full origin-bottom"
            style={{ transform: `rotate(${secondDeg}deg)`, top: 'calc(50% - 2.75rem)' }}
          />
          <div className="absolute w-2 h-2 bg-primary rounded-full" />
        </motion.div>
      );
    };

    const DigitalClock = ({ time }) => {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="w-24 h-24 flex items-center justify-center"
        >
          <span className="text-2xl font-bold font-mono text-primary text-glow">
            {format(time, 'HH:mm:ss')}
          </span>
        </motion.div>
      );
    };

    const DynamicClock = () => {
      const [time, setTime] = useState(new Date());
      const [clockType, setClockType] = useState('analog');

      useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
      }, []);

      const toggleClockType = () => {
        setClockType(prev => (prev === 'analog' ? 'digital' : 'analog'));
      };

      const formattedDate = format(time, 'dd MMMM', { locale: es });

      return (
        <div className="hidden md:flex flex-col items-center" onDoubleClick={toggleClockType}>
          <AnimatePresence mode="wait">
            {clockType === 'analog' ? (
              <AnalogClock key="analog" time={time} />
            ) : (
              <DigitalClock key="digital" time={time} />
            )}
          </AnimatePresence>
          <p className="text-sm text-muted-foreground mt-2 capitalize">{formattedDate}</p>
        </div>
      );
    };

    export default DynamicClock;
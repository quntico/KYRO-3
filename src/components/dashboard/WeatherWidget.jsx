import React from 'react';
    import { motion } from 'framer-motion';
    import { Sun, Cloud, Thermometer, Calendar } from 'lucide-react';

    const WeatherWidget = () => {
      const weatherData = {
        current: {
          location: 'Ciudad de México',
          temp: 22,
          condition: 'Soleado',
          icon: <Sun className="w-10 h-10 text-yellow-400" />,
        },
        tomorrow: {
          temp_max: 24,
          temp_min: 14,
          condition: 'Parcialmente Nublado',
          icon: <Cloud className="w-8 h-8 text-gray-400" />,
        },
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10 card-hover h-full"
        >
          <h3 className="text-base font-semibold text-glow mb-3">Clima</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{weatherData.current.location}</span>
              <span className="text-4xl font-bold text-glow">{weatherData.current.temp}°C</span>
              <span className="text-sm text-muted-foreground">{weatherData.current.condition}</span>
            </div>
            <div className="flex items-center justify-center">
              {weatherData.current.icon}
            </div>
          </div>
          <div className="border-t border-white/10 mt-4 pt-3 flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Mañana:</span>
            </div>
            <div className="flex items-center">
              {weatherData.tomorrow.icon}
              <span className="ml-2">{weatherData.tomorrow.temp_max}° / {weatherData.tomorrow.temp_min}°</span>
            </div>
          </div>
        </motion.div>
      );
    };

    export default WeatherWidget;
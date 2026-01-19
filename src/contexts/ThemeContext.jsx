import React, { createContext, useState, useEffect, useContext } from 'react';
    import usePersistentState from '@/hooks/usePersistentState.js';

    const ThemeContext = createContext();

    export const useTheme = () => useContext(ThemeContext);

    const defaultThemeSettings = {
      futuristicGlowIntensity: 0.5,
    };

    export const ThemeProvider = ({ children }) => {
      const [theme, setTheme] = usePersistentState('kyro-theme', 'light');
      const [themeSettings, setThemeSettings] = usePersistentState('kyro-theme-settings', defaultThemeSettings);

      const toggleTheme = () => {
        setTheme(prevTheme => {
          if (prevTheme === 'light') return 'dark';
          if (prevTheme === 'dark') return 'futuristic';
          if (prevTheme === 'futuristic') return 'play';
          return 'light';
        });
      };

      const changeTheme = (newTheme) => {
        if (['light', 'dark', 'futuristic', 'play'].includes(newTheme)) {
          setTheme(newTheme);
        }
      };

      const updateThemeSettings = (newSettings) => {
        setThemeSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
      };
      
      useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'futuristic', 'play');
        root.classList.add(theme);
        
        if (theme === 'futuristic' || theme === 'play') {
          root.style.setProperty('--glow-intensity', themeSettings.futuristicGlowIntensity);
        } else {
          root.style.removeProperty('--glow-intensity');
        }

      }, [theme, themeSettings]);

      return (
        <ThemeContext.Provider value={{ theme, toggleTheme, changeTheme, themeSettings, updateThemeSettings }}>
          {children}
        </ThemeContext.Provider>
      );
    };
import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const defaultThemeSettings = {
  futuristicGlowIntensity: 0.5,
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('kyro-theme');
    const savedVersion = localStorage.getItem('kyro-version');

    if (savedVersion !== '4.0.0') {
      localStorage.setItem('kyro-version', '4.0.0');
      localStorage.setItem('kyro-theme', JSON.stringify('nova'));
      return 'nova';
    }

    return saved ? JSON.parse(saved) : 'nova';
  });
  const [themeSettings, setThemeSettings] = useState(() => {
    const saved = localStorage.getItem('kyro-theme-settings');
    return saved ? JSON.parse(saved) : defaultThemeSettings;
  });

  const changeTheme = (newTheme) => {
    if (['light', 'dark', 'futuristic', 'play', 'nova'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const updateThemeSettings = (newSettings) => {
    setThemeSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  const saveThemeSettings = () => {
    localStorage.setItem('kyro-theme', JSON.stringify(theme));
    localStorage.setItem('kyro-theme-settings', JSON.stringify(themeSettings));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'futuristic', 'play', 'nova');
    root.classList.add(theme);

    if (theme === 'futuristic' || theme === 'play' || theme === 'nova') {
      root.style.setProperty('--glow-intensity', themeSettings.futuristicGlowIntensity);
    } else {
      root.style.removeProperty('--glow-intensity');
    }

  }, [theme, themeSettings]);

  return (
    <ThemeContext.Provider value={{
      theme,
      changeTheme,
      themeSettings,
      updateThemeSettings,
      saveThemeSettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Supported theme modes: 'auto', 'light', 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('riskguard_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
    return 'auto'; // Default to Auto (system preference) for new users
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme() {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        // 'auto' mode: check OS preference
        isDark = mediaQuery.matches;
      }

      setResolvedTheme(isDark ? 'dark' : 'light');

      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }

    applyTheme();
    localStorage.setItem('riskguard_theme', theme);

    // Live OS scheme change listener for 'auto' mode
    function handleOsThemeChange() {
      if (theme === 'auto') {
        applyTheme();
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleOsThemeChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleOsThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleOsThemeChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleOsThemeChange);
      }
    };
  }, [theme]);

  // Cycle through Light -> Dark -> Auto -> Light
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, effectiveTheme: resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

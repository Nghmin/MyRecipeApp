import React, { createContext, useContext, useState } from 'react';
import { menuColors } from '../components/ThemeSelectionModal'; 


interface ThemeContextType {
  currentTheme: any;
  setTheme: (theme: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(menuColors[0]);

  const setTheme = (theme: any) => {
    setCurrentTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme phải được dùng trong ThemeProvider');
  }
  return context;
};
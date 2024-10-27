import React, { createContext, useState } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false); 

  return (
    <DataContext.Provider value={{ 
      isDarkThemeEnabled, 
      setIsDarkThemeEnabled, 
      isNotificationsEnabled, 
      setIsNotificationsEnabled 
    }}>
      {children}
    </DataContext.Provider>
  );
};

import React, { createContext, useContext, useState } from 'react';
import usePersistentState from '@/hooks/usePersistentState';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = usePersistentState('sidebarCollapsed', true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };
  
  const toggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev);
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
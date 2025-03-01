"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GlassesModeContextType {
  glassesMode: boolean;
  toggleGlassesMode: () => void;
}

const GlassesModeContext = createContext<GlassesModeContextType | undefined>(undefined);

export function GlassesModeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available, otherwise default to false
  const [glassesMode, setGlassesMode] = useState<boolean>(false);

  // Load saved state on component mount
  useEffect(() => {
    const savedMode = localStorage.getItem('glassesMode');
    if (savedMode !== null) {
      setGlassesMode(savedMode === 'true');
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('glassesMode', glassesMode.toString());
  }, [glassesMode]);

  const toggleGlassesMode = () => {
    setGlassesMode(prev => !prev);
  };

  return (
    <GlassesModeContext.Provider value={{ glassesMode, toggleGlassesMode }}>
      {children}
    </GlassesModeContext.Provider>
  );
}

export function useGlassesMode() {
  const context = useContext(GlassesModeContext);
  if (context === undefined) {
    throw new Error('useGlassesMode must be used within a GlassesModeProvider');
  }
  return context;
} 
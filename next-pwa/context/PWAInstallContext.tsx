"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface PWAInstallContextProps {
  deferredPrompt: any;
  setDeferredPrompt: React.Dispatch<any>;
  isInstalled: boolean;
  setIsInstalled: React.Dispatch<React.SetStateAction<boolean>>;
}

const PWAInstallContext = createContext<PWAInstallContextProps | undefined>(undefined);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Prevent the mini-infobar
      setDeferredPrompt(e);
      setIsInstalled(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <PWAInstallContext.Provider value={{ deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled }}>
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error("usePWAInstall must be used within a PWAInstallProvider");
  }
  return context;
};
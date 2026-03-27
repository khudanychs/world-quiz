import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const LoadingFallback = () => (
  <div style={{
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0b1020',
    color: '#fff'
  }}>
    <div>Loading...</div>
  </div>
);

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { loading: authLoading } = useAuth();
  const { i18n } = useTranslation();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Check if i18n is already initialized
    if (i18n.isInitialized) {
      setI18nReady(true);
      return;
    }

    // Wait for i18n to initialize
    const checkI18nReady = () => {
      if (i18n.isInitialized) {
        setI18nReady(true);
      }
    };

    // Poll every 50ms until i18n is ready (it should be very fast)
    const interval = setInterval(checkI18nReady, 50);
    
    // Also listen for the initialized event if available
    i18n.on('initialized', checkI18nReady);

    return () => {
      clearInterval(interval);
      i18n.off('initialized', checkI18nReady);
    };
  }, [i18n]);

  // Show loading until both auth and i18n are initialized
  if (authLoading || !i18nReady) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
}

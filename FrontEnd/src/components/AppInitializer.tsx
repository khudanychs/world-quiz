import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoadingFallback = () => (
  <div style={{
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0b1020',
    color: '#fff'
  }}>
    <div className="animate-pulse">Loading...</div>
  </div>
);

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { loading: authLoading } = useAuth();
  
  // App Shell & Auth Readiness Pattern:
  // Block rendering ONLY until Firebase onAuthStateChanged resolves (typically <100ms).
  // No artificial timeouts, no i18n polling - rely strictly on Firebase's native flow.
  // This ensures we never flash unauthenticated content or trigger premature redirects.
  if (authLoading) {
    return <LoadingFallback />;
  }

  // Once Firebase confirms identity, render the entire app shell.
  // React Router will now resolve routes and begin background chunk loading.
  return <>{children}</>;
}
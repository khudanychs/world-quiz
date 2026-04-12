import { ReactNode } from 'react';

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  // Keep shell rendering non-blocking to protect LCP.
  // Route guards still control access to protected pages.
  return <>{children}</>;
}
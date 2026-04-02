import React from 'react';
import { Navbar } from './Navbar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}

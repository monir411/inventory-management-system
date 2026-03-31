import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen w-full gap-4 px-3 py-4 sm:px-4 lg:px-6">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AppHeader />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '../auth/auth-provider';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  return (
    <AuthProvider>
      <ToastProvider>
        {isAuthPage ? (
          children
        ) : (
          <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] p-4 md:p-6 print:min-h-0 print:bg-white print:p-0">
            <div className="grid w-full gap-6 lg:grid-cols-[280px_minmax(0,1fr)] print:block print:gap-0">
              <div className="print:hidden">
                <Sidebar />
              </div>
              <div className="space-y-6 print:space-y-0">
                <div className="print:hidden">
                  <Topbar />
                </div>
                {children}
              </div>
            </div>
          </div>
        )}
      </ToastProvider>
    </AuthProvider>
  );
}

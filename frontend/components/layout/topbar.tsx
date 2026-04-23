'use client';

import { useAuth } from '../auth/auth-provider';
import { usePathname } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const getTitle = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    
    const first = parts[0];
    if (first === 'orders') return 'Manage Order';
    if (first === 'sales') return 'Sales Management';
    if (first === 'products') return 'Products';
    if (first === 'stock') return 'Inventory';
    if (first === 'routes') return 'Routes';
    if (first === 'shops') return 'Shops';
    if (first === 'companies') return 'Companies';
    
    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  return (
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          {getTitle()}
        </h2>
        <p className="text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 pr-4 border-r border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Loading...'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <User className="w-5 h-5" />
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

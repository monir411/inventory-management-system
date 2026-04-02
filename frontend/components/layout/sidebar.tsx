'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: 'Dashboard' },
  { href: '/companies', label: 'Companies' },
  { href: '/products', label: 'Products' },
  { href: '/products/all', label: 'All Products' },
  { href: '/stock', label: 'Stock' },
  { href: '/stock/movements', label: 'Stock Movements' },
  { href: '/routes', label: 'Routes' },
  { href: '/shops', label: 'Shops' },
  { href: '/sales', label: 'Sales' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-xs rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
          Dealer ERP
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Admin Workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Companies, products, stock, routes, shops, and sales connected to the backend API.
        </p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : item.href === '/products' || item.href === '/stock'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

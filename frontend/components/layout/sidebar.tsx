'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: 'Dashboard' },
  { href: '/sales/create', label: 'New Order' },
  { href: '/sales', label: 'Sales Dashboard' },
  { href: '/orders', label: 'All Orders' },
  { href: '/delivery-summaries', label: 'Delivery Summaries' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/products/all', label: 'All Products' }, 
  { href: '/products', label: 'Products' },
  { href: '/stock', label: 'Stock' },
  { href: '/routes', label: 'Routes' },
  { href: '/shops', label: 'Shops' },
  { href: '/companies', label: 'Companies' },
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
          Companies, products, purchases, stock, routes, shops, and sales connected to the backend API.
        </p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : item.href === '/sales'
                ? pathname === '/sales' || (pathname.startsWith('/sales/') && pathname !== '/sales/create')
              : item.href === '/products'
                ? pathname === '/products' || (pathname.startsWith('/products/') && pathname !== '/products/all')
              : item.href === '/stock'
                ? pathname === item.href || pathname.startsWith('/stock/')
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

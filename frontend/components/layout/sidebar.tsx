'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/orders/new', label: 'New Order' },
  { href: '/orders', label: 'Manage Order' },
  { href: '/delivery-summaries', label: 'Delivery Summary' },
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
          Core management for Orders, Companies, Products, Routes, and Shops.
        </p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

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

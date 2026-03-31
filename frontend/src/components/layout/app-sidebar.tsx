import Link from 'next/link';
import { navItems } from '@/components/layout/navigation';

export function AppSidebar() {
  return (
    <aside className="shell-card hidden w-64 shrink-0 rounded-3xl p-4 lg:block">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Quick Menu
        </p>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--primary-soft)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 rounded-2xl bg-[var(--primary-soft)] px-4 py-4 text-sm text-[var(--text)]">
        Route-wise sales, collections, stock, and payable workflow in one simple menu.
      </div>
    </aside>
  );
}

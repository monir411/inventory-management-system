'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { navItems } from '@/components/layout/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AppHeader() {
  const router = useRouter();
  const { logout, session } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="shell-card rounded-3xl px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--primary)]">Dealer ERP</p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
            সহজ, দ্রুত ব্যবসা নিয়ন্ত্রণ
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            কম ক্লিকেই business summary দেখা যাবে
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right text-sm">
            <p className="font-medium text-[var(--text)]">{session?.user.username ?? 'User'}</p>
            <p className="text-[var(--muted)]">{session?.user.role ?? 'operator'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-white/80 px-3 py-2 text-sm font-medium text-[var(--text)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

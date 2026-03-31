import type { DashboardHighlight } from '@/types/dashboard';

type DashboardHighlightListProps = {
  items: DashboardHighlight[];
};

export function DashboardHighlightList({ items }: DashboardHighlightListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.note}</p>
            </div>
            <p className="text-lg font-semibold text-[var(--text)]">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}


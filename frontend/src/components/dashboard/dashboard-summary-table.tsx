import type { DashboardSummaryRow } from '@/types/dashboard';

type DashboardSummaryTableProps = {
  columns: string[];
  rows: DashboardSummaryRow[];
};

export function DashboardSummaryTable({
  columns,
  rows,
}: DashboardSummaryTableProps) {
  const columnClassName = columns.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white/90">
      <div
        className={`hidden gap-4 border-b border-[var(--border)] bg-[#f8f4ea] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:grid ${columnClassName}`}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`grid gap-3 px-5 py-4 md:items-center md:gap-4 ${columnClassName}`}
          >
            {row.values.map((value, index) => (
              <div key={`${row.id}-${index}`} className="text-sm text-[var(--text)]">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                  {columns[index]}
                </span>
                <span className={index === 0 ? 'font-semibold' : ''}>{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

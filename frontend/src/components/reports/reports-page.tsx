'use client';

import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

type ReportKey =
  | 'daily-sales'
  | 'route-sales'
  | 'company-sales'
  | 'stock'
  | 'damage'
  | 'expenses'
  | 'company-payable'
  | 'route-due'
  | 'collections'
  | 'purchases'
  | 'investments';

type ReportConfig = {
  key: ReportKey;
  label: string;
  totalLabel: string;
  totalValue: string;
  columns: string[];
  rows: string[][];
};

const reportConfigs: ReportConfig[] = [
  {
    key: 'daily-sales',
    label: 'Daily Sales',
    totalLabel: 'Total sales',
    totalValue: '৳ 1,48,500',
    columns: ['Date', 'Sales', 'Collection', 'Due'],
    rows: [
      ['2026-03-31', '৳ 1,48,500', '৳ 1,12,200', '৳ 36,300'],
      ['2026-03-30', '৳ 1,35,200', '৳ 1,01,900', '৳ 33,300'],
      ['2026-03-29', '৳ 1,42,000', '৳ 1,08,100', '৳ 33,900'],
    ],
  },
  {
    key: 'route-sales',
    label: 'Route-wise Sales',
    totalLabel: 'Route sales total',
    totalValue: '৳ 1,48,500',
    columns: ['Route', 'Sales', 'Collection', 'Due'],
    rows: [
      ['Dhaka North', '৳ 52,000', '৳ 40,000', '৳ 12,000'],
      ['Dhaka South', '৳ 38,500', '৳ 27,000', '৳ 11,500'],
      ['Gazipur', '৳ 31,000', '৳ 24,200', '৳ 6,800'],
    ],
  },
  {
    key: 'company-sales',
    label: 'Company-wise Sales',
    totalLabel: 'Company sales total',
    totalValue: '৳ 1,48,500',
    columns: ['Company', 'Sales', 'Share', 'Top items'],
    rows: [
      ['ACI Distribution', '৳ 61,000', '41%', 'Soap, detergent'],
      ['Square Consumer', '৳ 42,800', '29%', 'Toiletries'],
      ['Pran Foods', '৳ 28,400', '19%', 'Snacks'],
    ],
  },
  {
    key: 'stock',
    label: 'Stock Report',
    totalLabel: 'Stock value',
    totalValue: '৳ 8,42,000',
    columns: ['Product', 'Warehouse', 'Qty', 'Value'],
    rows: [
      ['Detergent 500g', 'Main Warehouse', '820 pcs', '৳ 1,64,000'],
      ['Soap 100g', 'Main Warehouse', '1,240 pcs', '৳ 1,86,000'],
      ['Biscuits Family Pack', 'Secondary Warehouse', '640 pcs', '৳ 96,000'],
    ],
  },
  {
    key: 'damage',
    label: 'Damage Report',
    totalLabel: 'Damage value',
    totalValue: '৳ 7,400',
    columns: ['Date', 'Product', 'Qty', 'Reason'],
    rows: [
      ['2026-03-31', 'Detergent 500g', '8 pcs', 'Leak damage'],
      ['2026-03-31', 'Soap 100g', '10 pcs', 'Broken carton'],
    ],
  },
  {
    key: 'expenses',
    label: 'Expenses Report',
    totalLabel: 'Expense total',
    totalValue: '৳ 9,800',
    columns: ['Date', 'Expense', 'Amount', 'Note'],
    rows: [
      ['2026-03-31', 'Transport', '৳ 4,500', 'Route delivery cost'],
      ['2026-03-31', 'Labour', '৳ 2,300', 'Loading and unloading'],
      ['2026-03-31', 'Utility', '৳ 3,000', 'Electricity and misc'],
    ],
  },
  {
    key: 'company-payable',
    label: 'Company Payable',
    totalLabel: 'Total payable',
    totalValue: '৳ 3,12,900',
    columns: ['Company', 'Purchases', 'Payments', 'Payable'],
    rows: [
      ['ACI Distribution', '৳ 1,54,000', '৳ 50,000', '৳ 1,04,000'],
      ['Square Consumer', '৳ 1,09,500', '৳ 35,000', '৳ 74,500'],
      ['Pran Foods', '৳ 76,900', '৳ 20,000', '৳ 56,900'],
    ],
  },
  {
    key: 'route-due',
    label: 'Route Due',
    totalLabel: 'Overall due',
    totalValue: '৳ 2,36,400',
    columns: ['Route', 'Sales', 'Collections', 'Due'],
    rows: [
      ['Dhaka North', '৳ 52,000', '৳ 40,000', '৳ 12,000'],
      ['Dhaka South', '৳ 38,500', '৳ 27,000', '৳ 11,500'],
      ['Gazipur', '৳ 31,000', '৳ 24,200', '৳ 6,800'],
    ],
  },
  {
    key: 'collections',
    label: 'Collections Report',
    totalLabel: 'Collections total',
    totalValue: '৳ 1,12,200',
    columns: ['Collection No', 'Route', 'Date', 'Amount'],
    rows: [
      ['COL-001', 'Dhaka North', '2026-03-31', '৳ 40,000'],
      ['COL-002', 'Dhaka South', '2026-03-31', '৳ 27,000'],
      ['COL-003', 'Gazipur', '2026-03-31', '৳ 24,200'],
    ],
  },
  {
    key: 'purchases',
    label: 'Purchases Report',
    totalLabel: 'Purchase total',
    totalValue: '৳ 1,89,300',
    columns: ['Purchase No', 'Company', 'Date', 'Amount'],
    rows: [
      ['PUR-001', 'ACI Distribution', '2026-03-31', '৳ 82,500'],
      ['PUR-002', 'Square Consumer', '2026-03-31', '৳ 61,800'],
      ['PUR-003', 'Pran Foods', '2026-03-31', '৳ 45,000'],
    ],
  },
  {
    key: 'investments',
    label: 'Investments Report',
    totalLabel: 'Investment total',
    totalValue: '৳ 0',
    columns: ['Date', 'Source', 'Amount', 'Note'],
    rows: [['No data', '-', '-', 'Investment module not connected yet']],
  },
];

function ReportCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-white/90 px-5 py-5">
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{note}</p>
    </div>
  );
}

function ReportTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white/90">
      <div
        className="hidden gap-4 border-b border-[var(--border)] bg-[#f8f4ea] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:grid"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {rows.map((row, rowIndex) => (
          <div
            key={`${row[0]}-${rowIndex}`}
            className="grid gap-3 px-5 py-4 md:gap-4"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {row.map((value, valueIndex) => (
              <div key={`${value}-${valueIndex}`} className="text-sm text-[var(--text)]">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:hidden">
                  {columns[valueIndex]}
                </span>
                <span className={valueIndex === 0 ? 'font-semibold' : ''}>{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportKey>('daily-sales');
  const [fromDate, setFromDate] = useState('2026-03-01');
  const [toDate, setToDate] = useState('2026-03-31');
  const [routeFilter, setRouteFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const activeReport = useMemo(
    () => reportConfigs.find((report) => report.key === selectedReport) ?? reportConfigs[0],
    [selectedReport],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Reports"
        title="Business reports"
        description="Simple report screen with filters, summary totals, and export-ready table structure. Built for clarity first."
      />

      <SectionCard
        title="Filters"
        description="Use date range and relevant quick filters to narrow the report."
      >
        <div className="grid gap-3 xl:grid-cols-[220px_180px_180px_1fr_1fr_1fr]">
          <select
            value={selectedReport}
            onChange={(event) => setSelectedReport(event.target.value as ReportKey)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          >
            {reportConfigs.map((report) => (
              <option key={report.key} value={report.key}>
                {report.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
          />

          <input
            value={routeFilter}
            onChange={(event) => setRouteFilter(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
            placeholder="Route filter"
          />

          <input
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
            placeholder="Company filter"
          />

          <input
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            className="shell-border rounded-2xl bg-white px-4 py-3 text-sm outline-none"
            placeholder="Product filter"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            Apply filters
          </button>
          <button
            type="button"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[var(--text)]"
          >
            Print / Export
          </button>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          title={activeReport.totalLabel}
          value={activeReport.totalValue}
          note={`${activeReport.label} summary for selected filters`}
        />
        <ReportCard
          title="From date"
          value={fromDate}
          note="Start date used for this report view"
        />
        <ReportCard
          title="To date"
          value={toDate}
          note="End date used for this report view"
        />
        <ReportCard
          title="Report type"
          value={activeReport.label}
          note="Switch reports from the filter bar above"
        />
      </div>

      <SectionCard
        title={activeReport.label}
        description="This table layout is export-ready and can be wired to live backend report endpoints later."
      >
        <ReportTable columns={activeReport.columns} rows={activeReport.rows} />
      </SectionCard>

      <SectionCard
        title="Usage Notes"
        description="Keep this screen easy to scan and easy to print."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-white/90 px-4 py-4 text-sm text-[var(--text)]">
            Route-based reports keep sales and collections aligned with the dealer workflow.
          </div>
          <div className="rounded-[1.5rem] bg-white/90 px-4 py-4 text-sm text-[var(--text)]">
            Summary totals stay visible at the top so owners do not need to scroll first.
          </div>
          <div className="rounded-[1.5rem] bg-white/90 px-4 py-4 text-sm text-[var(--text)]">
            The current screen is frontend-ready and waiting for public backend report endpoints.
          </div>
        </div>
      </SectionCard>
    </div>
  );
}


import { DashboardHighlightList } from '@/components/dashboard/dashboard-highlight-list';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { DashboardSummaryTable } from '@/components/dashboard/dashboard-summary-table';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import type {
  DashboardHighlight,
  DashboardMetric,
  DashboardSummaryRow,
} from '@/types/dashboard';

const topMetrics: DashboardMetric[] = [
  {
    label: 'আজকের বিক্রয়',
    value: '৳ 1,48,500',
    helper: 'আজকের route-wise sales total',
    tone: 'primary',
  },
  {
    label: 'আজকের কালেকশন',
    value: '৳ 1,12,200',
    helper: 'আজকের route-wise collection',
    tone: 'accent',
  },
  {
    label: 'আজকের খরচ',
    value: '৳ 9,800',
    helper: 'আজকের expense entry total',
    tone: 'neutral',
  },
  {
    label: 'মোট স্টক ভ্যালু',
    value: '৳ 8,42,000',
    helper: 'Current stock value summary',
    tone: 'primary',
  },
  {
    label: 'মোট Due',
    value: '৳ 2,36,400',
    helper: 'Sales minus collections',
    tone: 'neutral',
  },
  {
    label: 'মোট Payable',
    value: '৳ 3,12,900',
    helper: 'Purchases minus company payments',
    tone: 'neutral',
  },
];

const routeSummaries: DashboardSummaryRow[] = [
  { id: 'dhaka-north', values: ['Dhaka North', '৳ 52,000', '৳ 40,000', '৳ 12,000'] },
  { id: 'dhaka-south', values: ['Dhaka South', '৳ 38,500', '৳ 27,000', '৳ 11,500'] },
  { id: 'gazipur', values: ['Gazipur Route', '৳ 31,000', '৳ 24,200', '৳ 6,800'] },
  { id: 'narayanganj', values: ['Narayanganj', '৳ 27,000', '৳ 21,000', '৳ 6,000'] },
];

const companySummaries: DashboardSummaryRow[] = [
  { id: 'aci', values: ['ACI Distribution', '৳ 61,000', '৳ 1,04,000'] },
  { id: 'square', values: ['Square Consumer', '৳ 42,800', '৳ 74,500'] },
  { id: 'pran', values: ['Pran Foods', '৳ 28,400', '৳ 56,900'] },
  { id: 'local-brand', values: ['Local Brand Supply', '৳ 16,300', '৳ 32,100'] },
];

const highlights: DashboardHighlight[] = [
  {
    title: 'Damage highlight',
    value: '18 pcs',
    note: 'আজকের reported damage quantity',
  },
  {
    title: 'Expense highlight',
    value: '৳ 9,800',
    note: 'Transport, labour, and utility cost',
  },
  {
    title: 'Stock watch',
    value: '12 low items',
    note: 'Products nearing low stock level',
  },
];

export function DashboardOverview() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Owner Dashboard"
        title="আজকের ব্যবসার সারসংক্ষেপ"
        description="Large cards, route summary, company summary, and quick highlights in one screen so non-technical users can see the business status without extra clicks."
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {topMetrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.35fr_1fr]">
        <SectionCard
          title="Route-wise sales summary"
          description="Daily route sales, collection, and due in one simple view."
        >
          <DashboardSummaryTable
            columns={['Route', 'Sales', 'Collection', 'Due']}
            rows={routeSummaries}
          />
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard
            title="Company-wise summary"
            description="Quick company sales and payable picture for the owner."
          >
            <DashboardSummaryTable
              columns={['Company', 'Sales', 'Payable']}
              rows={companySummaries}
            />
          </SectionCard>

          <SectionCard
            title="Damage / expense highlights"
            description="A small highlight block keeps the dashboard readable and practical."
          >
            <DashboardHighlightList items={highlights} />
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="আজকের ফোকাস"
          description="Simple owner-facing hints, not too many widgets."
        >
          <div className="space-y-3 text-sm text-[var(--text)]">
            <div className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              Highest route sales: <span className="font-semibold">Dhaka North</span>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              Highest due route: <span className="font-semibold">Dhaka South</span>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              Expense pressure: <span className="font-semibold">Transport cost rising</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Stock snapshot"
          description="Quick stock value view for today."
        >
          <div className="grid gap-3">
            <div className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Total stock quantity</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">4,820 pcs</p>
            </div>
            <div className="rounded-[1.5rem] bg-[var(--surface-strong)] px-4 py-4">
              <p className="text-sm text-[var(--muted)]">Total stock value</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text)]">৳ 8,42,000</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Notes"
          description="This dashboard is ready to swap from sample data to backend summary APIs later."
        >
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/70 px-4 py-5 text-sm text-[var(--muted)]">
            Current UI uses clean sample summary data because a dedicated dashboard endpoint is not available yet.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

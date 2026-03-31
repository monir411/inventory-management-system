import type { DashboardMetric } from '@/types/dashboard';

const toneClasses: Record<NonNullable<DashboardMetric['tone']>, string> = {
  primary: 'bg-[var(--primary-soft)]',
  accent: 'bg-[#fff0d8]',
  neutral: 'bg-[var(--surface-strong)]',
};

type DashboardMetricCardProps = {
  metric: DashboardMetric;
};

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  return (
    <article className={`shell-card rounded-[2rem] p-5 sm:p-6 ${toneClasses[metric.tone ?? 'neutral']}`}>
      <p className="text-sm font-medium text-[var(--muted)]">{metric.label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
        {metric.value}
      </p>
      {metric.helper ? <p className="mt-3 text-sm text-[var(--muted)]">{metric.helper}</p> : null}
    </article>
  );
}


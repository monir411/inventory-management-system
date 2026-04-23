import { ReactNode } from 'react';

type PageCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  noPadding?: boolean;
  className?: string;
  children: ReactNode;
};

export function PageCard({
  title,
  description,
  action,
  noPadding = false,
  className = '',
  children,
}: PageCardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {hasHeader ? (
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {title ? <h3 className="text-base font-semibold text-slate-900">{title}</h3> : null}
              {description ? (
                <p className="mt-0.5 max-w-2xl text-xs text-slate-500">{description}</p>
              ) : null}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>
      ) : null}
      <div className={noPadding ? undefined : 'p-6'}>{children}</div>
    </section>
  );
}

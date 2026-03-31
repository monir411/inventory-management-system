export type DashboardMetric = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'primary' | 'accent' | 'neutral';
};

export type DashboardSummaryRow = {
  id: string;
  values: string[];
};

export type DashboardHighlight = {
  title: string;
  value: string;
  note: string;
};

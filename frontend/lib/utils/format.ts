export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
  }).format(value);
}

const monthNames = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export function formatDate(value: string) {
  const date = new Date(value);
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = `${date.getFullYear()}`.slice(-2);

  return `${day}-${month}-${year}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('en-BD', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${formatDate(value)}, ${time}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-BD', {
    maximumFractionDigits: 0,
  }).format(value);
}

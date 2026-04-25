export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
  }).format(value);
}



export function formatDate(value: string | Date | undefined) {
  if (!value) return '-';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).format(date).replace(/ /g, '-').replace(/\//g, '-').toLowerCase();
  } catch (e) {
    return '-';
  }
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const time = new Intl.DateTimeFormat('en-BD', {
    timeZone: 'Asia/Dhaka',
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

export function getTodayBD() {
  // Returns a Date object representing the current point in time.
  // When using this for date calculations (like yesterday), 
  // we must be careful about the local machine timezone.
  return new Date();
}

export function getTodayBDDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatBDDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

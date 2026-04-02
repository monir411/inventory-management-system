import { redirect } from 'next/navigation';

type StockMovementsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StockMovementsRoute({
  searchParams,
}: StockMovementsRouteProps) {
  const resolvedSearchParams = await searchParams;
  const nextParams = new URLSearchParams({
    view: 'movements',
  });

  for (const key of ['companyId', 'productId', 'search', 'type', 'fromDate', 'toDate']) {
    const value = getFirstQueryValue(resolvedSearchParams[key]);

    if (value) {
      nextParams.set(key, value);
    }
  }

  redirect(`/stock?${nextParams.toString()}`);
}

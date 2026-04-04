import { CompanyPayableLedgerPage } from '@/components/purchases/company-payable-ledger-page';

export default async function CompanyPayableLedgerRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CompanyPayableLedgerPage companyId={Number(id)} />;
}

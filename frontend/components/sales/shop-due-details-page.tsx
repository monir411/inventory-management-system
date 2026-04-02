'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { getShopDueDetails, receiveSalePayment } from '@/lib/api/sales';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';
import type { ShopDueDetails } from '@/types/api';

type PaymentFormState = {
  amount: string;
  paymentDate: string;
  note: string;
};

function createPaymentFormState(amount: number): PaymentFormState {
  return {
    amount: amount.toFixed(2),
    paymentDate: new Date().toISOString().slice(0, 16),
    note: '',
  };
}

function getOutstandingSaleStatus(sale: ShopDueDetails['dueSales'][number]) {
  if (sale.paidAmount <= 0) {
    return {
      badge: 'Full due sale',
      description: 'No payment collected yet.',
      toneClassName: 'bg-rose-100 text-rose-700',
    };
  }

  return {
    badge: 'Partial payment received',
    description: `${formatCurrency(sale.paidAmount)} already collected, ${formatCurrency(
      sale.dueAmount,
    )} still due.`,
    toneClassName: 'bg-amber-100 text-amber-700',
  };
}

function getPaymentEntryStatus(
  payment: ShopDueDetails['paymentHistory'][number],
) {
  const isInitialPayment = payment.note === 'Initial payment at sale creation';

  return {
    paymentType: isInitialPayment ? 'Initial payment' : 'Due payment received',
    saleStatus:
      payment.saleDueAmount > 0
        ? 'Currently due remaining'
        : 'Currently cleared',
  };
}

export function ShopDueDetailsPage({ shopId }: { shopId: number }) {
  const [details, setDetails] = useState<ShopDueDetails | null>(null);
  const [paymentForms, setPaymentForms] = useState<
    Record<number, PaymentFormState>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSaleId, setIsSubmittingSaleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useToastNotification({
    message: error,
    title: 'Could not load shop ledger',
    tone: 'error',
  });
  useToastNotification({
    message: paymentError,
    title: 'Could not receive payment',
    tone: 'error',
  });
  useToastNotification({
    message: paymentSuccess,
    title: 'Payment saved',
    tone: 'success',
  });

  const refreshDetails = useCallback(
    async (showLoader: boolean) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        setError(null);
        const nextDetails = await getShopDueDetails(shopId);
        setDetails(nextDetails);
        setPaymentForms(
          Object.fromEntries(
            nextDetails.dueSales.map((sale) => [
              sale.id,
              createPaymentFormState(sale.dueAmount),
            ]),
          ),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load shop due details.',
        );
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [shopId],
  );

  useEffect(() => {
    void refreshDetails(true);
  }, [refreshDetails]);

  async function handleReceivePayment(
    event: FormEvent<HTMLFormElement>,
    saleId: number,
  ) {
    event.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    const form = paymentForms[saleId];
    if (!form) {
      return;
    }

    try {
      setIsSubmittingSaleId(saleId);
      await receiveSalePayment(saleId, {
        amount: Number(form.amount),
        paymentDate: new Date(form.paymentDate).toISOString(),
        note: form.note.trim() || undefined,
      });

      await refreshDetails(false);
      setPaymentSuccess('Shop due payment received successfully.');
    } catch (submitError) {
      setPaymentError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to receive payment.',
      );
    } finally {
      setIsSubmittingSaleId(null);
    }
  }

  function updatePaymentForm(
    saleId: number,
    patch: Partial<PaymentFormState>,
  ) {
    setPaymentForms((current) => ({
      ...current,
      [saleId]: {
        ...current[saleId],
        ...patch,
      },
    }));
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Shop Due Details"
        description="Review outstanding due sales for one shop, collect payments quickly, and check the full payment history."
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sales"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Back to sales
            </Link>
            <Link
              href="/shops"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Back to shops
            </Link>
          </div>
        }
      >
        {isLoading ? <LoadingBlock label="Loading shop ledger..." /> : null}

        {!isLoading && !error && details ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InfoCard label="Shop" value={details.shop.name} />
            <InfoCard
              label="Route"
              value={details.shop.route?.name ?? `Route #${details.shop.routeId}`}
            />
            <InfoCard
              label="Total sales"
              value={String(details.summary.saleCount)}
            />
            <InfoCard
              label="Collected amount"
              value={formatCurrency(details.summary.totalPaid)}
            />
            <InfoCard
              label="Outstanding due"
              value={formatCurrency(details.summary.totalDue)}
            />
          </div>
        ) : null}
      </PageCard>

      <PageCard
        title="Outstanding Due Sales"
        description="Use the quick payment form on each sale to collect due without leaving the shop ledger."
      >
        {isLoading ? <LoadingBlock label="Loading due sales..." /> : null}
        {!isLoading && !error && details ? (
          details.dueSales.length > 0 ? (
            <div className="space-y-4">
              {details.dueSales.map((sale) => {
                const form = paymentForms[sale.id] ?? createPaymentFormState(sale.dueAmount);
                const saleStatus = getOutstandingSaleStatus(sale);

                return (
                  <div
                    key={sale.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {sale.invoiceNo}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {sale.company?.name ?? `Company #${sale.companyId}`} •{' '}
                          {formatDate(sale.saleDate)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${saleStatus.toneClassName}`}
                          >
                            {saleStatus.badge}
                          </span>
                          <span className="text-xs text-slate-500">
                            {saleStatus.description}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <SummaryPill label="Total" value={formatCurrency(sale.totalAmount)} />
                        <SummaryPill label="Collected" value={formatCurrency(sale.paidAmount)} />
                        <SummaryPill label="Due" value={formatCurrency(sale.dueAmount)} tone="amber" />
                      </div>
                    </div>

                    <form
                      onSubmit={(event) => void handleReceivePayment(event, sale.id)}
                      className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_0.9fr_auto]"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Payment amount
                          </span>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              max={sale.dueAmount}
                              value={form.amount}
                              onChange={(event) =>
                                updatePaymentForm(sale.id, {
                                  amount: event.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updatePaymentForm(sale.id, {
                                  amount: sale.dueAmount.toFixed(2),
                                })
                              }
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-medium text-slate-700"
                            >
                              Full due
                            </button>
                          </div>
                        </label>

                        <label className="block space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Payment date
                          </span>
                          <input
                            type="datetime-local"
                            value={form.paymentDate}
                            onChange={(event) =>
                              updatePaymentForm(sale.id, {
                                paymentDate: event.target.value,
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          />
                        </label>
                      </div>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Note</span>
                        <textarea
                          value={form.note}
                          onChange={(event) =>
                            updatePaymentForm(sale.id, {
                              note: event.target.value,
                            })
                          }
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Optional payment note"
                        />
                      </label>

                      <div className="flex flex-col gap-2 xl:justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingSaleId === sale.id}
                          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {isSubmittingSaleId === sale.id
                            ? 'Saving payment...'
                            : 'Receive payment'}
                        </button>
                        <Link
                          href={`/sales/${sale.id}`}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700"
                        >
                          Open sale
                        </Link>
                      </div>
                    </form>
                  </div>
                );
              })}
            </div>
          ) : (
            <StateMessage
              title="No due remaining"
              description="This shop does not have any outstanding due sales right now."
            />
          )
        ) : null}
      </PageCard>

      <PageCard
        title="Shop Payment History"
        description="Every payment collected for this shop is listed here, including initial payments taken during sale creation."
      >
        {isLoading ? <LoadingBlock label="Loading payment history..." /> : null}
        {!isLoading && !error && details ? (
          details.paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Payment Date</th>
                    <th className="px-3 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Company</th>
                    <th className="px-3 py-3 font-medium">Route</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Type / Current status</th>
                    <th className="px-3 py-3 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.paymentHistory.map((payment) => {
                    const paymentStatus = getPaymentEntryStatus(payment);

                    return (
                    <tr key={payment.id}>
                      <td className="px-3 py-4 text-slate-700">
                        {formatDateTime(payment.paymentDate)}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          href={`/sales/${payment.saleId}`}
                          className="font-medium text-slate-900 underline underline-offset-4"
                        >
                          {payment.invoiceNo}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {payment.companyName}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {payment.routeName}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                            {paymentStatus.paymentType}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                              paymentStatus.saleStatus === 'Currently cleared'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {paymentStatus.saleStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {payment.note || 'No note provided.'}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <StateMessage
              title="No payments recorded"
              description="Payments received for this shop will appear here."
            />
          )
        ) : null}
      </PageCard>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'amber';
}) {
  const className =
    tone === 'amber'
      ? 'bg-amber-50 text-amber-900'
      : 'bg-white text-slate-900';

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${className}`}>
      <p className="text-current/70">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

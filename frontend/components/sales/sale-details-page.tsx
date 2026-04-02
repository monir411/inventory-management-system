'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { getSale, receiveSalePayment } from '@/lib/api/sales';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { StateMessage } from '@/components/ui/state-message';
import { useToastNotification } from '@/components/ui/toast-provider';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '@/lib/utils/format';
import type { Sale } from '@/types/api';

export function SaleDetailsPage({ saleId }: { saleId: number }) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [paymentNote, setPaymentNote] = useState('');

  useToastNotification({
    message: error,
    title: 'Could not load sale',
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

  useEffect(() => {
    async function loadSale() {
      try {
        setIsLoading(true);
        setError(null);
        const saleData = await getSale(saleId);
        setSale(saleData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load sale details.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSale();
  }, [saleId]);

  async function handleReceivePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    if (!sale) {
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const updatedSale = await receiveSalePayment(sale.id, {
        amount: Number(paymentAmount),
        paymentDate: new Date(paymentDate).toISOString(),
        note: paymentNote.trim() || undefined,
      });

      setSale(updatedSale);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().slice(0, 16));
      setPaymentNote('');
      setPaymentSuccess('Due payment received successfully.');
    } catch (submitError) {
      setPaymentError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to receive payment.',
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Sale Details"
        description="Inspect the full sale payload, including header information, due status, and all sold items."
        action={
          <Link
            href="/sales"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Back to sales
          </Link>
        }
      >
        {isLoading ? <LoadingBlock label="Loading sale details..." /> : null}

        {!isLoading && !error && sale ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Invoice no" value={sale.invoiceNo} />
              <InfoCard label="Sale date" value={formatDate(sale.saleDate)} />
              <InfoCard
                label="Company"
                value={sale.company?.name ?? `Company #${sale.companyId}`}
              />
              <InfoCard
                label="Route"
                value={sale.route?.name ?? `Route #${sale.routeId}`}
              />
              <InfoCard label="Shop" value={sale.shop?.name ?? 'No shop'} />
              <InfoCard
                label="Total amount"
                value={formatCurrency(sale.totalAmount)}
              />
              <InfoCard
                label="Paid amount"
                value={formatCurrency(sale.paidAmount)}
              />
              <InfoCard
                label="Due amount"
                value={formatCurrency(sale.dueAmount)}
              />
              <InfoCard
                label="Total profit"
                value={formatCurrency(sale.totalProfit)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {sale.note || 'No note provided.'}
              </p>
            </div>

            {sale.shopId ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/sales/shops/${sale.shopId}`}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Open shop ledger
                </Link>
              </div>
            ) : null}

            <PageCard
              title="Receive Due Payment"
              description="Collect additional payment against this sale and keep the due balance updated."
            >
              {sale.dueAmount > 0 ? (
                <form onSubmit={handleReceivePayment} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
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
                          value={paymentAmount}
                          onChange={(event) => setPaymentAmount(event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                          placeholder={`Max ${sale.dueAmount}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(sale.dueAmount.toFixed(2))}
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
                        value={paymentDate}
                        onChange={(event) => setPaymentDate(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                        required
                      />
                    </label>

                    <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                      <p className="text-sm">Outstanding due</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatCurrency(sale.dueAmount)}
                      </p>
                    </div>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Note
                    </span>
                    <textarea
                      value={paymentNote}
                      onChange={(event) => setPaymentNote(event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      placeholder="Optional payment note"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {isSubmittingPayment ? 'Saving payment...' : 'Receive payment'}
                  </button>
                </form>
              ) : (
                <StateMessage
                  title="No due remaining"
                  description="This sale is already fully paid."
                />
              )}
            </PageCard>

            <PageCard
              title="Payment History"
              description="Every payment collected for this sale is listed here."
            >
              {sale.payments && sale.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="px-3 py-3 font-medium">Payment Date</th>
                        <th className="px-3 py-3 font-medium">Amount</th>
                        <th className="px-3 py-3 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sale.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDateTime(payment.paymentDate)}
                          </td>
                          <td className="px-3 py-4 font-medium text-slate-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {payment.note || 'No note provided.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <StateMessage
                  title="No payments recorded"
                  description="Payments received for this sale will appear here."
                />
              )}
            </PageCard>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Quantity</th>
                    <th className="px-3 py-3 font-medium">Unit price</th>
                    <th className="px-3 py-3 font-medium">Buy price</th>
                    <th className="px-3 py-3 font-medium">Line total</th>
                    <th className="px-3 py-3 font-medium">Line profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">
                          {item.product?.name ?? `Product #${item.productId}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.product?.sku ?? ''}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {formatNumber(item.quantity)} {item.product?.unit ?? ''}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {formatCurrency(item.buyPrice)}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {formatCurrency(item.lineProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

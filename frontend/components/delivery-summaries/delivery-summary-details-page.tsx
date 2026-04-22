'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDeliverySummary, updateDeliverySummary } from '@/lib/api/delivery-summaries';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { useToastNotification } from '@/components/ui/toast-provider';
import type { DeliverySummary } from '@/types/api';

export function DeliverySummaryDetailsPage({ id }: { id: string }) {
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable return quantities
  const [returns, setReturns] = useState<Record<number, string>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  useToastNotification({ message: error, title: 'Error', tone: 'error' });
  useToastNotification({ message: successMsg, title: 'Success', tone: 'success' });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDeliverySummary(Number(id));
        setSummary(data);
        
        // Initialize state
        const initialReturns: Record<number, string> = {};
        const initialRemarks: Record<number, string> = {};
        data.items.forEach(item => {
          initialReturns[item.productId] = String(item.returnQuantity);
          initialRemarks[item.productId] = item.remarks || '';
        });
        setReturns(initialReturns);
        setRemarks(initialRemarks);
        
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, [id]);

  const handleReturnChange = (productId: number, val: string) => {
    setReturns(prev => ({ ...prev, [productId]: val }));
  };

  const handleRemarkChange = (productId: number, val: string) => {
    setRemarks(prev => ({ ...prev, [productId]: val }));
  };

  const handleUpdate = async (finalize = false) => {
    if (!summary) return;
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const payloadItems = summary.items.map(item => {
        const retQty = Number(returns[item.productId]) || 0;
        return {
          productId: item.productId,
          returnQuantity: retQty > item.orderQuantity ? item.orderQuantity : retQty,
          remarks: remarks[item.productId],
        };
      });

      const updated = await updateDeliverySummary(Number(id), {
        items: payloadItems,
        finalize,
      });

      setSummary(updated);
      setSuccessMsg(finalize ? 'Returns finalized and stock updated.' : 'Returns saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update returns.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6"><LoadingBlock label="Loading summary..." /></div>;
  }

  if (!summary) {
    return (
      <div className="p-6 text-center text-slate-500">
        Summary not found. <Link href="/" className="text-indigo-600">Go back</Link>
      </div>
    );
  }

  const isCompleted = summary.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      <PageCard
        title={`Delivery Summary #${summary.id}`}
        description={isCompleted ? 'This summary is finalized and stock has been updated.' : 'Enter end-of-day returns for each product.'}
        action={
          <div className="flex gap-2">
            <Link
              href={`/delivery-summaries/${summary.id}/print`}
              target="_blank"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Print
            </Link>
          </div>
        }
      >
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div>
            <p className="text-sm text-slate-500">Date</p>
            <p className="font-medium text-slate-900">{new Date(summary.deliveryDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Route</p>
            <p className="font-medium text-slate-900">{summary.route?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              isCompleted ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
            }`}>
              {summary.status}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="pb-3 px-2 font-medium">SL</th>
                <th className="pb-3 px-2 font-medium">Product</th>
                <th className="pb-3 px-2 font-medium text-center">Order Qty</th>
                <th className="pb-3 px-2 font-medium text-center">Return Qty</th>
                <th className="pb-3 px-2 font-medium text-center">Sales Qty</th>
                <th className="pb-3 px-2 font-medium text-right">Price</th>
                <th className="pb-3 px-2 font-medium text-right">Total</th>
                <th className="pb-3 px-2 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.items.map((item, i) => {
                const retQty = Number(returns[item.productId]) || 0;
                const saleQty = Math.max(0, item.orderQuantity - retQty);
                const lineTotal = saleQty * Number(item.unitPrice);

                return (
                  <tr key={item.id}>
                    <td className="py-3 px-2 text-slate-400">{i + 1}</td>
                    <td className="py-3 px-2 font-medium text-slate-900">{item.product?.name}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{item.orderQuantity}</td>
                    <td className="py-3 px-2 w-32">
                      <input
                        type="number"
                        min="0"
                        max={item.orderQuantity}
                        step="1"
                        value={returns[item.productId]}
                        onChange={e => handleReturnChange(item.productId, e.target.value)}
                        disabled={isCompleted || isSaving}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                      />
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700">{saleQty}</td>
                    <td className="py-3 px-2 text-right text-slate-600">৳{item.unitPrice}</td>
                    <td className="py-3 px-2 text-right font-bold text-slate-900">৳{lineTotal.toFixed(2)}</td>
                    <td className="py-3 px-2 min-w-[150px]">
                      <input
                        type="text"
                        value={remarks[item.productId]}
                        onChange={e => handleRemarkChange(item.productId, e.target.value)}
                        disabled={isCompleted || isSaving}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="py-4 px-2 text-right font-medium text-slate-500">Total Valid Sales:</td>
                <td className="py-4 px-2 text-right font-bold text-lg text-slate-900">
                  ৳{summary.items.reduce((acc, item) => {
                    const retQty = Number(returns[item.productId]) || 0;
                    const saleQty = Math.max(0, item.orderQuantity - retQty);
                    return acc + (saleQty * Number(item.unitPrice));
                  }, 0).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!isCompleted && (
          <div className="mt-8 flex gap-4 justify-end border-t border-slate-100 pt-6">
            <button
              onClick={() => handleUpdate(false)}
              disabled={isSaving}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Save Progress
            </button>
            <button
              onClick={() => handleUpdate(true)}
              disabled={isSaving}
              className="rounded-2xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
            >
              Finalize Returns & Update Stock
            </button>
          </div>
        )}
      </PageCard>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getDeliverySummary } from '@/lib/api/delivery-summaries';
import { LoadingBlock } from '@/components/ui/loading-block';
import type { DeliverySummary } from '@/types/api';

export function PrintDeliverySummaryPage({ id }: { id: string }) {
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDeliverySummary(Number(id));
        setSummary(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, [id]);

  useEffect(() => {
    if (summary && !isLoading) {
      // Delay printing slightly to ensure styles apply
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [summary, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingBlock label="Preparing print document..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-red-500 font-medium">{error || 'Summary not found'}</p>
        </div>
      </div>
    );
  }

  const isReturnPhase = summary.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col items-center py-10 print:py-0">
      <div className="w-full max-w-[210mm] bg-white print:shadow-none shadow-sm print:p-0 p-10 min-h-[297mm]">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold text-black uppercase tracking-wider">
            {summary.company?.name || 'ALL COMPANIES'}
          </h1>
          <h2 className="text-xl font-bold text-black mt-1">Delivery Order Summary</h2>
          {isReturnPhase && (
            <span className="inline-block mt-2 px-3 py-1 bg-black text-white text-xs font-bold uppercase rounded-full print:border print:border-black print:text-black print:bg-transparent">
              Finalized (Completed)
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
          <div>
            <span className="font-bold">Date:</span> {new Date(summary.deliveryDate).toLocaleDateString()}
          </div>
          <div className="text-right">
            <span className="font-bold">Summary ID:</span> #{summary.id}
          </div>
          <div>
            <span className="font-bold">Route:</span> {summary.route?.name || 'Any / Not Specified'}
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-slate-100 print:bg-transparent">
              <th className="border border-black p-2 text-center w-12">SL</th>
              <th className="border border-black p-2 text-left">Product Name</th>
              <th className="border border-black p-2 text-center w-20">Order</th>
              <th className="border border-black p-2 text-center w-20">Return</th>
              <th className="border border-black p-2 text-center w-20">Sales</th>
              <th className="border border-black p-2 text-right w-24">Price</th>
              <th className="border border-black p-2 text-right w-24">Total</th>
              <th className="border border-black p-2 text-left w-32">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map((item, index) => {
              const saleQty = item.orderQuantity - item.returnQuantity;
              return (
                <tr key={item.id}>
                  <td className="border border-black p-2 text-center">{index + 1}</td>
                  <td className="border border-black p-2">
                    {item.product?.name}
                    {item.product?.unit ? ` (${item.product.unit})` : ''}
                  </td>
                  <td className="border border-black p-2 text-center">{item.orderQuantity}</td>
                  <td className="border border-black p-2 text-center">{item.returnQuantity > 0 ? item.returnQuantity : ''}</td>
                  <td className="border border-black p-2 text-center font-bold">{saleQty > 0 ? saleQty : ''}</td>
                  <td className="border border-black p-2 text-right">{item.unitPrice}</td>
                  <td className="border border-black p-2 text-right font-bold">{item.lineTotal > 0 ? item.lineTotal : ''}</td>
                  <td className="border border-black p-2 text-xs">{item.remarks || ''}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="border border-black p-2 text-right font-bold">Total Sales Amount:</td>
              <td className="border border-black p-2 text-right font-bold text-lg">
                {summary.items.reduce((sum, item) => sum + Number(item.lineTotal), 0).toFixed(2)}
              </td>
              <td className="border border-black p-2"></td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-10 mt-20 text-center">
          <div>
            <div className="border-t border-black w-48 mx-auto pt-2 font-medium">Prepared By</div>
          </div>
          <div>
            <div className="border-t border-black w-48 mx-auto pt-2 font-medium">Delivery Helper / Driver</div>
          </div>
        </div>

        {/* Footer Note */}
        {summary.note && (
          <div className="mt-10 border border-black p-3 text-sm">
            <span className="font-bold">Note:</span> {summary.note}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 10mm;
          }
        }
      `}} />
    </div>
  );
}

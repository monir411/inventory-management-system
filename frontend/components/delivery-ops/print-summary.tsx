'use client';

import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface PrintSummaryProps {
  report: any;
  mode: 'morning' | 'final' | 'field';
}

export function PrintSummary({ report, mode }: PrintSummaryProps) {
  if (!report) return null;

  const getTitle = () => {
    switch (mode) {
      case 'morning': return 'Morning Delivery Summary';
      case 'field': return 'Delivery Field Summary Sheet';
      case 'final': return 'Final Delivery Settlement';
      default: return 'Delivery Report';
    }
  };

  return (
    <div className="mx-auto bg-white p-8 text-sm text-black printable-report">
      {/* Header Section */}
      <div className="border-b-2 border-slate-900 pb-6 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[0.25em]">
          {getTitle()}
        </h1>
        <div className="mt-4 grid grid-cols-3 gap-4 text-left">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batch Number</p>
            <p className="font-bold text-lg">{report.batchNo}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Date</p>
            <p className="font-bold text-lg">{new Date(report.dispatchDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Route</p>
            <p className="font-bold text-lg">{report.route.name}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Personnel</p>
            <p className="font-bold">{report.deliveryPerson.name}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Print Date</p>
             <p className="font-medium text-slate-500">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {mode === 'morning' && <MorningLayout report={report} />}
      {mode === 'field' && <FieldLayout report={report} />}
      {mode === 'final' && <FinalLayout report={report} />}
    </div>
  );
}

function FieldLayout({ report }: { report: any }) {
  // Aggregate items across all orders (though morning report usually already has itemWiseTotals)
  const items = report.itemWiseTotals || [];
  
  // Sort alphabetically
  const sortedItems = [...items].sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <div className="mt-8">
      <table className="w-full border-2 border-slate-900 border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest">
            <th className="border-2 border-slate-900 px-3 py-4 text-center w-12">SL</th>
            <th className="border-2 border-slate-900 px-4 py-4 text-left min-w-[200px]">Product Name</th>
            <th className="border-2 border-slate-900 px-3 py-4 text-center w-24">Order</th>
            <th className="border-2 border-slate-900 px-3 py-4 text-center w-24 text-rose-600">Return</th>
            <th className="border-2 border-slate-900 px-3 py-4 text-center w-24 text-emerald-600">Sales</th>
            <th className="border-2 border-slate-900 px-3 py-4 text-center w-24">Price</th>
            <th className="border-2 border-slate-900 px-4 py-4 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, index) => (
            <tr key={item.productName} className="font-bold">
              <td className="border-2 border-slate-900 px-3 py-5 text-center text-slate-400 font-medium">
                {index + 1}
              </td>
              <td className="border-2 border-slate-900 px-4 py-5 text-left text-slate-900 text-base">
                {item.productName}
              </td>
              <td className="border-2 border-slate-900 px-3 py-5 text-center text-lg bg-slate-50">
                {formatNumber(item.quantity)}
              </td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-4 py-5"></td>
            </tr>
          ))}
          {/* Add a few extra empty rows just in case */}
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-14">
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-4 py-5"></td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-3 py-5"></td>
              <td className="border-2 border-slate-900 px-4 py-5"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-2 gap-20">
        <div className="border-t-2 border-slate-900 pt-3 text-center">
          <p className="text-xs font-black uppercase tracking-widest">Delivery Man Signature</p>
        </div>
        <div className="border-t-2 border-slate-900 pt-3 text-center">
          <p className="text-xs font-black uppercase tracking-widest">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
}

function MorningLayout({ report }: { report: any }) {
  return (
    <div className="mt-8 space-y-10">
      {/* Item Summary Table */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest border-l-4 border-slate-900 pl-3 mb-4">
          Item-wise Loading Sheet
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-3 text-left">Product Name</th>
              <th className="py-3 text-center">Total Quantity</th>
              <th className="py-3 text-right">Est. Unit Price</th>
              <th className="py-3 text-right">Est. Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.itemWiseTotals.map((item: any) => (
              <tr key={item.productName} className="font-medium">
                <td className="py-3 font-bold text-slate-900">{item.productName}</td>
                <td className="py-3 text-center font-black">{formatNumber(item.quantity)}</td>
                <td className="py-3 text-right text-slate-500">{formatCurrency(item.estimatedAmount / item.quantity)}</td>
                <td className="py-3 text-right font-bold">{formatCurrency(item.estimatedAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td colSpan={3} className="py-4 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                Total Estimated Value
              </td>
              <td className="py-4 text-right text-xl font-black">
                {formatCurrency(report.estimatedTotalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Order Breakdown */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest border-l-4 border-slate-900 pl-3 mb-4">
          Order Breakdown
        </h2>
        <div className="grid gap-4 grid-cols-2">
          {report.selectedOrders.map((order: any) => (
            <div key={order.orderId} className="rounded-xl border-2 border-slate-100 p-4 break-inside-avoid">
              <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                <div>
                  <p className="font-black">Order #{String(order.orderId).padStart(6, '0')}</p>
                  <p className="text-xs text-slate-500 font-bold">{order.shopName}</p>
                </div>
                <p className="text-xs font-black">{formatCurrency(order.estimatedAmount)}</p>
              </div>
              <div className="space-y-1">
                {order.items.map((item: any) => (
                  <div key={item.productName} className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">{item.productName}</span>
                    <span className="font-bold">{formatNumber(item.dispatchedQuantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinalLayout({ report }: { report: any }) {
  return (
    <div className="mt-8 space-y-10">
       {/* Metrics Grid */}
       <div className="grid grid-cols-4 gap-4">
        {[
          ['Gross Dispatch', report.summary.grossDispatchedValue, 'text-slate-500'],
          ['Return Adjusted', report.summary.returnAdjustedValue, 'text-rose-600'],
          ['Final Sold', report.summary.finalSoldValue, 'text-emerald-700'],
          ['Collected Cash', report.summary.totalCollectedAmount, 'text-cyan-700'],
        ].map(([label, value, colorClass]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-lg font-black ${colorClass}`}>{formatCurrency(Number(value))}</p>
          </div>
        ))}
      </div>

      {/* Product Reconciliation */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest border-l-4 border-slate-900 pl-3 mb-4">
          Product Reconciliation
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-3 text-left">Product</th>
              <th className="py-3 text-center">Dispatch</th>
              <th className="py-3 text-center text-rose-500">Return</th>
              <th className="py-3 text-center text-rose-500">Damage</th>
              <th className="py-3 text-center text-emerald-600">Sold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.productSummary.map((item: any) => (
              <tr key={item.productName} className="font-medium text-[12px]">
                <td className="py-2.5 font-bold text-slate-900">{item.productName}</td>
                <td className="py-2.5 text-center">{formatNumber(item.dispatched)}</td>
                <td className="py-2.5 text-center text-rose-500">{formatNumber(item.returned)}</td>
                <td className="py-2.5 text-center text-rose-500">{formatNumber(item.damaged)}</td>
                <td className="py-2.5 text-center font-black text-emerald-600">{formatNumber(item.delivered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Settlement */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest border-l-4 border-slate-900 pl-3 mb-4">
          Order Settlement Details
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-3 text-left">Order</th>
              <th className="py-3 text-right">Sold Amount</th>
              <th className="py-3 text-right">Advance</th>
              <th className="py-3 text-right">Collected</th>
              <th className="py-3 text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.orders.map((order: any) => (
              <tr key={order.orderId} className="text-[12px]">
                <td className="py-3">
                  <p className="font-black text-slate-900">#{String(order.orderId).padStart(6, '0')}</p>
                  <p className="text-[10px] font-bold text-slate-400">{order.shopName}</p>
                </td>
                <td className="py-3 text-right font-bold">{formatCurrency(order.calculations.finalSoldAmount)}</td>
                <td className="py-3 text-right text-slate-500">{formatCurrency(order.advancePaid || 0)}</td>
                <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(order.collectedAmount || 0)}</td>
                <td className="py-3 text-right font-black text-rose-600">{formatCurrency(order.dueAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


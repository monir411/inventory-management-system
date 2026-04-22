'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDeliverySummaries, deleteDeliverySummary } from '@/lib/api/delivery-summaries';
import { getCompanies } from '@/lib/api/companies';
import { getRoutes } from '@/lib/api/routes';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageCard } from '@/components/ui/page-card';
import { useToastNotification } from '@/components/ui/toast-provider';
import type { DeliverySummary, Company, Route } from '@/types/api';

export function DeliverySummariesListPage() {
  const [summaries, setSummaries] = useState<DeliverySummary[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Filters
  const [companyId, setCompanyId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [date, setDate] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useToastNotification({ message: error, title: 'Error', tone: 'error' });
  useToastNotification({ message: success, title: 'Success', tone: 'success' });

  async function loadData() {
    try {
      setIsLoading(true);
      const [sumsRes, compsRes, routesRes] = await Promise.all([
        getDeliverySummaries({
          companyId: companyId ? Number(companyId) : undefined,
          routeId: routeId ? Number(routeId) : undefined,
          date: date || undefined,
        }),
        getCompanies(),
        getRoutes(),
      ]);
      setSummaries(sumsRes.items);
      setCompanies(compsRes);
      setRoutes(routesRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summaries');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [companyId, routeId, date]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this summary? This will also reverse any stock updates.')) {
      return;
    }
    
    try {
      setIsDeleting(id);
      await deleteDeliverySummary(id);
      setSuccess('Summary deleted successfully.');
      setSummaries(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="Delivery Summaries"
        description="Manage all delivery sheets. Click on a summary to add evening returns."
        action={
          <Link
            href="/delivery-summaries/create"
            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            + Create Summary
          </Link>
        }
      >
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Routes</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <LoadingBlock label="Loading summaries..." />
        ) : summaries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl">
            No delivery summaries found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100 text-slate-600">
                  <th className="py-3 px-4 font-medium">ID / Date</th>
                  <th className="py-3 px-4 font-medium">Company & Route</th>
                  <th className="py-3 px-4 font-medium text-center">Ordered</th>
                  <th className="py-3 px-4 font-medium text-center">Returned</th>
                  <th className="py-3 px-4 font-medium text-center">Sold</th>
                  <th className="py-3 px-4 font-medium text-right">Amount</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((summary) => {
                  let totalOrder = 0, totalReturn = 0, totalAmount = 0;
                  summary.items.forEach(item => {
                    totalOrder += item.orderQuantity;
                    totalReturn += item.returnQuantity;
                    totalAmount += Number(item.lineTotal);
                  });
                  const totalSold = totalOrder - totalReturn;

                  return (
                    <tr key={summary.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">#{summary.id}</div>
                        <div className="text-xs text-slate-500">{new Date(summary.deliveryDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{summary.company?.name || 'All'}</div>
                        <div className="text-xs text-slate-500">{summary.route?.name || 'Any Route'}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{totalOrder.toFixed(0)}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{totalReturn.toFixed(0)}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{totalSold.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">৳{totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          summary.status === 'COMPLETED' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                        }`}>
                          {summary.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/delivery-summaries/${summary.id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                        >
                          {summary.status === 'COMPLETED' ? 'View' : 'Edit Returns'}
                        </Link>
                        <Link
                          href={`/delivery-summaries/${summary.id}/print`}
                          target="_blank"
                          className="text-slate-600 hover:text-slate-900 font-medium text-sm ml-2"
                        >
                          Print
                        </Link>
                        <button
                          onClick={() => handleDelete(summary.id)}
                          disabled={isDeleting === summary.id}
                          className="text-red-500 hover:text-red-700 font-medium text-sm ml-2 disabled:opacity-50"
                        >
                          {isDeleting === summary.id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
}

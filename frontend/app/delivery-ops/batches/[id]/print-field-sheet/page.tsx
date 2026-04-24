'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDispatchBatch, getMorningDispatchReport } from '@/lib/api/delivery-ops';
import { PrintSummary } from '@/components/delivery-ops/print-summary';
import { LoadingBlock } from '@/components/ui/loading-block';

export default function PrintFieldSheetPage() {
  const params = useParams();
  const id = params.id as string;
  const batchId = Number(id);
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getMorningDispatchReport(batchId);
        setReport(data);
        
        // Trigger print after a short delay to ensure rendering is complete
        setTimeout(() => {
          window.print();
        }, 800);
      } catch (err) {
        console.error('Failed to load print data:', err);
        setError('Failed to load dispatch data for printing.');
      } finally {
        setIsLoading(false);
      }
    }

    if (batchId) {
      loadData();
    }
  }, [batchId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoadingBlock label="Preparing Field Sheet for printing..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center text-rose-600 font-bold bg-white h-screen">
        {error || 'No report data found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-page * {
            visibility: visible !important;
          }
        }

        /* Ensure clean display on screen too */
        body {
          background-color: #f8fafc;
        }
        
        .print-container {
          max-width: 210mm;
          margin: 20px auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        @media print {
          .print-container {
            margin: 0;
            box-shadow: none;
            max-width: none;
          }
        }
      `}} />
      
      <div className="print-container print-page">
        <PrintSummary report={report} mode="field" />
      </div>

      <div className="no-print fixed bottom-8 right-8 flex gap-4">
        <button 
          onClick={() => window.print()}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition"
        >
          Print Again
        </button>
        <button 
          onClick={() => window.close()}
          className="rounded-full bg-white border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 shadow-xl hover:bg-slate-50 transition"
        >
          Close Window
        </button>
      </div>
    </div>
  );
}

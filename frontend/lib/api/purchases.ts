import { apiRequest } from './client';
import type {
  CompanyPayableLedger,
  CompanyWisePayableSummary,
  CreatePurchasePayload,
  Purchase,
  PurchaseQuery,
  ReceivePurchasePaymentPayload,
} from '@/types/api';

export function getPurchases(query: PurchaseQuery = {}) {
  return apiRequest<Purchase[]>('purchases', {
    query,
  });
}

export function getPurchase(id: number) {
  return apiRequest<Purchase>(`purchases/${id}`);
}

export function createPurchase(payload: CreatePurchasePayload) {
  return apiRequest<Purchase>('purchases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function receivePurchasePayment(
  id: number,
  payload: ReceivePurchasePaymentPayload,
) {
  return apiRequest<Purchase>(`purchases/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCompanyWisePayableSummary(query: PurchaseQuery = {}) {
  return apiRequest<CompanyWisePayableSummary[]>(
    'purchases/summary/company-wise-payable',
    {
      query,
    },
  );
}

export function getCompanyPayableLedger(companyId: number) {
  return apiRequest<CompanyPayableLedger>(
    `purchases/companies/${companyId}/payable-ledger`,
  );
}

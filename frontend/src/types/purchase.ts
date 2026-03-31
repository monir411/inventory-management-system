import type { Company } from '@/types/company';
import type { Product } from '@/types/product';
import type { Warehouse } from '@/types/warehouse';

export type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreatePurchaseInput = {
  purchaseNo: string;
  purchaseDate: string;
  companyId: string;
  warehouseId: string;
  supplierInvoiceNo?: string;
  note?: string;
  items: PurchaseItemInput[];
};

export type PurchaseListItem = {
  id: string;
  purchaseNo: string;
  supplierInvoiceNo?: string | null;
  purchaseDate: string;
  note?: string | null;
  company: Company;
  warehouse: Warehouse;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
};

export type PurchaseItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: Product;
  createdAt: string;
};

export type PurchaseDetails = {
  id: string;
  purchaseNo: string;
  supplierInvoiceNo?: string | null;
  purchaseDate: string;
  note?: string | null;
  company: Company;
  warehouse: Warehouse;
  items: PurchaseItem[];
  totalAmount: number;
  createdAt: string;
};

export type PurchaseListFilters = {
  companyId?: string;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
};


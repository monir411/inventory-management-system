import type { Company } from '@/types/company';

export type Product = {
  id: string;
  code: string;
  sku?: string | null;
  name: string;
  purchasePrice: number;
  salePrice: number;
  mrp?: number | null;
  isActive: boolean;
  company?: Company;
};


import type { RouteItem } from '@/types/route';

export type CollectionFormInput = {
  collectionNo: string;
  routeId: string;
  collectionDate: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
};

export type CollectionItem = {
  id: string;
  collectionNo: string;
  collectionDate: string;
  amount: number;
  paymentMethod?: string | null;
  note?: string | null;
  route: RouteItem;
  createdAt: string;
};

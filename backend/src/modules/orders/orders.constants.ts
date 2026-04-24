export enum DiscountType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  RETURNED_PARTIAL = 'RETURNED_PARTIAL',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED',
}

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

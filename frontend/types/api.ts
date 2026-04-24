export type Company = {
  [key: string]: any;
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyPayload = {
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive?: boolean;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export type ProductUnit = 'PCS' | 'KG' | 'LITER' | 'PACK' | 'DOZEN' | 'OTHER';

export type Product = {
  [key: string]: any;
  id: number;
  companyId: number;
  name: string;
  sku: string;
  unit: ProductUnit;
  buyPrice: number;
  salePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company?: Company;
};

export type CreateProductPayload = {
  companyId: number;
  name: string;
  sku: string;
  unit: ProductUnit;
  buyPrice: number;
  salePrice: number;
  isActive?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type Route = {
  [key: string]: any;
  id: number;
  name: string;
  area: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Shop = {
  [key: string]: any;
  id: number;
  routeId: number;
  name: string;
  ownerName: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  route?: Route;
};

export type CreateRoutePayload = {
  name: string;
  area?: string;
  isActive?: boolean;
};

export type UpdateRoutePayload = Partial<CreateRoutePayload>;

export type CreateShopPayload = {
  routeId: number;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
};

export type UpdateShopPayload = Partial<CreateShopPayload>;

export type PaginatedResponse<T> = {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
};

export type Role = 'ADMIN' | 'MANAGER' | 'SALES';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  access_token: string;
  user: User;
};

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'RETURNED_PARTIAL'
  | 'CANCELLED'
  | 'SETTLED';
export type DiscountType = 'FIXED' | 'PERCENT';

export type DeliveryPerson = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  vehicleNo?: string | null;
  helperName?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  freeQuantity: number;
  unitPrice: number;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  lineTotal: number;
  deliveredQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
};

export type Order = {
  id: number;
  orderDate: string;
  companyId: number;
  company?: Company;
  routeId: number;
  route?: Route;
  deliveryPersonId?: number | null;
  deliveryPerson?: DeliveryPerson | null;
  marketArea?: string | null;
  shopId: number | null;
  shop?: Shop;
  subtotal: number;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  grandTotal: number;
  advancePaid: number;
  actualSoldAmount: number;
  collectedAmount: number;
  dueAmount: number;
  status: OrderStatus;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  settledAt?: string | null;
  isLocked: boolean;
  note: string | null;
  settlementNote?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type DispatchBatchStatus =
  | 'DRAFT'
  | 'PRINTED'
  | 'DISPATCHED'
  | 'RETURN_PENDING'
  | 'PARTIALLY_SETTLED'
  | 'SETTLED'
  | 'CANCELLED';

export type DispatchBatchItem = {
  id: number;
  productId: number;
  product: Product;
  totalDispatchedQty: number;
  totalReturnedQty: number;
  totalDamagedQty: number;
  totalDeliveredQty: number;
  estimatedAmount: number;
  finalSoldAmount: number;
};

export type DispatchBatchOrder = {
  id: number;
  orderId: number;
  order: Order;
  estimatedAmount: number;
  finalSoldAmount: number;
  collectedAmount: number;
  dueAmount: number;
  shortageOrExcess: number;
  isSettled: boolean;
};

export type DispatchBatchMetrics = {
  grossDispatchedValue: number;
  returnAdjustedValue: number;
  finalSoldValue: number;
  totalAdvancePaid: number;
  totalCollectedAmount: number;
  totalDueAmount: number;
  shortageOrExcess: number;
  orders: {
    orderId: number;
    dispatchedQuantity: number;
    returnedQuantity: number;
    damagedQuantity: number;
    deliveredQuantity: number;
    deliveredSubtotal: number;
    invoiceDiscountApplied: number;
    finalSoldAmount: number;
  }[];
};

export type DispatchBatch = {
  id: number;
  batchNo: string;
  dispatchDate: string;
  companyId?: number | null;
  company?: Company | null;
  routeId: number;
  route: Route;
  deliveryPersonId: number;
  deliveryPerson: DeliveryPerson;
  marketArea?: string | null;
  status: DispatchBatchStatus;
  totalOrders: number;
  grossDispatchedValue: number;
  returnAdjustedValue: number;
  finalSoldValue: number;
  totalAdvancePaid: number;
  totalCollectedAmount: number;
  totalDueAmount: number;
  shortageOrExcess: number;
  isMorningPrinted: boolean;
  isFinalPrinted: boolean;
  morningPrintedAt?: string | null;
  dispatchedAt?: string | null;
  returnsRecordedAt?: string | null;
  settledAt?: string | null;
  note?: string | null;
  settlementNote?: string | null;
  orders: DispatchBatchOrder[];
  items: DispatchBatchItem[];
  metrics: DispatchBatchMetrics;
  createdAt: string;
  updatedAt: string;
};

export type DeliverySummaryStatus = 'DRAFT' | 'COMPLETED';

export type DeliverySummaryItem = {
  id: number;
  summaryId: number;
  productId: number;
  product: Product;
  orderedQuantity: number;
  returnedQuantity: number;
  soldQuantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type DeliverySummary = {
  id: number;
  deliveryDate: string;
  companyId: number;
  company: Company;
  routeId: number;
  route: Route;
  status: DeliverySummaryStatus;
  morningPrinted: boolean;
  finalPrinted: boolean;
  totalAmount: number;
  note: string | null;
  items: DeliverySummaryItem[];
  createdAt: string;
  updatedAt: string;
};

export type SalesQuery = {
  page?: number;
  limit?: number;
  companyId?: number;
  routeId?: number;
  shopId?: number;
  date?: string;
  year?: number;
  month?: number;
  fromDate?: string;
  toDate?: string;
  dueOnly?: boolean;
  search?: string;
  scope?: 'all' | 'company';
};

export type SaleItem = {
  id: number;
  [key: string]: any;
  productId: number;
  product?: Product;
  quantity: number;
  freeQuantity: number;
  unitPrice: number;
  discountAmount: number;
  discountType: string;
  discountValue: number;
  lineTotal: number;
};

export type Sale = {
  id: number;
  [key: string]: any;
  saleDate: string;
  invoiceNo: string;
  deliveryStatus?: string;
  companyId?: number;
  routeId?: number;
  shopId?: number;
  company?: Company;
  route?: Route;
  shop?: Shop;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  payments: any[];
  createdAt?: string;
  updatedAt?: string;
};

export type TodaySalesSummary = {
  [key: string]: any;
  totalSales: number;
  totalInvoices: number;
  averageOrderValue: number;
};

export type TodayProfitSummary = {
  [key: string]: any;
  grossProfit: number;
  netProfit: number;
  marginPercent: number;
};

export type MonthlySalesSummary = {
  [key: string]: any;
  totalSales: number;
  totalInvoices: number;
  trend: number;
};

export type RouteWiseSalesSummary = {
  [key: string]: any;
  routeId: number;
  routeName: string;
  totalSales: number;
  invoiceCount: number;
  totalAmount: number;
};

export type CompanyWiseSalesSummary = {
  [key: string]: any;
  companyId: number;
  companyName: string;
  totalSales: number;
  invoiceCount: number;
  totalAmount: number;
};

export type RouteWiseDueSummary = {
  [key: string]: any;
  routeId: number;
  routeName: string;
  totalDue: number;
};

export type ShopWiseDueSummary = {
  [key: string]: any;
  shopId: number;
  shopName: string;
  totalDue: number;
};

export type CompanyWiseDueSummary = {
  [key: string]: any;
  companyId: number;
  companyName: string;
  totalDue: number;
};

export type DueOverviewSummary = {
  [key: string]: any;
  totalDue: number;
  totalCollected: number;
  overdueCount: number;
};

export type ShopDueDetails = {
  [key: string]: any;
  shop: Shop;
  dues: { saleId: number; dueAmount: number; saleDate?: string }[];
};

export type CreateSalePayload = Record<string, any>;
export type ReceiveSalePaymentPayload = Record<string, any>;

export type PurchaseQuery = {
  page?: number;
  limit?: number;
  companyId?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

export type PurchaseItem = {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type Purchase = {
  id: number;
  [key: string]: any;
  purchaseDate: string;
  companyId: number;
  company?: Company;
  items: PurchaseItem[];
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePurchasePayload = Record<string, any>;
export type ReceivePurchasePaymentPayload = Record<string, any>;

export type CompanyWisePayableSummary = {
  [key: string]: any;
  companyId: number;
  companyName: string;
  payableAmount: number;
  companyCode?: string;
};

export type CompanyPayableHistoryEntry = {
  [key: string]: any;
  id: number;
  date: string;
  type: string;
  amount: number;
  note?: string;
  purchasePayableAmount: number;
};

export type CompanyPayableLedger = {
  [key: string]: any;
  companyId: number;
  companyName: string;
  totalPayable: number;
  history: CompanyPayableHistoryEntry[];
  payablePurchases: any[];
};

export type StockMovementType =
  | 'OPENING'
  | 'STOCK_IN'
  | 'SALE_OUT'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'RETURN_IN'
  | 'DAMAGE'
  | 'SALE';

export type StockMovement = {
  id: number;
  productId: number;
  companyId: number;
  product?: Product;
  company?: Company;
  type: StockMovementType;
  quantity: number;
  note?: string;
  reference?: string;
  user?: string;
  createdAt: string;
};

export type StockMovementQuery = {
  type?: StockMovementType;
  productId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
};

export type StockSummaryItem = Product & {
  currentStock: number;
  stockValue: number;
};

export type StockInvestmentSummary = {
  [key: string]: any;
  summary: {
    totalProducts: number;
    totalStockQty: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    todayStockIn: number;
    todayStockOut: number;
  };
  currentStockList: StockSummaryItem[];
  companies?: any[];
  units?: any[];
  totalProducts?: number;
  inStockProducts?: number;
  lowStockProducts?: number;
  zeroStockProducts?: number;
  totalInvestment?: number;
};

export type DeliverySummariesQuery = {
  startDate?: string;
  endDate?: string;
  companyId?: number;
  routeId?: number;
};

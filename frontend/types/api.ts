export type Company = {
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

export type StockMovementType =
  | 'OPENING'
  | 'STOCK_IN'
  | 'SALE_OUT'
  | 'RETURN_IN'
  | 'ADJUSTMENT'
  | 'DAMAGE';

export type StockMovement = {
  id: number;
  companyId: number;
  productId: number;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  movementDate: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  product?: Product;
};

export type StockMovementQuery = {
  productId?: number;
  type?: StockMovementType;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

export type StockSummaryItem = {
  productId: number;
  companyId: number;
  company?: {
    id: number;
    name: string;
    code: string;
    isActive: boolean;
  };
  productName: string;
  sku: string;
  unit: ProductUnit;
  buyPrice: number;
  salePrice: number;
  isActive: boolean;
  currentStock: number;
  investmentValue: number;
  isLowStock?: boolean;
  isZeroStock?: boolean;
};

export type StockInvestmentCompanySummary = {
  companyId: number;
  companyName: string;
  companyCode: string;
  productCount: number;
  inStockProductCount: number;
  lowStockProductCount: number;
  zeroStockProductCount: number;
  totalQuantity: number;
  investmentValue: number;
};

export type StockInvestmentUnitSummary = {
  unit: ProductUnit;
  productCount: number;
  inStockProductCount: number;
  totalQuantity: number;
  investmentValue: number;
};

export type StockInvestmentSummary = {
  totalInvestment: number;
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  zeroStockProducts: number;
  companyCount: number;
  companies: StockInvestmentCompanySummary[];
  units: StockInvestmentUnitSummary[];
  items: StockSummaryItem[];
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

export type CreateStockMovementPayload = {
  companyId: number;
  productId: number;
  quantity: number;
  note?: string;
  movementDate: string;
};

export type Route = {
  id: number;
  name: string;
  area: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Shop = {
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
  totalOrders?: number;
  totalDue?: number;
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

export type Purchase = {
  id: number;
  companyId: number;
  purchaseDate: string;
  referenceNo: string | null;
  totalAmount: number;
  paidAmount: number;
  payableAmount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  items?: PurchaseItem[];
  payments?: PurchasePayment[];
};

export type PurchaseItem = {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
};

export type PurchasePayment = {
  id: number;
  purchaseId: number;
  amount: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePurchaseItemPayload = {
  productId: number;
  quantity: number;
  unitCost: number;
};

export type CreatePurchasePayload = {
  companyId: number;
  purchaseDate: string;
  referenceNo?: string;
  note?: string;
  items: CreatePurchaseItemPayload[];
};

export type ReceivePurchasePaymentPayload = {
  amount: number;
  paymentDate: string;
  note?: string;
};

export type PurchaseQuery = {
  companyId?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

export type CompanyWisePayableSummary = {
  companyId: number;
  companyName: string;
  companyCode: string;
  purchaseCount: number;
  payablePurchaseCount: number;
  totalAmount: number;
  totalPaid: number;
  totalPayable: number;
  lastPurchaseDate: string | null;
};

export type CompanyPayableHistoryEntry = {
  id: number;
  purchaseId: number;
  amount: number;
  paymentDate: string;
  note: string | null;
  referenceNo: string | null;
  purchaseTotalAmount: number;
  purchasePaidAmount: number;
  purchasePayableAmount: number;
  companyId: number;
  companyName: string;
  companyCode: string;
};

export type CompanyPayableLedger = {
  company: Company;
  summary: {
    purchaseCount: number;
    payablePurchaseCount: number;
    totalAmount: number;
    totalPaid: number;
    totalPayable: number;
    lastPurchaseDate: string | null;
  };
  payablePurchases: Purchase[];
  paymentHistory: CompanyPayableHistoryEntry[];
};

export type Sale = {
  id: number;
  companyId: number;
  routeId: number;
  shopId: number | null;
  saleDate: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  totalProfit: number;
  note: string | null;
  invoiceDiscountType: string | null;
  invoiceDiscountValue: number | null;
  invoiceDiscountAmount: number | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  route?: Route;
  shop?: Shop | null;
  items?: SaleItem[];
  payments?: SalePayment[];
};

export type SaleItem = {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  buyPrice: number;
  lineTotal: number;
  lineProfit: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  freeQuantity: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
};

export type SalePayment = {
  id: number;
  saleId: number;
  amount: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSaleItemPayload = {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  freeQuantity?: number;
};

export type CreateSalePayload = {
  companyId: number;
  routeId: number;
  shopId?: number;
  saleDate: string;
  invoiceNo?: string;
  paidAmount: number;
  note?: string;
  invoiceDiscountType?: 'percentage' | 'fixed';
  invoiceDiscountValue?: number;
  items: CreateSaleItemPayload[];
};

export type ReceiveSalePaymentPayload = {
  amount: number;
  paymentDate: string;
  note?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
};

export type SalesQuery = {
  companyId?: number;
  routeId?: number;
  shopId?: number;
  fromDate?: string;
  toDate?: string;
  dueOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type TodaySalesSummary = {
  date: string;
  saleCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
};

export type TodayProfitSummary = {
  date: string;
  saleCount: number;
  totalProfit: number;
};

export type MonthlySalesSummary = {
  year: number;
  month: number;
  saleCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  totalProfit: number;
};

export type DueOverviewSummary = {
  todayDue: number;
  monthlyDue: number;
  totalDue: number;
  todayPaid: number;
  monthlyPaid: number;
  totalPaid: number;
  dueSaleCount: number;
};

export type RouteWiseDueSummary = {
  routeId: number;
  routeName: string;
  routeArea: string | null;
  dueSaleCount: number;
  shopCount: number;
  totalDue: number;
  totalPaid: number;
  lastSaleDate: string | null;
};

export type ShopWiseDueSummary = {
  shopId: number;
  shopName: string;
  ownerName: string | null;
  routeId: number;
  routeName: string;
  dueSaleCount: number;
  companyCount: number;
  totalDue: number;
  totalPaid: number;
  lastSaleDate: string | null;
};

export type CompanyWiseDueSummary = {
  companyId: number;
  companyName: string;
  companyCode: string;
  dueSaleCount: number;
  shopCount: number;
  totalDue: number;
  totalPaid: number;
  lastSaleDate: string | null;
};

export type RouteWiseSalesSummary = {
  routeId: number;
  routeName: string;
  routeArea: string | null;
  saleCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  totalProfit: number;
};

export type ShopPaymentHistoryEntry = {
  id: number;
  saleId: number;
  amount: number;
  paymentDate: string;
  note: string | null;
  invoiceNo: string;
  saleTotalAmount: number;
  salePaidAmount: number;
  saleDueAmount: number;
  companyId: number;
  companyName: string;
  routeId: number;
  routeName: string;
};

export type ShopDueDetails = {
  shop: Shop;
  summary: {
    saleCount: number;
    dueSaleCount: number;
    totalAmount: number;
    totalPaid: number;
    totalDue: number;
    lastSaleDate: string | null;
  };
  dueSales: Sale[];
  paymentHistory: ShopPaymentHistoryEntry[];
};

export type CompanyWiseSalesSummary = {
  companyId: number;
  companyName: string;
  companyCode: string;
  saleCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  totalProfit: number;
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

export type DeliverySummaryItem = {
  id: number;
  deliverySummaryId: number;
  productId: number;
  orderQuantity: number;
  returnQuantity: number;
  saleQuantity: number;
  unitPrice: number;
  lineTotal: number;
  remarks: string | null;
  product?: Product;
};

export type DeliverySummary = {
  id: number;
  companyId: number | null;
  routeId: number | null;
  deliveryDate: string;
  status: 'PENDING' | 'COMPLETED';
  note: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  route?: Route;
  items: DeliverySummaryItem[];
};

export type CreateDeliverySummaryItemPayload = {
  productId: number;
  orderQuantity: number;
  unitPrice?: number;
};

export type CreateDeliverySummaryPayload = {
  companyId?: number;
  routeId?: number;
  deliveryDate: string;
  note?: string;
  items: CreateDeliverySummaryItemPayload[];
};

export type UpdateDeliverySummaryItemPayload = {
  productId: number;
  returnQuantity: number;
  remarks?: string;
};

export type UpdateDeliverySummaryPayload = {
  items: UpdateDeliverySummaryItemPayload[];
  finalize?: boolean;
};

export type DeliverySummariesQuery = {
  page?: number;
  limit?: number;
  companyId?: number;
  routeId?: number;
  date?: string;
};

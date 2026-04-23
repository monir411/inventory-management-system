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

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
export type DiscountType = 'FIXED' | 'PERCENT';

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
};

export type Order = {
  id: number;
  orderDate: string;
  companyId: number;
  company?: Company;
  routeId: number;
  route?: Route;
  shopId: number | null;
  shop?: Shop;
  subtotal: number;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  grandTotal: number;
  status: OrderStatus;
  note: string | null;
  items: OrderItem[];
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

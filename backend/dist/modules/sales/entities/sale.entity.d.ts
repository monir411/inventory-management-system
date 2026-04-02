import { Company } from '../../companies/entities/company.entity';
import { Route } from '../../routes/entities/route.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { SaleItem } from './sale-item.entity';
export declare class Sale {
    id: number;
    companyId: number;
    routeId: number;
    shopId: number | null;
    saleDate: Date;
    invoiceNo: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    totalProfit: number;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    company: Company;
    route: Route;
    shop: Shop | null;
    items: SaleItem[];
}

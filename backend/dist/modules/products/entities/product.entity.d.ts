import { Company } from '../../companies/entities/company.entity';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
import { ProductUnit } from './product-unit.enum';
export declare class Product {
    id: number;
    companyId: number;
    name: string;
    sku: string;
    unit: ProductUnit;
    buyPrice: number;
    salePrice: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    company: Company;
    stockMovements: StockMovement[];
}

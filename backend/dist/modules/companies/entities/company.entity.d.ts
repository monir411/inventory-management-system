import { Product } from '../../products/entities/product.entity';
import { StockMovement } from '../../stock/entities/stock-movement.entity';
export declare class Company {
    id: number;
    name: string;
    code: string;
    address: string;
    phone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    products: Product[];
    stockMovements: StockMovement[];
}

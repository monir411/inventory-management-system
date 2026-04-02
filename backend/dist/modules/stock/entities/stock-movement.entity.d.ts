import { Company } from '../../companies/entities/company.entity';
import { Product } from '../../products/entities/product.entity';
import { StockMovementType } from '../enums/stock-movement-type.enum';
export declare class StockMovement {
    id: number;
    companyId: number;
    productId: number;
    type: StockMovementType;
    quantity: number;
    note: string | null;
    movementDate: Date;
    createdAt: Date;
    updatedAt: Date;
    company: Company;
    product: Product;
}

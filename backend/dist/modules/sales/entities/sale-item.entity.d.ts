import { Product } from '../../products/entities/product.entity';
import { Sale } from './sale.entity';
export declare class SaleItem {
    id: number;
    saleId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    buyPrice: number;
    lineTotal: number;
    lineProfit: number;
    createdAt: Date;
    updatedAt: Date;
    sale: Sale;
    product: Product;
}

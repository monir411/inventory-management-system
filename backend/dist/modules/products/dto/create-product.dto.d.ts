import { ProductUnit } from '../entities/product-unit.enum';
export declare class CreateProductDto {
    companyId: number;
    name: string;
    sku: string;
    unit: ProductUnit;
    buyPrice: number;
    salePrice: number;
    isActive?: boolean;
}

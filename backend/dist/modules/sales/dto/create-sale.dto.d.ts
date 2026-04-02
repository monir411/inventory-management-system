import { CreateSaleItemDto } from './create-sale-item.dto';
export declare class CreateSaleDto {
    companyId: number;
    routeId: number;
    shopId?: number;
    saleDate: Date;
    invoiceNo?: string;
    paidAmount: number;
    note?: string;
    items: CreateSaleItemDto[];
}

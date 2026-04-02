import { StockMovementType } from '../enums/stock-movement-type.enum';
export declare class QueryStockMovementsDto {
    companyId: number;
    productId?: number;
    type?: StockMovementType;
    fromDate?: Date;
    toDate?: Date;
}

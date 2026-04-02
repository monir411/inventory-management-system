import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto';
import { StockSummaryQueryDto } from './dto/stock-summary-query.dto';
import { StockService } from './stock.service';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    createOpeningStock(createStockMovementDto: CreateStockMovementDto): Promise<import("./entities/stock-movement.entity").StockMovement>;
    createStockIn(createStockMovementDto: CreateStockMovementDto): Promise<import("./entities/stock-movement.entity").StockMovement>;
    createAdjustment(createStockMovementDto: CreateStockMovementDto): Promise<import("./entities/stock-movement.entity").StockMovement>;
    findMovements(query: QueryStockMovementsDto): Promise<import("./entities/stock-movement.entity").StockMovement[]>;
    getCurrentStockSummary(query: StockSummaryQueryDto): Promise<{
        productId: number;
        companyId: number;
        company: {
            id: number;
            name: string;
            code: string;
            isActive: boolean;
        };
        productName: string;
        sku: string;
        unit: string;
        isActive: boolean;
        currentStock: number;
        isLowStock: boolean;
        isZeroStock: boolean;
    }[]>;
    getLowStockProducts(query: StockSummaryQueryDto): Promise<{
        productId: number;
        companyId: number;
        company: {
            id: number;
            name: string;
            code: string;
            isActive: boolean;
        };
        productName: string;
        sku: string;
        unit: string;
        isActive: boolean;
        currentStock: number;
        isLowStock: boolean;
        isZeroStock: boolean;
    }[]>;
    getZeroStockProducts(query: StockSummaryQueryDto): Promise<{
        productId: number;
        companyId: number;
        company: {
            id: number;
            name: string;
            code: string;
            isActive: boolean;
        };
        productName: string;
        sku: string;
        unit: string;
        isActive: boolean;
        currentStock: number;
        isLowStock: boolean;
        isZeroStock: boolean;
    }[]>;
}

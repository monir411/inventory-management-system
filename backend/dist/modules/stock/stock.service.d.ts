import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto';
import { StockSummaryQueryDto } from './dto/stock-summary-query.dto';
import { StockMovement } from './entities/stock-movement.entity';
export declare class StockService {
    private readonly stockMovementsRepository;
    private readonly companiesRepository;
    private readonly productsRepository;
    constructor(stockMovementsRepository: Repository<StockMovement>, companiesRepository: Repository<Company>, productsRepository: Repository<Product>);
    createOpeningStock(createStockMovementDto: CreateStockMovementDto): Promise<StockMovement>;
    createStockIn(createStockMovementDto: CreateStockMovementDto): Promise<StockMovement>;
    createAdjustment(createStockMovementDto: CreateStockMovementDto): Promise<StockMovement>;
    findMovements(query: QueryStockMovementsDto): Promise<StockMovement[]>;
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
    private createMovement;
    private validatePositiveQuantity;
    private ensureCompanyExists;
    private buildStockSummary;
}

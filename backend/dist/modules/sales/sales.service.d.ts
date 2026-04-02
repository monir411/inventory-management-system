import { DataSource, Repository } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { Sale } from './entities/sale.entity';
export declare class SalesService {
    private readonly dataSource;
    private readonly salesRepository;
    constructor(dataSource: DataSource, salesRepository: Repository<Sale>);
    create(createSaleDto: CreateSaleDto): Promise<Sale>;
    findAll(query: QuerySalesDto): Promise<Sale[]>;
    findOne(id: number): Promise<Sale>;
    getTodaySalesSummary(query: SalesSummaryQueryDto): Promise<{
        date: string;
        saleCount: number;
        totalAmount: number;
        paidAmount: number;
        dueAmount: number;
    }>;
    getTodayProfitSummary(query: SalesSummaryQueryDto): Promise<{
        date: string;
        saleCount: number;
        totalProfit: number;
    }>;
    getMonthlySalesSummary(query: SalesSummaryQueryDto): Promise<{
        year: number;
        month: number;
        saleCount: number;
        totalAmount: number;
        paidAmount: number;
        dueAmount: number;
        totalProfit: number;
    }>;
    getRouteWiseSalesSummary(query: SalesSummaryQueryDto): Promise<{
        routeId: number;
        routeName: string;
        routeArea: string | null;
        saleCount: number;
        totalAmount: number;
        paidAmount: number;
        dueAmount: number;
        totalProfit: number;
    }[]>;
    getCompanyWiseSalesSummary(query: SalesSummaryQueryDto): Promise<{
        companyId: number;
        companyName: string;
        companyCode: string;
        saleCount: number;
        totalAmount: number;
        paidAmount: number;
        dueAmount: number;
        totalProfit: number;
    }[]>;
    private getCurrentStockByProduct;
    private getAggregateSummary;
    private applySalesFilters;
    private ensureInvoiceNoAvailable;
    private generateInvoiceNo;
    private formatInvoiceDate;
    private getDayRange;
    private getMonthRange;
    private roundToTwo;
    private roundToThree;
}

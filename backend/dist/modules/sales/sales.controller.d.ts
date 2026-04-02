import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(createSaleDto: CreateSaleDto): Promise<import("./entities/sale.entity").Sale>;
    findAll(query: QuerySalesDto): Promise<import("./entities/sale.entity").Sale[]>;
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
    findOne(id: number): Promise<import("./entities/sale.entity").Sale>;
}

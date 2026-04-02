import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { ReceiveSalePaymentDto } from './dto/receive-sale-payment.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  findAll(@Query() query: QuerySalesDto) {
    return this.salesService.findAll(query);
  }

  @Get('summary/today-sales')
  getTodaySalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getTodaySalesSummary(query);
  }

  @Get('summary/today-profit')
  getTodayProfitSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getTodayProfitSummary(query);
  }

  @Get('summary/monthly')
  getMonthlySalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getMonthlySalesSummary(query);
  }

  @Get('summary/route-wise')
  getRouteWiseSalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getRouteWiseSalesSummary(query);
  }

  @Get('summary/company-wise')
  getCompanyWiseSalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getCompanyWiseSalesSummary(query);
  }

  @Get('summary/route-wise-due')
  getRouteWiseDueSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getRouteWiseDueSummary(query);
  }

  @Get('summary/shop-wise-due')
  getShopWiseDueSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getShopWiseDueSummary(query);
  }

  @Get('summary/company-wise-due')
  getCompanyWiseDueSummary(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getCompanyWiseDueSummary(query);
  }

  @Get('summary/due-overview')
  getDueOverview(@Query() query: SalesSummaryQueryDto) {
    return this.salesService.getDueOverview(query);
  }

  @Get('shops/:shopId/due-details')
  getShopDueDetails(@Param('shopId', ParseIntPipe) shopId: number) {
    return this.salesService.getShopDueDetails(shopId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Post(':id/payments')
  receivePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() receiveSalePaymentDto: ReceiveSalePaymentDto,
  ) {
    return this.salesService.receivePayment(id, receiveSalePaymentDto);
  }
}

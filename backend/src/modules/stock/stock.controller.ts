import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto';
import { StockSummaryQueryDto } from './dto/stock-summary-query.dto';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('opening')
  createOpeningStock(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockService.createOpeningStock(createStockMovementDto);
  }

  @Post('in')
  createStockIn(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockService.createStockIn(createStockMovementDto);
  }

  @Post('adjustment')
  createAdjustment(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockService.createAdjustment(createStockMovementDto);
  }

  @Get('movements')
  findMovements(@Query() query: QueryStockMovementsDto) {
    return this.stockService.findMovements(query);
  }

  @Get('summary/current')
  getCurrentStockSummary(@Query() query: StockSummaryQueryDto) {
    return this.stockService.getCurrentStockSummary(query);
  }

  @Get('summary/low-stock')
  getLowStockProducts(@Query() query: StockSummaryQueryDto) {
    return this.stockService.getLowStockProducts(query);
  }

  @Get('summary/zero-stock')
  getZeroStockProducts(@Query() query: StockSummaryQueryDto) {
    return this.stockService.getZeroStockProducts(query);
  }

  @Get('summary/investment')
  getInvestmentSummary(@Query() query: StockSummaryQueryDto) {
    return this.stockService.getInvestmentSummary(query);
  }
}

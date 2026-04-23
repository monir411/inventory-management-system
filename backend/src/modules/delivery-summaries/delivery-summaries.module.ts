import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverySummariesController } from './delivery-summaries.controller';
import { DeliverySummariesService } from './delivery-summaries.service';
import { DeliverySummaryItem } from './entities/delivery-summary-item.entity';
import { DeliverySummary } from './entities/delivery-summary.entity';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliverySummary, DeliverySummaryItem]),
    ProductsModule,
    OrdersModule,
    StockModule,
  ],
  controllers: [DeliverySummariesController],
  providers: [DeliverySummariesService],
  exports: [DeliverySummariesService],
})
export class DeliverySummariesModule {}

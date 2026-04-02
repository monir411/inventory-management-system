import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Route } from '../routes/entities/route.entity';
import { Shop } from '../shops/entities/shop.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { Sale } from './entities/sale.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      SalePayment,
      Company,
      Route,
      Shop,
      Product,
      StockMovement,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}

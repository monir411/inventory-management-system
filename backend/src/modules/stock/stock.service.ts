import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementType } from './stock.constants';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product } from '../products/entities/product.entity';
import { Order, OrderItem } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/orders.constants';
import { DispatchBatch, DispatchBatchStatus } from '../delivery-ops/entities/dispatch-batch.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(DispatchBatch)
    private readonly batchRepository: Repository<DispatchBatch>,
  ) {}

  async create(dto: CreateStockMovementDto, username: string = 'Admin', manager?: any) {
    const repo = manager ? manager.getRepository(StockMovement) : this.movementRepository;
    
    // Prevent negative stock if it's an outgoing movement
    if (Number(dto.quantity) < 0) {
      const currentStock = await this.getProductStock(dto.productId, manager);
      if (currentStock + Number(dto.quantity) < 0) {
        throw new Error(`Insufficient stock for product ${dto.productId}. Current: ${currentStock}, Requested: ${Math.abs(Number(dto.quantity))}`);
      }
    }

    const movement = repo.create({
      ...dto,
      user: username,
    });
    return repo.save(movement);
  }

  async getProductStock(productId: number, manager?: any): Promise<number> {
    const repo = manager ? manager.getRepository(StockMovement) : this.movementRepository;
    const result = await repo
      .createQueryBuilder('m')
      .select('SUM(m.quantity)', 'sum')
      .where('m.productId = :productId', { productId })
      .getRawOne();
    
    return Number(result?.sum || 0);
  }

  async getHistory(query: { 
    companyId?: number; 
    productId?: number; 
    type?: StockMovementType;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const qb = this.movementRepository.createQueryBuilder('m')
      .leftJoinAndSelect('m.product', 'product')
      .leftJoinAndSelect('m.company', 'company')
      .orderBy('m.createdAt', 'DESC');

    if (query.companyId) qb.andWhere('m.companyId = :companyId', { companyId: query.companyId });
    if (query.productId) qb.andWhere('m.productId = :productId', { productId: query.productId });
    if (query.type) qb.andWhere('m.type = :type', { type: query.type });
    
    if (query.startDate && query.endDate) {
      qb.andWhere('m.createdAt BETWEEN :start AND :end', { 
        start: new Date(query.startDate), 
        end: new Date(query.endDate) 
      });
    }

    if (query.search) {
      qb.andWhere('(product.name ILIKE :s OR product.sku ILIKE :s)', { s: `%${query.search}%` });
    }

    return qb.getMany();
  }

  async getSummary(companyId?: number, search?: string) {
    const qb = this.productRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.company', 'company');
      
    if (companyId) {
      qb.andWhere('p.companyId = :companyId', { companyId });
    }
    
    if (search) {
      qb.andWhere('(p.name ILIKE :s OR p.sku ILIKE :s)', { s: `%${search}%` });
    }
    
    const products = await qb.getMany();

    const movements = await this.movementRepository.find({
      where: companyId ? { companyId } : {},
    });

    const stockMap = new Map<number, number>();
    movements.forEach(m => {
      const current = stockMap.get(m.productId) || 0;
      stockMap.set(m.productId, current + Number(m.quantity));
    });

    // Check for negative stocks and provide a "fix" flag if requested
    // (In this system, recalculating is already the way it works, 
    // so we just ensure the map is accurate)

    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Helper for safe numeric conversion
    const safeNum = (val: any) => {
      const n = Number(val);
      return isFinite(n) ? n : 0;
    };

    // Calculate Today's Settled Metrics from Dispatch Batches (Same source as Delivery Reporting)
    const todaySettledBatches = await this.batchRepository.find({
      where: {
        status: DispatchBatchStatus.SETTLED,
        settledAt: Between(today, new Date()),
        ...(companyId ? { companyId } : {})
      },
      relations: ['items']
    });

    const todaySoldQty = todaySettledBatches.reduce((total, batch) => {
      return total + batch.items.reduce((itemTotal, item) => itemTotal + safeNum(item.totalDeliveredQty), 0);
    }, 0);

    const todayReturnQty = todaySettledBatches.reduce((total, batch) => {
      return total + batch.items.reduce((itemTotal, item) => itemTotal + safeNum(item.totalReturnedQty), 0);
    }, 0);

    const todayDeliveryAmount = todaySettledBatches.reduce((total, batch) => total + safeNum(batch.finalSoldValue), 0);

    // Calculate All-Time Settled Metrics from Dispatch Batches
    const allSettledBatches = await this.batchRepository.find({
      where: {
        status: DispatchBatchStatus.SETTLED,
        ...(companyId ? { companyId } : {})
      },
      relations: ['items']
    });

    const totalSoldQtyAllTime = allSettledBatches.reduce((total, batch) => {
      return total + batch.items.reduce((itemTotal, item) => itemTotal + safeNum(item.totalDeliveredQty), 0);
    }, 0);

    const totalReturnQtyAllTime = allSettledBatches.reduce((total, batch) => {
      return total + batch.items.reduce((itemTotal, item) => itemTotal + safeNum(item.totalReturnedQty), 0);
    }, 0);

    const totalDeliveryAmountAllTime = allSettledBatches.reduce((total, batch) => total + safeNum(batch.finalSoldValue), 0);

    const summary = {
      totalProducts: products.length,
      totalStockQty: products.reduce((sum, p) => sum + (stockMap.get(p.id) || 0), 0),
      totalStockValue: products.reduce((sum, p) => sum + ((stockMap.get(p.id) || 0) * p.buyPrice), 0),
      lowStockCount: products.filter(p => (stockMap.get(p.id) || 0) > 0 && (stockMap.get(p.id) || 0) <= 10).length,
      outOfStockCount: products.filter(p => (stockMap.get(p.id) || 0) <= 0).length,
      todaySoldQty,
      todayReturnQty,
      todayDeliveryAmount,
      totalSoldQtyAllTime,
      totalReturnQtyAllTime,
      totalDeliveryAmountAllTime,
    };

    const currentStockList = products.map(p => ({
      ...p,
      currentStock: stockMap.get(p.id) || 0,
      stockValue: (stockMap.get(p.id) || 0) * p.buyPrice,
    }));

    return { summary, currentStockList };
  }
}

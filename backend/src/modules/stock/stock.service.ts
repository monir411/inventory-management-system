import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementType } from './stock.constants';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateStockMovementDto, username: string = 'Admin') {
    const movement = this.movementRepository.create({
      ...dto,
      user: username,
    });
    return this.movementRepository.save(movement);
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

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayMovements = movements.filter(m => new Date(m.createdAt) >= today);

    const summary = {
      totalProducts: products.length,
      totalStockQty: products.reduce((sum, p) => sum + (stockMap.get(p.id) || 0), 0),
      totalStockValue: products.reduce((sum, p) => sum + ((stockMap.get(p.id) || 0) * p.buyPrice), 0),
      lowStockCount: products.filter(p => (stockMap.get(p.id) || 0) > 0 && (stockMap.get(p.id) || 0) <= 10).length,
      outOfStockCount: products.filter(p => (stockMap.get(p.id) || 0) <= 0).length,
      todayStockIn: todayMovements.filter(m => products.some(p => p.id === m.productId) && Number(m.quantity) > 0).reduce((a, b) => a + Number(b.quantity), 0),
      todayStockOut: Math.abs(todayMovements.filter(m => products.some(p => p.id === m.productId) && Number(m.quantity) < 0).reduce((a, b) => a + Number(b.quantity), 0)),
    };

    const currentStockList = products.map(p => ({
      ...p,
      currentStock: stockMap.get(p.id) || 0,
      stockValue: (stockMap.get(p.id) || 0) * p.buyPrice,
    }));

    return { summary, currentStockList };
  }
}

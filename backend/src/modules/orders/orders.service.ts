import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderItem } from './entities/order.entity';
import { DiscountType, OrderStatus } from './orders.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { StockMovementType } from '../stock/stock.constants';

@Injectable()
// Triggering backend restart for new logic
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    return await this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        orderDate: new Date(dto.orderDate),
        companyId: dto.companyId,
        routeId: dto.routeId,
        shopId: dto.shopId,
        discountType: dto.discountType || DiscountType.FIXED,
        discountValue: dto.discountValue || 0,
        note: dto.note,
        status: OrderStatus.CONFIRMED,
        createdBy: 'Admin',
      });

      let subtotal = 0;
      const items: OrderItem[] = [];
      const stockMovements: StockMovement[] = [];

      for (const itemDto of dto.items) {
        const itemDiscountType = itemDto.discountType || DiscountType.FIXED;
        const itemDiscountValue = itemDto.discountValue || 0;
        
        const grossAmount = itemDto.quantity * itemDto.unitPrice;
        let itemDiscountAmount = 0;

        if (itemDiscountType === DiscountType.PERCENT) {
          itemDiscountAmount = grossAmount * (itemDiscountValue / 100);
        } else {
          itemDiscountAmount = itemDiscountValue;
        }

        const lineTotal = grossAmount - itemDiscountAmount;
        subtotal += lineTotal;

        items.push(manager.create(OrderItem, {
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          freeQuantity: itemDto.freeQuantity || 0,
          unitPrice: itemDto.unitPrice,
          discountType: itemDiscountType,
          discountValue: itemDiscountValue,
          discountAmount: itemDiscountAmount,
          lineTotal: lineTotal,
        }));

        // Stock reduction for Sale
        const totalQtyToReduce = Number(itemDto.quantity) + Number(itemDto.freeQuantity || 0);
        stockMovements.push(manager.create(StockMovement, {
          productId: itemDto.productId,
          companyId: dto.companyId,
          type: StockMovementType.SALE,
          quantity: -totalQtyToReduce,
          note: `Sale to Shop #${dto.shopId || 'N/A'}`,
          user: 'Admin',
        }));
      }

      order.subtotal = subtotal;
      
      let invoiceDiscountAmount = 0;
      if (order.discountType === DiscountType.PERCENT) {
        invoiceDiscountAmount = subtotal * (order.discountValue / 100);
      } else {
        invoiceDiscountAmount = order.discountValue;
      }

      order.discountAmount = invoiceDiscountAmount;
      order.grandTotal = subtotal - invoiceDiscountAmount;

      const savedOrder = await manager.save(order);
      
      for (const item of items) {
        item.orderId = savedOrder.id;
      }
      await manager.save(items);
      
      // Save stock movements
      for (const sm of stockMovements) {
        sm.reference = `Order #${savedOrder.id}`;
      }
      await manager.save(stockMovements);

      // Load the full order with relations inside the transaction to ensure data visibility
      return await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'company', 'route', 'shop'],
      });
    });
  }

  async findOne(id: number) {
    return this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'company', 'route', 'shop'],
    });
  }

  async findAll(query: any = {}) {
    // If no complex filters, use simple find for better reliability with relations
    if (!query.search && !query.companyId && !query.routeId && !query.shopId && !query.status && !query.startDate) {
      return this.ordersRepository.find({
        relations: ['company', 'route', 'shop', 'items', 'items.product'],
        order: { orderDate: 'DESC', createdAt: 'DESC' },
      });
    }

    const qb = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.company', 'company')
      .leftJoinAndSelect('order.route', 'route')
      .leftJoinAndSelect('order.shop', 'shop')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Filters
    if (query.companyId) {
      qb.andWhere('order.companyId = :companyId', { companyId: query.companyId });
    }
    if (query.routeId) {
      qb.andWhere('order.routeId = :routeId', { routeId: query.routeId });
    }
    if (query.shopId) {
      qb.andWhere('order.shopId = :shopId', { shopId: query.shopId });
    }
    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.startDate && query.endDate) {
      qb.andWhere('order.orderDate BETWEEN :startDate AND :endDate', { 
        startDate: query.startDate, 
        endDate: query.endDate 
      });
    }

    // Search
    if (query.search) {
      const search = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(CAST(order.id AS TEXT)) LIKE :search OR LOWER(shop.name) LIKE :search OR LOWER(order.note) LIKE :search OR LOWER(product.name) LIKE :search)',
        { search }
      );
    }

    qb.orderBy('order.orderDate', 'DESC')
      .addOrderBy('order.createdAt', 'DESC');

    return qb.getMany();
  }

  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const allOrders = await this.ordersRepository.find();
    const todayOrders = allOrders.filter(o => {
      const oDate = new Date(o.orderDate).toISOString().split('T')[0];
      return oDate === today;
    });

    const totalAmount = allOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    
    return {
      totalOrders: allOrders.length,
      todayOrders: todayOrders.length,
      totalAmount,
      pending: allOrders.filter(o => o.status === OrderStatus.DRAFT).length,
      confirmed: allOrders.filter(o => o.status === OrderStatus.CONFIRMED).length,
      delivered: allOrders.filter(o => o.status === OrderStatus.DELIVERED).length,
      cancelled: allOrders.filter(o => o.status === OrderStatus.CANCELLED).length,
    };
  }

  async updateStatus(id: number, status: OrderStatus) {
    await this.ordersRepository.update(id, { status });
    return this.findOne(id);
  }

  async update(id: number, dto: CreateOrderDto) {
    const existingOrder = await this.findOne(id);
    if (!existingOrder) {
      throw new BadRequestException('Order not found');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Reverse previous stock movements if any
      // For simplicity in this implementation, we will just delete old items and movements
      // and recreate them. A real system would be more careful.
      
      // Delete old items
      await manager.delete(OrderItem, { orderId: id });
      
      // Delete old stock movements related to this order
      await manager.delete(StockMovement, { reference: `Order #${id}` });

      // 2. Update order header
      const orderDate = new Date(dto.orderDate);
      await manager.update(Order, id, {
        orderDate: orderDate,
        companyId: dto.companyId,
        routeId: dto.routeId,
        shopId: dto.shopId,
        discountType: dto.discountType || DiscountType.FIXED,
        discountValue: dto.discountValue || 0,
        note: dto.note,
      });

      // 3. Re-calculate and Re-create items
      let subtotal = 0;
      const items: OrderItem[] = [];
      const stockMovements: StockMovement[] = [];

      for (const itemDto of dto.items) {
        const itemDiscountType = itemDto.discountType || DiscountType.FIXED;
        const itemDiscountValue = itemDto.discountValue || 0;
        
        const grossAmount = itemDto.quantity * itemDto.unitPrice;
        let itemDiscountAmount = 0;

        if (itemDiscountType === DiscountType.PERCENT) {
          itemDiscountAmount = grossAmount * (itemDiscountValue / 100);
        } else {
          itemDiscountAmount = itemDiscountValue;
        }

        const lineTotal = grossAmount - itemDiscountAmount;
        subtotal += lineTotal;

        items.push(manager.create(OrderItem, {
          orderId: id,
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          freeQuantity: itemDto.freeQuantity || 0,
          unitPrice: itemDto.unitPrice,
          discountType: itemDiscountType,
          discountValue: itemDiscountValue,
          discountAmount: itemDiscountAmount,
          lineTotal: lineTotal,
        }));

        const totalQtyToReduce = Number(itemDto.quantity) + Number(itemDto.freeQuantity || 0);
        stockMovements.push(manager.create(StockMovement, {
          productId: itemDto.productId,
          companyId: dto.companyId,
          type: StockMovementType.SALE,
          quantity: -totalQtyToReduce,
          note: `Updated Sale to Shop #${dto.shopId || 'N/A'}`,
          user: 'Admin',
          reference: `Order #${id}`
        }));
      }

      let invoiceDiscountAmount = 0;
      const discountType = dto.discountType || DiscountType.FIXED;
      const discountValue = dto.discountValue || 0;
      
      if (discountType === DiscountType.PERCENT) {
        invoiceDiscountAmount = subtotal * (discountValue / 100);
      } else {
        invoiceDiscountAmount = discountValue;
      }

      await manager.update(Order, id, {
        subtotal: subtotal,
        discountAmount: invoiceDiscountAmount,
        grandTotal: subtotal - invoiceDiscountAmount,
      });

      await manager.save(items);
      await manager.save(stockMovements);

      return await manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.product', 'company', 'route', 'shop'],
      });
    });
  }

  async delete(id: number) {
    return this.ordersRepository.delete(id);
  }
}

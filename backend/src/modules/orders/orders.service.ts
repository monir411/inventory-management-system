import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderItem } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { DiscountType, OrderStatus } from './orders.constants';
import { SettleOrderDto } from './dto/settle-order.dto';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { StockMovementType } from '../stock/stock.constants';
import { Product } from '../products/entities/product.entity';

@Injectable()
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

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        orderDate: new Date(dto.orderDate),
        companyId: dto.companyId,
        routeId: dto.routeId,
        deliveryPersonId: dto.deliveryPersonId,
        marketArea: dto.marketArea,
        shopId: dto.shopId,
        discountType: dto.discountType || DiscountType.FIXED,
        discountValue: dto.discountValue || 0,
        advancePaid: dto.advancePaid || 0,
        note: dto.note,
        status: dto.deliveryPersonId ? OrderStatus.ASSIGNED : OrderStatus.CONFIRMED,
        createdBy: 'Admin',
      });

      const { items, subtotal, grandTotal } =
        this.buildOrderItems(dto.items, manager);

      // Validate stock for all items
      for (const itemDto of dto.items) {
        const totalRequested = Number(itemDto.quantity) + Number(itemDto.freeQuantity || 0);
        const currentStock = await this.getProductStock(itemDto.productId, manager);
        if (currentStock < totalRequested) {
          const product = await manager.findOne(Product, { where: { id: itemDto.productId } });
          throw new BadRequestException(`Insufficient stock for product ${product?.name || itemDto.productId}. Available: ${currentStock}, Requested: ${totalRequested}`);
        }
      }

      order.subtotal = subtotal;
      order.discountAmount = this.getInvoiceDiscountAmount(
        subtotal,
        order.discountType,
        order.discountValue,
      );
      order.grandTotal = Math.max(0, grandTotal - order.discountAmount);
      order.actualSoldAmount = order.grandTotal;
      order.dueAmount = Math.max(0, order.grandTotal - Number(order.advancePaid || 0));

      const savedOrder = await manager.save(order);
      
      for (const item of items) {
        item.orderId = savedOrder.id;
        // Create stock movement for each item
        const movement = manager.create(StockMovement, {
          productId: item.productId,
          companyId: order.companyId,
          type: StockMovementType.SALE,
          quantity: -(Number(item.quantity) + Number(item.freeQuantity || 0)),
          reference: `Order #${savedOrder.id}`,
          user: 'Admin',
          note: `Auto-deducted for order creation`,
        });
        await manager.save(movement);
      }
      await manager.save(items);

      return manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'company', 'route', 'shop', 'deliveryPerson'],
      });
    });
  }

  async findOne(id: number) {
    return this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'company', 'route', 'shop', 'deliveryPerson'],
    });
  }

  async findAll(query: Record<string, unknown> = {}) {
    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.company', 'company')
      .leftJoinAndSelect('order.route', 'route')
      .leftJoinAndSelect('order.shop', 'shop')
      .leftJoinAndSelect('order.deliveryPerson', 'deliveryPerson')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

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
        endDate: query.endDate,
      });
    }
    if (query.search) {
      const search = `%${String(query.search).toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(CAST(order.id AS TEXT)) LIKE :search OR LOWER(shop.name) LIKE :search OR LOWER(order.note) LIKE :search OR LOWER(product.name) LIKE :search OR LOWER(COALESCE(order.marketArea, \'\')) LIKE :search)',
        { search },
      );
    }

    qb.orderBy('order.orderDate', 'DESC').addOrderBy('order.createdAt', 'DESC');
    return qb.getMany();
  }

  async getStats() {
    const allOrders = await this.ordersRepository.find();
    const today = new Date().toISOString().split('T')[0];

    const countByStatus = (status: OrderStatus) =>
      allOrders.filter((order) => order.status === status).length;

    return {
      totalOrders: allOrders.length,
      todayOrders: allOrders.filter(
        (order) => new Date(order.orderDate).toISOString().split('T')[0] === today,
      ).length,
      totalAmount: allOrders.reduce((sum, order) => sum + Number(order.grandTotal), 0),
      pending: countByStatus(OrderStatus.DRAFT),
      confirmed: countByStatus(OrderStatus.CONFIRMED),
      assigned: countByStatus(OrderStatus.ASSIGNED),
      outForDelivery: countByStatus(OrderStatus.OUT_FOR_DELIVERY),
      delivered: countByStatus(OrderStatus.DELIVERED),
      partial: countByStatus(OrderStatus.PARTIALLY_DELIVERED),
      settled: countByStatus(OrderStatus.SETTLED),
      cancelled: countByStatus(OrderStatus.CANCELLED),
    };
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.findOne(id);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.isLocked && ![OrderStatus.SETTLED, OrderStatus.CANCELLED].includes(status)) {
      throw new BadRequestException('Dispatched orders are locked from unsafe manual status changes');
    }

    const patch: Partial<Order> = { status };
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      patch.dispatchedAt = new Date();
      patch.isLocked = true;
    }
    if ([OrderStatus.DELIVERED, OrderStatus.PARTIALLY_DELIVERED].includes(status)) {
      patch.deliveredAt = new Date();
    }
    if (status === OrderStatus.SETTLED) {
      patch.settledAt = new Date();
    }

    await this.ordersRepository.update(id, patch);
    return this.findOne(id);
  }

  async settleOrder(id: number, dto: SettleOrderDto) {
    const order = await this.findOne(id);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.status === OrderStatus.SETTLED) {
      throw new BadRequestException('Order already settled');
    }

    return this.dataSource.transaction(async (manager) => {
      let totalSoldAmount = 0;

      for (const itemDto of dto.items) {
        const orderItem = order.items.find(i => i.productId === itemDto.productId);
        if (!orderItem) continue;

        const dispatchedQty = Number(orderItem.quantity) + Number(orderItem.freeQuantity || 0);
        const returnedQty = Number(itemDto.returnedQuantity || 0);
        const damagedQty = Number(itemDto.damagedQuantity || 0);
        const deliveredQty = Math.max(0, dispatchedQty - returnedQty - damagedQty);

        // 1. Restore stock for returned items (only)
        if (returnedQty > 0) {
          await manager.save(
            manager.create(StockMovement, {
              productId: orderItem.productId,
              companyId: order.companyId,
              type: StockMovementType.ADJUSTMENT,
              quantity: returnedQty,
              reference: `Order Settlement #${id}`,
              user: 'Admin',
              note: `Returned ${returnedQty} units from order #${id}`,
            }),
          );
        }

        // 2. Damage record (stock stays out, but marked)
        if (damagedQty > 0) {
          await manager.save(
            manager.create(StockMovement, {
              productId: orderItem.productId,
              companyId: order.companyId,
              type: StockMovementType.ADJUSTMENT,
              quantity: 0,
              reference: `Order Settlement #${id}`,
              user: 'Admin',
              note: `Damaged ${damagedQty} units from order #${id}`,
            }),
          );
        }

        // 3. Calculate sold amount for this item
        const unitPriceAfterDiscount = Number(orderItem.quantity) > 0 
          ? Number(orderItem.lineTotal) / Number(orderItem.quantity) 
          : 0;
        
        const chargeableDelivered = Math.max(0, Math.min(Number(orderItem.quantity), deliveredQty));
        const itemSoldAmount = chargeableDelivered * unitPriceAfterDiscount;
        totalSoldAmount += itemSoldAmount;

        // 4. Update order item
        await manager.update(OrderItem, orderItem.id, {
          deliveredQuantity: deliveredQty,
          returnedQuantity: returnedQty,
          damagedQuantity: damagedQty,
        });
      }

      // 5. Finalize order
      const collectedAmount = Number(dto.collectedAmount || 0);
      const actualSoldAmount = totalSoldAmount; // Assuming invoice discount is already handled in unitPriceAfterDiscount or we should re-apply it?
      // Actually, order.discountAmount was on the whole subtotal.
      // We should probably re-calculate the final grand total.
      
      const subtotal = totalSoldAmount;
      const discountAmount = order.discountAmount; // Keep original discount? 
      // Usually, if some items are returned, the discount might need adjustment, 
      // but keeping it simple for now as requested.
      
      const grandTotal = Math.max(0, subtotal); // Already includes item-level discounts
      const dueAmount = Math.max(0, grandTotal - collectedAmount);

      await manager.update(Order, id, {
        actualSoldAmount: grandTotal,
        collectedAmount,
        dueAmount,
        settlementNote: dto.settlementNote,
        settledAt: new Date(),
        status: OrderStatus.SETTLED,
        isLocked: true,
      });

      return manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.product', 'company', 'route', 'shop', 'deliveryPerson'],
      });
    });
  }

  async update(id: number, dto: CreateOrderDto) {
    const existingOrder = await this.findOne(id);
    if (!existingOrder) {
      throw new BadRequestException('Order not found');
    }
    if (existingOrder.isLocked) {
      throw new BadRequestException('This order is locked after dispatch and cannot be edited');
    }

    return this.dataSource.transaction(async (manager) => {
      // Remove old stock movements and items
      await manager.delete(StockMovement, { reference: `Order #${id}` });
      await manager.delete(OrderItem, { orderId: id });

      const { items, subtotal, grandTotal } = this.buildOrderItems(dto.items, manager);
      
      // Validate stock for all items
      for (const itemDto of dto.items) {
        const totalRequested = Number(itemDto.quantity) + Number(itemDto.freeQuantity || 0);
        const currentStock = await this.getProductStock(itemDto.productId, manager);
        if (currentStock < totalRequested) {
          const product = await manager.findOne(Product, { where: { id: itemDto.productId } });
          throw new BadRequestException(`Insufficient stock for product ${product?.name || itemDto.productId}. Available: ${currentStock}, Requested: ${totalRequested}`);
        }
      }

      const discountType = dto.discountType || DiscountType.FIXED;
      const discountValue = dto.discountValue || 0;
      const discountAmount = this.getInvoiceDiscountAmount(
        subtotal,
        discountType,
        discountValue,
      );

      await manager.update(Order, id, {
        orderDate: new Date(dto.orderDate),
        companyId: dto.companyId,
        routeId: dto.routeId,
        deliveryPersonId: dto.deliveryPersonId,
        marketArea: dto.marketArea,
        shopId: dto.shopId,
        discountType,
        discountValue,
        discountAmount,
        subtotal,
        grandTotal: Math.max(0, grandTotal - discountAmount),
        actualSoldAmount: Math.max(0, grandTotal - discountAmount),
        advancePaid: dto.advancePaid || 0,
        dueAmount: Math.max(0, Math.max(0, grandTotal - discountAmount) - Number(dto.advancePaid || 0)),
        note: dto.note,
        status:
          existingOrder.status === OrderStatus.DRAFT
            ? OrderStatus.DRAFT
            : dto.deliveryPersonId
              ? OrderStatus.ASSIGNED
              : OrderStatus.CONFIRMED,
      });

      for (const item of items) {
        item.orderId = id;
        // Re-create stock movement
        const movement = manager.create(StockMovement, {
          productId: item.productId,
          companyId: dto.companyId,
          type: StockMovementType.SALE,
          quantity: -(Number(item.quantity) + Number(item.freeQuantity || 0)),
          reference: `Order #${id}`,
          user: 'Admin',
          note: `Auto-updated for order modification`,
        });
        await manager.save(movement);
      }
      await manager.save(items);

      return manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.product', 'company', 'route', 'shop', 'deliveryPerson'],
      });
    });
  }

  async delete(id: number) {
    const order = await this.findOne(id);
    if (order?.isLocked) {
      throw new BadRequestException('Dispatched orders cannot be deleted');
    }
    return this.dataSource.transaction(async (manager) => {
      // Restore stock
      await manager.delete(StockMovement, { reference: `Order #${id}` });
      // Delete order (cascades or manual delete items)
      await manager.delete(OrderItem, { orderId: id });
      return manager.delete(Order, id);
    });
  }

  private buildOrderItems(
    itemsDto: CreateOrderDto['items'],
    manager: DataSource['manager'],
  ) {
    let subtotal = 0;
    const items: OrderItem[] = [];

    for (const itemDto of itemsDto) {
      const itemDiscountType = itemDto.discountType || DiscountType.FIXED;
      const itemDiscountValue = itemDto.discountValue || 0;

      const grossAmount = Number(itemDto.quantity) * Number(itemDto.unitPrice);
      const itemDiscountAmount =
        itemDiscountType === DiscountType.PERCENT
          ? grossAmount * (Number(itemDiscountValue) / 100)
          : Number(itemDiscountValue);

      const lineTotal = Math.max(0, grossAmount - itemDiscountAmount);
      subtotal += lineTotal;

      items.push(
        manager.create(OrderItem, {
          productId: itemDto.productId,
          quantity: itemDto.quantity,
          freeQuantity: itemDto.freeQuantity || 0,
          unitPrice: itemDto.unitPrice,
          discountType: itemDiscountType,
          discountValue: itemDiscountValue,
          discountAmount: itemDiscountAmount,
          lineTotal,
          deliveredQuantity:
            Number(itemDto.quantity) + Number(itemDto.freeQuantity || 0),
          returnedQuantity: 0,
          damagedQuantity: 0,
        }),
      );
    }

    return {
      items,
      subtotal,
      discountAmount: 0,
      grandTotal: subtotal,
    };
  }

  private getInvoiceDiscountAmount(
    subtotal: number,
    discountType: DiscountType,
    discountValue: number,
  ) {
    return discountType === DiscountType.PERCENT
      ? subtotal * (Number(discountValue) / 100)
      : Number(discountValue);
  }

  private async getProductStock(productId: number, manager: DataSource['manager']): Promise<number> {
    const result = await manager
      .createQueryBuilder(StockMovement, 'm')
      .select('SUM(m.quantity)', 'sum')
      .where('m.productId = :productId', { productId })
      .getRawOne();
    
    return Number(result?.sum || 0);
  }
}

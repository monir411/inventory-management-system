import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderItem } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { DiscountType, OrderStatus } from './orders.constants';

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

      const { items, subtotal, discountAmount, grandTotal } =
        this.buildOrderItems(dto.items, manager);

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

  async update(id: number, dto: CreateOrderDto) {
    const existingOrder = await this.findOne(id);
    if (!existingOrder) {
      throw new BadRequestException('Order not found');
    }
    if (existingOrder.isLocked) {
      throw new BadRequestException('This order is locked after dispatch and cannot be edited');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(OrderItem, { orderId: id });

      const { items, subtotal, grandTotal } = this.buildOrderItems(dto.items, manager);
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
    return this.ordersRepository.delete(id);
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
}

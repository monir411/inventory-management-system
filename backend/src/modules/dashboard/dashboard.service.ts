import { getBDDayRange, isTodayBD, isTodayBDDate } from '../../common/utils/date.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { Order, OrderItem } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/orders.constants';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly movementsRepository: Repository<StockMovement>,
  ) { }
  private readonly logger = new Logger(DashboardService.name);

  async getDashboardData(companyId?: number) {
    const { startUtc: todayStartUTC, endUtc: todayEndUTC } = getBDDayRange();
    
    this.logger.log(`[DEBUG DASHBOARD] BD TODAY RANGE: ${todayStartUTC.toISOString()} to ${todayEndUTC.toISOString()}`);

    const safeNum = (val: any) => {
      const n = Number(val);
      return isFinite(n) ? n : 0;
    };

    // 1. Fetch ALL orders for metrics
    const allOrders = await this.ordersRepository.find({
      where: companyId ? { companyId } : {},
      relations: ['items', 'items.product'],
    });

    this.logger.log(`[DEBUG DASHBOARD] Total Orders Fetched: ${allOrders.length} (companyId: ${companyId || 'ALL'})`);
    
    if (allOrders.length > 0) {
      const sorted = [...allOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const latest = sorted[0];
      this.logger.log(`[DEBUG DASHBOARD] Latest Order in DB: ID=${latest.id}, createdAt=${latest.createdAt.toISOString()}, orderDate=${latest.orderDate instanceof Date ? latest.orderDate.toISOString().split('T')[0] : latest.orderDate}, isTodayBDTimestamp=${isTodayBD(latest.createdAt)}, isTodayBDDate=${isTodayBDDate(latest.orderDate)}`);
      
      const matchedToday = allOrders.filter(o => isTodayBDDate(o.orderDate) && o.status !== OrderStatus.CANCELLED);
      this.logger.log(`[DEBUG DASHBOARD] Today Matched Count: ${matchedToday.length}`);
      if (matchedToday.length > 0) {
        this.logger.log(`[DEBUG DASHBOARD] Today Matched IDs: ${matchedToday.slice(0, 10).map(o => o.id).join(', ')}`);
      }
    }

    const nonCancelled = allOrders.filter(o => o.status !== OrderStatus.CANCELLED);
    const settledOrders = allOrders.filter(o => o.status === OrderStatus.SETTLED);

    const totalOrderValue = nonCancelled.reduce((sum, o) => sum + safeNum(o.grandTotal), 0);
    const netSales = settledOrders.reduce((sum, o) => sum + safeNum(o.actualSoldAmount), 0);

    // Total Profit (requires deliveredQuantity from items and buyPrice from products)
    const itemsQuery = this.orderItemsRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoin('item.order', 'order')
      .where('order.status = :status', { status: OrderStatus.SETTLED });
    if (companyId) itemsQuery.andWhere('order.companyId = :companyId', { companyId });
    const settledItems = await itemsQuery.getMany();

    const totalProfit = settledItems.reduce((sum: number, item: OrderItem) => {
      const delivered = safeNum(item.deliveredQuantity);
      const buyPrice = safeNum(item.product?.buyPrice);
      // Unit price after item discount
      const itemPrice = item.quantity > 0 ? item.lineTotal / item.quantity : item.unitPrice;
      return sum + (delivered * (itemPrice - buyPrice));
    }, 0);

    // Return Rate
    const totalOrderedQty = nonCancelled.reduce((sum: number, o: Order) => sum + (o.items?.reduce((s: number, i: OrderItem) => s + safeNum(i.quantity), 0) || 0), 0);
    const totalReturnedQty = allOrders.reduce((sum: number, o: Order) => sum + (o.items?.reduce((s: number, i: OrderItem) => s + safeNum(i.returnedQuantity), 0) || 0), 0);
    const returnRate = totalOrderedQty > 0 ? (totalReturnedQty / totalOrderedQty) * 100 : 0;

    // 2. Daily Operations (Strictly using createdAt as requested)
    const todayOrdersList = allOrders.filter(o => 
      isTodayBD(o.createdAt) && 
      o.status !== OrderStatus.CANCELLED
    );
    
    this.logger.log(`[DEBUG DASHBOARD] Today Orders Filter (Hybrid): Matched ${todayOrdersList.length} orders.`);
    const todayOrders = {
      amount: todayOrdersList.reduce((sum, o) => sum + safeNum(o.grandTotal), 0),
      count: todayOrdersList.length
    };

    const todayDispatch = allOrders.filter(o => isTodayBD(o.dispatchedAt)).length;
    const todaySettledValue = allOrders.filter(o => o.status === OrderStatus.SETTLED && isTodayBD(o.settledAt))
      .reduce((sum, o) => sum + safeNum(o.actualSoldAmount), 0);

    // Today Return (from orders settled today)
    const todaySettledOrders = allOrders.filter(o => o.status === OrderStatus.SETTLED && isTodayBD(o.settledAt));
    const todayReturn = todaySettledOrders.reduce((sum: number, o: Order) => {
      return sum + (o.items?.reduce((s: number, i: OrderItem) => s + (safeNum(i.returnedQuantity) * safeNum(i.unitPrice)), 0) || 0);
    }, 0);

    const todayCancelled = allOrders.filter(o => o.status === OrderStatus.CANCELLED && isTodayBD(o.updatedAt)).length;

    this.logger.log(`[DEBUG] Today Stats: Orders=${todayOrders.count}, Dispatch=${todayDispatch}, SettledValue=${todaySettledValue}, Cancelled=${todayCancelled}`);

    // 3. Delivery & Pending
    const pendingAmount = allOrders.filter(o => [OrderStatus.CONFIRMED, OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY].includes(o.status))
      .reduce((sum, o) => sum + safeNum(o.grandTotal), 0);

    const totalCancelledOrders = allOrders.filter(o => o.status === OrderStatus.CANCELLED).length;
    const deliveryPerformance = nonCancelled.length > 0 ? (settledOrders.length / nonCancelled.length) * 100 : 0;

    // 4. Stock Overview
    const products = await this.productsRepository.find({ where: companyId ? { companyId } : {} });
    const movements = await this.movementsRepository.find({ where: companyId ? { companyId } : {} });

    const stockMap = new Map<number, number>();
    movements.forEach(m => {
      const current = stockMap.get(m.productId) || 0;
      stockMap.set(m.productId, current + Number(m.quantity));
    });

    const stockValue = products.reduce((sum, p) => sum + ((stockMap.get(p.id) || 0) * safeNum(p.buyPrice)), 0);
    const lowStockCount = products.filter(p => (stockMap.get(p.id) || 0) > 0 && (stockMap.get(p.id) || 0) <= 10).length;
    const outOfStockCount = products.filter(p => (stockMap.get(p.id) || 0) <= 0).length;

    // Top Selling Product
    const productSales = new Map<number, { name: string; qty: number }>();
    settledItems.forEach(item => {
      const data = productSales.get(item.productId) || { name: item.product?.name || 'Unknown', qty: 0 };
      data.qty += safeNum(item.deliveredQuantity);
      productSales.set(item.productId, data);
    });

    const topSellingProductsList = Array.from(productSales.values()).sort((a, b) => b.qty - a.qty);
    const topSellingProduct = topSellingProductsList[0]?.name || 'N/A';

    // Charts
    const pipeline = Object.values(OrderStatus).map(status => ({
      status,
      count: allOrders.filter(o => o.status === status).length
    }));

    const topProducts = topSellingProductsList.slice(0, 5).map(p => ({
      name: p.name,
      quantity: p.qty
    }));

    // Last 7 Days Sales
    const last7Days = [];
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const startOfTodayBD = new Date(todayStartUTC.getTime() + BD_OFFSET_MS);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfTodayBD.getTime() - i * 24 * 60 * 60 * 1000);
      const dStart = new Date(d.getTime() - BD_OFFSET_MS);
      const dEnd = new Date(dStart.getTime() + 24 * 60 * 60 * 1000);

      const daySales = allOrders.filter(o => o.status === OrderStatus.SETTLED && o.settledAt && o.settledAt >= dStart && o.settledAt < dEnd)
        .reduce((sum, o) => sum + safeNum(o.actualSoldAmount), 0);

      last7Days.push({
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Dhaka' }),
        amount: daySales
      });
    }

    // Recent Orders (Newest 10)
    const recentOrders = await this.ordersRepository.find({
      where: companyId ? { companyId } : {},
      relations: ['shop'],
      order: { createdAt: 'DESC' },
      take: 10
    });

    this.logger.log(`[DEBUG DASHBOARD] Recent Orders Count: ${recentOrders.length}`);
    if (recentOrders.length > 0) {
      this.logger.log(`[DEBUG DASHBOARD] Recent Orders (Top 3): ${recentOrders.slice(0, 3).map(o => `ID=${o.id}(${o.createdAt.toISOString()})`).join(' | ')}`);
    }
    
    const todayMatchedOrders = allOrders.filter(o => isTodayBD(o.createdAt) && o.status !== OrderStatus.CANCELLED);
    
    return {
      debug: {
        serverNow: new Date().toISOString(),
        bdTodayDate: getBDTodayString(),
        bdStartUtc: todayStartUTC.toISOString(),
        bdEndUtc: todayEndUTC.toISOString(),
        latestOrders: allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5).map(o => ({
          id: o.id,
          createdAt: o.createdAt.toISOString(),
          orderDate: o.orderDate,
          grandTotal: o.grandTotal,
          status: o.status
        })),
        todayMatchedOrders: todayMatchedOrders.map(o => ({
          id: o.id,
          createdAt: o.createdAt.toISOString(),
          status: o.status
        })),
        todayOrdersCount: todayOrders.count,
        todayOrdersValue: todayOrders.amount
      },
      salesOverview: { totalOrderValue, netSales, totalProfit, returnRate },
      dailyOperations: { todayOrders, todayDispatch, todaySettled: todaySettledValue, todayReturn, todayCancelled },
      deliveryAndPending: { pendingAmount, totalDeliveredSettled: netSales, totalCancelledOrders, deliveryPerformance },
      stockOverview: { stockValue, lowStockCount, outOfStockCount, topSellingProduct },
      charts: { pipeline, topProducts, last7Days },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        shopName: o.shop?.name || 'Direct / Walk-in',
        grandTotal: o.grandTotal,
        actualSoldAmount: o.actualSoldAmount,
        status: o.status,
        orderDate: o.orderDate,
        createdAt: o.createdAt
      }))
    };
  }
}

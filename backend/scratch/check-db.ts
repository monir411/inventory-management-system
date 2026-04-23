import { DataSource } from 'typeorm';
import { Order, OrderItem } from '../src/modules/orders/entities/order.entity';
import { Company } from '../src/modules/companies/entities/company.entity';
import { Route } from '../src/modules/routes/entities/route.entity';
import { Shop } from '../src/modules/shops/entities/shop.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function check() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'inventory_db',
    entities: [Order, OrderItem, Company, Route, Shop, Product],
    synchronize: false,
  });

  try {
    await ds.initialize();
    console.log('DB Connected');

    const orders = await ds.getRepository(Order).find({
      relations: ['items'],
      take: 5,
      order: { id: 'DESC' }
    });

    console.log('Orders found:', orders.length);
    orders.forEach(o => {
      console.log(`Order #${o.id}: Items Count = ${o.items?.length || 0}, Total = ${o.grandTotal}`);
    });

    const itemSample = await ds.getRepository(OrderItem).findOne({ where: {} });
    console.log('Item Sample:', itemSample);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await ds.destroy();
  }
}

check();

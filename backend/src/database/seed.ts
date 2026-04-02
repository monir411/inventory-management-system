import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Company } from '../modules/companies/entities/company.entity';
import { CompaniesService } from '../modules/companies/companies.service';
import { Product } from '../modules/products/entities/product.entity';
import { ProductUnit } from '../modules/products/entities/product-unit.enum';
import { ProductsService } from '../modules/products/products.service';
import { Route } from '../modules/routes/entities/route.entity';
import { RoutesService } from '../modules/routes/routes.service';
import { SalePayment } from '../modules/sales/entities/sale-payment.entity';
import { Sale } from '../modules/sales/entities/sale.entity';
import { SalesService } from '../modules/sales/sales.service';
import { Shop } from '../modules/shops/entities/shop.entity';
import { ShopsService } from '../modules/shops/shops.service';
import { StockMovement } from '../modules/stock/entities/stock-movement.entity';
import { StockMovementType } from '../modules/stock/enums/stock-movement-type.enum';
import { StockService } from '../modules/stock/stock.service';

type ProductSeed = {
  key: string;
  companyKey: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  buyPrice: number;
  salePrice: number;
};

type SaleItemSeed = {
  productKey: string;
  quantity: number;
  unitPrice?: number;
};

type SaleSeed = {
  key: string;
  companyKey: string;
  routeKey: string;
  shopKey?: string;
  daysAgo: number;
  hour: number;
  minute: number;
  invoiceNo: string;
  paidAmount: number;
  note: string;
  items: SaleItemSeed[];
};

const seedProducts: ProductSeed[] = [
  {
    key: 'biskit',
    companyKey: 'keya',
    name: 'biskit',
    sku: '2013',
    unit: ProductUnit.PACK,
    buyPrice: 18,
    salePrice: 25,
  },
  {
    key: 'jhalmuri',
    companyKey: 'keya',
    name: 'jhalmuri',
    sku: 'KYC-204',
    unit: ProductUnit.PACK,
    buyPrice: 12,
    salePrice: 18,
  },
  {
    key: 'pani',
    companyKey: 'keya',
    name: 'pani',
    sku: 'KYC-205',
    unit: ProductUnit.LITER,
    buyPrice: 14,
    salePrice: 20,
  },
  {
    key: 'atta',
    companyKey: 'keya',
    name: 'atta',
    sku: 'KYC-206',
    unit: ProductUnit.KG,
    buyPrice: 48,
    salePrice: 58,
  },
  {
    key: 'cal',
    companyKey: 'pran',
    name: 'cal',
    sku: '2012',
    unit: ProductUnit.KG,
    buyPrice: 62,
    salePrice: 78,
  },
  {
    key: 'mango-juice',
    companyKey: 'pran',
    name: 'mango juice',
    sku: 'PRN-310',
    unit: ProductUnit.LITER,
    buyPrice: 32,
    salePrice: 45,
  },
  {
    key: 'chanachur',
    companyKey: 'pran',
    name: 'chanachur',
    sku: 'PRN-311',
    unit: ProductUnit.PACK,
    buyPrice: 10,
    salePrice: 15,
  },
  {
    key: 'semai',
    companyKey: 'pran',
    name: 'semai',
    sku: 'PRN-312',
    unit: ProductUnit.PACK,
    buyPrice: 22,
    salePrice: 30,
  },
  {
    key: 'tea-pack',
    companyKey: 'abul',
    name: 'tea pack',
    sku: 'AK-401',
    unit: ProductUnit.PACK,
    buyPrice: 16,
    salePrice: 24,
  },
  {
    key: 'sugar',
    companyKey: 'abul',
    name: 'sugar',
    sku: 'AK-402',
    unit: ProductUnit.KG,
    buyPrice: 68,
    salePrice: 82,
  },
  {
    key: 'noodles',
    companyKey: 'abul',
    name: 'noodles',
    sku: 'AK-403',
    unit: ProductUnit.PACK,
    buyPrice: 14,
    salePrice: 22,
  },
  {
    key: 'soap-bar',
    companyKey: 'abul',
    name: 'soap bar',
    sku: 'AK-404',
    unit: ProductUnit.PCS,
    buyPrice: 26,
    salePrice: 36,
  },
];

const saleSeeds: SaleSeed[] = [
  {
    key: 'sale-001',
    companyKey: 'keya',
    routeKey: 'chowdharani',
    shopKey: 'rahman-store',
    daysAgo: 9,
    hour: 10,
    minute: 15,
    invoiceNo: 'DEMO-001',
    paidAmount: 394,
    note: 'Morning route sale from seeded demo data.',
    items: [
      { productKey: 'biskit', quantity: 10 },
      { productKey: 'jhalmuri', quantity: 8 },
    ],
  },
  {
    key: 'sale-002',
    companyKey: 'keya',
    routeKey: 'mirpur-retail',
    shopKey: 'maa-general-store',
    daysAgo: 7,
    hour: 12,
    minute: 20,
    invoiceNo: 'DEMO-002',
    paidAmount: 400,
    note: 'Due sale with pani and atta for shop balance testing.',
    items: [
      { productKey: 'pani', quantity: 25 },
      { productKey: 'atta', quantity: 4 },
    ],
  },
  {
    key: 'sale-003',
    companyKey: 'keya',
    routeKey: 'chowdharani',
    shopKey: 'noor-traders',
    daysAgo: 5,
    hour: 15,
    minute: 10,
    invoiceNo: 'DEMO-003',
    paidAmount: 900,
    note: 'Fully paid sale for movement history and stock summary.',
    items: [
      { productKey: 'biskit', quantity: 12 },
      { productKey: 'pani', quantity: 30 },
    ],
  },
  {
    key: 'sale-004',
    companyKey: 'keya',
    routeKey: 'uttara-line',
    shopKey: 'sumi-variety-store',
    daysAgo: 3,
    hour: 11,
    minute: 45,
    invoiceNo: 'DEMO-004',
    paidAmount: 200,
    note: 'Partial payment sale to leave a small open due.',
    items: [
      { productKey: 'jhalmuri', quantity: 10 },
      { productKey: 'atta', quantity: 3 },
    ],
  },
  {
    key: 'sale-005',
    companyKey: 'keya',
    routeKey: 'mirpur-retail',
    daysAgo: 0,
    hour: 9,
    minute: 30,
    invoiceNo: 'DEMO-005',
    paidAmount: 150,
    note: 'Quick cash sale without a shop.',
    items: [{ productKey: 'biskit', quantity: 6 }],
  },
  {
    key: 'sale-006',
    companyKey: 'pran',
    routeKey: 'agrabad-market',
    shopKey: 'bismillah-traders',
    daysAgo: 11,
    hour: 13,
    minute: 5,
    invoiceNo: 'DEMO-006',
    paidAmount: 300,
    note: 'Seeded due sale for cal search and payment history.',
    items: [
      { productKey: 'cal', quantity: 2 },
      { productKey: 'mango-juice', quantity: 10 },
    ],
  },
  {
    key: 'sale-007',
    companyKey: 'pran',
    routeKey: 'chowdharani',
    shopKey: 'rahman-store',
    daysAgo: 8,
    hour: 16,
    minute: 35,
    invoiceNo: 'DEMO-007',
    paidAmount: 438,
    note: 'Fully paid seeded sale with cal and semai.',
    items: [
      { productKey: 'cal', quantity: 1 },
      { productKey: 'semai', quantity: 12 },
    ],
  },
  {
    key: 'sale-008',
    companyKey: 'pran',
    routeKey: 'uttara-line',
    shopKey: 'new-market-mart',
    daysAgo: 4,
    hour: 14,
    minute: 25,
    invoiceNo: 'DEMO-008',
    paidAmount: 1035,
    note: 'Large fully paid seeded sale.',
    items: [
      { productKey: 'mango-juice', quantity: 18 },
      { productKey: 'chanachur', quantity: 15 },
    ],
  },
  {
    key: 'sale-009',
    companyKey: 'pran',
    routeKey: 'agrabad-market',
    shopKey: 'city-plaza-store',
    daysAgo: 0,
    hour: 12,
    minute: 40,
    invoiceNo: 'DEMO-009',
    paidAmount: 500,
    note: 'Same-day partial payment sale.',
    items: [
      { productKey: 'chanachur', quantity: 25 },
      { productKey: 'semai', quantity: 10 },
    ],
  },
  {
    key: 'sale-010',
    companyKey: 'abul',
    routeKey: 'mirpur-retail',
    shopKey: 'alif-enterprise',
    daysAgo: 13,
    hour: 10,
    minute: 50,
    invoiceNo: 'DEMO-010',
    paidAmount: 700,
    note: 'Due sale for shop due summary testing.',
    items: [
      { productKey: 'sugar', quantity: 15 },
      { productKey: 'noodles', quantity: 2 },
    ],
  },
  {
    key: 'sale-011',
    companyKey: 'abul',
    routeKey: 'agrabad-market',
    shopKey: 'city-plaza-store',
    daysAgo: 10,
    hour: 15,
    minute: 0,
    invoiceNo: 'DEMO-011',
    paidAmount: 1108,
    note: 'Fully paid sale with soap and sugar.',
    items: [
      { productKey: 'soap-bar', quantity: 8 },
      { productKey: 'sugar', quantity: 10 },
    ],
  },
  {
    key: 'sale-012',
    companyKey: 'abul',
    routeKey: 'uttara-line',
    shopKey: 'sumi-variety-store',
    daysAgo: 6,
    hour: 11,
    minute: 5,
    invoiceNo: 'DEMO-012',
    paidAmount: 100,
    note: 'Tea pack due sale that settles down to a small balance.',
    items: [{ productKey: 'tea-pack', quantity: 12 }],
  },
  {
    key: 'sale-013',
    companyKey: 'abul',
    routeKey: 'chowdharani',
    shopKey: 'noor-traders',
    daysAgo: 2,
    hour: 17,
    minute: 20,
    invoiceNo: 'DEMO-013',
    paidAmount: 426,
    note: 'Fully paid sale for noodles and soap bar.',
    items: [
      { productKey: 'noodles', quantity: 3 },
      { productKey: 'soap-bar', quantity: 10 },
    ],
  },
  {
    key: 'sale-014',
    companyKey: 'abul',
    routeKey: 'mirpur-retail',
    daysAgo: 0,
    hour: 9,
    minute: 50,
    invoiceNo: 'DEMO-014',
    paidAmount: 872,
    note: 'Cash sale without a shop to keep the list varied.',
    items: [
      { productKey: 'sugar', quantity: 8 },
      { productKey: 'soap-bar', quantity: 6 },
    ],
  },
];

let stockMovementsRepositoryRef: Repository<StockMovement> | null = null;

async function bootstrap() {
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.DB_DROP_SCHEMA = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const dataSource = app.get(DataSource);
    const companiesRepository = dataSource.getRepository(Company);
    const productsRepository = dataSource.getRepository(Product);
    const routesRepository = dataSource.getRepository(Route);
    const shopsRepository = dataSource.getRepository(Shop);
    const stockMovementsRepository = dataSource.getRepository(StockMovement);
    const salesRepository = dataSource.getRepository(Sale);
    const paymentsRepository = dataSource.getRepository(SalePayment);
    stockMovementsRepositoryRef = stockMovementsRepository;
    const existingCounts = await Promise.all([
      companiesRepository.count(),
      productsRepository.count(),
      routesRepository.count(),
      shopsRepository.count(),
      salesRepository.count(),
      stockMovementsRepository.count(),
    ]);

    const companiesService = app.get(CompaniesService);
    const productsService = app.get(ProductsService);
    const routesService = app.get(RoutesService);
    const shopsService = app.get(ShopsService);
    const stockService = app.get(StockService);
    const salesService = app.get(SalesService);

    Logger.log(
      'Seeding demo companies, products, routes, shops, stock movements, sales, and due payments...',
      'DatabaseSeed',
    );

    if (existingCounts.some((count) => count > 0)) {
      Logger.warn(
        'Existing records were found. The seed will add missing demo data and keep current records untouched.',
        'DatabaseSeed',
      );
    }

    const companies = new Map<string, Company>();
    const products = new Map<string, Product>();
    const routes = new Map<string, Route>();
    const shops = new Map<string, Shop>();

    companies.set(
      'keya',
      await findOrCreateCompany(companiesRepository, companiesService, {
        codes: ['KEYA02'],
        aliases: ['keya cosmetic', 'keya cosmetics'],
        create: {
          name: 'keya cosmetic',
          code: 'KEYA02',
          address: 'House 12, Section 10, Mirpur, Dhaka',
          phone: '01711000101',
        },
      }),
    );
    companies.set(
      'pran',
      await findOrCreateCompany(companiesRepository, companiesService, {
        codes: ['PRAN01'],
        aliases: ['pran rfl ltd'],
        create: {
          name: 'Pran RFL ltd',
          code: 'PRAN01',
          address: 'Plot 22, Agrabad C/A, Chattogram',
          phone: '01711000102',
        },
      }),
    );
    companies.set(
      'abul',
      await findOrCreateCompany(companiesRepository, companiesService, {
        codes: ['AK04'],
        aliases: ['abul khayer'],
        create: {
          name: 'abul khayer',
          code: 'AK04',
          address: 'Road 6, Nasirabad, Chattogram',
          phone: '01711000103',
        },
      }),
    );

    routes.set(
      'chowdharani',
      await findOrCreateRoute(routesRepository, routesService, {
        aliases: ['chowdharani', 'chowdhorani'],
        create: {
          name: 'chowdharani',
          area: 'Chowdharani bazar line',
        },
      }),
    );
    routes.set(
      'mirpur-retail',
      await findOrCreateRoute(routesRepository, routesService, {
        aliases: ['mirpur retail'],
        create: {
          name: 'Mirpur Retail',
          area: 'Mirpur retail corridor',
        },
      }),
    );
    routes.set(
      'agrabad-market',
      await findOrCreateRoute(routesRepository, routesService, {
        aliases: ['agrabad market'],
        create: {
          name: 'Agrabad Market',
          area: 'Agrabad wholesale and retail',
        },
      }),
    );
    routes.set(
      'uttara-line',
      await findOrCreateRoute(routesRepository, routesService, {
        aliases: ['uttara line'],
        create: {
          name: 'Uttara Line',
          area: 'Uttara sector delivery route',
        },
      }),
    );

    shops.set(
      'rahman-store',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'chowdharani', 'route').id,
        aliases: ['rahman store'],
        create: {
          name: 'Rahman Store',
          ownerName: 'Md. Rahman',
          phone: '01810000001',
          address: 'Chowdharani bazar main road',
        },
      }),
    );
    shops.set(
      'noor-traders',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'chowdharani', 'route').id,
        aliases: ['noor traders'],
        create: {
          name: 'Noor Traders',
          ownerName: 'Nur Alam',
          phone: '01810000002',
          address: 'Chowdharani bazar east lane',
        },
      }),
    );
    shops.set(
      'maa-general-store',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'mirpur-retail', 'route').id,
        aliases: ['maa general store'],
        create: {
          name: 'Maa General Store',
          ownerName: 'Shila Akter',
          phone: '01810000003',
          address: 'Mirpur 10 retail lane',
        },
      }),
    );
    shops.set(
      'alif-enterprise',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'mirpur-retail', 'route').id,
        aliases: ['alif enterprise'],
        create: {
          name: 'Alif Enterprise',
          ownerName: 'Abu Taleb',
          phone: '01810000004',
          address: 'Mirpur 11 market block B',
        },
      }),
    );
    shops.set(
      'bismillah-traders',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'agrabad-market', 'route').id,
        aliases: ['bismillah traders'],
        create: {
          name: 'Bismillah Traders',
          ownerName: 'Hasan Ahmed',
          phone: '01810000005',
          address: 'Agrabad market north row',
        },
      }),
    );
    shops.set(
      'city-plaza-store',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'agrabad-market', 'route').id,
        aliases: ['city plaza store'],
        create: {
          name: 'City Plaza Store',
          ownerName: 'Jannat Hossain',
          phone: '01810000006',
          address: 'City Plaza, Agrabad',
        },
      }),
    );
    shops.set(
      'sumi-variety-store',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'uttara-line', 'route').id,
        aliases: ['sumi variety store'],
        create: {
          name: 'Sumi Variety Store',
          ownerName: 'Sumi Begum',
          phone: '01810000007',
          address: 'Uttara sector 7 market',
        },
      }),
    );
    shops.set(
      'new-market-mart',
      await findOrCreateShop(shopsRepository, shopsService, {
        routeId: getMapValue(routes, 'uttara-line', 'route').id,
        aliases: ['new market mart'],
        create: {
          name: 'New Market Mart',
          ownerName: 'Rafiq Islam',
          phone: '01810000008',
          address: 'Uttara sector 11 main road',
        },
      }),
    );

    for (const seedProduct of seedProducts) {
      const company = getMapValue(companies, seedProduct.companyKey, 'company');
      const product = await findOrCreateProduct(
        productsRepository,
        productsService,
        {
          companyId: company.id,
          aliases: [seedProduct.name],
          create: {
            companyId: company.id,
            name: seedProduct.name,
            sku: seedProduct.sku,
            unit: seedProduct.unit,
            buyPrice: seedProduct.buyPrice,
            salePrice: seedProduct.salePrice,
          },
        },
      );
      products.set(seedProduct.key, product);
    }

    await createOpeningStock(stockService, companies, products, {
      productKey: 'biskit',
      quantity: 120,
      daysAgo: 20,
      hour: 9,
      minute: 0,
      note: 'Opening stock loaded for demo inventory.',
    });
    await createStockIn(stockService, companies, products, {
      productKey: 'biskit',
      quantity: 30,
      daysAgo: 12,
      hour: 10,
      minute: 10,
      note: 'Weekly restock for biskit.',
    });
    await createAdjustment(stockService, companies, products, {
      productKey: 'biskit',
      quantity: -5,
      daysAgo: 10,
      hour: 18,
      minute: 15,
      note: 'Minor damaged pack adjustment.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'jhalmuri',
      quantity: 90,
      daysAgo: 20,
      hour: 9,
      minute: 15,
      note: 'Opening stock for jhalmuri.',
    });
    await createAdjustment(stockService, companies, products, {
      productKey: 'jhalmuri',
      quantity: 5,
      daysAgo: 8,
      hour: 17,
      minute: 30,
      note: 'Corrected extra received jhalmuri packets.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'pani',
      quantity: 420,
      daysAgo: 22,
      hour: 8,
      minute: 50,
      note: 'Opening stock for pani.',
    });
    await createStockIn(stockService, companies, products, {
      productKey: 'pani',
      quantity: 80,
      daysAgo: 10,
      hour: 11,
      minute: 25,
      note: 'Fresh delivery of pani.',
    });
    await createAdjustment(stockService, companies, products, {
      productKey: 'pani',
      quantity: -15,
      daysAgo: 5,
      hour: 18,
      minute: 10,
      note: 'Leakage adjustment for pani.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'atta',
      quantity: 18,
      daysAgo: 18,
      hour: 9,
      minute: 5,
      note: 'Opening stock for atta.',
    });
    await createAdjustment(stockService, companies, products, {
      productKey: 'atta',
      quantity: -2,
      daysAgo: 7,
      hour: 19,
      minute: 0,
      note: 'Manual correction after bag count.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'cal',
      quantity: 6,
      daysAgo: 15,
      hour: 10,
      minute: 0,
      note: 'Opening stock for cal.',
    });
    await createStockIn(stockService, companies, products, {
      productKey: 'cal',
      quantity: 2,
      daysAgo: 6,
      hour: 12,
      minute: 40,
      note: 'Top-up stock for cal.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'mango-juice',
      quantity: 70,
      daysAgo: 21,
      hour: 9,
      minute: 20,
      note: 'Opening stock for mango juice.',
    });
    await createStockIn(stockService, companies, products, {
      productKey: 'mango-juice',
      quantity: 20,
      daysAgo: 9,
      hour: 13,
      minute: 15,
      note: 'Additional mango juice stock-in.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'chanachur',
      quantity: 40,
      daysAgo: 20,
      hour: 10,
      minute: 30,
      note: 'Opening stock for chanachur.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'semai',
      quantity: 60,
      daysAgo: 14,
      hour: 8,
      minute: 40,
      note: 'Opening stock for semai.',
    });
    await createStockIn(stockService, companies, products, {
      productKey: 'semai',
      quantity: 10,
      daysAgo: 4,
      hour: 11,
      minute: 55,
      note: 'Festival season stock-in for semai.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'tea-pack',
      quantity: 12,
      daysAgo: 16,
      hour: 9,
      minute: 35,
      note: 'Opening stock for tea pack.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'sugar',
      quantity: 120,
      daysAgo: 17,
      hour: 8,
      minute: 55,
      note: 'Opening stock for sugar.',
    });
    await createStockIn(stockService, companies, products, {
      productKey: 'sugar',
      quantity: 25,
      daysAgo: 6,
      hour: 10,
      minute: 45,
      note: 'Additional sugar stock-in.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'noodles',
      quantity: 11,
      daysAgo: 15,
      hour: 9,
      minute: 50,
      note: 'Opening stock for noodles.',
    });
    await createAdjustment(stockService, companies, products, {
      productKey: 'noodles',
      quantity: -1,
      daysAgo: 5,
      hour: 18,
      minute: 20,
      note: 'Broken pack adjustment.',
    });

    await createOpeningStock(stockService, companies, products, {
      productKey: 'soap-bar',
      quantity: 55,
      daysAgo: 16,
      hour: 10,
      minute: 5,
      note: 'Opening stock for soap bar.',
    });

    const createdSales = new Map<string, Sale>();

    for (const saleSeed of saleSeeds) {
      const company = getMapValue(companies, saleSeed.companyKey, 'company');
      const route = getMapValue(routes, saleSeed.routeKey, 'route');
      const shop = saleSeed.shopKey
        ? getMapValue(shops, saleSeed.shopKey, 'shop')
        : null;

      const sale = await findOrCreateSale(salesRepository, salesService, {
        invoiceNo: saleSeed.invoiceNo,
        create: {
          companyId: company.id,
          routeId: route.id,
          shopId: shop?.id,
          saleDate: buildDate({
            daysAgo: saleSeed.daysAgo,
            hour: saleSeed.hour,
            minute: saleSeed.minute,
          }),
          invoiceNo: saleSeed.invoiceNo,
          paidAmount: saleSeed.paidAmount,
          note: saleSeed.note,
          items: saleSeed.items.map((item) => {
            const product = getMapValue(products, item.productKey, 'product');

            return {
              productId: product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice ?? product.salePrice,
            };
          }),
        },
      });

      createdSales.set(saleSeed.key, sale);
    }

    await findOrCreatePayment(paymentsRepository, salesService, {
      saleId: getSeedSale(createdSales, 'sale-002').id,
      amount: 200,
      paymentDate: buildDate({ daysAgo: 6, hour: 16, minute: 10 }),
      note: 'Collected part of the outstanding amount.',
    });
    await findOrCreatePayment(paymentsRepository, salesService, {
      saleId: getSeedSale(createdSales, 'sale-004').id,
      amount: 100,
      paymentDate: buildDate({ daysAgo: 2, hour: 12, minute: 15 }),
      note: 'Second payment collected from the shop.',
    });
    await findOrCreatePayment(paymentsRepository, salesService, {
      saleId: getSeedSale(createdSales, 'sale-006').id,
      amount: 150,
      paymentDate: buildDate({ daysAgo: 7, hour: 11, minute: 20 }),
      note: 'Follow-up payment for the cal order.',
    });
    await findOrCreatePayment(paymentsRepository, salesService, {
      saleId: getSeedSale(createdSales, 'sale-009').id,
      amount: 75,
      paymentDate: buildDate({ daysAgo: 0, hour: 17, minute: 0 }),
      note: 'Same-day follow-up collection.',
    });
    await findOrCreatePayment(paymentsRepository, salesService, {
      saleId: getSeedSale(createdSales, 'sale-010').id,
      amount: 200,
      paymentDate: buildDate({ daysAgo: 4, hour: 13, minute: 45 }),
      note: 'Collected additional due from Alif Enterprise.',
    });
    await findOrCreatePayment(paymentsRepository, salesService, {
      saleId: getSeedSale(createdSales, 'sale-012').id,
      amount: 88,
      paymentDate: buildDate({ daysAgo: 3, hour: 10, minute: 30 }),
      note: 'Tea pack due collection.',
    });

    const [
      companyCount,
      productCount,
      routeCount,
      shopCount,
      stockMovementCount,
      saleCount,
      paymentCount,
    ] = await Promise.all([
      dataSource.getRepository(Company).count(),
      dataSource.getRepository(Product).count(),
      dataSource.getRepository(Route).count(),
      dataSource.getRepository(Shop).count(),
      dataSource.getRepository(StockMovement).count(),
      dataSource.getRepository(Sale).count(),
      dataSource.getRepository(SalePayment).count(),
    ]);

    Logger.log(
      `Demo seed completed. Companies: ${companyCount}, products: ${productCount}, routes: ${routeCount}, shops: ${shopCount}, stock movements: ${stockMovementCount}, sales: ${saleCount}, payments: ${paymentCount}.`,
      'DatabaseSeed',
    );
    Logger.log(
      'Open the frontend and check /stock, /sales, /sales/create, and the due pages to explore the seeded workflows.',
      'DatabaseSeed',
    );
  } finally {
    await app.close();
  }
}

function getMapValue<T>(map: Map<string, T>, key: string, label: string) {
  const value = map.get(key);

  if (!value) {
    throw new Error(`Seed ${label} "${key}" was not created.`);
  }

  return value;
}

function getSeedSale(map: Map<string, Sale>, key: string) {
  return getMapValue(map, key, 'sale');
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildDate({
  daysAgo,
  hour,
  minute,
}: {
  daysAgo: number;
  hour: number;
  minute: number;
}) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function findOrCreateCompany(
  companiesRepository: Repository<Company>,
  companiesService: CompaniesService,
  config: {
    codes: string[];
    aliases: string[];
    create: {
      name: string;
      code: string;
      address: string;
      phone: string;
    };
  },
) {
  const companies = await companiesRepository.find();
  const aliasSet = new Set(config.aliases.map((alias) => normalizeText(alias)));
  const existing = companies.find(
    (company) =>
      config.codes.includes(company.code) ||
      aliasSet.has(normalizeText(company.name)),
  );

  if (existing) {
    return existing;
  }

  return companiesService.create(config.create);
}

async function findOrCreateRoute(
  routesRepository: Repository<Route>,
  routesService: RoutesService,
  config: {
    aliases: string[];
    create: {
      name: string;
      area?: string;
    };
  },
) {
  const routes = await routesRepository.find();
  const aliasSet = new Set(config.aliases.map((alias) => normalizeText(alias)));
  const existing = routes.find((route) =>
    aliasSet.has(normalizeText(route.name)),
  );

  if (existing) {
    return existing;
  }

  return routesService.create(config.create);
}

async function findOrCreateShop(
  shopsRepository: Repository<Shop>,
  shopsService: ShopsService,
  config: {
    routeId: number;
    aliases: string[];
    create: {
      name: string;
      ownerName: string;
      phone: string;
      address: string;
    };
  },
) {
  const shops = await shopsRepository.find({
    where: { routeId: config.routeId },
  });
  const aliasSet = new Set(config.aliases.map((alias) => normalizeText(alias)));
  const existing = shops.find((shop) => aliasSet.has(normalizeText(shop.name)));

  if (existing) {
    return existing;
  }

  return shopsService.create({
    routeId: config.routeId,
    ...config.create,
  });
}

async function findOrCreateProduct(
  productsRepository: Repository<Product>,
  productsService: ProductsService,
  config: {
    companyId: number;
    aliases: string[];
    create: {
      companyId: number;
      name: string;
      sku: string;
      unit: ProductUnit;
      buyPrice: number;
      salePrice: number;
    };
  },
) {
  const products = await productsRepository.find({
    where: { companyId: config.companyId },
  });
  const aliasSet = new Set(config.aliases.map((alias) => normalizeText(alias)));
  const existing = products.find(
    (product) =>
      product.sku === config.create.sku ||
      aliasSet.has(normalizeText(product.name)),
  );

  if (existing) {
    return existing;
  }

  return productsService.create(config.create);
}

async function findOrCreateSale(
  salesRepository: Repository<Sale>,
  salesService: SalesService,
  config: {
    invoiceNo: string;
    create: {
      companyId: number;
      routeId: number;
      shopId?: number;
      saleDate: Date;
      invoiceNo: string;
      paidAmount: number;
      note: string;
      items: {
        productId: number;
        quantity: number;
        unitPrice: number;
      }[];
    };
  },
) {
  const existing = await salesRepository.findOne({
    where: { invoiceNo: config.invoiceNo },
  });

  if (existing) {
    return salesService.findOne(existing.id);
  }

  return salesService.create(config.create);
}

async function findOrCreatePayment(
  paymentsRepository: Repository<SalePayment>,
  salesService: SalesService,
  config: {
    saleId: number;
    amount: number;
    paymentDate: Date;
    note: string;
  },
) {
  const existingPayments = await paymentsRepository.find({
    where: { saleId: config.saleId },
  });
  const existing = existingPayments.find(
    (payment) =>
      payment.amount === config.amount &&
      payment.note === config.note &&
      payment.paymentDate.getTime() === config.paymentDate.getTime(),
  );

  if (existing) {
    return existing;
  }

  const sale = await salesService.receivePayment(config.saleId, {
    amount: config.amount,
    paymentDate: config.paymentDate,
    note: config.note,
  });

  return sale.payments.find(
    (payment) =>
      payment.amount === config.amount &&
      payment.note === config.note &&
      new Date(payment.paymentDate).getTime() === config.paymentDate.getTime(),
  );
}

function getStockMovementsRepository() {
  if (!stockMovementsRepositoryRef) {
    throw new Error('Stock movement repository is not available.');
  }

  return stockMovementsRepositoryRef;
}

async function createOpeningStock(
  stockService: StockService,
  companies: Map<string, Company>,
  products: Map<string, Product>,
  config: {
    productKey: string;
    quantity: number;
    daysAgo: number;
    hour: number;
    minute: number;
    note: string;
  },
) {
  const product = getMapValue(products, config.productKey, 'product');
  const company = findCompanyForProduct(companies, product);
  const movementDate = buildDate(config);
  const existingMovement = await getStockMovementsRepository().findOne({
    where: {
      companyId: company.id,
      productId: product.id,
      type: StockMovementType.OPENING,
      quantity: config.quantity,
      note: config.note,
      movementDate,
    },
  });

  if (existingMovement) {
    return existingMovement;
  }

  await stockService.createOpeningStock({
    companyId: company.id,
    productId: product.id,
    quantity: config.quantity,
    note: config.note,
    movementDate,
  });
}

async function createStockIn(
  stockService: StockService,
  companies: Map<string, Company>,
  products: Map<string, Product>,
  config: {
    productKey: string;
    quantity: number;
    daysAgo: number;
    hour: number;
    minute: number;
    note: string;
  },
) {
  const product = getMapValue(products, config.productKey, 'product');
  const company = findCompanyForProduct(companies, product);
  const movementDate = buildDate(config);
  const existingMovement = await getStockMovementsRepository().findOne({
    where: {
      companyId: company.id,
      productId: product.id,
      type: StockMovementType.STOCK_IN,
      quantity: config.quantity,
      note: config.note,
      movementDate,
    },
  });

  if (existingMovement) {
    return existingMovement;
  }

  await stockService.createStockIn({
    companyId: company.id,
    productId: product.id,
    quantity: config.quantity,
    note: config.note,
    movementDate,
  });
}

async function createAdjustment(
  stockService: StockService,
  companies: Map<string, Company>,
  products: Map<string, Product>,
  config: {
    productKey: string;
    quantity: number;
    daysAgo: number;
    hour: number;
    minute: number;
    note: string;
  },
) {
  const product = getMapValue(products, config.productKey, 'product');
  const company = findCompanyForProduct(companies, product);
  const movementDate = buildDate(config);
  const existingMovement = await getStockMovementsRepository().findOne({
    where: {
      companyId: company.id,
      productId: product.id,
      type: StockMovementType.ADJUSTMENT,
      quantity: config.quantity,
      note: config.note,
      movementDate,
    },
  });

  if (existingMovement) {
    return existingMovement;
  }

  await stockService.createAdjustment({
    companyId: company.id,
    productId: product.id,
    quantity: config.quantity,
    note: config.note,
    movementDate,
  });
}

function findCompanyForProduct(
  companies: Map<string, Company>,
  product: Product,
) {
  const company = [...companies.values()].find(
    (candidate) => candidate.id === product.companyId,
  );

  if (!company) {
    throw new Error(`Company ${product.companyId} was not found for product.`);
  }

  return company;
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : error;
  Logger.error(message, undefined, 'DatabaseSeed');
  process.exitCode = 1;
});

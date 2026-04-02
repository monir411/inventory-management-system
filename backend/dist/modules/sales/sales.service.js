"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../companies/entities/company.entity");
const product_entity_1 = require("../products/entities/product.entity");
const route_entity_1 = require("../routes/entities/route.entity");
const shop_entity_1 = require("../shops/entities/shop.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const stock_movement_type_enum_1 = require("../stock/enums/stock-movement-type.enum");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_entity_1 = require("./entities/sale.entity");
let SalesService = class SalesService {
    dataSource;
    salesRepository;
    constructor(dataSource, salesRepository) {
        this.dataSource = dataSource;
        this.salesRepository = salesRepository;
    }
    async create(createSaleDto) {
        const sale = await this.dataSource.transaction(async (manager) => {
            const company = await manager.getRepository(company_entity_1.Company).findOne({
                where: { id: createSaleDto.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found.');
            }
            if (!company.isActive) {
                throw new common_1.BadRequestException('Cannot create a sale for an inactive company.');
            }
            const route = await manager.getRepository(route_entity_1.Route).findOne({
                where: { id: createSaleDto.routeId },
            });
            if (!route) {
                throw new common_1.NotFoundException('Route not found.');
            }
            if (!route.isActive) {
                throw new common_1.BadRequestException('Cannot create a sale for an inactive route.');
            }
            let shop = null;
            if (createSaleDto.shopId) {
                shop = await manager.getRepository(shop_entity_1.Shop).findOne({
                    where: { id: createSaleDto.shopId },
                });
                if (!shop) {
                    throw new common_1.NotFoundException('Shop not found.');
                }
                if (!shop.isActive) {
                    throw new common_1.BadRequestException('Cannot create a sale for an inactive shop.');
                }
                if (shop.routeId !== route.id) {
                    throw new common_1.BadRequestException('Selected shop does not belong to the selected route.');
                }
            }
            const productIds = [
                ...new Set(createSaleDto.items.map((item) => item.productId)),
            ];
            const products = await manager
                .getRepository(product_entity_1.Product)
                .findByIds(productIds);
            if (products.length !== productIds.length) {
                throw new common_1.NotFoundException('One or more products were not found.');
            }
            const productsById = new Map(products.map((product) => [product.id, product]));
            const requiredQuantities = new Map();
            for (const item of createSaleDto.items) {
                const product = productsById.get(item.productId);
                if (!product) {
                    throw new common_1.NotFoundException(`Product ${item.productId} not found.`);
                }
                if (!product.isActive) {
                    throw new common_1.BadRequestException(`Cannot sell inactive product "${product.name}".`);
                }
                if (product.companyId !== company.id) {
                    throw new common_1.BadRequestException(`Product "${product.name}" does not belong to the selected company.`);
                }
                requiredQuantities.set(item.productId, this.roundToThree((requiredQuantities.get(item.productId) ?? 0) + item.quantity));
            }
            const availableStockByProduct = await this.getCurrentStockByProduct(manager, company.id, productIds);
            for (const [productId, requiredQuantity,] of requiredQuantities.entries()) {
                const product = productsById.get(productId);
                const availableQuantity = availableStockByProduct.get(productId) ?? 0;
                if (availableQuantity < requiredQuantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for product "${product.name}". Available: ${availableQuantity}, required: ${requiredQuantity}.`);
                }
            }
            const preparedItems = createSaleDto.items.map((item) => {
                const product = productsById.get(item.productId);
                const quantity = this.roundToThree(item.quantity);
                const unitPrice = this.roundToTwo(item.unitPrice);
                const buyPrice = this.roundToTwo(product.buyPrice);
                const lineTotal = this.roundToTwo(quantity * unitPrice);
                const lineProfit = this.roundToTwo((unitPrice - buyPrice) * quantity);
                return {
                    productId: product.id,
                    quantity,
                    unitPrice,
                    buyPrice,
                    lineTotal,
                    lineProfit,
                };
            });
            const totalAmount = this.roundToTwo(preparedItems.reduce((sum, item) => sum + item.lineTotal, 0));
            const totalProfit = this.roundToTwo(preparedItems.reduce((sum, item) => sum + item.lineProfit, 0));
            const paidAmount = this.roundToTwo(createSaleDto.paidAmount);
            if (paidAmount > totalAmount) {
                throw new common_1.BadRequestException('Paid amount cannot be greater than total amount.');
            }
            const dueAmount = this.roundToTwo(totalAmount - paidAmount);
            if (dueAmount > 0 && !createSaleDto.shopId) {
                throw new common_1.BadRequestException('Shop is required when the sale has a due amount.');
            }
            const saleRepository = manager.getRepository(sale_entity_1.Sale);
            const invoiceNo = createSaleDto.invoiceNo?.trim()
                ? await this.ensureInvoiceNoAvailable(saleRepository, createSaleDto.invoiceNo.trim())
                : await this.generateInvoiceNo(saleRepository, createSaleDto.saleDate);
            const sale = saleRepository.create({
                companyId: company.id,
                routeId: route.id,
                shopId: shop?.id ?? null,
                saleDate: createSaleDto.saleDate,
                invoiceNo,
                totalAmount,
                paidAmount,
                dueAmount,
                totalProfit,
                note: createSaleDto.note?.trim() || null,
            });
            const savedSale = await saleRepository.save(sale);
            await manager.getRepository(sale_item_entity_1.SaleItem).save(manager.getRepository(sale_item_entity_1.SaleItem).create(preparedItems.map((item) => ({
                saleId: savedSale.id,
                ...item,
            }))));
            await manager.getRepository(stock_movement_entity_1.StockMovement).save(manager.getRepository(stock_movement_entity_1.StockMovement).create(preparedItems.map((item) => ({
                companyId: company.id,
                productId: item.productId,
                type: stock_movement_type_enum_1.StockMovementType.SALE_OUT,
                quantity: item.quantity,
                note: `Sale ${invoiceNo}`,
                movementDate: createSaleDto.saleDate,
            }))));
            return savedSale.id;
        });
        return this.findOne(sale);
    }
    async findAll(query) {
        const queryBuilder = this.salesRepository
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.company', 'company')
            .leftJoinAndSelect('sale.route', 'route')
            .leftJoinAndSelect('sale.shop', 'shop')
            .orderBy('sale.saleDate', 'DESC')
            .addOrderBy('sale.id', 'DESC');
        this.applySalesFilters(queryBuilder, query);
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const sale = await this.salesRepository.findOne({
            where: { id },
            relations: {
                company: true,
                route: true,
                shop: true,
                items: {
                    product: true,
                },
            },
        });
        if (!sale) {
            throw new common_1.NotFoundException('Sale not found.');
        }
        return sale;
    }
    async getTodaySalesSummary(query) {
        const { start, end } = this.getDayRange(query.date);
        const summary = await this.getAggregateSummary({
            ...query,
            fromDate: start,
            toDate: end,
        });
        return {
            date: start.toISOString(),
            saleCount: summary.saleCount,
            totalAmount: summary.totalAmount,
            paidAmount: summary.paidAmount,
            dueAmount: summary.dueAmount,
        };
    }
    async getTodayProfitSummary(query) {
        const { start, end } = this.getDayRange(query.date);
        const summary = await this.getAggregateSummary({
            ...query,
            fromDate: start,
            toDate: end,
        });
        return {
            date: start.toISOString(),
            saleCount: summary.saleCount,
            totalProfit: summary.totalProfit,
        };
    }
    async getMonthlySalesSummary(query) {
        const { start, end, year, month } = this.getMonthRange(query.year, query.month);
        const summary = await this.getAggregateSummary({
            ...query,
            fromDate: start,
            toDate: end,
        });
        return {
            year,
            month,
            saleCount: summary.saleCount,
            totalAmount: summary.totalAmount,
            paidAmount: summary.paidAmount,
            dueAmount: summary.dueAmount,
            totalProfit: summary.totalProfit,
        };
    }
    async getRouteWiseSalesSummary(query) {
        const queryBuilder = this.salesRepository
            .createQueryBuilder('sale')
            .leftJoin('sale.route', 'route')
            .select('sale.routeId', 'routeId')
            .addSelect('route.name', 'routeName')
            .addSelect('route.area', 'routeArea')
            .addSelect('COUNT(sale.id)', 'saleCount')
            .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'totalAmount')
            .addSelect('COALESCE(SUM(sale.paidAmount), 0)', 'paidAmount')
            .addSelect('COALESCE(SUM(sale.dueAmount), 0)', 'dueAmount')
            .addSelect('COALESCE(SUM(sale.totalProfit), 0)', 'totalProfit')
            .groupBy('sale.routeId')
            .addGroupBy('route.name')
            .addGroupBy('route.area')
            .orderBy('route.name', 'ASC');
        this.applySalesFilters(queryBuilder, query);
        const rows = await queryBuilder.getRawMany();
        return rows.map((row) => ({
            routeId: Number(row.routeId),
            routeName: row.routeName,
            routeArea: row.routeArea,
            saleCount: Number(row.saleCount),
            totalAmount: Number(row.totalAmount),
            paidAmount: Number(row.paidAmount),
            dueAmount: Number(row.dueAmount),
            totalProfit: Number(row.totalProfit),
        }));
    }
    async getCompanyWiseSalesSummary(query) {
        const queryBuilder = this.salesRepository
            .createQueryBuilder('sale')
            .leftJoin('sale.company', 'company')
            .select('sale.companyId', 'companyId')
            .addSelect('company.name', 'companyName')
            .addSelect('company.code', 'companyCode')
            .addSelect('COUNT(sale.id)', 'saleCount')
            .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'totalAmount')
            .addSelect('COALESCE(SUM(sale.paidAmount), 0)', 'paidAmount')
            .addSelect('COALESCE(SUM(sale.dueAmount), 0)', 'dueAmount')
            .addSelect('COALESCE(SUM(sale.totalProfit), 0)', 'totalProfit')
            .groupBy('sale.companyId')
            .addGroupBy('company.name')
            .addGroupBy('company.code')
            .orderBy('company.name', 'ASC');
        this.applySalesFilters(queryBuilder, query);
        const rows = await queryBuilder.getRawMany();
        return rows.map((row) => ({
            companyId: Number(row.companyId),
            companyName: row.companyName,
            companyCode: row.companyCode,
            saleCount: Number(row.saleCount),
            totalAmount: Number(row.totalAmount),
            paidAmount: Number(row.paidAmount),
            dueAmount: Number(row.dueAmount),
            totalProfit: Number(row.totalProfit),
        }));
    }
    async getCurrentStockByProduct(manager, companyId, productIds) {
        if (productIds.length === 0) {
            return new Map();
        }
        const rows = await manager
            .getRepository(stock_movement_entity_1.StockMovement)
            .createQueryBuilder('movement')
            .select('movement.productId', 'productId')
            .addSelect(`
          COALESCE(
            SUM(
              CASE
                WHEN movement.type = :saleOutType THEN -movement.quantity
                ELSE movement.quantity
              END
            ),
            0
          )
        `, 'currentStock')
            .where('movement.companyId = :companyId', { companyId })
            .andWhere('movement.productId IN (:...productIds)', { productIds })
            .groupBy('movement.productId')
            .setParameter('saleOutType', stock_movement_type_enum_1.StockMovementType.SALE_OUT)
            .getRawMany();
        return new Map(rows.map((row) => [Number(row.productId), Number(row.currentStock)]));
    }
    async getAggregateSummary(query) {
        const queryBuilder = this.salesRepository
            .createQueryBuilder('sale')
            .select('COUNT(sale.id)', 'saleCount')
            .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'totalAmount')
            .addSelect('COALESCE(SUM(sale.paidAmount), 0)', 'paidAmount')
            .addSelect('COALESCE(SUM(sale.dueAmount), 0)', 'dueAmount')
            .addSelect('COALESCE(SUM(sale.totalProfit), 0)', 'totalProfit');
        this.applySalesFilters(queryBuilder, query);
        const row = await queryBuilder.getRawOne();
        return {
            saleCount: Number(row?.saleCount ?? 0),
            totalAmount: Number(row?.totalAmount ?? 0),
            paidAmount: Number(row?.paidAmount ?? 0),
            dueAmount: Number(row?.dueAmount ?? 0),
            totalProfit: Number(row?.totalProfit ?? 0),
        };
    }
    applySalesFilters(queryBuilder, query) {
        if (query.companyId) {
            queryBuilder.andWhere('sale.companyId = :companyId', {
                companyId: query.companyId,
            });
        }
        if (query.routeId) {
            queryBuilder.andWhere('sale.routeId = :routeId', {
                routeId: query.routeId,
            });
        }
        if (query.shopId) {
            queryBuilder.andWhere('sale.shopId = :shopId', {
                shopId: query.shopId,
            });
        }
        if (query.fromDate) {
            queryBuilder.andWhere('sale.saleDate >= :fromDate', {
                fromDate: query.fromDate,
            });
        }
        if (query.toDate) {
            queryBuilder.andWhere('sale.saleDate <= :toDate', {
                toDate: query.toDate,
            });
        }
    }
    async ensureInvoiceNoAvailable(saleRepository, invoiceNo) {
        const existingSale = await saleRepository.findOne({
            where: { invoiceNo },
        });
        if (existingSale) {
            throw new common_1.ConflictException('Invoice number already exists.');
        }
        return invoiceNo;
    }
    async generateInvoiceNo(saleRepository, saleDate) {
        const datePart = this.formatInvoiceDate(saleDate);
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const candidate = `INV-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`;
            const existingSale = await saleRepository.findOne({
                where: { invoiceNo: candidate },
            });
            if (!existingSale) {
                return candidate;
            }
        }
        return `INV-${datePart}-${Date.now()}`;
    }
    formatInvoiceDate(value) {
        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, '0');
        const day = `${value.getDate()}`.padStart(2, '0');
        return `${year}${month}${day}`;
    }
    getDayRange(date) {
        const baseDate = date ? new Date(date) : new Date();
        const start = new Date(baseDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(baseDate);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    getMonthRange(year, month) {
        const today = new Date();
        const resolvedYear = year ?? today.getFullYear();
        const resolvedMonth = month ?? today.getMonth() + 1;
        const start = new Date(resolvedYear, resolvedMonth - 1, 1, 0, 0, 0, 0);
        const end = new Date(resolvedYear, resolvedMonth, 0, 23, 59, 59, 999);
        return {
            start,
            end,
            year: resolvedYear,
            month: resolvedMonth,
        };
    }
    roundToTwo(value) {
        return Number(value.toFixed(2));
    }
    roundToThree(value) {
        return Number(value.toFixed(3));
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository])
], SalesService);
//# sourceMappingURL=sales.service.js.map
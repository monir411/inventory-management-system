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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../companies/entities/company.entity");
const product_entity_1 = require("../products/entities/product.entity");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const stock_movement_type_enum_1 = require("./enums/stock-movement-type.enum");
let StockService = class StockService {
    stockMovementsRepository;
    companiesRepository;
    productsRepository;
    constructor(stockMovementsRepository, companiesRepository, productsRepository) {
        this.stockMovementsRepository = stockMovementsRepository;
        this.companiesRepository = companiesRepository;
        this.productsRepository = productsRepository;
    }
    createOpeningStock(createStockMovementDto) {
        this.validatePositiveQuantity(createStockMovementDto.quantity, 'Opening stock');
        return this.createMovement(stock_movement_type_enum_1.StockMovementType.OPENING, createStockMovementDto);
    }
    createStockIn(createStockMovementDto) {
        this.validatePositiveQuantity(createStockMovementDto.quantity, 'Stock in');
        return this.createMovement(stock_movement_type_enum_1.StockMovementType.STOCK_IN, createStockMovementDto);
    }
    createAdjustment(createStockMovementDto) {
        if (createStockMovementDto.quantity === 0) {
            throw new common_1.BadRequestException('Adjustment quantity cannot be zero.');
        }
        return this.createMovement(stock_movement_type_enum_1.StockMovementType.ADJUSTMENT, createStockMovementDto);
    }
    async findMovements(query) {
        await this.ensureCompanyExists(query.companyId);
        const queryBuilder = this.stockMovementsRepository
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.company', 'company')
            .leftJoinAndSelect('movement.product', 'product')
            .where('movement.companyId = :companyId', {
            companyId: query.companyId,
        });
        if (query.productId) {
            queryBuilder.andWhere('movement.productId = :productId', {
                productId: query.productId,
            });
        }
        if (query.type) {
            queryBuilder.andWhere('movement.type = :type', { type: query.type });
        }
        if (query.fromDate) {
            queryBuilder.andWhere('movement.movementDate >= :fromDate', {
                fromDate: query.fromDate,
            });
        }
        if (query.toDate) {
            queryBuilder.andWhere('movement.movementDate <= :toDate', {
                toDate: query.toDate,
            });
        }
        return queryBuilder
            .orderBy('movement.movementDate', 'DESC')
            .addOrderBy('movement.createdAt', 'DESC')
            .getMany();
    }
    async getCurrentStockSummary(query) {
        await this.ensureCompanyExists(query.companyId);
        return this.buildStockSummary(query);
    }
    async getLowStockProducts(query) {
        const threshold = query.threshold ?? 10;
        const summary = await this.buildStockSummary(query);
        return summary.filter((item) => item.currentStock > 0 && item.currentStock <= threshold);
    }
    async getZeroStockProducts(query) {
        const summary = await this.buildStockSummary(query);
        return summary.filter((item) => item.currentStock === 0);
    }
    async createMovement(type, createStockMovementDto) {
        const company = await this.companiesRepository.findOne({
            where: { id: createStockMovementDto.companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found.');
        }
        if (!company.isActive) {
            throw new common_1.BadRequestException('Stock movement cannot be created for an inactive company.');
        }
        const product = await this.productsRepository.findOne({
            where: { id: createStockMovementDto.productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found.');
        }
        if (!product.isActive) {
            throw new common_1.BadRequestException('Stock movement cannot be created for an inactive product.');
        }
        if (product.companyId !== company.id) {
            throw new common_1.BadRequestException('Product does not belong to the provided company.');
        }
        const movement = this.stockMovementsRepository.create({
            ...createStockMovementDto,
            note: createStockMovementDto.note ?? null,
            type,
        });
        return this.stockMovementsRepository.save(movement);
    }
    validatePositiveQuantity(quantity, label) {
        if (quantity <= 0) {
            throw new common_1.BadRequestException(`${label} quantity must be greater than zero.`);
        }
    }
    async ensureCompanyExists(companyId) {
        const company = await this.companiesRepository.findOne({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found.');
        }
    }
    async buildStockSummary(query) {
        const threshold = query.threshold ?? 10;
        const queryBuilder = this.productsRepository
            .createQueryBuilder('product')
            .leftJoin('product.company', 'company')
            .leftJoin((subQuery) => subQuery
            .select('movement.productId', 'productId')
            .addSelect('movement.companyId', 'companyId')
            .addSelect(`
                SUM(
                  CASE
                    WHEN movement.type = :saleOutType THEN -movement.quantity
                    ELSE movement.quantity
                  END
                )
              `, 'currentStock')
            .from(stock_movement_entity_1.StockMovement, 'movement')
            .groupBy('movement.productId')
            .addGroupBy('movement.companyId'), 'stock_summary', '"stock_summary"."productId" = product.id AND "stock_summary"."companyId" = product.companyId', {
            saleOutType: stock_movement_type_enum_1.StockMovementType.SALE_OUT,
        })
            .where('product.companyId = :companyId', {
            companyId: query.companyId,
        });
        if (query.search) {
            queryBuilder.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const stockRows = await queryBuilder
            .select('product.id', 'productId')
            .addSelect('product.companyId', 'companyId')
            .addSelect('company.name', 'companyName')
            .addSelect('company.code', 'companyCode')
            .addSelect('company.isActive', 'companyIsActive')
            .addSelect('product.name', 'productName')
            .addSelect('product.sku', 'sku')
            .addSelect('product.unit', 'unit')
            .addSelect('product.isActive', 'isActive')
            .addSelect('COALESCE("stock_summary"."currentStock", 0)', 'currentStock')
            .orderBy('product.name', 'ASC')
            .getRawMany();
        return stockRows.map((row) => ({
            productId: Number(row.productId),
            companyId: Number(row.companyId),
            company: {
                id: Number(row.companyId),
                name: row.companyName,
                code: row.companyCode,
                isActive: typeof row.companyIsActive === 'boolean'
                    ? row.companyIsActive
                    : row.companyIsActive === 'true',
            },
            productName: row.productName,
            sku: row.sku,
            unit: row.unit,
            isActive: typeof row.isActive === 'boolean'
                ? row.isActive
                : row.isActive === 'true',
            currentStock: Number(row.currentStock),
            isLowStock: Number(row.currentStock) > 0 && Number(row.currentStock) <= threshold,
            isZeroStock: Number(row.currentStock) === 0,
        }));
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __param(1, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StockService);
//# sourceMappingURL=stock.service.js.map
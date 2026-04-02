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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../companies/entities/company.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const product_entity_1 = require("./entities/product.entity");
let ProductsService = class ProductsService {
    productsRepository;
    companiesRepository;
    stockMovementsRepository;
    constructor(productsRepository, companiesRepository, stockMovementsRepository) {
        this.productsRepository = productsRepository;
        this.companiesRepository = companiesRepository;
        this.stockMovementsRepository = stockMovementsRepository;
    }
    async create(createProductDto) {
        await this.ensureCompanyExists(createProductDto.companyId);
        await this.ensureUniqueSku(createProductDto.companyId, createProductDto.sku);
        const product = this.productsRepository.create(createProductDto);
        return this.productsRepository.save(product);
    }
    async findAll(query) {
        const queryBuilder = this.productsRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.company', 'company')
            .orderBy('product.name', 'ASC');
        if (query.companyId) {
            queryBuilder.andWhere('product.companyId = :companyId', {
                companyId: query.companyId,
            });
        }
        if (query.search) {
            queryBuilder.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        if (query.isActive !== undefined) {
            queryBuilder.andWhere('product.isActive = :isActive', {
                isActive: query.isActive,
            });
        }
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const product = await this.productsRepository.findOne({
            where: { id },
            relations: {
                company: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found.');
        }
        return product;
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        const nextCompanyId = updateProductDto.companyId ?? product.companyId;
        const nextSku = updateProductDto.sku ?? product.sku;
        await this.ensureCompanyExists(nextCompanyId);
        if (nextCompanyId !== product.companyId || nextSku !== product.sku) {
            await this.ensureUniqueSku(nextCompanyId, nextSku, product.id);
        }
        Object.assign(product, updateProductDto);
        return this.productsRepository.save(product);
    }
    async remove(id) {
        const product = await this.findOne(id);
        const stockMovementCount = await this.stockMovementsRepository.count({
            where: { productId: product.id },
        });
        if (stockMovementCount > 0) {
            throw new common_1.ConflictException('Product cannot be deleted while stock movements exist for it.');
        }
        await this.productsRepository.remove(product);
        return { success: true };
    }
    async ensureCompanyExists(companyId) {
        const company = await this.companiesRepository.findOne({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found.');
        }
    }
    async ensureUniqueSku(companyId, sku, excludeProductId) {
        const existingProduct = await this.productsRepository.findOne({
            where: { companyId, sku },
        });
        if (existingProduct && existingProduct.id !== excludeProductId) {
            throw new common_1.ConflictException('Product SKU already exists for this company.');
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(2, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map
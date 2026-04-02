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
exports.ShopsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const route_entity_1 = require("../routes/entities/route.entity");
const shop_entity_1 = require("./entities/shop.entity");
let ShopsService = class ShopsService {
    shopsRepository;
    routesRepository;
    constructor(shopsRepository, routesRepository) {
        this.shopsRepository = shopsRepository;
        this.routesRepository = routesRepository;
    }
    async create(createShopDto) {
        const route = await this.findRouteOrFail(createShopDto.routeId);
        this.ensureRouteIsActive(route);
        await this.ensureUniqueShopName(createShopDto.routeId, createShopDto.name);
        const shop = this.shopsRepository.create({
            ...createShopDto,
            ownerName: createShopDto.ownerName ?? null,
            phone: createShopDto.phone ?? null,
            address: createShopDto.address ?? null,
            isActive: createShopDto.isActive ?? true,
        });
        return this.shopsRepository.save(shop);
    }
    async findAll(query) {
        const queryBuilder = this.shopsRepository
            .createQueryBuilder('shop')
            .leftJoinAndSelect('shop.route', 'route')
            .orderBy('shop.name', 'ASC');
        if (query.routeId) {
            queryBuilder.andWhere('shop.routeId = :routeId', {
                routeId: query.routeId,
            });
        }
        if (query.search) {
            queryBuilder.andWhere('(shop.name ILIKE :search OR shop.ownerName ILIKE :search OR route.name ILIKE :search)', { search: `%${query.search}%` });
        }
        if (query.isActive !== undefined) {
            queryBuilder.andWhere('shop.isActive = :isActive', {
                isActive: query.isActive,
            });
        }
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const shop = await this.shopsRepository.findOne({
            where: { id },
            relations: { route: true },
        });
        if (!shop) {
            throw new common_1.NotFoundException('Shop not found.');
        }
        return shop;
    }
    async update(id, updateShopDto) {
        const shop = await this.findOne(id);
        const nextRouteId = updateShopDto.routeId ?? shop.routeId;
        const nextName = updateShopDto.name ?? shop.name;
        const route = await this.findRouteOrFail(nextRouteId);
        this.ensureRouteIsActive(route);
        if (nextRouteId !== shop.routeId || nextName !== shop.name) {
            await this.ensureUniqueShopName(nextRouteId, nextName, shop.id);
        }
        Object.assign(shop, {
            ...updateShopDto,
            ownerName: updateShopDto.ownerName !== undefined
                ? (updateShopDto.ownerName ?? null)
                : shop.ownerName,
            phone: updateShopDto.phone !== undefined
                ? (updateShopDto.phone ?? null)
                : shop.phone,
            address: updateShopDto.address !== undefined
                ? (updateShopDto.address ?? null)
                : shop.address,
        });
        return this.shopsRepository.save(shop);
    }
    async deactivate(id) {
        const shop = await this.findOne(id);
        shop.isActive = false;
        return this.shopsRepository.save(shop);
    }
    async listByRoute(routeId) {
        await this.findRouteOrFail(routeId);
        return this.shopsRepository.find({
            where: { routeId },
            relations: { route: true },
            order: { name: 'ASC' },
        });
    }
    async findRouteOrFail(routeId) {
        const route = await this.routesRepository.findOne({
            where: { id: routeId },
        });
        if (!route) {
            throw new common_1.NotFoundException('Route not found.');
        }
        return route;
    }
    ensureRouteIsActive(route) {
        if (!route.isActive) {
            throw new common_1.BadRequestException('Cannot create or move a shop under an inactive route.');
        }
    }
    async ensureUniqueShopName(routeId, name, excludeId) {
        const existingShop = await this.shopsRepository.findOne({
            where: { routeId, name },
        });
        if (existingShop && existingShop.id !== excludeId) {
            throw new common_1.ConflictException('Shop name already exists for this route.');
        }
    }
};
exports.ShopsService = ShopsService;
exports.ShopsService = ShopsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __param(1, (0, typeorm_1.InjectRepository)(route_entity_1.Route)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ShopsService);
//# sourceMappingURL=shops.service.js.map
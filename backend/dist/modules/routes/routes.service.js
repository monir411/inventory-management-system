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
exports.RoutesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("../shops/entities/shop.entity");
const route_entity_1 = require("./entities/route.entity");
let RoutesService = class RoutesService {
    routesRepository;
    shopsRepository;
    constructor(routesRepository, shopsRepository) {
        this.routesRepository = routesRepository;
        this.shopsRepository = shopsRepository;
    }
    async create(createRouteDto) {
        await this.ensureUniqueName(createRouteDto.name);
        const route = this.routesRepository.create({
            ...createRouteDto,
            area: createRouteDto.area ?? null,
            isActive: createRouteDto.isActive ?? true,
        });
        return this.routesRepository.save(route);
    }
    async findAll(query) {
        const queryBuilder = this.routesRepository
            .createQueryBuilder('route')
            .orderBy('route.name', 'ASC');
        if (query.search) {
            queryBuilder.andWhere('(route.name ILIKE :search OR route.area ILIKE :search)', { search: `%${query.search}%` });
        }
        if (query.isActive !== undefined) {
            queryBuilder.andWhere('route.isActive = :isActive', {
                isActive: query.isActive,
            });
        }
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const route = await this.routesRepository.findOne({
            where: { id },
            relations: {
                shops: true,
            },
        });
        if (!route) {
            throw new common_1.NotFoundException('Route not found.');
        }
        return route;
    }
    async update(id, updateRouteDto) {
        const route = await this.findRouteEntity(id);
        if (updateRouteDto.name && updateRouteDto.name !== route.name) {
            await this.ensureUniqueName(updateRouteDto.name, route.id);
        }
        Object.assign(route, {
            ...updateRouteDto,
            area: updateRouteDto.area !== undefined
                ? (updateRouteDto.area ?? null)
                : route.area,
        });
        return this.routesRepository.save(route);
    }
    async deactivate(id) {
        const route = await this.findRouteEntity(id);
        route.isActive = false;
        return this.routesRepository.save(route);
    }
    async listShops(id) {
        await this.findRouteEntity(id);
        return this.shopsRepository.find({
            where: { routeId: id },
            order: { name: 'ASC' },
        });
    }
    async ensureUniqueName(name, excludeId) {
        const existingRoute = await this.routesRepository.findOne({
            where: { name },
        });
        if (existingRoute && existingRoute.id !== excludeId) {
            throw new common_1.ConflictException('Route name already exists.');
        }
    }
    async findRouteEntity(id) {
        const route = await this.routesRepository.findOne({
            where: { id },
        });
        if (!route) {
            throw new common_1.NotFoundException('Route not found.');
        }
        return route;
    }
};
exports.RoutesService = RoutesService;
exports.RoutesService = RoutesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(route_entity_1.Route)),
    __param(1, (0, typeorm_1.InjectRepository)(shop_entity_1.Shop)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RoutesService);
//# sourceMappingURL=routes.service.js.map
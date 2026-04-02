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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../products/entities/product.entity");
const company_entity_1 = require("./entities/company.entity");
let CompaniesService = class CompaniesService {
    companiesRepository;
    productsRepository;
    constructor(companiesRepository, productsRepository) {
        this.companiesRepository = companiesRepository;
        this.productsRepository = productsRepository;
    }
    async create(createCompanyDto) {
        const existingCompany = await this.companiesRepository.findOne({
            where: { code: createCompanyDto.code },
        });
        if (existingCompany) {
            throw new common_1.ConflictException('Company code already exists.');
        }
        const company = this.companiesRepository.create(createCompanyDto);
        return this.companiesRepository.save(company);
    }
    async findAll(query) {
        const queryBuilder = this.companiesRepository
            .createQueryBuilder('company')
            .orderBy('company.name', 'ASC');
        if (query.search) {
            queryBuilder.andWhere('(company.name ILIKE :search OR company.code ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        if (query.isActive !== undefined) {
            queryBuilder.andWhere('company.isActive = :isActive', {
                isActive: query.isActive,
            });
        }
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const company = await this.companiesRepository.findOne({ where: { id } });
        if (!company) {
            throw new common_1.NotFoundException('Company not found.');
        }
        return company;
    }
    async update(id, updateCompanyDto) {
        const company = await this.findOne(id);
        if (updateCompanyDto.code && updateCompanyDto.code !== company.code) {
            const existingCompany = await this.companiesRepository.findOne({
                where: { code: updateCompanyDto.code },
            });
            if (existingCompany) {
                throw new common_1.ConflictException('Company code already exists.');
            }
        }
        Object.assign(company, updateCompanyDto);
        return this.companiesRepository.save(company);
    }
    async remove(id) {
        const company = await this.findOne(id);
        const productCount = await this.productsRepository.count({
            where: { companyId: company.id },
        });
        if (productCount > 0) {
            throw new common_1.ConflictException('Company cannot be deleted while products exist for it.');
        }
        await this.companiesRepository.remove(company);
        return { success: true };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map
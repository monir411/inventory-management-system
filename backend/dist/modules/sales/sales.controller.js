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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const query_sales_dto_1 = require("./dto/query-sales.dto");
const sales_summary_query_dto_1 = require("./dto/sales-summary-query.dto");
const sales_service_1 = require("./sales.service");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    create(createSaleDto) {
        return this.salesService.create(createSaleDto);
    }
    findAll(query) {
        return this.salesService.findAll(query);
    }
    getTodaySalesSummary(query) {
        return this.salesService.getTodaySalesSummary(query);
    }
    getTodayProfitSummary(query) {
        return this.salesService.getTodayProfitSummary(query);
    }
    getMonthlySalesSummary(query) {
        return this.salesService.getMonthlySalesSummary(query);
    }
    getRouteWiseSalesSummary(query) {
        return this.salesService.getRouteWiseSalesSummary(query);
    }
    getCompanyWiseSalesSummary(query) {
        return this.salesService.getCompanyWiseSalesSummary(query);
    }
    findOne(id) {
        return this.salesService.findOne(id);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sale_dto_1.CreateSaleDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_sales_dto_1.QuerySalesDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary/today-sales'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_summary_query_dto_1.SalesSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getTodaySalesSummary", null);
__decorate([
    (0, common_1.Get)('summary/today-profit'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_summary_query_dto_1.SalesSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getTodayProfitSummary", null);
__decorate([
    (0, common_1.Get)('summary/monthly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_summary_query_dto_1.SalesSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getMonthlySalesSummary", null);
__decorate([
    (0, common_1.Get)('summary/route-wise'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_summary_query_dto_1.SalesSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getRouteWiseSalesSummary", null);
__decorate([
    (0, common_1.Get)('summary/company-wise'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_summary_query_dto_1.SalesSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getCompanyWiseSalesSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map
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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const create_stock_movement_dto_1 = require("./dto/create-stock-movement.dto");
const query_stock_movements_dto_1 = require("./dto/query-stock-movements.dto");
const stock_summary_query_dto_1 = require("./dto/stock-summary-query.dto");
const stock_service_1 = require("./stock.service");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    createOpeningStock(createStockMovementDto) {
        return this.stockService.createOpeningStock(createStockMovementDto);
    }
    createStockIn(createStockMovementDto) {
        return this.stockService.createStockIn(createStockMovementDto);
    }
    createAdjustment(createStockMovementDto) {
        return this.stockService.createAdjustment(createStockMovementDto);
    }
    findMovements(query) {
        return this.stockService.findMovements(query);
    }
    getCurrentStockSummary(query) {
        return this.stockService.getCurrentStockSummary(query);
    }
    getLowStockProducts(query) {
        return this.stockService.getLowStockProducts(query);
    }
    getZeroStockProducts(query) {
        return this.stockService.getZeroStockProducts(query);
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Post)('opening'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.CreateStockMovementDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "createOpeningStock", null);
__decorate([
    (0, common_1.Post)('in'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.CreateStockMovementDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "createStockIn", null);
__decorate([
    (0, common_1.Post)('adjustment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.CreateStockMovementDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "createAdjustment", null);
__decorate([
    (0, common_1.Get)('movements'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_stock_movements_dto_1.QueryStockMovementsDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "findMovements", null);
__decorate([
    (0, common_1.Get)('summary/current'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_summary_query_dto_1.StockSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "getCurrentStockSummary", null);
__decorate([
    (0, common_1.Get)('summary/low-stock'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_summary_query_dto_1.StockSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "getLowStockProducts", null);
__decorate([
    (0, common_1.Get)('summary/zero-stock'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_summary_query_dto_1.StockSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], StockController.prototype, "getZeroStockProducts", null);
exports.StockController = StockController = __decorate([
    (0, common_1.Controller)('stock'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map
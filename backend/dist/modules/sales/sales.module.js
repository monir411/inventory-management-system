"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("../companies/entities/company.entity");
const product_entity_1 = require("../products/entities/product.entity");
const route_entity_1 = require("../routes/entities/route.entity");
const shop_entity_1 = require("../shops/entities/shop.entity");
const stock_movement_entity_1 = require("../stock/entities/stock-movement.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_entity_1 = require("./entities/sale.entity");
const sales_controller_1 = require("./sales.controller");
const sales_service_1 = require("./sales.service");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sale_entity_1.Sale,
                sale_item_entity_1.SaleItem,
                company_entity_1.Company,
                route_entity_1.Route,
                shop_entity_1.Shop,
                product_entity_1.Product,
                stock_movement_entity_1.StockMovement,
            ]),
        ],
        controllers: [sales_controller_1.SalesController],
        providers: [sales_service_1.SalesService],
        exports: [sales_service_1.SalesService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map
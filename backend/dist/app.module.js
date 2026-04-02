"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const configuration_1 = __importDefault(require("./config/configuration"));
const env_validation_1 = require("./config/env.validation");
const database_module_1 = require("./database/database.module");
const health_module_1 = require("./health/health.module");
const companies_module_1 = require("./modules/companies/companies.module");
const products_module_1 = require("./modules/products/products.module");
const routes_module_1 = require("./modules/routes/routes.module");
const sales_module_1 = require("./modules/sales/sales.module");
const shops_module_1 = require("./modules/shops/shops.module");
const stock_module_1 = require("./modules/stock/stock.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                envFilePath: ['.env.local', '.env'],
                load: [configuration_1.default],
                validationSchema: env_validation_1.envValidationSchema,
            }),
            database_module_1.DatabaseModule,
            health_module_1.HealthModule,
            companies_module_1.CompaniesModule,
            products_module_1.ProductsModule,
            routes_module_1.RoutesModule,
            sales_module_1.SalesModule,
            shops_module_1.ShopsModule,
            stock_module_1.StockModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
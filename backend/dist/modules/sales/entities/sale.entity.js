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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = void 0;
const typeorm_1 = require("typeorm");
const numeric_transformer_1 = require("../../../common/database/numeric.transformer");
const company_entity_1 = require("../../companies/entities/company.entity");
const route_entity_1 = require("../../routes/entities/route.entity");
const shop_entity_1 = require("../../shops/entities/shop.entity");
const sale_item_entity_1 = require("./sale-item.entity");
let Sale = class Sale {
    id;
    companyId;
    routeId;
    shopId;
    saleDate;
    invoiceNo;
    totalAmount;
    paidAmount;
    dueAmount;
    totalProfit;
    note;
    createdAt;
    updatedAt;
    company;
    route;
    shop;
    items;
};
exports.Sale = Sale;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Sale.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Sale.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Sale.prototype, "routeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "shopId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Sale.prototype, "saleDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], Sale.prototype, "invoiceNo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 14,
        scale: 2,
        transformer: numeric_transformer_1.numericColumnTransformer,
    }),
    __metadata("design:type", Number)
], Sale.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 14,
        scale: 2,
        transformer: numeric_transformer_1.numericColumnTransformer,
    }),
    __metadata("design:type", Number)
], Sale.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 14,
        scale: 2,
        transformer: numeric_transformer_1.numericColumnTransformer,
    }),
    __metadata("design:type", Number)
], Sale.prototype, "dueAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 14,
        scale: 2,
        transformer: numeric_transformer_1.numericColumnTransformer,
    }),
    __metadata("design:type", Number)
], Sale.prototype, "totalProfit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Sale.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Sale.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Sale.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'companyId' }),
    __metadata("design:type", company_entity_1.Company)
], Sale.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => route_entity_1.Route, {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'routeId' }),
    __metadata("design:type", route_entity_1.Route)
], Sale.prototype, "route", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => shop_entity_1.Shop, {
        nullable: true,
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'shopId' }),
    __metadata("design:type", Object)
], Sale.prototype, "shop", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_item_entity_1.SaleItem, (saleItem) => saleItem.sale, {
        cascade: false,
    }),
    __metadata("design:type", Array)
], Sale.prototype, "items", void 0);
exports.Sale = Sale = __decorate([
    (0, typeorm_1.Entity)({ name: 'sales' }),
    (0, typeorm_1.Index)(['companyId', 'saleDate']),
    (0, typeorm_1.Index)(['routeId', 'saleDate']),
    (0, typeorm_1.Index)(['shopId', 'saleDate']),
    (0, typeorm_1.Index)(['invoiceNo'], { unique: true })
], Sale);
//# sourceMappingURL=sale.entity.js.map
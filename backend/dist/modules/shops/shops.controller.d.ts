import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopsDto } from './dto/query-shops.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';
export declare class ShopsController {
    private readonly shopsService;
    constructor(shopsService: ShopsService);
    create(createShopDto: CreateShopDto): Promise<import("./entities/shop.entity").Shop>;
    findAll(query: QueryShopsDto): Promise<import("./entities/shop.entity").Shop[]>;
    findOne(id: number): Promise<import("./entities/shop.entity").Shop>;
    listByRoute(routeId: number): Promise<import("./entities/shop.entity").Shop[]>;
    update(id: number, updateShopDto: UpdateShopDto): Promise<import("./entities/shop.entity").Shop>;
    deactivate(id: number): Promise<import("./entities/shop.entity").Shop>;
}
